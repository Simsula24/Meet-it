import { pb } from './pocketbaseSetup';

export interface Media {
  id: string;
  event: string;
  user: string;
  file: string;
  type: 'photo' | 'video';
  caption?: string;
  created: string;
  expand?: {
    user?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

/**
 * Upload media to an event
 */
export const uploadMedia = async (
  eventId: string,
  userId: string,
  fileUri: string,
  type: 'photo' | 'video',
  caption?: string
): Promise<Media> => {
  try {
    // Create a FormData object for file upload
    const formData = new FormData();
    
    // Append the file
    // Note: this implementation will need to be adjusted based on how your app handles files
    const fileInfo = {
      uri: fileUri,
      name: fileUri.split('/').pop() || 'media',
      type: type === 'photo' ? 'image/jpeg' : 'video/mp4',
    };
    
    // @ts-ignore - FormData expects a Blob but React Native provides a different object
    formData.append('file', fileInfo);
    
    // Append other fields
    formData.append('event', eventId);
    formData.append('user', userId);
    formData.append('type', type);
    if (caption) {
      formData.append('caption', caption);
    }
    
    // Send the request to PocketBase
    const record = await pb.collection('media').create(formData);
    
    return record as unknown as Media;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

/**
 * Get all media for an event
 */
export const getEventMedia = async (
  eventId: string,
  page: number = 1,
  limit: number = 50
): Promise<{
  items: Media[];
  totalItems: number;
  totalPages: number;
}> => {
  try {
    const resultList = await pb.collection('media').getList(page, limit, {
      filter: `event="${eventId}"`,
      sort: '-created',
      expand: 'user',
    });

    // Format the file URLs
    const items = resultList.items.map(item => {
      // Get the URL for the file
      const fileUrl = item.file ? pb.getFileUrl(item, item.file) : '';
      
      return {
        ...item,
        file: fileUrl,
      } as unknown as Media;
    });

    return {
      items,
      totalItems: resultList.totalItems,
      totalPages: resultList.totalPages,
    };
  } catch (error) {
    console.error('Error fetching event media:', error);
    throw error;
  }
};

/**
 * Delete media
 */
export const deleteMedia = async (mediaId: string): Promise<boolean> => {
  try {
    await pb.collection('media').delete(mediaId);
    return true;
  } catch (error) {
    console.error('Error deleting media:', error);
    throw error;
  }
};

/**
 * Update a media caption
 */
export const updateMediaCaption = async (
  mediaId: string,
  caption: string
): Promise<Media> => {
  try {
    const record = await pb.collection('media').update(mediaId, {
      caption,
    });
    
    return record as unknown as Media;
  } catch (error) {
    console.error('Error updating media caption:', error);
    throw error;
  }
}; 