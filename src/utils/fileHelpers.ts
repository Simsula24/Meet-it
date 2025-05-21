import { pb } from '../api/pocketbaseSetup';

/**
 * Gets the full URL for a file stored in PocketBase
 * 
 * @param record The record that contains the file
 * @param filename The filename or field name
 * @returns The full URL of the file
 */
export const getFileUrl = (record: any, filename: string): string => {
  if (!record || !record.collectionId || !record.id) {
    console.log('Invalid record for file URL:', record);
    return '';
  }
  
  const url = `${pb.baseUrl}/api/files/${record.collectionId}/${record.id}/${filename}`;
  
  return url;
};

/**
 * Gets the avatar URL for a user
 * 
 * @param user The user record
 * @returns The URL of the user's avatar or empty string if none
 */
export const getAvatarUrl = (user: any): string => {
  
  
  if (!user || !user.avatar) {
    return '';
  }
  
  return getFileUrl(user, user.avatar);
}; 