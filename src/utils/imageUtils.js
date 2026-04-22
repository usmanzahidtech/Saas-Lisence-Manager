import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compress an image file to under 250KB
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file) => {
  try {
    // Compression options
    const options = {
      maxSizeMB: 0.25, // 250KB maximum
      maxWidthOrHeight: 800, // Resize if larger than 800px
      useWebWorker: true, // Use web worker for better performance
      fileType: file.type, // Preserve original file type
    };

    console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const compressedFile = await imageCompression(file, options);

    console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Upload a profile image to Firebase Storage
 * @param {string} userId - User ID for folder organization
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadProfileImage = async (userId, file) => {
  try {
    // First, compress the image
    const compressedFile = await compressImage(file);

    // Create a reference to the storage location
    // Path: profile-images/{userId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `profile-images/${userId}/${fileName}`);

    // Upload the compressed file
    console.log('Uploading compressed image to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, compressedFile);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('Image uploaded successfully:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
};

/**
 * Upload a company logo to Firebase Storage
 * @param {string} companyId - Company ID for folder organization
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadCompanyLogo = async (companyId, file) => {
  try {
    // First, compress the image
    const compressedFile = await compressImage(file);

    // Create a reference to the storage location
    // Path: company-logos/{companyId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `company-logos/${companyId}/${fileName}`);

    // Upload the compressed file
    console.log('Uploading compressed logo to Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, compressedFile);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('Logo uploaded successfully:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    throw new Error('Failed to upload company logo');
  }
};

/**
 * Validate image file before upload
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with isValid and error message
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB max before compression

  if (!file) {
    return {
      isValid: false,
      error: 'No file selected'
    };
  }

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Please upload an image under 10MB.'
    };
  }

  return {
    isValid: true,
    error: null
  };
};
