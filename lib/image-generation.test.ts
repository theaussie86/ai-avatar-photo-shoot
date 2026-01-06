import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  validateImageGenerationConfig, 
  selectPose, 
  refinePrompt, 
  processReferenceImages,
  generateImage 
} from './image-generation';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock dependencies
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
}));

const globalFetch = global.fetch;
global.fetch = vi.fn();

describe('Image Generation Library', () => {

  const mockGenAIModel = {
     generateContent: vi.fn(),
  };

  // Create a mock GenAI instance directly for passing to functions
  const mockGenAIInstance = {
      getGenerativeModel: vi.fn().mockReturnValue(mockGenAIModel)
  } as unknown as GoogleGenerativeAI;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default fetch mock
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new ArrayBuffer(8),
        headers: { get: () => 'image/jpeg' },
        json: async () => ({})
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('validateImageGenerationConfig', () => {
    it('should pass valid config', () => {
      const validConfig = {
        imageCount: [1],
        shotType: 'upper_body',
        aspectRatio: '1:1',
        referenceImages: [],
        background: 'white',
        collectionName: 'My Collection'
      };
      
      // We need to cast because we are testing the function logic against inputs
      const result = validateImageGenerationConfig(validConfig as any);
      expect(result).toMatchObject(validConfig);
    });

    it('should throw on invalid config', () => {
      const invalidConfig = { imageCount: [] };
      expect(() => validateImageGenerationConfig(invalidConfig as any)).toThrow(/Validation failed/);
    });
  });

  describe('selectPose', () => {
    const poses = ['pose1', 'pose2', 'pose3'];

    it('should return correct pose for index', () => {
      expect(selectPose('shot', 0, poses)).toBe('pose1');
      expect(selectPose('shot', 1, poses)).toBe('pose2');
    });

    it('should cycle through poses', () => {
      expect(selectPose('shot', 3, poses)).toBe('pose1'); 
    });

    it('should return empty string if no poses', () => {
      expect(selectPose('shot', 0, undefined as any)).toBe('');
      expect(selectPose('shot', 0, [])).toBe('');
    });
  });

  describe('refinePrompt', () => {
    const config = { 
        shotType: 'upper_body', // Changed to match schema enum
        background: 'custom', 
        customPrompt: 'smile', 
        aspectRatio: '1:1', 
        imageCount: [1], 
        referenceImages: [],
        collectionName: 'Test'
    } as any;

    it('should return refined prompt from model', async () => {
      mockGenAIModel.generateContent.mockResolvedValue({
        response: { text: () => "Refined Prompt" }
      });

      const result = await refinePrompt(mockGenAIInstance, config, 'pose1');
      expect(result).toBe("Refined Prompt");
    });

    it('should return fallback prompt on error', async () => {
      mockGenAIModel.generateContent.mockRejectedValue(new Error("API Error"));
      
      const result = await refinePrompt(mockGenAIInstance, config, 'pose1');
      expect(result).toContain("upper_body photo, pose: pose1");
    });
  });

  describe('processReferenceImages', () => {
    it('should process valid image URLs', async () => {
      const urls = ['http://example.com/image.jpg'];
      const result = await processReferenceImages(urls);
      
      expect(fetch).toHaveBeenCalledWith('http://example.com/image.jpg');
      expect(result).toHaveLength(1);
      expect(result[0].inlineData).toBeDefined();
    });



    it('should prepend app url to relative paths', async () => {
        vi.stubGlobal('process', { env: { NEXT_PUBLIC_APP_URL: 'http://localhost:3000' } });
        await processReferenceImages(['/image.jpg']);
        expect(fetch).toHaveBeenCalledWith('http://localhost:3000/image.jpg');
    });
  });

  describe('generateImage', () => {
    it('should return image data on success', async () => {
      mockGenAIModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ inlineData: { data: 'base64data' } }]
            }
          }]
        }
      });

      const result = await generateImage(mockGenAIInstance, 'prompt', []);
      expect(result).toBe('base64data');
    });

    it('should accept reference images', async () => {
      mockGenAIModel.generateContent.mockResolvedValue({
          response: { candidates: [{ content: { parts: [{ inlineData: { data: 'd' } }] } }] }
      });

      const refImages = [{ inlineData: { data: 'ref', mimeType: 'image/png' } }];
      await generateImage(mockGenAIInstance, 'prompt', refImages as any);

      expect(mockGenAIModel.generateContent).toHaveBeenCalledWith(expect.objectContaining({
          contents: [{ role: 'user', parts: expect.arrayContaining([expect.objectContaining({text: 'prompt'}), ...refImages]) }]
      }));
    });

    it('should throw if no candidates returned', async () => {
      mockGenAIModel.generateContent.mockResolvedValue({ response: { candidates: [] } });
      await expect(generateImage(mockGenAIInstance, 'prompt', [])).rejects.toThrow(/No candidates/);
    });

    it('should throw if model refuses (returns text)', async () => {
      mockGenAIModel.generateContent.mockResolvedValue({
        response: {
          candidates: [{
            content: {
              parts: [{ text: "Cannot generate this" }]
            }
          }]
        }
      });
      await expect(generateImage(mockGenAIInstance, 'prompt', [])).rejects.toThrow(/Model returned text/);
    });
    
    it('should rethrow generic errors', async () => {
        mockGenAIModel.generateContent.mockRejectedValue(new Error("Generic Error"));
        await expect(generateImage(mockGenAIInstance, 'prompt', [])).rejects.toThrow("Generic Error");
    });

    it('should wrap 400/API errors', async () => {
        mockGenAIModel.generateContent.mockRejectedValue(new Error("400 Bad Request"));
        await expect(generateImage(mockGenAIInstance, 'prompt', [])).rejects.toThrow(/Generation failed/);
    });
  });

});
