import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImagesAction, deleteCollectionAction, deleteImageAction } from './image-actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleGenAI } from '@google/genai';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

// Mock Trigger.dev SDK
vi.mock('@trigger.dev/sdk/v3', () => ({
  tasks: {
    trigger: vi.fn().mockResolvedValue({ id: 'mock-run-id' }),
    triggerAndWait: vi.fn().mockResolvedValue({ ok: true, output: {} }),
  },
}));

vi.mock('@/lib/encryption', () => ({
  decrypt: vi.fn().mockReturnValue('mock-api-key'),
}));

// Mock global fetch
const globalFetch = global.fetch;
global.fetch = vi.fn();




describe('Image Actions', () => {
  const mockUser = { id: 'user-123' };
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'at', refresh_token: 'rt' } }, error: null }),
      setSession: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      list: vi.fn(),
      remove: vi.fn(),
    },
  };

  const mockGenAIClient = {
     models: {
         generateContent: vi.fn()
     },
     files: {
         upload: vi.fn(),
         delete: vi.fn().mockResolvedValue({}),
         get: vi.fn()
     }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fetch mock
    const fetchMock = vi.fn().mockResolvedValue({
        arrayBuffer: async () => new ArrayBuffer(8),
        ok: true,
        json: async () => ({}),
        headers: { get: () => 'image/jpeg' }
    });
    vi.stubGlobal('fetch', fetchMock);

    // Setup other mocks
    (createClient as any).mockResolvedValue(mockSupabase);
    (GoogleGenAI as any).mockImplementation(function() { return mockGenAIClient; });

    // Mock genAI behavior
    mockGenAIClient.models.generateContent.mockResolvedValue({
        response: { 
            candidates: [{
                content: {
                    parts: [{ inlineData: { data: 'mock-base64-image' } }]
                }
            }]
        }
    });
    mockGenAIClient.files.upload.mockResolvedValue({
        file: { name: 'files/123rec', uri: 'https://generativelanguage.googleapis.com/v1beta/files/123rec', mimeType: 'image/jpeg' }
    });
    
    // Default happy path mocks
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabase.auth.setSession.mockResolvedValue({ error: null });
    
    // Mock profile with API key and other table interactions
    mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }), // Default fail
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(), 
        } as any;

        if (table === 'profiles') {
             chain.single.mockResolvedValue({ data: { gemini_api_key: 'test-api-key' }, error: null });
        }
        if (table === 'collections') {
             chain.single.mockResolvedValue({ data: { id: 'existing-col', user_id: mockUser.id }, error: null });
             chain.insert.mockReturnValue({
                 select: vi.fn().mockReturnValue({
                     single: vi.fn().mockResolvedValue({ data: { id: 'new-col' }, error: null })
                 })
             });
        }
        if (table === 'images') {
             chain.single.mockResolvedValue({ data: { id: 'img-123', user_id: mockUser.id }, error: null });
        }
        return chain;
    });
    
    // Mock storage upload and public url
    mockSupabase.storage.upload.mockResolvedValue({ error: null });
    mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } });
    mockSupabase.storage.list.mockResolvedValue({ data: [], error: null });
    mockSupabase.storage.remove.mockResolvedValue({ error: null });
    
    // Set env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
  });

  afterEach(() => {
      vi.unstubAllGlobals();
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('generateImagesAction', () => {
    const validData = {
      imageCount: [1],
      shotType: 'upper_body',
      collectionName: 'Test Collection',
      customPrompt: 'A test prompt',
      aspectRatio: '1:1',
      background: 'white',
      outputFormat: 'png',
      referenceImages: []
    };

    it('should redirect to login if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      try {
        await generateImagesAction(validData as any);
      } catch (e) { }      
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should throw error if validation fails', async () => {
        const invalidData = { ...validData, imageCount: [] }; 
        await expect(generateImagesAction(invalidData as any)).rejects.toThrow(/Validation failed/);
    });

    it('should create a new collection', async () => {
        const result = await generateImagesAction(validData as any);
        expect(result.success).toBe(true);
        expect(GoogleGenAI).toHaveBeenCalled();
    });
  });

  // Note: generateImageTask tests removed - now a Trigger.dev task
  // See src/trigger/generate-image.ts and its tests

  describe('deleteCollectionAction', () => {
      it('should trigger background job for collection deletion', async () => {
          const collectionId = 'col-123';

          // Mock ownership check
          const mockCollection = { id: collectionId };
          mockSupabase.from.mockImplementation((table) => {
              const chain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCollection }),
                delete: vi.fn().mockReturnThis(),
              } as any;
              return chain;
          });

          const result = await deleteCollectionAction(collectionId);

          // Now triggers a background job instead of deleting directly
          expect(result.success).toBe(true);
          expect(result.runId).toBe('mock-run-id');
          expect(mockSupabase.from).toHaveBeenCalledWith('collections');
      });
  });

  describe('deleteImageAction', () => {
      it('should delete single image', async () => {
          const imageId = 'img-123';
          const storagePath = 'col/img.png';

          mockSupabase.from.mockImplementation((table) => {
              const chain = {
                  select: vi.fn().mockReturnThis(),
                  eq: vi.fn().mockReturnThis(),
                  single: vi.fn().mockResolvedValue({ 
                      data: { 
                          id: imageId, 
                          user_id: mockUser.id,
                          metadata: {} 
                      } 
                  }),
                  delete: vi.fn().mockReturnThis(),
                  neq: vi.fn().mockReturnThis(),
                  in: vi.fn().mockReturnThis(),
              } as any;

              if (table === 'profiles') {
                  chain.single.mockResolvedValue({ data: { gemini_api_key: 'test' } });
              }
              return chain;
          });

          mockSupabase.storage.remove.mockResolvedValue({ error: null });

          const result = await deleteImageAction(imageId, storagePath);

          expect(result.success).toBe(true);
          expect(mockSupabase.storage.remove).toHaveBeenCalledWith([storagePath]); // Only main image
      });

      it('should NOT delete Gemini files (cleanup skipped per user request)', async () => {
        const imageId = 'img-with-refs';
        const storagePath = 'col/main_img.png';

        // We now use Gemini URIs in metadata
        const refUrl = `https://generativelanguage.googleapis.com/v1beta/files/123rec`;

        mockSupabase.from.mockImplementation((table) => {
            const chain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                neq: vi.fn().mockReturnThis(),
                in: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: {
                        id: imageId,
                        user_id: mockUser.id,
                        metadata: {
                            config: {
                                referenceImages: [refUrl]
                            }
                        }
                    }
                }),
                delete: vi.fn().mockReturnThis()
            } as any;

            if (table === 'profiles') {
                chain.single.mockResolvedValue({ data: { gemini_api_key: 'test-api-key' } });
            }
            return chain;
        });

        const removeMock = vi.fn().mockResolvedValue({ error: null });
        mockSupabase.storage.remove = removeMock;

        await deleteImageAction(imageId, storagePath);

        // Gemini files cleanup is skipped per user request
        expect(mockGenAIClient.files.delete).not.toHaveBeenCalled();

        // Main image cleanup (Supabase) should still happen
        expect(removeMock).toHaveBeenCalledWith([storagePath]);
      });
  });

  describe('deleteCollectionImagesAction', () => {
      it('should trigger background job for collection images deletion', async () => {
          const collectionId = 'col-123';

          // Mock ownership check
          const mockCollection = { id: collectionId };
          mockSupabase.from.mockImplementation((table) => {
              const chain = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockCollection }),
                delete: vi.fn().mockReturnThis(),
              } as any;
              return chain;
          });

          const { deleteCollectionImagesAction } = await import('./image-actions');
          const result = await deleteCollectionImagesAction(collectionId);

          // Now triggers a background job instead of deleting directly
          expect(result.success).toBe(true);
          expect(result.runId).toBe('mock-run-id');
          expect(mockSupabase.from).toHaveBeenCalledWith('collections');
    });
});
});
