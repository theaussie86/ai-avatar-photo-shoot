# Testing Patterns

**Analysis Date:** 2026-01-24

## Test Framework

**Runner:**
- Vitest v4.0.16
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled

**Assertion Library:**
- Vitest built-in expect (compatible with Jest)
- No additional assertion library needed

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
npm run test:watch       # Watch mode (if configured)
npm run test:coverage    # Coverage report (if configured)
```

**Configuration Details:**
- Test environment: jsdom (browser-like environment)
- Globals enabled: allows direct use of `describe`, `it`, `expect` without imports
- Path alias support: `@` resolves to project root
- React plugin enabled for component testing

## Test File Organization

**Location:**
- Co-located: Test files sit next to source files in same directory
- Naming: `*.test.ts` or `*.test.tsx` suffix

**Test File Locations:**
- `app/actions/image-actions.test.ts` (tests `app/actions/image-actions.ts`)
- `app/actions/profile-actions.test.ts` (tests `app/actions/profile-actions.ts`)
- `lib/encryption.test.ts` (tests `lib/encryption.ts`)
- `lib/storage.test.ts` (tests `lib/storage.ts`)
- `lib/image-generation.test.ts` (tests `lib/image-generation.ts`)

**Test Files Present:**
5 test files total covering core business logic and utilities.

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Feature or Module Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Specific Function/Behavior', () => {
    it('should do X when Y', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

**Patterns Observed:**

1. **Describe nesting:** Tests organized in nested describe blocks by feature/function
2. **Naming:** Test names start with "should" or "must": `it('should encrypt and decrypt a string correctly', ...)`
3. **Setup/Teardown:** `beforeEach()` and `afterEach()` used for mock setup and cleanup
4. **Clear sections:** Arrange-Act-Assert pattern followed (implicit, not commented)

**Example from `lib/encryption.test.ts`:**
```typescript
describe('Encryption Utility', () => {
  const MOCK_SECRET = '2a79d95a007e0a7fa31e45ead7a7782f231dd8180177fd7c06123d4ed73227f7';

  beforeEach(() => {
    vi.stubEnv('ENCRYPTION_SECRET', MOCK_SECRET);
  });

  it('should encrypt and decrypt a string correctly', () => {
    const originalText = 'my-secret-api-key';
    const encrypted = encrypt(originalText);
    expect(encrypted).toContain(':');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });
});
```

## Mocking

**Framework:** Vitest's `vi` object

**Patterns:**

1. **Module mocking:**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
```

2. **Function mocking with return values:**
```typescript
vi.fn().mockReturnValue(mockValue)
vi.fn().mockResolvedValue(mockValue)  // For promises
vi.fn().mockRejectedValue(error)      // For promise rejections
```

3. **Implementation mocks:**
```typescript
vi.fn().mockImplementation((table: string) => {
  const chain = { /* implementation */ };
  return chain;
});
```

4. **Spy and stub:**
```typescript
vi.spyOn(console, 'error').mockImplementation(() => {})
vi.stubEnv('ENV_VAR', 'value')
vi.stubGlobal('fetch', vi.fn())
```

5. **Mock clearing:**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});
```

**Example Mocking Pattern from `app/actions/image-actions.test.ts`:**
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'at', refresh_token: 'rt' } },
      error: null
    }),
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
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  (createClient as any).mockResolvedValue(mockSupabase);
});
```

**What to Mock:**
- External APIs: `@google/genai`, `@supabase/supabase-js`
- Next.js internals: `next/navigation`, `next/cache`
- Environment variables and global fetch
- Database client creation

**What NOT to Mock:**
- Core utility functions like `encrypt()`, `decrypt()` unless testing isolation
- Constants like `POSES`, `ASPECT_RATIOS`
- Zod schema validation (test as-is)

## Fixtures and Factories

**Test Data:**

1. **Mock objects defined in test file:**
```typescript
const mockUser = { id: 'user-123' };
const validData = {
  imageCount: [1],
  shotType: 'upper_body',
  collectionName: 'Test Collection',
  customPrompt: 'A test prompt',
  aspectRatio: '1:1',
  background: 'white',
  referenceImages: []
};
```

2. **Dynamic mock builders:**
```typescript
(createClient as any).mockImplementation((table: string) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    // ... chain methods
  };

  if (table === 'profiles') {
    chain.single.mockResolvedValue({ data: { gemini_api_key: 'test-api-key' }, error: null });
  }

  return chain;
});
```

**Location:**
- Fixtures defined within test files (no separate fixture directory)
- Mock data created in `beforeEach()` blocks for isolation
- Reusable mock objects defined at top of describe block

## Coverage

**Requirements:** Not enforced (no coverage config in package.json)

**View Coverage:** Not configured (would need `npm run test:coverage` command added)

**Current Coverage:**
- 5 test files covering core functionality
- Server actions tested: `generateImagesAction`, `deleteCollectionAction`, `deleteImageAction`
- Utilities tested: `encrypt`, `decrypt`, storage operations, image generation
- Missing: Component tests, integration tests, E2E tests

## Test Types

**Unit Tests:**
- Scope: Individual functions and utilities
- Approach: Direct function calls with mocked dependencies
- Files: `lib/encryption.test.ts`, `lib/image-generation.test.ts`, `lib/storage.test.ts`
- Pattern: Test function behavior in isolation

**Integration Tests:**
- Scope: Multiple units working together (actions + database)
- Approach: Mock Supabase and external APIs, test workflows
- Files: `app/actions/image-actions.test.ts`, `app/actions/profile-actions.test.ts`
- Pattern: Test action + query chain interactions

**E2E Tests:**
- Status: Not implemented
- Would test: Full user workflows through UI to API to database
- Tool needed: Playwright or Cypress

## Common Patterns

**Async Testing:**
```typescript
it('should return data on success', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expectedValue);
});

// With expect.rejects
await expect(someAsyncFunction()).rejects.toThrow(/error message/);
```

**Error Testing:**
```typescript
it('should throw an error if validation fails', () => {
  expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET environment variable is not set');
});

// Async error testing
it('should throw if decryption fails', () => {
  const encrypted = encrypt('test');
  const [iv, authTag, data] = encrypted.split(':');
  const tampered = `${iv}:${authTag}:modified${data}`;
  expect(() => decrypt(tampered)).toThrow();
});
```

**Mock Assertion:**
```typescript
it('should call database with correct params', async () => {
  await deleteCollectionAction(collectionId);

  expect(mockSupabase.from).toHaveBeenCalledWith('collections');
  expect(mockSupabase.storage.list).toHaveBeenCalledWith(collectionId);
  expect(mockSupabase.storage.remove).toHaveBeenCalled();
});
```

**Chain Testing (Supabase pattern):**
```typescript
it('should chain queries correctly', async () => {
  const result = await updateGeminiApiKey({ apiKey: 'new-api-key' });

  expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  expect(mockSupabase.upsert).toHaveBeenCalledWith(expect.objectContaining({
    id: mockUser.id,
    gemini_api_key: 'encrypted:new-api-key'
  }));
  expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUser.id);
});
```

**Spy on globals:**
```typescript
it('should handle errors gracefully', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  await deleteFolder(mockSupabase, 'bucket', 'folder');

  expect(consoleSpy).toHaveBeenCalled();
  consoleSpy.mockRestore();
});
```

## Test Naming Conventions

- Start with "should": `it('should encrypt and decrypt correctly', ...)`
- Describe the behavior: `it('should throw error if user is not authenticated', ...)`
- Include the condition: `it('should return failure if Supabase update fails', ...)`
- Avoid implementation details: Use "what" not "how"

## Environment Setup

**Environment variables in tests:**
```typescript
beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
  vi.stubEnv('ENCRYPTION_SECRET', MOCK_SECRET);
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  vi.unstubAllGlobals();
});
```

## Known Testing Limitations

1. **No component tests:** UI components not tested, only logic/actions
2. **No E2E tests:** Full user workflows not tested end-to-end
3. **No API route tests:** No tests for `app/auth/callback/route.ts` or similar
4. **No coverage enforcement:** No minimum coverage percentage set
5. **Mock complexity:** Supabase mocking is verbose; consider factory pattern

---

*Testing analysis: 2026-01-24*
