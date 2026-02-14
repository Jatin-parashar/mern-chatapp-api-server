import AppError from '../../../src/utils/appError.js';
import { throwNotFound, throwRequired, throwTooLong } from '../../../src/utils/errorHelpers.js';

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error Helpers', () => {
    it('should throw 404 not found error', () => {
      expect(() => throwNotFound('User')).toThrow(AppError);
      expect(() => throwNotFound('User')).toThrow('User not found');
      
      try {
        throwNotFound('User');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });

    it('should throw required field error', () => {
      expect(() => throwRequired('Email')).toThrow(AppError);
      expect(() => throwRequired('Email')).toThrow('Email is required');
      
      try {
        throwRequired('Email');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('should throw too long error', () => {
      expect(() => throwTooLong('Name', 50)).toThrow(AppError);
      expect(() => throwTooLong('Name', 50)).toThrow('Name exceeds 50 characters');
      
      try {
        throwTooLong('Name', 50);
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });
});
