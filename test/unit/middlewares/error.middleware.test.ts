import errorMiddleware from '../../../src/middlewares/error.middleware.js';
import AppError from '../../../src/utils/appError.js';
import { jest } from '@jest/globals';

describe('Error Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = { path: '/test', method: 'GET', requestId: 'req1' };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
    process.env.NODE_ENV = 'test';
  });

  it('should handle AppError', () => {
    const error = new AppError('Test error', 400);
    errorMiddleware(error, mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle string error', () => {
    errorMiddleware('String error', mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should handle operational error in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new AppError('Operational error', 400);
    errorMiddleware(error, mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'fail',
      message: 'Operational error'
    }));
  });

  it('should handle non-operational error in production', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Programming error');
    errorMiddleware(error, mockReq, mockRes, mockNext);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Something went wrong!'
    }));
  });
});
