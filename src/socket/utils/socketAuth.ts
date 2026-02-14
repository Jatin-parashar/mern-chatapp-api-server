import { ExtendedError, Socket } from "socket.io";
import { validateAccessToken } from "../../utils/auth.js";
import logger from "../../utils/logger.js";
import { HTTP_MESSAGES } from "../../config/constants.js";

// Define custom socket data interface
export interface CustomSocket extends Socket {
  userId: string;
  userEmail: string;
}

export const authenticateSocket = (
  socket: Socket,
  next: (err?: ExtendedError) => void
): void => {
  try {
    const token = socket.handshake.auth.token;

    if (!token || typeof token !== 'string') {
      logger.warn({ socketId: socket.id }, "Socket connection attempt without valid token");
      return next(new Error(`Authentication error: ${HTTP_MESSAGES.AUTH.TOKEN_NOT_PROVIDED}`));
    }

    const decoded = validateAccessToken(token);
    
    if (typeof decoded === 'string' || !decoded._id || !decoded.email) {
      logger.warn({ socketId: socket.id }, "Invalid token payload");
      return next(new Error(`Authentication error: ${HTTP_MESSAGES.AUTH.INVALID_PAYLOAD}`));
    }
    
    // Cast to CustomSocket and add user data
    const customSocket = socket as CustomSocket;
    customSocket.userId = decoded._id;
    customSocket.userEmail = decoded.email;

    logger.debug(`Socket authenticated for user: ${decoded._id}`);
    next();
  } catch (error: any) {
    logger.error({ err: error, socketId: socket.id }, "Socket authentication failed");
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error(`Authentication error: ${HTTP_MESSAGES.AUTH.TOKEN_EXPIRED}`));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new Error(`Authentication error: ${HTTP_MESSAGES.AUTH.INVALID_TOKEN}`));
    }
    
    return next(new Error(`Authentication error: ${HTTP_MESSAGES.AUTH.AUTH_FAILED}`));
  }
};