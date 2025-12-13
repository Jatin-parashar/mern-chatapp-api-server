import { ExtendedError, Socket } from "socket.io";
import { validateAccessToken } from "../../utils/auth.js";
import logger from "../../utils/logger.js";
import { JwtPayload } from "jsonwebtoken";

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
      socket.disconnect(true);
      return next(new Error("Authentication error: No token provided"));
    }

    const user = validateAccessToken(token) as JwtPayload;
    
    if (!user || typeof user !== 'object' || !user._id || !user.email) {
      logger.warn({ socketId: socket.id }, "Invalid token payload");
      socket.disconnect(true);
      return next(new Error("Authentication error: Invalid token"));
    }
    
    // Cast to CustomSocket and add user data
    const customSocket = socket as CustomSocket;
    customSocket.userId = user._id;
    customSocket.userEmail = user.email;

    logger.debug(`Socket authenticated for user: ${user._id}`);
    next();
  } catch (error) {
    logger.error({ err: error, socketId: socket.id }, "Socket authentication failed");
    socket.disconnect(true);
    return next(new Error("Authentication error: Token validation failed"));
  }
};