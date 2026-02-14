import { jest } from '@jest/globals';

// Mock modules before imports
const mockFindUserById = jest.fn<any>();
const mockUpdateUserStatus = jest.fn<any>();
const mockCheckUsernameAvailability = jest.fn<any>();
const mockBuildPaginatedQuery = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/user.service.js', () => ({
  findUserById: mockFindUserById,
  updateUserStatus: mockUpdateUserStatus,
  checkUsernameAvailability: mockCheckUsernameAvailability
}));

jest.unstable_mockModule('../../../src/utils/queryBuilder.js', () => ({
  buildPaginatedQuery: mockBuildPaginatedQuery
}));

const { getCurrentUser, getAllUsers, getuserById, updateUserInfo, checkUsername } = await import('../../../src/controllers/user.controller.js');

describe('User Controller', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = { user: { _id: 'u1' }, body: {}, query: {}, params: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockUser = { _id: 'u1', name: 'Test' };
      mockFindUserById.mockResolvedValue(mockUser);

      await getCurrentUser(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      mockBuildPaginatedQuery.mockResolvedValue({ data: [], total: 0 });

      await getAllUsers(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getuserById', () => {
    it('should get user by id', async () => {
      mockReq.params.id = 'u2';
      mockFindUserById.mockResolvedValue({ _id: 'u2' });

      await getuserById(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUserInfo', () => {
    it('should update user info', async () => {
      mockReq.body.status = 'online';
      mockUpdateUserStatus.mockResolvedValue({ _id: 'u1', status: 'online' });

      await updateUserInfo(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('checkUsername', () => {
    it('should check username availability', async () => {
      mockReq.params.username = 'testuser';
      mockCheckUsernameAvailability.mockResolvedValue(true);

      await checkUsername(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
