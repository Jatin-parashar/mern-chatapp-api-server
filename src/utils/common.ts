export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const toString = (value: unknown): string => {
  if (value && typeof (value as any).toString === 'function') {
    return (value as any).toString();
  }
  return String(value);
};

export const generateCallId = (): string => {
  return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface UserForSocket {
  _id: string;
  name: string;
  username: string;
  profilePic?: string;
  status?: string;
}

interface User extends UserForSocket {
  [key: string]: any;
}

export const formatUserForSocket = (user: User | null): UserForSocket | null => {
  if (!user) return null;
  
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    profilePic: user.profilePic,
    status: user.status,
  };
};

export const arrayIncludesUserId = (array: any[], userId: string): boolean => {
  if (!Array.isArray(array)) return false;
  const userIdStr = toString(userId);
  return array.some(item => toString(item) === userIdStr || toString(item._id) === userIdStr);
};

export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const safeJsonParse = <T = any>(str: string, fallback: T | null = null): T | null => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export const uniqueByKey = <T extends Record<string, any>>(
  array: T[], 
  key: keyof T
): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) return false;
    seen.add(keyValue);
    return true;
  });
};