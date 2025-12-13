const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export const sanitizeHtml = (str: string): string => {
  if (!str) return '';
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char]);
};

export const sanitizeRegexInput = (str: string): string => {
  if (!str) return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const sanitizeFilename = (filename: string): string => {
  if (!filename) return '';
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\./g, '_');
};
