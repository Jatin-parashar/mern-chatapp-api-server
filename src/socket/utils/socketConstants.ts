// Built-in events
export const SOCKET_CONNECTION = "connection";
export const SOCKET_DISCONNECT = "disconnect";

// Custom events
export const SOCKET_SETUP = "setup";
export const SOCKET_JOIN_ROOM = "joinRoom";
export const SOCKET_NEW_MESSAGE = "newMessage";
export const SOCKET_NEW_CONVERSATION = "newConversation";
export const SOCKET_MESSAGE_RECEIVED = "messageReceived";
export const SOCKET_NEW_CONVERSATION_RECEIVED = "conversationReceived";
export const SOCKET_TYPING = "typing";
export const SOCKET_STOP_TYPING = "stopTyping";
export const SOCKET_MESSAGE_SEEN = "messageSeen";
export const SOCKET_MESSAGE_SEEN_UPDATE = "messageSeenUpdate";
export const SOCKET_CONVERSATION_MESSAGES_SEEN = "conversationMessageSeen";
export const SOCKET_CONVERSATION_MESSAGES_SEEN_UPDATE =
  "conversationMessageSeenUpdate";
export const SOCKET_MESSAGE_DELIVERED = "messageDelivered";
export const SOCKET_MESSAGE_DELIVERED_UPDATE = "messageDeliveredUpdate";
export const SOCKET_ONLINE_USERS = "onlineUsers";
export const SOCKET_CALL_INITIATED = "callInitiated";
export const SOCKET_CALL_RECEIVED = "callReceived";
export const SOCKET_CALL_ACCEPTED = "callAccepted";
export const SOCKET_CALL_DECLINED = "callDeclined";
export const SOCKET_CALL_ENDED = "callEnded";
export const SOCKET_CALL_SIGNAL = "callSignal";
export const SOCKET_CALL_PEER_DISCONNECTED = "callPeerDisconnected";
