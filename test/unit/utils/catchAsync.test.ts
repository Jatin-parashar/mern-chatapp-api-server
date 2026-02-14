import catchAsync from '../../../src/utils/catchAsync.js';
import { sendSuccessResponse } from '../../../src/utils/response.js';
import { jest } from '@jest/globals';

describe('Utils', () => {
  describe('catchAsync', () => {
    it('should catch async errors', async () => {
      const mockNext = jest.fn();
      const asyncFn = catchAsync(async () => {
        throw new Error('Test error');
      });

      await asyncFn({} as any, {} as any, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call function normally if no error', async () => {
      const mockNext = jest.fn();
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const asyncFn = catchAsync(async (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await asyncFn({} as any, mockRes as any, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('sendSuccessResponse', () => {
    it('should send success response with data', () => {
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      sendSuccessResponse(mockRes as any, 200, 'Success', { id: 1 });
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { id: 1 }
      });
    });

    it('should send success response without data', () => {
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      sendSuccessResponse(mockRes as any, 200, 'Success');
      
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success'
      });
    });
  });
});
