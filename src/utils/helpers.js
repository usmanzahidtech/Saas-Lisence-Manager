import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Checks the expiry status of a license
 * @param {Date|import('firebase/firestore').Timestamp} expiryDate - The expiry date
 * @returns {Object} Status object with status and daysRemaining
 */
/**
 * Helper to parse various date formats (Firestore Timestamp, object with seconds, string, Date)
 */
export const parseDate = (date) => {
  if (!date) return null;
  if (date.toDate) return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  return new Date(date);
};

export const checkExpiryStatus = (expiryDate) => {
  if (!expiryDate) {
    return {
      status: 'unknown',
      daysRemaining: 0,
      badgeClass: 'badge-expired',
      color: 'gray'
    };
  }

  // Convert Firestore Timestamp to Date if needed
  const expiry = parseDate(expiryDate);
  const now = new Date();
  
  // Validate date
  if (isNaN(expiry.getTime())) {
    console.error('Invalid expiry date:', expiryDate);
    return {
      status: 'unknown',
      daysRemaining: 0,
      badgeClass: 'badge-expired',
      color: 'gray'
    };
  }
  
  // Calculate difference in days
  const diffTime = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      daysRemaining: 0,
      badgeClass: 'badge-expired',
      color: 'red'
    };
  } else if (daysRemaining <= 30) {
    return {
      status: 'expiring_soon',
      isExpiringSoon: true,
      daysRemaining,
      badgeClass: 'badge-expiring',
      color: 'yellow'
    };
  } else {
    return {
      status: 'active',
      isExpiringSoon: false,
      daysRemaining,
      badgeClass: 'badge-active',
      color: 'green'
    };
  }
};

/**
 * Creates an audit log entry in Firestore
 * @param {string} action - The action performed
 * @param {Object} details - Details about the action
 * @returns {Promise<void>}
 */
export const createAuditLog = async (action, details) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      timestamp: serverTimestamp(),
      action,
      performedBy: details.performedBy || null,
      performedByEmail: details.performedByEmail || null,
      targetUser: details.targetUser || null,
      details: details.message || '',
      metadata: details.metadata || {}
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

/**
 * Formats a date to a readable string
 * @param {Date|import('firebase/firestore').Timestamp} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const d = parseDate(date);
    
    // Validate date
    if (isNaN(d.getTime())) {
      console.error('Invalid date:', date);
      return 'Invalid Date';
    }
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a timestamp to a readable date and time string
 * @param {Date|import('firebase/firestore').Timestamp} timestamp - The timestamp to format
 * @returns {string} Formatted timestamp string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const d = parseDate(timestamp);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Validates if a user's license is valid (not expired and not suspended)
 * @param {Object} user - User object from Firestore
 * @returns {Object} Validation result
 */
export const validateUserLicense = (user) => {
  if (!user) {
    return {
      isValid: false,
      reason: 'User not found'
    };
  }

  // Check if user is suspended
  if (user.status === 'suspended') {
    return {
      isValid: false,
      reason: 'Account is suspended. Please contact your administrator.'
    };
  }

  // Check if license is expired
  const expiryStatus = checkExpiryStatus(user.expiryDate);
  if (expiryStatus.status === 'expired') {
    return {
      isValid: false,
      reason: 'License has expired. Please renew your subscription.'
    };
  }

  return {
    isValid: true,
    reason: 'Valid'
  };
};

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
