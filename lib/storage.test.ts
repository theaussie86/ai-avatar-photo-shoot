import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadGeneratedImage, deleteFolder } from './storage';

describe('Storage Library', () => {
  const mockSupabase = {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
      list: vi.fn(),
      remove: vi.fn(),
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadGeneratedImage', () => {
    it('should upload image and return public url', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://url.com/img.png' } });
      const buffer = Buffer.from('test');

      const url = await uploadGeneratedImage(mockSupabase as any, 'bucket', 'path/img.png', buffer);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('bucket');
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith('path/img.png', buffer, expect.any(Object));
      expect(url).toBe('http://url.com/img.png');
    });

    it('should throw on upload error', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ error: { message: 'Upload error' } });
      const buffer = Buffer.from('test');

      await expect(uploadGeneratedImage(mockSupabase as any, 'bucket', 'path', buffer)).rejects.toThrow(/Upload failed/);
    });
  });

  describe('deleteFolder', () => {
    it('should list and delete files in folder', async () => {
      mockSupabase.storage.list.mockResolvedValue({ data: [{ name: 'img1.png' }, { name: 'img2.png' }], error: null });
      mockSupabase.storage.remove.mockResolvedValue({ error: null });

      await deleteFolder(mockSupabase as any, 'bucket', 'folder');

      expect(mockSupabase.storage.list).toHaveBeenCalledWith('folder');
      // Should attempt to delete 'folder/img1.png' and 'folder/img2.png'
      expect(mockSupabase.storage.remove).toHaveBeenCalledWith(expect.arrayContaining(['folder/img1.png', 'folder/img2.png']));
    });

    it('should handle list error gracefully', async () => {
      mockSupabase.storage.list.mockResolvedValue({ data: null, error: { message: 'List error' } });
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await deleteFolder(mockSupabase as any, 'bucket', 'folder');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockSupabase.storage.remove).not.toHaveBeenCalled();
    });

    it('should attempt decoding names', async () => {
        // Mock a file that needs decoding
        const encodedName = 'img%20space.png';
        const decodedName = 'img space.png';
        mockSupabase.storage.list.mockResolvedValue({ data: [{ name: encodedName }], error: null });
    
        await deleteFolder(mockSupabase as any, 'bucket', 'folder');
        
        expect(mockSupabase.storage.remove).toHaveBeenCalledWith(expect.arrayContaining([
            `folder/${encodedName}`,
            `folder/${decodedName}`
        ]));
    });
  });
});
