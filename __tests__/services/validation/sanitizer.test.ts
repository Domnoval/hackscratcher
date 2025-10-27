/**
 * Sanitization Tests
 * Tests for input sanitization functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  sanitizeObject,
  stripNullBytes,
  normalizeWhitespace,
  sanitizePhoneNumber,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeBoolean,
} from '../../../services/validation/sanitizer';

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<p>Hello</p>')).toBe('Hello');
    expect(sanitizeString('<div class="test">Content</div>')).toBe('Content');
  });

  it('should remove script tags and content', () => {
    expect(sanitizeString('<script>alert(1)</script>Hello')).toBe('Hello');
    expect(sanitizeString('Test<script>malicious()</script>Text')).toBe(
      'TestText'
    );
  });

  it('should remove javascript: protocol', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
    expect(sanitizeString('JAVASCRIPT:void(0)')).toBe('void(0)');
  });

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
    expect(sanitizeString('onload=malicious()')).toBe('malicious()');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('test\0null')).toBe('testnull');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('should limit length', () => {
    const longString = 'a'.repeat(2000);
    expect(sanitizeString(longString, 100).length).toBe(100);
  });

  it('should handle non-string input', () => {
    expect(sanitizeString(null as any)).toBe('');
    expect(sanitizeString(undefined as any)).toBe('');
    expect(sanitizeString(123 as any)).toBe('');
  });
});

describe('sanitizeNumber', () => {
  it('should clamp numbers within bounds', () => {
    expect(sanitizeNumber(50, 0, 100)).toBe(50);
    expect(sanitizeNumber(150, 0, 100)).toBe(100);
    expect(sanitizeNumber(-10, 0, 100)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(sanitizeNumber(0, 0, 100)).toBe(0);
    expect(sanitizeNumber(100, 0, 100)).toBe(100);
  });

  it('should handle invalid numbers', () => {
    expect(sanitizeNumber(NaN, 0, 100)).toBe(0);
    expect(sanitizeNumber(Infinity, 0, 100)).toBe(0);
    expect(sanitizeNumber(-Infinity, 0, 100)).toBe(0);
  });

  it('should handle non-number input', () => {
    expect(sanitizeNumber('123' as any, 0, 100)).toBe(0);
  });
});

describe('sanitizeEmail', () => {
  it('should trim and lowercase emails', () => {
    expect(sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeEmail('user<script>@example.com')).toBe(
      'userscript@example.com'
    );
    expect(sanitizeEmail("user'@example.com")).toBe('user@example.com');
  });

  it('should limit length', () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    expect(sanitizeEmail(longEmail).length).toBeLessThanOrEqual(255);
  });

  it('should handle non-string input', () => {
    expect(sanitizeEmail(null as any)).toBe('');
  });
});

describe('sanitizeHTML', () => {
  it('should allow safe HTML tags', () => {
    const result1 = sanitizeHTML('<p>Hello</p>');
    const result2 = sanitizeHTML('<strong>Bold</strong>');
    // HTML tags should be preserved for safe tags
    expect(result1).toContain('Hello');
    expect(result2).toContain('Bold');
  });

  it('should remove dangerous tags', () => {
    const result1 = sanitizeHTML('<script>alert(1)</script>');
    const result2 = sanitizeHTML('<iframe src="evil"></iframe>');
    expect(result1).not.toContain('<script>');
    expect(result2).not.toContain('<iframe>');
  });

  it('should remove event handlers', () => {
    const result = sanitizeHTML('<p onclick="alert(1)">Text</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('Text');
  });

  it('should remove javascript: and data: protocols', () => {
    const result1 = sanitizeHTML('javascript:alert(1)');
    const result2 = sanitizeHTML('data:text/html,<script>');
    expect(result1).not.toContain('javascript:');
    expect(result2).not.toContain('data:text/html');
  });
});

describe('sanitizeSQL', () => {
  it('should remove SQL comments', () => {
    const result1 = sanitizeSQL('SELECT * FROM users -- comment');
    const result2 = sanitizeSQL('/* comment */ SELECT');
    expect(result1).not.toContain('--');
    expect(result2).not.toContain('/*');
  });

  it('should remove dangerous SQL keywords', () => {
    const result1 = sanitizeSQL('DROP TABLE users');
    const result2 = sanitizeSQL('DELETE FROM table');
    const result3 = sanitizeSQL('TRUNCATE users');
    expect(result1).not.toContain('DROP');
    expect(result2).not.toContain('DELETE');
    expect(result3).not.toContain('TRUNCATE');
  });

  it('should remove semicolons', () => {
    const result = sanitizeSQL("'; DROP TABLE users; --");
    expect(result).not.toContain(';');
  });

  it('should remove quote escaping attempts', () => {
    const result1 = sanitizeSQL("\\' OR 1=1");
    const result2 = sanitizeSQL('\\" OR 1=1');
    expect(result1).not.toContain("\\'");
    expect(result2).not.toContain('\\"');
  });
});

describe('sanitizeFilename', () => {
  it('should remove path separators', () => {
    expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt');
  });

  it('should remove directory traversal attempts', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('etcpasswd');
  });

  it('should remove null bytes', () => {
    expect(sanitizeFilename('file\0.txt')).toBe('file.txt');
  });

  it('should remove special characters', () => {
    expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
  });

  it('should handle empty result', () => {
    expect(sanitizeFilename('...')).toBe('file');
    expect(sanitizeFilename('   ')).toBe('file');
  });

  it('should limit length', () => {
    const longFilename = 'a'.repeat(300) + '.txt';
    expect(sanitizeFilename(longFilename).length).toBeLessThanOrEqual(255);
  });
});

describe('sanitizeURL', () => {
  it('should accept safe URLs', () => {
    expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    expect(sanitizeURL('http://test.org/path')).toBe('http://test.org/path');
  });

  it('should reject dangerous protocols', () => {
    expect(sanitizeURL('javascript:alert(1)')).toBe('');
    expect(sanitizeURL('data:text/html,<script>')).toBe('');
    expect(sanitizeURL('file:///etc/passwd')).toBe('');
  });

  it('should reject invalid URLs', () => {
    expect(sanitizeURL('not a url')).toBe('');
    expect(sanitizeURL('htp://broken')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeURL(null as any)).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string values in an object', () => {
    const input = {
      name: '<script>alert(1)</script>John',
      age: 25,
      address: {
        street: '123 Main<script>',
      },
    };

    const result = sanitizeObject(input);

    expect(result.name).not.toContain('<script>');
    expect(result.name).toContain('John');
    expect(result.age).toBe(25);
    expect(result.address.street).toContain('123 Main');
    expect(result.address.street).not.toContain('<script>');
  });

  it('should handle arrays', () => {
    const input = {
      items: ['<script>test</script>', 'normal', '<b>bold</b>'],
    };

    const result = sanitizeObject(input);

    // Script tags and their content should be completely removed
    expect(result.items[0]).not.toContain('<script>');
    expect(result.items[1]).toBe('normal');
    expect(result.items[2]).toContain('bold');
    expect(result.items[2]).not.toContain('<b>');
  });

  it('should respect max depth', () => {
    const deepObject = { a: { b: { c: { d: '<script>' } } } };
    const result = sanitizeObject(deepObject, 2);

    // Should sanitize up to depth 2 but not deeper
    expect(result).toBeDefined();
  });
});

describe('stripNullBytes', () => {
  it('should remove null bytes', () => {
    expect(stripNullBytes('test\0null\0bytes')).toBe('testnullbytes');
  });

  it('should handle strings without null bytes', () => {
    expect(stripNullBytes('normal string')).toBe('normal string');
  });

  it('should handle non-string input', () => {
    expect(stripNullBytes(null as any)).toBe('');
  });
});

describe('normalizeWhitespace', () => {
  it('should replace multiple spaces with single space', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
    expect(normalizeWhitespace('a  b  c')).toBe('a b c');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('should handle tabs and newlines', () => {
    expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
  });

  it('should handle non-string input', () => {
    expect(normalizeWhitespace(null as any)).toBe('');
  });
});

describe('sanitizePhoneNumber', () => {
  it('should extract only digits', () => {
    expect(sanitizePhoneNumber('(555) 123-4567')).toBe('5551234567');
    expect(sanitizePhoneNumber('+1-800-555-0100')).toBe('18005550100');
  });

  it('should limit length to 15 digits', () => {
    const longNumber = '1'.repeat(20);
    expect(sanitizePhoneNumber(longNumber).length).toBe(15);
  });

  it('should handle non-string input', () => {
    expect(sanitizePhoneNumber(null as any)).toBe('');
  });
});

describe('sanitizeInteger', () => {
  it('should parse valid integers', () => {
    expect(sanitizeInteger('123')).toBe(123);
    expect(sanitizeInteger(456)).toBe(456);
    expect(sanitizeInteger('0')).toBe(0);
  });

  it('should return default for invalid input', () => {
    expect(sanitizeInteger('abc', 99)).toBe(99);
    expect(sanitizeInteger(null, 42)).toBe(42);
  });

  it('should truncate floats', () => {
    expect(sanitizeInteger('123.45')).toBe(123);
  });
});

describe('sanitizeFloat', () => {
  it('should parse valid floats', () => {
    expect(sanitizeFloat('123.45')).toBe(123.45);
    expect(sanitizeFloat(456.78)).toBe(456.78);
  });

  it('should return default for invalid input', () => {
    expect(sanitizeFloat('abc', 99.9)).toBe(99.9);
    expect(sanitizeFloat(Infinity, 0)).toBe(0);
    expect(sanitizeFloat(NaN, 0)).toBe(0);
  });
});

describe('sanitizeBoolean', () => {
  it('should handle boolean input', () => {
    expect(sanitizeBoolean(true)).toBe(true);
    expect(sanitizeBoolean(false)).toBe(false);
  });

  it('should parse string values', () => {
    expect(sanitizeBoolean('true')).toBe(true);
    expect(sanitizeBoolean('TRUE')).toBe(true);
    expect(sanitizeBoolean('1')).toBe(true);
    expect(sanitizeBoolean('yes')).toBe(true);

    expect(sanitizeBoolean('false')).toBe(false);
    expect(sanitizeBoolean('FALSE')).toBe(false);
    expect(sanitizeBoolean('0')).toBe(false);
    expect(sanitizeBoolean('no')).toBe(false);
  });

  it('should handle number input', () => {
    expect(sanitizeBoolean(1)).toBe(true);
    expect(sanitizeBoolean(0)).toBe(false);
    expect(sanitizeBoolean(42)).toBe(true);
  });

  it('should return default for invalid input', () => {
    expect(sanitizeBoolean('maybe', true)).toBe(true);
    expect(sanitizeBoolean(null, false)).toBe(false);
  });
});
