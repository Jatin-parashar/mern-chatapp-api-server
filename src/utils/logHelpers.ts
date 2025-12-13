import logger from "./logger.js";

export const logSocketAction = (userId: string, action: string, conversationId: string): void => {
  logger.debug(`User ${userId} ${action} in conversation ${conversationId}`);
};