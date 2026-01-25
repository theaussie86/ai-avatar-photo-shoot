# Architecture Research: Video Prompt Generation Integration

**Research Date:** 2026-01-25
**Project:** AI Avatar Photo Shoot - Video Prompt Generation Feature
**Confidence Level:** HIGH

## Executive Summary

This research addresses how video prompt generation should integrate with the existing Next.js 16 + Supabase + Gemini AI architecture. The recommended approach follows established patterns in the codebase: new `video_prompts` table with FK to images, side panel UI using shadcn Sheet component, dedicated server actions for prompt generation and CRUD operations, and React Query for state management with optimistic updates.

**Key Integration Points:**
- Database: New table following existing RLS patterns
- UI: Sheet component (mobile-first drawer pattern)
- Server Logic: Server actions matching image-actions.ts patterns
- AI: Gemini 2.5 Flash for prompt generation (text model, not image model)
- State: React Query with polling for generation status

---

## Database Schema

### New Table: `video_prompts`

**Purpose:** Store multiple video prompt variants per image with configuration metadata

```sql
CREATE TABLE IF NOT EXISTS public.video_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,

  -- Prompt Content
  prompt_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),

  -- Configuration (stored as JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- config structure:
  -- {
  --   "cameraStyle": "tracking_shot" | "static" | "aerial" | "handheld" | ...,
  --   "filmEffect": "cinematic" | "vintage" | "noir" | "anime" | ...,
  --   "duration": "2s" | "4s" | "8s",
  --   "aspectRatio": "16:9" | "9:16" | "1:1",
  --   "lighting": "golden_hour" | "studio" | "dramatic" | ...,
  --   "mood": "energetic" | "calm" | "mysterious" | ...,
  --   "customInstructions": "optional user text"
  -- }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- metadata can store:
  -- - generation_time_ms
  -- - model_used
  -- - error_message (if failed)
  -- - user_rating (future feature)

  -- Ordering (for variant management)
  variant_order INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX idx_video_prompts_image_id ON public.video_prompts(image_id);
CREATE INDEX idx_video_prompts_user_id ON public.video_prompts(user_id);
CREATE INDEX idx_video_prompts_status ON public.video_prompts(status);

-- Updated_at trigger
CREATE TRIGGER on_video_prompts_updated
  BEFORE UPDATE ON public.video_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Row Level Security (RLS) Policies

Following the existing pattern from `images` and `collections` tables:

```sql
ALTER TABLE public.video_prompts ENABLE ROW LEVEL SECURITY;

-- Users can view their own video prompts
CREATE POLICY "Users can view their own video prompts"
  ON public.video_prompts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own video prompts
CREATE POLICY "Users can insert their own video prompts"
  ON public.video_prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own video prompts
CREATE POLICY "Users can update their own video prompts"
  ON public.video_prompts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own video prompts
CREATE POLICY "Users can delete their own video prompts"
  ON public.video_prompts FOR DELETE
  USING (auth.uid() = user_id);
```

### Schema Design Rationale

**Why separate table instead of adding to `images.metadata`?**
- Multiple variants per image (1-to-many relationship)
- Independent lifecycle (can delete prompts without affecting image)
- Easier querying and filtering
- Better performance with dedicated indexes
- Follows normalization best practices

**Why JSONB for config?**
- Flexible schema for evolving configuration options
- Efficient indexing with GIN indexes if needed
- Easy to query specific config values
- Matches existing pattern in `images.metadata`
- Avoids multiple columns for each config option

**Why variant_order field?**
- User can reorder favorite variants
- Provides stable ordering for UI display
- Allows "pin to top" functionality
- Default 0 means chronological order

---

## Component Architecture

### Component Hierarchy

```
CollectionDetailClient (existing)
└── ImageGallery (existing)
    └── ImageCard (existing) ← MODIFIED: Add onClick to open panel
        └── VideoPromptPanel (NEW) ← Sheet component
            ├── VideoPromptHeader (NEW)
            ├── VideoPromptList (NEW)
            │   └── VideoPromptCard (NEW) × N variants
            ├── VideoPromptConfigForm (NEW)
            └── VideoPromptActions (NEW)
```

### Component Specifications

#### 1. VideoPromptPanel (NEW)

**File:** `/components/video-prompts/VideoPromptPanel.tsx`

**Responsibility:** Container for all video prompt functionality

**Technology:** shadcn/ui Sheet component (responsive: drawer on mobile, side panel on desktop)

**Props:**
```typescript
interface VideoPromptPanelProps {
  imageId: string
  imageUrl: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}
```

**State Management:**
- React Query for fetching/mutating prompts
- Local state for config form
- Optimistic updates for better UX

**Key Features:**
- Responsive (Sheet on desktop, Drawer on mobile via shadcn responsive pattern)
- Polling for pending prompt generation status
- Keyboard shortcuts (Esc to close, Cmd+N for new variant)
- Scroll management (list scrollable, config sticky)

**Layout Structure:**
```
┌─────────────────────────────────┐
│ Header: "Video Prompts"    [X]  │ ← Fixed header
├─────────────────────────────────┤
│ Image Preview (small)           │ ← Context
├─────────────────────────────────┤
│ Variants List (scrollable)      │ ← Dynamic height
│  ┌─────────────────────────┐   │
│  │ Variant 1               │   │
│  │ "tracking shot..."      │   │
│  │ [Copy] [Delete]         │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Variant 2 (PENDING)     │   │
│  │ [Spinner...]            │   │
│  └─────────────────────────┘   │
├─────────────────────────────────┤
│ Config Form (sticky bottom)     │ ← Fixed config
│ [Camera: Tracking Shot ▼]       │
│ [Effect: Cinematic ▼]           │
│ [Generate New Variant]          │
└─────────────────────────────────┘
```

#### 2. VideoPromptCard (NEW)

**File:** `/components/video-prompts/VideoPromptCard.tsx`

**Responsibility:** Display single prompt variant with actions

**Props:**
```typescript
interface VideoPromptCardProps {
  prompt: VideoPrompt
  onCopy: (text: string) => void
  onDelete: (id: string) => void
  onRegenerate?: (id: string) => void
}
```

**States:**
- Completed: Show full prompt + actions
- Pending: Show loading spinner
- Failed: Show error + retry button

**Actions:**
- Copy to clipboard (with visual feedback)
- Delete variant (with confirmation)
- Regenerate (for failed prompts)

#### 3. VideoPromptConfigForm (NEW)

**File:** `/components/video-prompts/VideoPromptConfigForm.tsx`

**Responsibility:** Configuration UI for generating new variants

**Technology:** shadcn Select components + Textarea

**Configuration Options:**

```typescript
const CAMERA_STYLES = [
  "tracking_shot",
  "static_shot",
  "aerial_view",
  "handheld",
  "dolly_zoom",
  "crane_shot",
  "pov",
  "dutch_angle"
] as const;

const FILM_EFFECTS = [
  "cinematic",
  "vintage_film",
  "noir",
  "anime_style",
  "documentary",
  "music_video",
  "commercial",
  "slow_motion"
] as const;

const LIGHTING_STYLES = [
  "golden_hour",
  "studio_lighting",
  "dramatic_rim",
  "soft_natural",
  "neon_night",
  "moody_overcast"
] as const;

const DURATIONS = ["2s", "4s", "8s"] as const;
const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
```

**Form Layout:**
```tsx
<form>
  <Select label="Camera Movement" options={CAMERA_STYLES} />
  <Select label="Film Effect" options={FILM_EFFECTS} />
  <Select label="Lighting" options={LIGHTING_STYLES} />
  <div className="flex gap-2">
    <Select label="Duration" options={DURATIONS} />
    <Select label="Aspect" options={ASPECT_RATIOS} />
  </div>
  <Textarea
    label="Custom Instructions (optional)"
    placeholder="Add specific details..."
  />
  <Button type="submit">Generate Prompt</Button>
</form>
```

**Validation:** Zod schema matching config JSONB structure

#### 4. Modified ImageCard

**File:** `/components/avatar-creator/ImageCard.tsx` (EXISTING)

**Changes Required:**
- Add onClick handler to open VideoPromptPanel
- Add visual indicator (badge/icon) showing number of video prompts
- Pass imageId to panel

**New Props:**
```typescript
interface ImageCardProps {
  initialImage: any
  onClick: () => void // EXISTING
  onOpenVideoPrompts: (imageId: string) => void // NEW
  videoPromptCount?: number // NEW
}
```

**Visual Enhancement:**
```tsx
{/* Badge showing prompt count */}
{videoPromptCount > 0 && (
  <Badge className="absolute top-2 left-2 bg-purple-500">
    {videoPromptCount} video prompt{videoPromptCount > 1 ? 's' : ''}
  </Badge>
)}
```

---

## Server Actions

### New File: `/app/actions/video-prompt-actions.ts`

Following the pattern from `image-actions.ts`, create dedicated server actions for video prompt operations.

#### Action 1: `generateVideoPromptAction`

**Purpose:** Generate a new video prompt variant using Gemini AI

**Signature:**
```typescript
export async function generateVideoPromptAction(
  imageId: string,
  config: VideoPromptConfig
): Promise<{ success: boolean; promptId: string }>
```

**Flow:**
1. Validate user authentication
2. Verify image ownership (RLS + explicit check)
3. Fetch image URL and existing metadata
4. Decrypt Gemini API key from profile
5. Create pending prompt record in DB
6. Call Gemini 2.5 Flash with structured prompt
7. Update prompt record with generated text
8. Return promptId

**Gemini Prompt Structure:**

Based on research, effective video prompts need: subject + action + environment + camera + lighting + audio.

```typescript
const systemPrompt = `You are a professional video prompt engineer. Generate detailed, cinematic video prompts for AI video generation models like Veo, Runway, or Pika.

Structure your prompts with:
1. Subject and action (what's happening)
2. Camera movement and angle
3. Lighting and atmosphere
4. Film style and effects
5. Audio/mood descriptors

Keep prompts 20-60 words for optimal results.`;

const userPrompt = `Generate a video prompt based on this image and configuration:

Image context: ${imageMetadata}
Camera style: ${config.cameraStyle}
Film effect: ${config.filmEffect}
Lighting: ${config.lighting}
Duration: ${config.duration}
Aspect ratio: ${config.aspectRatio}
Custom instructions: ${config.customInstructions || 'None'}

Generate a professional video prompt that captures the essence of the image with the specified cinematic style.`;
```

**Error Handling:**
- API key missing → throw descriptive error
- Gemini API failure → mark prompt as 'failed', store error in metadata
- RLS violation → throw unauthorized error

**Model Selection:** Use `gemini-2.5-flash` (text model, NOT image model)

#### Action 2: `getVideoPromptsAction`

**Purpose:** Fetch all prompts for an image

**Signature:**
```typescript
export async function getVideoPromptsAction(
  imageId: string
): Promise<VideoPrompt[]>
```

**Flow:**
1. Validate auth
2. Query video_prompts table filtered by imageId
3. Order by variant_order ASC, created_at DESC
4. Return array

**Optimization:** Consider caching with React Query (already handled client-side)

#### Action 3: `deleteVideoPromptAction`

**Purpose:** Delete a single prompt variant

**Signature:**
```typescript
export async function deleteVideoPromptAction(
  promptId: string
): Promise<{ success: boolean }>
```

**Flow:**
1. Validate auth
2. Verify ownership via RLS
3. Delete record
4. Invalidate React Query cache (client-side)

#### Action 4: `regenerateVideoPromptAction`

**Purpose:** Retry failed prompt generation

**Signature:**
```typescript
export async function regenerateVideoPromptAction(
  promptId: string
): Promise<{ success: boolean }>
```

**Flow:**
1. Fetch existing prompt record
2. Extract config from JSONB
3. Reset status to 'pending'
4. Re-run generation logic
5. Update record

**Reuse:** Shares core logic with `generateVideoPromptAction`

#### Action 5: `updateVideoPromptOrderAction`

**Purpose:** Reorder variants (future feature, nice-to-have)

**Signature:**
```typescript
export async function updateVideoPromptOrderAction(
  updates: Array<{ id: string; order: number }>
): Promise<{ success: boolean }>
```

---

## Integration Points

### 1. Database Integration

**Migration File:** `/supabase/migrations/YYYYMMDDHHMMSS_create_video_prompts.sql`

**Deployment:**
- Apply via `supabase db push` or Supabase Dashboard
- Test RLS policies with different user contexts
- Verify cascade deletes (when image deleted, prompts auto-delete)

**Foreign Key Behavior:**
- `ON DELETE CASCADE` ensures orphaned prompts are cleaned up
- Matches existing pattern for images → collections relationship

### 2. UI Integration (CollectionDetailClient)

**Current Flow:**
```
CollectionDetailClient
  → ImageGallery
    → ImageCard (onClick opens full-screen preview)
```

**New Flow:**
```
CollectionDetailClient
  → ImageGallery
    → ImageCard
      → onClick: Full-screen preview (EXISTING)
      → onVideoPromptsClick: Opens VideoPromptPanel (NEW)
```

**Implementation:**
```typescript
// In CollectionDetailClient.tsx
const [selectedImageForPrompts, setSelectedImageForPrompts] =
  useState<string | null>(null);

<ImageGallery
  images={images}
  onOpenVideoPrompts={(imageId) => setSelectedImageForPrompts(imageId)}
/>

{selectedImageForPrompts && (
  <VideoPromptPanel
    imageId={selectedImageForPrompts}
    imageUrl={images.find(i => i.id === selectedImageForPrompts)?.url}
    isOpen={true}
    onOpenChange={(open) => !open && setSelectedImageForPrompts(null)}
  />
)}
```

### 3. React Query Integration

**Query Key Structure:**
```typescript
['video-prompts', imageId] // For fetching prompts per image
['video-prompt', promptId] // For individual prompt (if needed)
```

**Polling Pattern (for pending prompts):**
```typescript
useQuery({
  queryKey: ['video-prompts', imageId],
  queryFn: () => getVideoPromptsAction(imageId),
  refetchInterval: (query) => {
    const hasPending = query.state.data?.some(
      (p: VideoPrompt) => p.status === 'pending'
    );
    return hasPending ? 2000 : false; // Poll every 2s if pending
  }
});
```

**Optimistic Updates (for delete):**
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteVideoPromptAction,
  onMutate: async (promptId) => {
    await queryClient.cancelQueries(['video-prompts', imageId]);
    const previous = queryClient.getQueryData(['video-prompts', imageId]);

    queryClient.setQueryData(['video-prompts', imageId], (old: any) =>
      old?.filter((p: VideoPrompt) => p.id !== promptId)
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['video-prompts', imageId], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['video-prompts', imageId]);
  }
});
```

### 4. Gemini AI Integration

**Model Selection:**
- Use `gemini-2.5-flash` (text generation, NOT image generation)
- Same client initialization pattern as image generation
- Reuse existing API key from profiles table

**API Call Pattern:**
```typescript
const client = new GoogleGenAI({ apiKey: decryptedApiKey });

const result = await client.models.generateContent({
  model: "gemini-2.5-flash",
  config: {
    systemInstruction: VIDEO_PROMPT_SYSTEM_INSTRUCTION,
    temperature: 0.8, // Slightly higher for creative variation
    maxOutputTokens: 200, // Video prompts should be 20-60 words
  },
  contents: [
    {
      role: 'user',
      parts: [{ text: constructedPrompt }]
    }
  ],
});

const generatedPrompt = result.candidates?.[0]?.content?.parts?.[0]?.text;
```

**Error Handling:**
- Rate limits: Store in metadata, show friendly message
- API errors: Mark as 'failed', allow regenerate
- Empty responses: Use fallback template

**Cost Optimization:**
- Text generation is cheaper than image generation
- Consider caching common config combinations (future)
- Limit variants per image (e.g., max 10)

### 5. Storage Integration

**No additional storage needed:**
- Prompts are pure text (stored in DB)
- No binary data or file uploads
- No Supabase Storage bucket required

**Future consideration:**
- If users can generate actual videos (Veo API), would need new bucket
- For now, just prompts that users copy/paste into external tools

---

## Data Flow

### Flow 1: Generate New Video Prompt

```
User clicks "Generate Video Prompt" in panel
  ↓
VideoPromptConfigForm validates input (Zod)
  ↓
Client calls generateVideoPromptAction(imageId, config)
  ↓
Server Action:
  - Creates pending prompt record in DB
  - Fetches image metadata
  - Calls Gemini 2.5 Flash with structured prompt
  - Updates prompt status to 'completed'
  ↓
React Query refetches prompts (or receives via polling)
  ↓
VideoPromptCard displays new prompt
  ↓
User copies prompt to clipboard
```

**Timing:**
- DB insert: ~50ms
- Gemini API call: 1-3 seconds
- Total: ~3 seconds end-to-end

**Error Scenarios:**
- Gemini timeout → status: 'failed', show retry button
- Invalid config → client-side validation prevents submission
- RLS violation → redirect to login

### Flow 2: View Existing Prompts

```
User clicks on ImageCard
  ↓
CollectionDetailClient opens VideoPromptPanel
  ↓
Panel mounts, React Query fetches prompts
  ↓
useQuery calls getVideoPromptsAction(imageId)
  ↓
Server returns array of prompts (ordered)
  ↓
VideoPromptList renders VideoPromptCard for each
  ↓
If any pending, polling starts (every 2s)
```

**Optimization:**
- Initial data from SSR (future enhancement)
- Stale-while-revalidate pattern
- Prefetch on ImageCard hover

### Flow 3: Delete Prompt Variant

```
User clicks "Delete" on VideoPromptCard
  ↓
Confirmation dialog (AlertDialog)
  ↓
Client calls deleteVideoPromptAction(promptId)
  ↓
Optimistic update: Remove from UI immediately
  ↓
Server deletes record (RLS enforces ownership)
  ↓
On success: Keep optimistic state
On error: Roll back to previous state
```

**UX Enhancement:**
- Toast notification on success
- Undo functionality (future)

---

## Architecture Patterns

### Pattern 1: Server Action Co-location

**Follow existing pattern:**
```
/app/actions/
  - image-actions.ts (EXISTING)
  - video-prompt-actions.ts (NEW)
  - profile-actions.ts (EXISTING)
```

**Benefits:**
- Consistent file structure
- Easy to find related logic
- Shared types and utilities

### Pattern 2: Component Co-location

**Recommended structure:**
```
/components/
  - video-prompts/
    - VideoPromptPanel.tsx
    - VideoPromptCard.tsx
    - VideoPromptConfigForm.tsx
    - VideoPromptList.tsx
    - types.ts
    - constants.ts (camera styles, effects, etc.)
```

**Benefits:**
- Feature isolation
- Easy to delete/modify
- Clear ownership

### Pattern 3: Type Safety

**Shared types file:** `/lib/video-prompt-types.ts`

```typescript
import { z } from "zod";

// Camera styles (from research)
export const CAMERA_STYLES = [
  "tracking_shot",
  "static_shot",
  "aerial_view",
  "handheld",
  "dolly_zoom",
  "crane_shot",
  "pov",
  "dutch_angle"
] as const;

export const FILM_EFFECTS = [
  "cinematic",
  "vintage_film",
  "noir",
  "anime_style",
  "documentary",
  "music_video",
  "commercial",
  "slow_motion"
] as const;

export const LIGHTING_STYLES = [
  "golden_hour",
  "studio_lighting",
  "dramatic_rim",
  "soft_natural",
  "neon_night",
  "moody_overcast"
] as const;

// Zod schema for validation
export const VideoPromptConfigSchema = z.object({
  cameraStyle: z.enum(CAMERA_STYLES),
  filmEffect: z.enum(FILM_EFFECTS),
  lighting: z.enum(LIGHTING_STYLES).optional(),
  duration: z.enum(["2s", "4s", "8s"]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  customInstructions: z.string().max(500).optional(),
});

export type VideoPromptConfig = z.infer<typeof VideoPromptConfigSchema>;

// Database record type
export interface VideoPrompt {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  image_id: string;
  prompt_text: string;
  status: 'pending' | 'completed' | 'failed';
  config: VideoPromptConfig;
  metadata: {
    generation_time_ms?: number;
    model_used?: string;
    error_message?: string;
  };
  variant_order: number;
}
```

### Pattern 4: Error Handling

**Consistent with image-actions.ts:**

```typescript
try {
  // API call
} catch (error: any) {
  console.error("[VideoPrompt] Generation failed:", error);

  // Update DB with failure state
  await supabase
    .from('video_prompts')
    .update({
      status: 'failed',
      metadata: { error_message: error.message }
    })
    .eq('id', promptId);

  throw new Error(`Failed to generate video prompt: ${error.message}`);
}
```

**Client-side:**
```typescript
const generateMutation = useMutation({
  mutationFn: generateVideoPromptAction,
  onError: (error) => {
    toast.error("Generation failed", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
```

### Pattern 5: Progressive Enhancement

**Core functionality works without JS:**
- Server actions don't require client-side JS
- Forms use standard HTML semantics
- RLS policies enforce security regardless of client

**Enhanced with JS:**
- Optimistic updates
- Real-time polling
- Keyboard shortcuts
- Copy to clipboard

---

## Performance Considerations

### Database Performance

**Query Optimization:**
- Index on `image_id` for fast lookups
- Index on `status` for filtering pending prompts
- Limit results per image (e.g., max 50 variants)

**Estimated Load:**
- 1000 images × 5 prompts avg = 5000 records
- SELECT queries: ~10ms with indexes
- INSERT queries: ~50ms
- Negligible impact on DB

### API Rate Limits

**Gemini API limits (2.5 Flash):**
- Free tier: 15 RPM, 1500 RPD
- Paid tier: Higher limits

**Mitigation:**
- Queue system for bulk generation (future)
- Show user-friendly rate limit messages
- Exponential backoff on retries

### Client Performance

**React Query optimizations:**
- Cache prompts for 5 minutes
- Background refetch on window focus
- Pagination if >20 variants (unlikely)

**Component optimizations:**
- Lazy load VideoPromptPanel (code splitting)
- Virtualize prompt list if >50 items
- Debounce config form inputs

---

## Security Considerations

### Row Level Security (RLS)

**Critical:** All queries enforced at DB level
- Users can only see their own prompts
- Server actions provide convenience, not security
- Double-check ownership in server actions for belt-and-suspenders

### API Key Security

**Reuse existing encryption pattern:**
- Gemini API key stored encrypted in profiles
- Decrypted only in server actions
- Never exposed to client

### Input Validation

**Multi-layer validation:**
1. Client-side: Zod schema (UX)
2. Server-side: Zod schema (security)
3. Database: CHECK constraints (integrity)

### Prompt Injection Prevention

**Potential attack:**
User enters malicious text in customInstructions attempting to manipulate Gemini output.

**Mitigation:**
- Sanitize user input (strip control characters)
- Use structured prompts with clear delimiters
- Limit customInstructions length (500 chars)
- Monitor for abuse patterns

**Example:**
```typescript
const sanitized = config.customInstructions
  ?.replace(/[<>]/g, '') // Remove potential XML injection
  .slice(0, 500); // Enforce length limit
```

---

## Testing Strategy

### Unit Tests

**Server Actions:**
```typescript
// /app/actions/video-prompt-actions.test.ts
describe('generateVideoPromptAction', () => {
  it('creates pending prompt record', async () => {});
  it('calls Gemini API with correct prompt', async () => {});
  it('updates prompt with generated text', async () => {});
  it('handles API failures gracefully', async () => {});
  it('enforces RLS policies', async () => {});
});
```

**Components:**
```typescript
// /components/video-prompts/VideoPromptCard.test.tsx
describe('VideoPromptCard', () => {
  it('renders completed prompt', () => {});
  it('shows loading state for pending', () => {});
  it('shows error state for failed', () => {});
  it('copies to clipboard on click', () => {});
});
```

### Integration Tests

**Database:**
- Test RLS policies with different users
- Test cascade deletes
- Test JSONB querying

**API:**
- Mock Gemini responses
- Test error scenarios (timeout, rate limit)
- Test config variations

### E2E Tests

**User Flows:**
1. Generate first prompt for image
2. Generate multiple variants with different configs
3. Delete a variant
4. Retry failed prompt
5. Copy prompt to clipboard

---

## Migration Path

### Phase 1: Database Setup
1. Create migration file
2. Apply to development
3. Test RLS policies
4. Apply to production

### Phase 2: Server Actions
1. Create video-prompt-actions.ts
2. Implement generateVideoPromptAction
3. Implement CRUD actions
4. Add unit tests

### Phase 3: UI Components
1. Create VideoPromptPanel (stub)
2. Add to CollectionDetailClient
3. Implement VideoPromptConfigForm
4. Implement VideoPromptCard
5. Add loading/error states

### Phase 4: Integration
1. Wire up React Query
2. Connect to server actions
3. Add polling for pending prompts
4. Add optimistic updates

### Phase 5: Polish
1. Add keyboard shortcuts
2. Add copy feedback
3. Add animations
4. Add empty states
5. Mobile optimization

---

## Open Questions & Future Enhancements

### Questions for Product Owner

1. **Max variants per image?** Suggest 10-20 to prevent abuse
2. **Delete all prompts at once?** Useful for cleanup
3. **Share prompts between users?** Community feature?
4. **Export prompts to file?** CSV/JSON download
5. **Favorite/star variants?** Metadata flag

### Future Features

**V2 Enhancements:**
- Prompt templates (save favorite configs)
- Bulk generation (all images in collection)
- A/B testing (compare prompt variants)
- Community voting (best prompts)
- Integration with video generation APIs (Veo, Runway)

**Advanced Features:**
- AI-powered prompt refinement (meta-prompting)
- Image analysis for automatic config suggestions
- Historical tracking (prompt evolution over time)
- Analytics (most popular camera styles, effects)

---

## Sources & References

### Video Prompt Engineering Research
- [Veo on Vertex AI video generation prompt guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide) - Official Google documentation on Veo prompt structure
- [Generate videos with Veo 3.1 in Gemini API](https://ai.google.dev/gemini-api/docs/video) - Gemini API video generation documentation
- [25 Best Veo Prompts for Stunning AI Video Generation in 2026](https://aifreeforever.com/blog/25-best-veo-prompts-for-stunning-ai-video-generation) - Prompt engineering best practices
- [The Complete Guide to AI Video Prompt Engineering](https://venice.ai/blog/the-complete-guide-to-ai-video-prompt-engineering) - Comprehensive prompt engineering strategies

### Next.js & shadcn/ui Patterns
- [Shadcn Sheet Component](https://ui.shadcn.com/docs/components/sheet) - Official documentation for side panel UI
- [Shadcn Drawer Component](https://ui.shadcn.com/docs/components/drawer) - Responsive drawer pattern for mobile
- [Exploring Drawer and Sheet Components in shadcn UI](https://medium.com/@enayetflweb/exploring-drawer-and-sheet-components-in-shadcn-ui-cf2332e91c40) - Implementation comparison

### Database Schema Design
- [DB Designer 2025 Recap & 2026 Roadmap: AI-Driven Database Design](https://www.dbdesigner.net/db-designer-2025-recap-2026-roadmap-ai-driven-database-design/) - AI-driven schema design trends
- [Database Development with AI in 2026](https://www.brentozar.com/archive/2026/01/database-development-with-ai-in-2026/) - Current best practices for AI content storage

### Gemini API Documentation
- [Prompt design strategies | Gemini API](https://ai.google.dev/gemini-api/docs/prompting-strategies) - Official prompting guide
- [Build with Veo 3, now available in the Gemini API](https://developers.googleblog.com/en/veo-3-now-available-gemini-api/) - Latest API capabilities

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|-----------|-----------|
| Database Schema | HIGH | Follows existing patterns, well-researched structure |
| Component Architecture | HIGH | Matches current codebase conventions, uses proven shadcn components |
| Server Actions | HIGH | Direct parallel to image-actions.ts, same patterns apply |
| Gemini Integration | MEDIUM-HIGH | Text generation is simpler than image generation, but video prompt quality depends on prompt engineering |
| UI/UX Patterns | HIGH | Sheet component is battle-tested, responsive pattern is standard |
| Performance | HIGH | Minimal DB impact, text generation is fast, client-side optimizations are proven |
| Security | HIGH | RLS patterns are established, encryption is already in place |

**Overall Confidence: HIGH**

This architecture integrates seamlessly with the existing codebase, follows established patterns, and leverages well-researched video prompt engineering techniques. The main uncertainty is around optimal prompt engineering for video generation, which will require iterative refinement based on user feedback.

---

## Recommendation

**Proceed with implementation** following this architecture. The design is sound, integrates cleanly with existing code, and provides a solid foundation for future video-related features.

**Start with Phase 1 (Database) and Phase 2 (Server Actions)** to validate the core data model before investing in UI components. This allows for early feedback on prompt quality and generation times.

**Key Success Metrics:**
- Prompt generation time: <3 seconds
- Successful generation rate: >95%
- User satisfaction with prompt quality: Qualitative feedback
- System performance impact: Negligible (<5% DB load increase)
