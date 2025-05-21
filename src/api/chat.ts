import { pb } from '../lib/pocketbase';
import { ChatMessage, GroupChat, ChatParticipant } from '../types/chat';

// Helper function to check authentication
const checkAuth = () => {
  if (!pb.authStore.isValid) {
    console.error('Authentication check failed:', {
      isValid: pb.authStore.isValid,
      token: !!pb.authStore.token,
      model: !!pb.authStore.model
    });
    throw new Error('Not authenticated');
  }
  console.log('Authentication check passed:', {
    userId: pb.authStore.model?.id,
    userName: pb.authStore.model?.name
  });
};

export const createGroupChat = async (eventId: string): Promise<GroupChat> => {
  try {
    checkAuth();
    console.log('Creating group chat for event:', eventId);
    const chat = await pb.collection('group_chats').create({
      event: eventId,
      created: new Date().toISOString(),
    });
    console.log('Created group chat:', chat);
    return chat;
  } catch (error: any) {
    console.error('Error creating group chat:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const getGroupChat = async (eventId: string): Promise<GroupChat | null> => {
  try {
    checkAuth();
    console.log('Getting group chat for event:', eventId);
    const chats = await pb.collection('group_chats').getList(1, 1, {
      filter: `event = "${eventId}"`,
      expand: 'event',
    });
    console.log('Found group chats:', chats);
    return chats.items[0] || null;
  } catch (error: any) {
    console.error('Error getting group chat:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const getOrCreateGroupChat = async (eventId: string): Promise<GroupChat> => {
  checkAuth();
  console.log('Getting or creating group chat for event:', eventId);
  const existingChat = await getGroupChat(eventId);
  if (existingChat) {
    console.log('Found existing chat:', existingChat);
    return existingChat;
  }
  console.log('No existing chat found, creating new one');
  return createGroupChat(eventId);
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    checkAuth();
    console.log('Getting messages for chat:', chatId);
    const messages = await pb.collection('chat_messages').getList(1, 50, {
      filter: `chat = "${chatId}"`,
      sort: '-created',
      expand: 'sender',
    });
    console.log('Found messages:', messages);
    return messages.items;
  } catch (error: any) {
    console.error('Error getting chat messages:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const sendMessage = async (
  chatId: string,
  userId: string,
  content: string
): Promise<ChatMessage> => {
  try {
    checkAuth();
    console.log('Sending message:', { chatId, userId, content });
    const message = await pb.collection('chat_messages').create({
      chat: chatId,
      sender: userId,
      content,
      created: new Date().toISOString(),
    });
    console.log('Message sent:', message);
    return message;
  } catch (error: any) {
    console.error('Error sending message:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const addChatParticipant = async (
  chatId: string,
  userId: string
): Promise<ChatParticipant> => {
  try {
    checkAuth();
    console.log('Adding participant:', { chatId, userId });
    const participant = await pb.collection('chat_participants').create({
      chat: chatId,
      user: userId,
      joined_at: new Date().toISOString(),
      last_read: new Date().toISOString(),
    });
    console.log('Added participant:', participant);
    return participant;
  } catch (error: any) {
    console.error('Error adding chat participant:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const getChatParticipants = async (chatId: string): Promise<ChatParticipant[]> => {
  try {
    checkAuth();
    console.log('Getting participants for chat:', chatId);
    const participants = await pb.collection('chat_participants').getList(1, 100, {
      filter: `chat = "${chatId}"`,
      expand: 'user',
    });
    console.log('Found participants:', participants);
    return participants.items;
  } catch (error: any) {
    console.error('Error getting chat participants:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
};

export const updateLastRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    checkAuth();
    console.log('Updating last read:', { chatId, userId });
    const participants = await pb.collection('chat_participants').getList(1, 1, {
      filter: `chat = "${chatId}" && user = "${userId}"`,
    });
    
    if (participants.items[0]) {
      await pb.collection('chat_participants').update(participants.items[0].id, {
        last_read: new Date().toISOString(),
      });
      console.log('Updated last read');
    } else {
      console.log('No participant record found to update');
    }
  } catch (error: any) {
    console.error('Error updating last read:', {
      error,
      message: error.message,
      data: error.data,
      status: error.status
    });
    throw error;
  }
}; 