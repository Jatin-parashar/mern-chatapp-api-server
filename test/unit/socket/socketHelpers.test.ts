import { 
  addUserSocket, 
  removeUserSocket, 
  getOnlineUserIds, 
  isUserOnline,
  onlineUsers,
  storeActiveCall,
  getActiveCall,
  removeActiveCall,
  findCallBySocketId
} from '../../../src/socket/utils/socketHelpers.js';

describe('Socket Helpers', () => {
  beforeEach(() => {
    onlineUsers.clear();
  });

  describe('User Management', () => {
    it('should add user socket', () => {
      addUserSocket('user1', 'socket1');
      
      expect(isUserOnline('user1')).toBe(true);
      expect(getOnlineUserIds()).toContain('user1');
    });

    it('should add multiple sockets for same user', () => {
      addUserSocket('user1', 'socket1');
      addUserSocket('user1', 'socket2');
      
      expect(isUserOnline('user1')).toBe(true);
      expect(onlineUsers.get('user1')).toHaveLength(2);
    });

    it('should not duplicate socket IDs', () => {
      addUserSocket('user1', 'socket1');
      addUserSocket('user1', 'socket1');
      
      expect(onlineUsers.get('user1')).toHaveLength(1);
    });

    it('should remove user socket', () => {
      addUserSocket('user1', 'socket1');
      removeUserSocket('socket1');
      
      expect(isUserOnline('user1')).toBe(false);
      expect(getOnlineUserIds()).not.toContain('user1');
    });

    it('should keep user online if other sockets exist', () => {
      addUserSocket('user1', 'socket1');
      addUserSocket('user1', 'socket2');
      removeUserSocket('socket1');
      
      expect(isUserOnline('user1')).toBe(true);
      expect(onlineUsers.get('user1')).toHaveLength(1);
    });

    it('should get all online user IDs', () => {
      addUserSocket('user1', 'socket1');
      addUserSocket('user2', 'socket2');
      addUserSocket('user3', 'socket3');
      
      const onlineIds = getOnlineUserIds();
      expect(onlineIds).toHaveLength(3);
      expect(onlineIds).toContain('user1');
      expect(onlineIds).toContain('user2');
      expect(onlineIds).toContain('user3');
    });
  });

  describe('Call Management', () => {
    const callData = {
      caller: 'user1',
      receiver: 'user2',
      isVideoCall: true,
      callerSocketId: 'socket1',
      receiverSocketId: 'socket2',
      status: 'calling',
      createdAt: Date.now(),
    };

    it('should store active call', () => {
      storeActiveCall('call1', callData);
      
      const call = getActiveCall('call1');
      expect(call).toBeDefined();
      expect(call?.caller).toBe('user1');
      expect(call?.receiver).toBe('user2');
    });

    it('should find call by socket ID', () => {
      storeActiveCall('call1', callData);
      
      const result = findCallBySocketId('socket1');
      expect(result).toBeDefined();
      expect(result?.callId).toBe('call1');
      expect(result?.call.caller).toBe('user1');
    });

    it('should find call by receiver socket ID', () => {
      storeActiveCall('call1', callData);
      
      const result = findCallBySocketId('socket2');
      expect(result).toBeDefined();
      expect(result?.callId).toBe('call1');
    });

    it('should return null for non-existent socket', () => {
      storeActiveCall('call1', callData);
      
      const result = findCallBySocketId('nonexistent');
      expect(result).toBeNull();
    });

    it('should remove active call', () => {
      storeActiveCall('call1', callData);
      const removed = removeActiveCall('call1');
      
      expect(removed).toBe(true);
      expect(getActiveCall('call1')).toBeUndefined();
    });

    it('should return false when removing non-existent call', () => {
      const removed = removeActiveCall('nonexistent');
      expect(removed).toBe(false);
    });
  });
});
