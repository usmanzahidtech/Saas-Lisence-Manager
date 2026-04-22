import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  getCountFromServer,
  setDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { generateUniqueLicenseKey } from './generators';
import { checkExpiryStatus } from './helpers';

// Get Company Statistics (Optimized with Aggregation)
export const getCompanyStats = async () => {
  const stats = {
    total: 0,
    active: 0,
    suspended: 0,
    expired: 0,
    expiring: 0
  };

  try {
    const companiesRef = collection(db, 'companies');
    
    // 1. Basic Counts (Should work without custom indexes)
    // We run these in parallel for speed
    const [totalSnap, activeSnap, suspendedSnap] = await Promise.all([
      getCountFromServer(companiesRef),
      getCountFromServer(query(companiesRef, where('status', '==', 'active'))),
      getCountFromServer(query(companiesRef, where('status', '==', 'suspended')))
    ]);

    stats.total = totalSnap.data().count;
    stats.active = activeSnap.data().count;
    stats.suspended = suspendedSnap.data().count;

    // 2. Complex Date Queries (Might fail without index)
    // We wrap these in separate try-catch blocks so they don't crash the whole dashboard
    const now = new Date();

    try {
      const expiredQuery = query(
        companiesRef, 
        where('expiryDate', '<=', now)
      );
      const expiredSnap = await getCountFromServer(expiredQuery);
      stats.expired = expiredSnap.data().count;
    } catch (e) {
      console.warn("Expired query failed (likely missing index). Check console for link to create index:", e);
    }

    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);
      
      const expiringQuery = query(
        companiesRef,
        where('expiryDate', '>', now),
        where('expiryDate', '<=', thirtyDaysFromNow),
        where('status', '==', 'active')
      );
      const expiringSnap = await getCountFromServer(expiringQuery);
      stats.expiring = expiringSnap.data().count;
    } catch (e) {
      console.warn("Expiring query failed (likely missing index). Check console for link to create index:", e);
    }

    // Adjust active count to exclude expired if they are still marked as active in DB
    // Only do this if we successfully fetched the expired count
    if (stats.expired > 0) {
       // Note: This is an approximation. Ideally, we'd query for (status=active AND expiry > now)
       // but that requires another index. This subtraction assumes all 'expired' docs have 'active' status,
       // which might not be true if we have a status='expired'. 
       // If we strictly use status='active' for the active count, we should probably subtract.
       // However, if we can't fetch expired, we just show the raw active count.
       stats.active = Math.max(0, stats.active - stats.expired);
    }

    return stats;
  } catch (error) {
    console.error('Error fetching basic company stats:', error);
    return stats;
  }
};

/**
 * Create a new company with auto-generated license key
 * @param {Object} companyData - Company information
 * @returns {Promise<Object>} Created company object with ID
 */
export const createCompany = async (companyData) => {
  try {
    // Generate unique license key
    const licenseKey = await generateUniqueLicenseKey(db, 'companies');
    
    // Create company document
    const companyRef = doc(collection(db, 'companies'));
    const companyId = companyRef.id;
    
    const company = {
      id: companyId,
      name: companyData.name,
      licenseKey: licenseKey,
      serverUrl: companyData.serverUrl,
      startDate: companyData.startDate || new Date(),
      expiryDate: companyData.expiryDate,
      status: companyData.status || 'active',
      createdAt: serverTimestamp()
    };
    
    await setDoc(companyRef, company);
    
    return { ...company, id: companyId };
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

/**
 * Get a single company by ID
 * @param {string} companyId - Company ID
 * @returns {Promise<Object|null>} Company data or null
 */
export const getCompany = async (companyId) => {
  try {
    if (!companyId) return null;
    
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    
    if (companyDoc.exists()) {
      return { id: companyDoc.id, ...companyDoc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching company:', error);
    return null;
  }
};

/**
 * Get all companies (Super Admin only)
 * @returns {Promise<Array>} Array of all companies
 */
export const getAllCompanies = async () => {
  try {
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    const companies = [];
    
    companiesSnapshot.forEach((doc) => {
      companies.push({ id: doc.id, ...doc.data() });
    });
    
    return companies;
  } catch (error) {
    console.error('Error fetching all companies:', error);
    return [];
  }
};

/**
 * Get only active companies with valid licenses
 * @returns {Promise<Array>} Array of active companies
 */
export const getActiveCompanies = async () => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('status', '==', 'active')
    );
    
    const companiesSnapshot = await getDocs(q);
    const companies = [];
    const now = new Date();
    
    companiesSnapshot.forEach((doc) => {
      const company = { id: doc.id, ...doc.data() };
      
      // Convert Firestore Timestamp to Date
      const expiryDate = company.expiryDate.toDate 
        ? company.expiryDate.toDate() 
        : new Date(company.expiryDate);
      
      // Only include if not expired
      if (expiryDate > now) {
        companies.push(company);
      }
    });
    
    return companies;
  } catch (error) {
    console.error('Error fetching active companies:', error);
    return [];
  }
};

/**
 * Update company details
 * @param {string} companyId - Company ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export const updateCompany = async (companyId, updates) => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    
    // Remove fields that shouldn't be updated
    const { id, licenseKey, createdAt, ...allowedUpdates } = updates;
    
    await updateDoc(companyRef, {
      ...allowedUpdates,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

/**
 * Validate if a company's license is valid
 * @param {Object} company - Company object
 * @returns {Object} Validation result with isValid and reason
 */
export const validateCompanyLicense = (company) => {
  if (!company) {
    return {
      isValid: false,
      reason: 'Company not found'
    };
  }

  // Check if company is suspended
  if (company.status === 'suspended') {
    return {
      isValid: false,
      reason: 'Company account is suspended. Please contact your administrator.'
    };
  }

  // Check if company is active
  if (company.status !== 'active') {
    return {
      isValid: false,
      reason: 'Company account is not active.'
    };
  }

  // Check if license is expired
  const expiryDate = company.expiryDate.toDate 
    ? company.expiryDate.toDate() 
    : new Date(company.expiryDate);
  const now = new Date();

  if (expiryDate <= now) {
    return {
      isValid: false,
      reason: 'Company license has expired. Please contact your administrator to renew.'
    };
  }

  return {
    isValid: true,
    reason: 'Valid'
  };
};

/**
 * Get user count for a company
 * @param {string} companyId - Company ID
 * @returns {Promise<number>} Number of users in the company
 */
export const getCompanyUserCount = async (companyId) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('companyId', '==', companyId)
    );
    
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.size;
  } catch (error) {
    console.error('Error getting company user count:', error);
    return 0;
  }
};
