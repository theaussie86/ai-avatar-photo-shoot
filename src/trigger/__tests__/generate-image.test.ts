import { describe, it, expect } from 'vitest';
import { categorizeError, ERROR_CODES } from '../generate-image';

describe('Error Categorization', () => {
  describe('categorizeError', () => {
    describe('API_KEY_INVALID errors', () => {
      it('should categorize "api key" pattern', () => {
        const error = new Error('Invalid API key provided');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
        expect(result.code).toBe('API_KEY_INVALID');
        expect(result.message).toBe('Gemini API key is invalid or expired');
      });

      it('should categorize "invalid_api_key" pattern', () => {
        const error = new Error('Error: invalid_api_key - unauthorized');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });

      it('should categorize case-insensitive "API KEY" pattern', () => {
        const error = new Error('The API KEY you provided is not valid');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });

      it('should categorize error with "api key" in mixed case', () => {
        const error = new Error('Authentication failed: Api Key expired');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });
    });

    describe('QUOTA_EXCEEDED errors', () => {
      it('should categorize "quota" pattern', () => {
        const error = new Error('Quota exceeded for requests');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
        expect(result.code).toBe('QUOTA_EXCEEDED');
        expect(result.message).toBe('API quota exceeded. Try again later.');
      });

      it('should categorize "resource_exhausted" pattern', () => {
        const error = new Error('RESOURCE_EXHAUSTED: Too many requests');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });

      it('should categorize case-insensitive "QUOTA" pattern', () => {
        const error = new Error('Daily QUOTA limit reached');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });

      it('should categorize resource exhausted in lowercase', () => {
        const error = new Error('resource_exhausted: rate limit exceeded');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });
    });

    describe('FILE_TIMEOUT errors', () => {
      it('should categorize "timeout" pattern', () => {
        const error = new Error('Request timeout after 30 seconds');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
        expect(result.code).toBe('FILE_TIMEOUT');
        expect(result.message).toBe('Reference images took too long to process');
      });

      it('should categorize "file processing" pattern', () => {
        const error = new Error('File processing failed - timeout reached');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
      });

      it('should categorize "file" and "processing" together', () => {
        const error = new Error('Error during file processing operation');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
      });

      it('should categorize case-insensitive "TIMEOUT" pattern', () => {
        const error = new Error('Connection TIMEOUT occurred');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
      });

      it('should NOT categorize "file" without "processing"', () => {
        const error = new Error('File not found');
        const result = categorizeError(error);

        // Should not match FILE_TIMEOUT - should fall through to other categories or UNKNOWN
        expect(result).not.toEqual(ERROR_CODES.FILE_TIMEOUT);
      });
    });

    describe('UPLOAD_FAILED errors', () => {
      it('should categorize "upload" pattern', () => {
        const error = new Error('Upload to storage failed');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
        expect(result.code).toBe('UPLOAD_FAILED');
        expect(result.message).toBe('Failed to save generated image');
      });

      it('should categorize "storage" pattern', () => {
        const error = new Error('Storage service unavailable');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
      });

      it('should categorize case-insensitive "UPLOAD" pattern', () => {
        const error = new Error('UPLOAD failed: network error');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
      });

      it('should categorize Supabase storage errors', () => {
        const error = new Error('Supabase storage: upload rejected');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
      });
    });

    describe('GENERATION_FAILED errors', () => {
      it('should categorize "generation" pattern', () => {
        const error = new Error('Image generation failed');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
        expect(result.code).toBe('GENERATION_FAILED');
        expect(result.message).toBe('Image generation failed');
      });

      it('should categorize "generate" pattern', () => {
        const error = new Error('Failed to generate image');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
      });

      it('should categorize case-insensitive "GENERATION" pattern', () => {
        const error = new Error('GENERATION process encountered an error');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
      });

      it('should categorize "No image generated" error', () => {
        const error = new Error('No image generated. FinishReason: SAFETY');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
      });
    });

    describe('UNKNOWN errors', () => {
      it('should categorize unrecognized error patterns', () => {
        const error = new Error('Something went wrong');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UNKNOWN);
        expect(result.code).toBe('UNKNOWN');
        expect(result.message).toBe('An unexpected error occurred');
      });

      it('should categorize network errors as unknown', () => {
        const error = new Error('Network connection failed');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UNKNOWN);
      });

      it('should categorize generic errors as unknown', () => {
        const error = new Error('Unexpected server error');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UNKNOWN);
      });

      it('should handle empty error messages', () => {
        const error = new Error('');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UNKNOWN);
      });
    });

    describe('Error input handling', () => {
      it('should handle Error objects', () => {
        const error = new Error('api key invalid');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });

      it('should handle string errors', () => {
        const error = 'quota exceeded';
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });

      it('should handle non-Error objects', () => {
        const error = { message: 'timeout occurred' };
        const result = categorizeError(error);

        // Non-Error objects are converted to string with String(), which becomes "[object Object]"
        // This won't match any pattern, so it should be UNKNOWN
        expect(result).toEqual(ERROR_CODES.UNKNOWN);
      });

      it('should handle null/undefined errors', () => {
        const result1 = categorizeError(null);
        const result2 = categorizeError(undefined);

        expect(result1).toEqual(ERROR_CODES.UNKNOWN);
        expect(result2).toEqual(ERROR_CODES.UNKNOWN);
      });

      it('should handle numeric errors', () => {
        const error = 404;
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UNKNOWN);
      });
    });

    describe('Priority and specificity', () => {
      it('should prioritize API_KEY_INVALID over other patterns', () => {
        // If error message contains multiple patterns, first match wins
        const error = new Error('api key invalid - quota exceeded');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });

      it('should prioritize QUOTA_EXCEEDED over GENERATION_FAILED', () => {
        const error = new Error('quota exceeded during generation');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });

      it('should prioritize FILE_TIMEOUT over UPLOAD_FAILED', () => {
        const error = new Error('timeout during upload');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
      });

      it('should prioritize UPLOAD_FAILED over GENERATION_FAILED', () => {
        const error = new Error('upload failed after generation');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
      });
    });

    describe('Real-world error scenarios', () => {
      it('should categorize Gemini API authentication errors', () => {
        const error = new Error('GoogleGenerativeAI Error: invalid_api_key');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.API_KEY_INVALID);
      });

      it('should categorize rate limit errors', () => {
        const error = new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for quota metric');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.QUOTA_EXCEEDED);
      });

      it('should categorize file processing timeout errors', () => {
        const error = new Error('File processing timeout: Reference image not ready');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.FILE_TIMEOUT);
      });

      it('should categorize Supabase upload errors', () => {
        const error = new Error('Upload failed: Bucket not found in storage');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.UPLOAD_FAILED);
      });

      it('should categorize safety filter errors', () => {
        const error = new Error('No image generated. FinishReason: SAFETY');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
      });

      it('should categorize content policy errors', () => {
        const error = new Error('Image generation blocked by content policy');
        const result = categorizeError(error);

        expect(result).toEqual(ERROR_CODES.GENERATION_FAILED);
      });
    });
  });

  describe('ERROR_CODES constant', () => {
    it('should have all required error codes', () => {
      expect(ERROR_CODES.API_KEY_INVALID).toBeDefined();
      expect(ERROR_CODES.QUOTA_EXCEEDED).toBeDefined();
      expect(ERROR_CODES.FILE_TIMEOUT).toBeDefined();
      expect(ERROR_CODES.GENERATION_FAILED).toBeDefined();
      expect(ERROR_CODES.UPLOAD_FAILED).toBeDefined();
      expect(ERROR_CODES.UNKNOWN).toBeDefined();
    });

    it('should have correct structure for each error code', () => {
      Object.values(ERROR_CODES).forEach(errorCode => {
        expect(errorCode).toHaveProperty('code');
        expect(errorCode).toHaveProperty('message');
        expect(typeof errorCode.code).toBe('string');
        expect(typeof errorCode.message).toBe('string');
      });
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ERROR_CODES).map(e => e.code);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });

    it('should have non-empty error messages', () => {
      Object.values(ERROR_CODES).forEach(errorCode => {
        expect(errorCode.message.length).toBeGreaterThan(0);
      });
    });
  });
});
