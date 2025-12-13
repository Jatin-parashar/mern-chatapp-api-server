import logger from "../../utils/logger.js";

export const validateSocketEvent = (data: any, requiredField: string): boolean => {
  if (!data[requiredField]) {
    logger.warn(`Socket event missing ${requiredField}`);
    return false;
  }
  return true;
};