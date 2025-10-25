export const userFields = "_id name username profilePic status";

export const messagePopulateOptions = [
  { path: "sender", select: userFields },
  { path: "seenBy", select: userFields },
  { 
    path: "replyTo", 
    select: "content messageType sender createdAt",
    populate: { path: "sender", select: userFields }
  },
];

export const conversationPopulateOptions = [
  { path: "participants", select: userFields },
  { path: "admins", select: userFields },
  {
    path: "lastMessage",
    populate: messagePopulateOptions,
  },
];