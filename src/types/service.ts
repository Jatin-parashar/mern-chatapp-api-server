export interface CallWithPopulatedUsers {
  _id: string;
  callId: string;
  caller: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  receiver: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
  };
  isVideoCall: boolean;
  status: string;
  duration: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface MessageWithPopulatedFields {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
    status?: string;
  };
  content?: string;
  messageType?: string;
  attachments?: any[];
  replyTo?: any;
  deliveredTo: Array<{
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
    status?: string;
  }>;
  seenBy: Array<{
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
    status?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithPopulatedFields {
  _id: string;
  isGroup: boolean;
  name?: string;
  participants: Array<{
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
    status?: string;
  }>;
  admins: Array<{
    _id: string;
    name: string;
    username: string;
    profilePic?: string;
    status?: string;
  }>;
  lastMessage?: MessageWithPopulatedFields;
  createdAt: Date;
  updatedAt: Date;
}