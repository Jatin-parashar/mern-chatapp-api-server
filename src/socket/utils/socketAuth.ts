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

    if (!token) {
      logger.warn("Socket connection attempt without token");
      return next(new Error("Authentication error: No token provided"));
    }

    const user = validateAccessToken(token) as JwtPayload;
    
    if (!user || !user._id || !user.email) {
      logger.warn("Invalid token payload");
      return next(new Error("Authentication error: Invalid token"));
    }
    
    // Cast to CustomSocket and add user data
    const customSocket = socket as CustomSocket;
    customSocket.userId = user._id;
    customSocket.userEmail = user.email;

    logger.debug(`Socket authenticated for user: ${user._id}`);
    next();
  } catch (error) {
    logger.error({ err: error }, "Socket authentication failed");
    return next(new Error("Authentication error: Token validation failed"));
  }
};