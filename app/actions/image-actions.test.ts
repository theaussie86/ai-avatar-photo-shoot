import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateImagesAction, deleteCollectionAction, deleteImageAction } from './image-actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
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

  const mockGenAIModel = {
     // Add methods if they are called on the model instance
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fetch mock
    const fetchMock = vi.fn().mockResolvedValue({
        arrayBuffer: async () => new ArrayBuffer(8),
        ok: true,
        json: async () => ({})
    });
    vi.stubGlobal('fetch', fetchMock);

    // Setup other mocks
    (createClient as any).mockResolvedValue(mockSupabase);
    (GoogleGenerativeAI as any).mockImplementation(function (this: any) {
        return {
            getGenerativeModel: vi.fn().mockReturnValue({
                ...mockGenAIModel,
                generateContent: vi.fn().mockResolvedValue({
                    response: { 
                        text: () => "Mocked refined prompt",
                        candidates: [{
                            content: {
                                parts: [{ inlineData: { data: 'mock-base64-image' } }]
                            }
                        }]
                    }
                })
            })
        };
    });
    
    // Default happy path mocks
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Mock profile with API key
    // We need to ensure the chain works for any table by default, 
    // then specialize for specific tables if needed via invocations in tests or smarter mocks.
    // A more robust mock strategy:
    mockSupabase.from.mockImplementation((table: string) => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }), // Default fail
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            upsert: vi.fn().mockReturnThis(),
        };

        if (table === 'profiles') {
             chain.single.mockResolvedValue({ data: { gemini_api_key: 'test-api-key' }, error: null });
        }
        if (table === 'collections') {
             // Default for collections
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
  });

  afterEach(() => {
      vi.unstubAllGlobals();
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
      // Mock validation success by using validData
      // BUT we want to fail AUTH.
      
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      
      try {
        await generateImagesAction(validData as any);
      } catch (e) {
         // redirect acts like an error in server actions/Next.js
      }
      
      expect(redirect).toHaveBeenCalledWith('/login');
    });

    it('should throw error if validation fails', async () => {
        const invalidData = { ...validData, imageCount: [] }; // Invalid
        await expect(generateImagesAction(invalidData as any)).rejects.toThrow(/Validation failed/);
    });

    it('should throw error if no API key is found', async () => {
         // Override profile mock to return no key
         mockSupabase.from.mockImplementationOnce((table) => {
             if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: { gemini_api_key: null }, error: null })
                } as any;
             }
             return { select: vi.fn().mockReturnThis() } as any;
        });

        await expect(generateImagesAction(validData as any)).rejects.toThrow(/No Gemini API Key found/);
    });

    it('should create a new collection and generate images', async () => {
        // Mock specific returns for this flow
        const mockInsertSelect = {
             single: vi.fn().mockResolvedValue({ data: { id: 'new-collection-id' }, error: null })
        };
        
        // We need to carefully mock the chain for 'collections' insert
        mockSupabase.from.mockImplementation((table) => {
             if (table === 'collections') {
                 return {
                     insert: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue(mockInsertSelect)
                     }),
                     update: vi.fn().mockReturnThis(),
                     eq: vi.fn().mockReturnThis(), // for update().eq()
                     select: vi.fn().mockReturnThis(),
                 } as any;
             }
             if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: { gemini_api_key: 'key' } })
                } as any;
             }
             if (table === 'images') {
                 return {
                     insert: vi.fn().mockReturnThis()
                 } as any;
             }
             return { select: vi.fn().mockReturnThis() } as any;
        });

        const result = await generateImagesAction(validData as any);

        expect(result.success).toBe(true);
        expect(result.collectionId).toBe('new-collection-id');
        expect(result.images).toHaveLength(1);
        expect(GoogleGenerativeAI).toHaveBeenCalledWith('mock-api-key');
        expect(global.fetch).not.toHaveBeenCalled(); 
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
                      single: vi.fn().mockResolvedValue({ data: { id: imageId, user_id: mockUser.id } }),
                      delete: vi.fn().mockReturnThis()
                  } as any;
              }
              return {} as any;
          });

          mockSupabase.storage.remove.mockResolvedValue({ error: null });

          const result = await deleteImageAction(imageId, storagePath);

          expect(result.success).toBe(true);
          expect(mockSupabase.storage.remove).toHaveBeenCalledWith([storagePath]);
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
