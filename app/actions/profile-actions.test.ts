import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateGeminiApiKey } from './profile-actions';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/encryption';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/encryption', () => ({
  encrypt: vi.fn((text) => `encrypted:${text}`),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('updateGeminiApiKey Server Action', () => {
  const mockUser = { id: 'user-123' };
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue(mockSupabase);
  });

  it('should successfully update the API key for an authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabase.eq.mockResolvedValue({ error: null });

    const result = await updateGeminiApiKey('new-api-key');

    expect(result).toEqual({ success: true });
    expect(encrypt).toHaveBeenCalledWith('new-api-key');
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.update).toHaveBeenCalledWith({ gemini_api_key: 'encrypted:new-api-key' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUser.id);
    expect(revalidatePath).toHaveBeenCalledWith('/');
  });

  it('should throw an error if the user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(updateGeminiApiKey('some-key')).rejects.toThrow('Unauthorized');
  });

  it('should return failure if Supabase update fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockSupabase.eq.mockResolvedValue({ error: { message: 'DB Error' } });

    const result = await updateGeminiApiKey('some-key');

    expect(result).toEqual({ success: false, error: 'DB Error' });
  });
});
