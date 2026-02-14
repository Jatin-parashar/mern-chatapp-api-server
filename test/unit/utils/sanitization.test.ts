import { sanitizeHtml, sanitizeRegexInput, sanitizeFilename } from '../../../src/utils/sanitization.js';

describe('Sanitization Utils Unit Tests', () => {
  describe('sanitizeHtml', () => {
    it('should sanitize HTML tags', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should sanitize quotes', () => {
      const result = sanitizeHtml('"test"');
      expect(result).toBe('&quot;test&quot;');
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeRegexInput', () => {
    it('should escape regex special chars', () => {
      const result = sanitizeRegexInput('test.*');
      expect(result).toBe('test\\.\\*');
    });

    it('should handle empty string', () => {
      const result = sanitizeRegexInput('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filename', () => {
      const result = sanitizeFilename('test file!@#.txt');
      expect(result).toBe('test_file___.txt');
    });

    it('should prevent directory traversal', () => {
      const result = sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('..');
    });
  });
});
