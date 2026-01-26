# Coding Conventions

**Analysis Date:** 2026-01-24

## Naming Patterns

**Files:**
- Action files: kebab-case with `-actions` suffix (`image-actions.ts`, `profile-actions.ts`)
- Component files: PascalCase (`ConfigurationPanel.tsx`, `ImageCard.tsx`)
- Library/utility files: kebab-case (`image-generation.ts`, `image-persistence.ts`)
- Type/schema files: kebab-case (`schemas.ts`)
- UI components: PascalCase (`Button.tsx`, `Card.tsx`)
- Barrel files: `index.ts` (not commonly used in this codebase)

**Functions:**
- camelCase: `generateImagesAction()`, `refinePrompt()`, `validateImageGenerationConfig()`
- Action functions end with `Action`: `generateImagesAction()`, `deleteCollectionAction()`
- Async functions prefixed with verb: `refinePrompt()`, `generateImage()`, `encrypt()`, `decrypt()`
- Helper functions are also camelCase: `selectPose()`, `cn()`

**Variables:**
- camelCase for local variables and constants: `mockUser`, `validConfig`, `errorMessage`
- Constants in UPPER_SNAKE_CASE: `ALGORITHM`, `IV_LENGTH`, `AUTH_TAG_LENGTH`, `POSES`, `SHOT_TYPES`, `ASPECT_RATIOS`
- TypeScript types and interfaces in PascalCase: `ImageGenerationConfig`, `ApiKeyConfig`
- Boolean variables often prefixed with `is` or `has`: `isLoaded`, `hasGeneratedImages`, `isPending`

**Types:**
- Type names: PascalCase (`ImageGenerationConfig`, `AspectRatioType`, `ShotType`)
- Zod schemas: PascalCase suffix with `Schema` (`ImageGenerationSchema`, `ApiKeySchema`)
- Type inference from schemas: `z.infer<typeof ImageGenerationSchema>`

## Code Style

**Formatting:**
- No Prettier config detected; relies on ESLint config
- Indentation: 2 spaces (observed in source files)
- Line length: No hard limit enforced, but code stays within reasonable bounds
- Trailing commas: Included in multi-line objects/arrays

**Linting:**
- ESLint v9 with Next.js configuration
- Config: `eslint.config.mjs` using flat config format
- Rules enforced: Next.js core web vitals + TypeScript best practices
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**Type Strictness:**
- TypeScript strict mode enabled (`strict: true`)
- No implicit `any` allowed
- All DOM/React types are strictly typed

## Import Organization

**Order:**
1. Node.js/runtime imports (`crypto`)
2. Third-party library imports (`@google/genai`, `zod`, `react`, `next/*`)
3. Internal application imports (`@/lib/...`, `@/components/...`, `@/app/actions/...`)

**Path Aliases:**
- `@/*` resolves to project root
- Commonly used: `@/lib/`, `@/components/`, `@/app/`
- All imports use absolute path aliases, never relative paths

**Example from `app/actions/image-actions.ts`:**
```typescript
import { ImageGenerationConfig } from "@/lib/schemas";
import { validateImageGenerationConfig, refinePrompt, selectPose } from "@/lib/image-generation";
import { deleteFolder } from "@/lib/storage";
import { POSES } from "@/lib/poses";
import { decrypt } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { redirect } from "next/navigation";
```

## Error Handling

**Patterns:**
- Errors thrown as instances: `throw new Error("message")`
- Error messages are descriptive and context-specific
- Validation errors include details: `"Validation failed: " + result.error.message`
- Environment variable errors check and throw early: `if (!secret) { throw new Error(...) }`
- Database errors caught and rethrown with context: `catch (err: any) { throw new Error(...)}`
- Supabase errors accessed via `.error` property: `if (insertError) { ... }`

**Try-Catch Usage:**
- Used for async operations that might fail (API calls, DB queries)
- Fallback logic common: `try { ... } catch (error) { ... return fallback; }`
- Error logging: `console.error()` with context tag: `console.error("[Task ${imageId}] Failed:", error)`

**Example from `lib/encryption.ts`:**
```typescript
export function encrypt(text: string): string {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
  // ... implementation
}
```

## Logging

**Framework:** `console.*` (node.js native)

**Patterns:**
- Context-tagged logs using brackets: `console.log(\`[Action] Starting...\`)`, `console.log(\`[Task ${imageId}] ...\`)`
- Errors logged with context: `console.error("[Task ${imageId}] FAILED:", err)`
- Warnings for non-fatal issues: `console.warn("Direct upload failed:", e)`
- Development info in sequential steps: `console.log("Step 1: fetching...")`, `console.log("Step 2: processing...")`

**When to Log:**
- Major state transitions (started, completed, failed)
- Error conditions with details
- External API calls and responses
- User action consequences

**No logging for:**
- Debug detail in production code (test files only)
- Sensitive data (credentials are encrypted/decrypted without logging values)

## Comments

**When to Comment:**
- JSDoc for public exports (functions, types)
- Inline comments for non-obvious logic
- TODOs/FIXMEs marked with context

**JSDoc/TSDoc:**
- Used sparingly but present on encryption functions
- Format: `/** comment */` on single line or multi-line

**Example from `lib/encryption.ts`:**
```typescript
/**
 * Encrypts a string using AES-256-GCM.
 * The result is a colon-separated string: iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
```

**Example from `app/actions/image-actions.ts`:**
```typescript
// 1. Get API Key from Profile
// 1.5. Process Reference Images (Supabase -> Gemini)
// Phase 1: Create DB Records & Refine Prompts in Parallel
// NEW: Direct Upload Action
// Internal Background Task (Exported for testing)
```

## Function Design

**Size:** Functions are moderate length, ranging 20-100 lines for complex operations. Server actions (`generateImageTask`) can exceed 200 lines but maintain clear step-by-step structure.

**Parameters:**
- Named parameters preferred over positional
- Objects used for multiple related params
- No function parameters with default values common; defaults in destructuring
- Type annotations required on all params and return types

**Return Values:**
- Explicit return types always specified
- Success/failure objects common: `{ success: true, collectionId: '...' }` or `{ success: false, error: '...' }`
- Async functions return Promises: `async function (...): Promise<void|T>`
- Errors thrown rather than returning error objects

**Example return pattern from `app/actions/image-actions.ts`:**
```typescript
return {
    success: true,
    collectionId: collection.id,
    imageIds: tasksToTrigger.map(t => t.imageId),
    images: [],
};
```

## Module Design

**Exports:**
- Named exports used (not default exports)
- Multiple related functions per module common
- Files export what they define, no re-exports

**Example from `lib/schemas.ts`:**
```typescript
export const ASPECT_RATIOS = [...]
export type AspectRatioType = typeof ASPECT_RATIOS[number]
export const ImageGenerationSchema = z.object({...})
export type ImageGenerationConfig = z.infer<typeof ImageGenerationSchema>
```

**Barrel Files:**
- Not used in this codebase; each module imports directly from source files

## Async/Await

**Pattern:**
- Server actions marked with `"use server"` directive
- All async operations explicitly awaited
- No Promise.all() without proper error handling
- Parallel operations wrapped: `await Promise.all([...])`

**Example from `app/actions/image-actions.ts`:**
```typescript
"use server"

export async function generateImagesAction(data: ImageGenerationConfig) {
  const validatedData = validateImageGenerationConfig(data);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  // ...
}
```

## Component Patterns (React/Next.js)

**Server vs Client:**
- `"use server"` directive for server actions
- `"use client"` directive for client components explicitly marked
- Form handling with React Hook Form + Zod validation

**Props:**
- Typed interfaces for component props
- Optional props marked with `?`
- Destructuring in function signature

**Example from `components/avatar-creator/ConfigurationPanel.tsx`:**
```typescript
interface ConfigurationPanelProps {
  hasGeneratedImages?: boolean;
  onGenerate?: (data: ImageGenerationConfig) => void;
  onDeleteAll?: () => void;
  isPending?: boolean;
  collectionId?: string;
}

export function ConfigurationPanel({
  hasGeneratedImages = false,
  onGenerate,
  collectionId,
  initialValues
}: ConfigurationPanelProps) {
  // ...
}
```

---

*Convention analysis: 2026-01-24*
