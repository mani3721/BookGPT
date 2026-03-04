import { model, Schema, models } from 'mongoose';
import { IChat } from '@/types';

const ChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    clerkId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true }
);

const Chat = models.Chat || model<IChat>('Chat', ChatSchema);

export default Chat;
