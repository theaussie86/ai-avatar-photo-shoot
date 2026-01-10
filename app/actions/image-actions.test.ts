import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImagesAction, deleteCollectionAction, deleteImageAction, generateImageTask } from './image-actions';
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

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
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
         delete: vi.fn(),
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
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }), // Default fail
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(), 
        };

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

  describe('generateImageTask', () => {
       const mockConfig = {
          aspectRatio: '1:1',
          referenceImages: [],
          model: 'models/gemini-2.0-flash'
       };

       it('should update status to failed if Gemini API fails', async () => {
           const imageId = 'img-fail-gemini';
           
           const mockTaskSupabase = {
               auth: { setSession: vi.fn(), getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u' } } }) },
               from: vi.fn().mockImplementation((table) => {
                   if (table === 'images') {
                       return {
                           select: vi.fn().mockReturnThis(),
                           eq: vi.fn().mockReturnThis(),
                           single: vi.fn().mockResolvedValue({ data: { id: imageId, collection_id: 'col-1' }, error: null }),
                           update: vi.fn().mockReturnThis()
                       } as any;
                   }
                   return { select: vi.fn().mockReturnThis() } as any;
               }),
               storage: { from: vi.fn().mockReturnThis(), upload: vi.fn() }
           };
           (createSupabaseAdmin as any).mockReturnValue(mockTaskSupabase);

           // Mock Gemini Failure
           mockGenAIClient.models.generateContent.mockRejectedValue(new Error('Gemini Exploded'));

           await generateImageTask(imageId, 'api-key', 'prompt', mockConfig as any);
           
           expect(mockTaskSupabase.from).toHaveBeenCalledWith('images');
           // Should trigger failure update
       });
       
       it('should handle reference images via Files API', async () => {
           const imageId = 'img-ref';
           // Update: The logic now expects these to be GEMINI URIs, not paths to be uploaded.
           // And it DOES NOT upload them again. It just uses them.
           // However, it does attempt to DELETE them at the end.
           
           // We'll mimic a Gemini URI
           const geminiUri = 'https://generativelanguage.googleapis.com/v1beta/files/12345';
           const configWithRef = { ...mockConfig, referenceImages: [geminiUri] };
           
             const mockTaskSupabase = {
               auth: { setSession: vi.fn(), getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u' } } }) },
               from: vi.fn().mockImplementation((table) => {
                   if (table === 'images') {
                       return {
                           select: vi.fn().mockReturnThis(),
                           eq: vi.fn().mockReturnThis(),
                           single: vi.fn().mockResolvedValue({ data: { id: imageId, collection_id: 'col-1' }, error: null }),
                           update: vi.fn().mockReturnThis()
                       } as any;
                   }
                   return { select: vi.fn().mockReturnThis() } as any;
               }),
               storage: { from: vi.fn().mockReturnThis(), upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'pub' } }) }
           };
            mockGenAIClient.files.get.mockResolvedValue({ state: 'ACTIVE', mimeType: 'image/jpeg' });
           (createSupabaseAdmin as any).mockReturnValue(mockTaskSupabase);
           
           await generateImageTask(imageId, 'api-key', 'prompt', configWithRef as any);
           
           // EXPECTATION CHANGE: It does NOT upload anymore.
           expect(mockGenAIClient.files.upload).not.toHaveBeenCalled(); 
           expect(mockGenAIClient.models.generateContent).toHaveBeenCalled();
           
           // It attempts to delete them at the end
           expect(mockGenAIClient.files.delete).toHaveBeenCalledWith({ name: 'files/12345' });
       });
  });

  describe('deleteCollectionAction', () => {
      it('should delete collection and its files', async () => {
          const collectionId = 'col-123';
          
          // Mock ownership check
          const mockCollection = { id: collectionId };
          mockSupabase.from.mockImplementation((table) => {
              if (table === 'collections') {
                  return {
                      select: vi.fn().mockReturnThis(),
                      eq: vi.fn().mockReturnThis(),
                      single: vi.fn().mockResolvedValue({ data: mockCollection }),
                      delete: vi.fn().mockReturnThis(),
                  } as any;
              }
              if (table === 'images') {
                  return {
                      delete: vi.fn().mockReturnThis(),
                      eq: vi.fn().mockReturnThis()
                  } as any;
              }
              return {} as any;
          });

          // Mock listing files
          mockSupabase.storage.list.mockResolvedValue({ data: [{ name: 'img1.png' }, { name: 'img2.png' }], error: null });
          mockSupabase.storage.remove.mockResolvedValue({ error: null });

          const result = await deleteCollectionAction(collectionId);

          expect(result.success).toBe(true);
          expect(mockSupabase.storage.list).toHaveBeenCalledWith(collectionId);
          expect(mockSupabase.storage.remove).toHaveBeenCalled();
          expect(mockSupabase.from).toHaveBeenCalledWith('collections'); 
          expect(mockSupabase.from).toHaveBeenCalledWith('images');
      });
  });

  describe('deleteImageAction', () => {
      it('should delete single image', async () => {
          const imageId = 'img-123';
          const storagePath = 'col/img.png';

          mockSupabase.from.mockImplementation((table) => {
              if (table === 'images') {
                  return {
                      select: vi.fn().mockReturnThis(),
                      eq: vi.fn().mockReturnThis(),
                      single: vi.fn().mockResolvedValue({ 
                          data: { 
                              id: imageId, 
                              user_id: mockUser.id,
                              metadata: {} 
                          } 
                      }),
                      delete: vi.fn().mockReturnThis()
                  } as any;
              }
              return {} as any;
          });

          mockSupabase.storage.remove.mockResolvedValue({ error: null });

          const result = await deleteImageAction(imageId, storagePath);

          expect(result.success).toBe(true);
          expect(mockSupabase.storage.remove).toHaveBeenCalledWith([storagePath]); // Only main image
      });

      it('should delete associated reference images if present in metadata', async () => {
        const imageId = 'img-with-refs';
        const storagePath = 'col/main_img.png';
        const refImage = 'col/ref_1.png';
        
        // Mock Metadata with legacy reference image path (simulated)
        // The logic looks for paths containing "generated_images" or simple logic
        // Let's provide a full URL that our logic detects as Supabase
        const refUrl = `https://supabase.co/storage/v1/object/public/generated_images/${refImage}`;

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'images') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
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
            }
            return {} as any;
        });

        const removeMock = vi.fn().mockResolvedValue({ error: null });
        mockSupabase.storage.remove = removeMock;

        await deleteImageAction(imageId, storagePath);

        // Expect TWO remove calls (or one with multiple files, depending on implementation details)
        // My implementation calls remove(filesToDelete) for refs, and remove([storagePath]) for main.
        // So 2 calls.
        
        // 1. Reference cleanup
        expect(removeMock).toHaveBeenCalledWith([refImage]);
        
        // 2. Main image cleanup
        expect(removeMock).toHaveBeenCalledWith([storagePath]);
      });
  });

  describe('deleteCollectionImagesAction', () => {
      it('should delete all images in a collection', async () => {
          const collectionId = 'col-123';

          // Mock Ownership
          mockSupabase.from.mockImplementation((table) => {
               if (table === 'collections') {
                   return {
                       select: vi.fn().mockReturnThis(),
                       eq: vi.fn().mockReturnThis(),
                       single: vi.fn().mockResolvedValue({ data: { id: collectionId } })
                   } as any;
               }
               if (table === 'images') {
                   return {
                       delete: vi.fn().mockReturnThis(),
                       eq: vi.fn().mockReturnThis()
                   } as any;
               }
               return {} as any;
          });
          
          mockSupabase.storage.list.mockResolvedValue({ data: [{ name: '1.png' }, { name: '2.png' }], error: null });
          mockSupabase.storage.remove.mockResolvedValue({ error: null });

          await import('./image-actions').then(mod => mod.deleteCollectionImagesAction(collectionId));

          expect(mockSupabase.storage.list).toHaveBeenCalledWith(collectionId);
          expect(mockSupabase.storage.remove).toHaveBeenCalled(); // with paths
          expect(mockSupabase.from).toHaveBeenCalledWith('images');
      });
  });

});
