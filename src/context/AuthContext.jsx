import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';
import { validateUserLicense, createAuditLog } from '../utils/helpers';
import { getCompany, validateCompanyLicense } from '../utils/CompanyService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get cached data
  const getCachedData = (key) => {
    try {
      const cached = sessionStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  };

  // Helper to set cached data
  const setCachedData = (key, data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Error caching data:', e);
    }
  };

  // Fetch user data from Firestore with Caching
  const fetchUserData = async (uid) => {
    // 1. Check Memory State first (already handled by React state, but good for explicit calls)
    if (userData && userData.uid === uid) return userData;

    // 2. Check Session Storage
    const cachedUser = getCachedData(`user_${uid}`);
    if (cachedUser) {
      console.log('Using cached user data');
      return cachedUser;
    }

    // 3. Fetch from Firestore
    try {
      console.log('Fetching user data from Firestore...');
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCachedData(`user_${uid}`, data); // Cache it
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Fetch company data with Caching
  const fetchCompanyData = async (companyId) => {
    if (!companyId) return null;

    // 1. Check Memory State
    if (companyData && companyData.id === companyId) return companyData;

    // 2. Check Session Storage
    const cachedCompany = getCachedData(`company_${companyId}`);
    if (cachedCompany) {
      console.log('Using cached company data');
      return cachedCompany;
    }

    // 3. Fetch from Firestore
    try {
      console.log('Fetching company data from Firestore...');
      const company = await getCompany(companyId);
      if (company) {
        setCachedData(`company_${companyId}`, company); // Cache it
        return company;
      }
      return null;
    } catch (error) {
      console.error('Error fetching company data:', error);
      return null;
    }
  };

  // Login function with company-level validation
  const login = async (email, password) => {
    try {
      setError(null);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Force fetch fresh data on login (bypass cache to ensure latest status)
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User data not found in database');
      }
      const fetchedUserData = userDoc.data();
      
      // Update Cache & State
      setCachedData(`user_${user.uid}`, fetchedUserData);
      setUserData(fetchedUserData);
      setUserRole(fetchedUserData.role);

      // CRITICAL: Fetch company data and validate company license
      if (fetchedUserData.companyId) {
        // Force fetch company data
        const company = await getCompany(fetchedUserData.companyId);
        
        if (!company) {
          await signOut(auth);
          throw new Error('Company not found. Please contact your administrator.');
        }

        // Update Cache & State
        setCachedData(`company_${fetchedUserData.companyId}`, company);
        setCompanyData(company);

        // Validate company license
        const companyValidation = validateCompanyLicense(company);
        
        if (!companyValidation.isValid) {
          await signOut(auth);
          
          // Log failed login attempt
          createAuditLog('login_failed', {
            performedBy: user.uid,
            performedByEmail: email,
            message: `Login blocked: ${companyValidation.reason}`,
            metadata: { 
              reason: companyValidation.reason,
              companyId: fetchedUserData.companyId,
              companyName: company.name
            }
          }).catch(err => console.error('Audit log error:', err));
          
          throw new Error(companyValidation.reason);
        }
      } else {
        // Legacy user without company - validate user-level license
        const validation = validateUserLicense(fetchedUserData);
        
        if (!validation.isValid) {
          await signOut(auth);
          
          createAuditLog('login_failed', {
            performedBy: user.uid,
            performedByEmail: email,
            message: `Login blocked: ${validation.reason}`,
            metadata: { reason: validation.reason }
          }).catch(err => console.error('Audit log error:', err));
          
          throw new Error(validation.reason);
        }
      }

      // Log successful login
      createAuditLog('login_success', {
        performedBy: user.uid,
        performedByEmail: email,
        message: `User logged in successfully`,
        metadata: { 
          role: fetchedUserData.role,
          companyId: fetchedUserData.companyId || 'legacy'
        }
      }).catch(err => console.error('Audit log error:', err));

      return userCredential;
    } catch (error) {
      setError(error.message);
      // Clear any partial state on error
      setUserData(null);
      setCompanyData(null);
      sessionStorage.clear();
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (currentUser && userData) {
        createAuditLog('logout', {
          performedBy: currentUser.uid,
          performedByEmail: userData.email,
          message: `User logged out`
        }).catch(err => console.error('Audit log error:', err));
      }
      
      // Clear Cache
      sessionStorage.clear();
      setUserData(null);
      setCompanyData(null);
      setUserRole(null);
      
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // 1. Try to get data from Cache first (Optimistic Load)
        const cachedUser = getCachedData(`user_${user.uid}`);
        if (cachedUser) {
          setUserData(cachedUser);
          setUserRole(cachedUser.role);
          
          if (cachedUser.companyId) {
            const cachedCompany = getCachedData(`company_${cachedUser.companyId}`);
            if (cachedCompany) {
              setCompanyData(cachedCompany);
            } else {
              // Fetch company if missing in cache
              const company = await fetchCompanyData(cachedUser.companyId);
              setCompanyData(company);
            }
          }
          setLoading(false); // Unblock UI immediately with cached data
          
          // Background Revalidation (Optional: Check for updates silently)
          // For now, we trust the cache until explicit refresh or login
        } else {
          // 2. No Cache - Fetch from Network
          const data = await fetchUserData(user.uid);
          if (data) {
            setUserData(data);
            setUserRole(data.role);
            
            if (data.companyId) {
              const company = await fetchCompanyData(data.companyId);
              setCompanyData(company);
            } else {
              setCompanyData(null);
            }
          } else {
            // User authenticated but no data found?
            setUserData(null);
            setUserRole(null);
            setCompanyData(null);
          }
          setLoading(false);
        }
      } else {
        setUserData(null);
        setUserRole(null);
        setCompanyData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    companyData,
    login,
    logout,
    loading,
    error,
    setError,
    hasRole: (role) => userRole === role,
    hasAnyRole: (roles) => roles.includes(userRole),
    // Expose refresh functions if needed
    refreshUserData: async () => {
      if (currentUser) {
        sessionStorage.removeItem(`user_${currentUser.uid}`);
        const data = await fetchUserData(currentUser.uid);
        setUserData(data);
        return data;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
