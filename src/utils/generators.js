/**
 * Generates a custom user ID in the format ABCD-1234-X
 * Format: 4 uppercase letters - 4 digits - 1 uppercase letter
 * @returns {string} Generated custom ID
 */
export const generateCustomID = () => {
  const letters1 = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

  const digits = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  const letter2 = String.fromCharCode(65 + Math.floor(Math.random() * 26));

  return `${letters1}-${digits}-${letter2}`;
};

/**
 * Generates a secure license key
 * Format: AAAADDDDD (9 characters: 4 Alpha + 4 Digits + 1 Digit)
 * @returns {string} Generated license key
 */
export const generateLicenseKey = () => {
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

  const digits = Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');

  return `${letters}${digits}`;
};

/**
 * Validates if a license key is unique in the database
 * You can add this check when creating a new user or company
 * @param {string} licenseKey - The license key to check
 * @param {import('firebase/firestore').Firestore} db - Firestore instance
 * @param {string} collectionName - Collection to check ('users' or 'companies')
 * @returns {Promise<boolean>} True if unique, false if exists
 */
export const isLicenseKeyUnique = async (licenseKey, db, collectionName = 'users') => {
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, collectionName), where('licenseKey', '==', licenseKey));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
};

/**
 * Generates a unique license key by checking database
 * @param {import('firebase/firestore').Firestore} db - Firestore instance
 * @param {string} collectionName - Collection to check ('users' or 'companies')
 * @returns {Promise<string>} Unique license key
 */
export const generateUniqueLicenseKey = async (db, collectionName = 'users') => {
  let licenseKey;
  let isUnique = false;

  while (!isUnique) {
    licenseKey = generateLicenseKey();
    isUnique = await isLicenseKeyUnique(licenseKey, db, collectionName);
  }

  return licenseKey;
};
