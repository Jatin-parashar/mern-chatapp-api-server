import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  username: string;
  profilePic: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthCredential extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  content?: string;
  messageType?: string;
  attachments?: Array<{
    url: string;
    publicId: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  replyTo?: Types.ObjectId;
  seenBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  isGroup: boolean;
  name?: string;
  participants: Types.ObjectId[];
  admins: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICall extends Document {
  _id: Types.ObjectId;
  callId: string;
  caller: Types.ObjectId;
  receiver: Types.ObjectId;
  isVideoCall: boolean;
  status: 'calling' | 'accepted' | 'declined' | 'ended' | 'missed';
  duration: number;
  startedAt: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}