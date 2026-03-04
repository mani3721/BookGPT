'use server';

import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/database/mongoose';
import { serializeData } from '@/lib/utils';
import Chat from '@/database/models/chat.model';
import { IChatMessage } from '@/types';

export const getChats = async () => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const chats = await Chat.find({ clerkId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    return { success: true, data: serializeData(chats) };
  } catch (e) {
    console.error('getChats error:', e);
    return { success: false, error: e };
  }
};

export const getChatById = async (id: string) => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const chat = await Chat.findOne({ _id: id, clerkId: userId }).lean();
    if (!chat) return { success: false, error: 'Chat not found' };

    return { success: true, data: serializeData(chat) };
  } catch (e) {
    console.error('getChatById error:', e);
    return { success: false, error: e };
  }
};

export const createChat = async (title: string = 'New Chat') => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const chat = await Chat.create({ clerkId: userId, title, messages: [] });

    return { success: true, data: serializeData(chat) };
  } catch (e) {
    console.error('createChat error:', e);
    return { success: false, error: e };
  }
};

export const updateChatMessages = async (id: string, messages: IChatMessage[]) => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const chat = await Chat.findOneAndUpdate(
      { _id: id, clerkId: userId },
      { messages, title: messages.length ? getTitleFromMessages(messages) : 'New Chat' },
      { new: true }
    ).lean();

    if (!chat) return { success: false, error: 'Chat not found' };
    return { success: true, data: serializeData(chat) };
  } catch (e) {
    console.error('updateChatMessages error:', e);
    return { success: false, error: e };
  }
};

export const deleteChat = async (id: string) => {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    const chat = await Chat.findOneAndDelete({ _id: id, clerkId: userId });
    if (!chat) return { success: false, error: 'Chat not found' };

    return { success: true };
  } catch (e) {
    console.error('deleteChat error:', e);
    return { success: false, error: e };
  }
};

function getTitleFromMessages(messages: IChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser?.content) return 'New Chat';
  const text = firstUser.content.slice(0, 50);
  return text.length < firstUser.content.length ? `${text}...` : text;
}
