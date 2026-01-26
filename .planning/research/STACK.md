# Stack Research: Video Prompt Generation

**Project:** AI Avatar Photo Shoot - Video Prompt Generation
**Research Date:** 2025-01-25
**Researcher:** GSD Project Researcher
**Research Focus:** Stack dimension for video prompt generation feature

## Executive Summary

**Recommendation:** Use Gemini AI (already integrated) to generate structured video prompts optimized for Runway Gen-4, Pika 2.x, Kling 2.6, and Sora 2. No new dependencies required.

**Key Finding:** Modern video AI platforms (2025) expect highly structured prompts with 4-8 standardized components. LLMs excel at generating these structured prompts when given proper templates and constraints. Gemini's multimodal capabilities make it ideal for analyzing source images and generating contextually appropriate video prompts.

**Confidence:** HIGH for prompt structure patterns, MEDIUM for tool-specific formats (verified with official docs where available), MEDIUM for LLM generation best practices (based on recent research papers and community patterns).

---

## Recommended Stack

### Core Technology
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Gemini AI | 2.5 Pro | Video prompt generation from image analysis | Already integrated, multimodal (can analyze images), supports structured output, no additional API key needed |
| TypeScript | 5.x | Prompt template definitions | Type-safe prompt structures, ensures consistency |
| Zod | 3.x | Prompt validation | Runtime validation of generated prompts, ensures all required components present |

### Supporting Infrastructure (Existing)
| Technology | Purpose | Why Sufficient |
|------------|---------|----------------|
| Supabase DB | Store video prompt variants | Already in stack, good for relational data (prompts linked to images) |
| Next.js Server Actions | Generate prompts server-side | Secure API key handling, already used for image generation |

### No New Major Dependencies
The existing stack (Next.js 16, Supabase, Gemini AI) is sufficient for video prompt generation. This is a content generation feature, not a video generation feature.

---

## Video Prompt Structure (Industry Standard 2025)

### Core Components Framework

Based on analysis of Runway Gen-4, Pika 2.x, Kling 2.6, and Sora 2 documentation, video prompts in 2025 follow a 4-8 component structure:

#### 1. Subject (REQUIRED)
**What:** Main character, object, or focus of the video
**Format:** Specific noun with descriptive details
**Examples:**
- "A golden retriever with fluffy fur"
- "A sleek red sports car with chrome wheels"
- "A woman in a blue coat"

**Best Practices:**
- Use specific, concrete terms (not "a person" but "a woman in her 30s")
- Include 2-3 visual details
- Avoid vague adjectives like "beautiful" or "nice"

**Confidence:** HIGH (verified across all platforms)

#### 2. Action/Motion (REQUIRED)
**What:** What the subject is doing, how it's moving
**Format:** Strong verbs with adverbs, specific beats
**Examples:**
- "walks slowly toward the camera, pauses, then turns left"
- "drives along the highway at moderate speed"
- "blinks twice, then smiles"

**Best Practices:**
- Use beat-by-beat descriptions for complex actions
- Prefer "takes four steps" over "walks"
- Specify speed/pacing explicitly
- Single scene focus (no scene changes in 5-10 sec clips)

**Confidence:** HIGH (consistent across all platforms)

#### 3. Environment/Setting (REQUIRED)
**What:** Where the action takes place
**Format:** Location + 3-5 environmental details
**Examples:**
- "in a sunny park with green grass and oak trees, golden hour lighting"
- "on a coastal highway, dramatic cliffs on one side, ocean on the other"
- "in a minimalist white studio with soft shadows"

**Best Practices:**
- Include time of day
- Specify lighting conditions
- Add atmospheric details (fog, rain, mist)
- Keep to 3-5 elements max to avoid overload

**Confidence:** HIGH (verified across all platforms)

#### 4. Camera Movement (IMPORTANT)
**What:** How the camera frames and moves
**Format:** Shot type + movement direction
**Examples:**
- "Wide establishing shot, camera slowly dollies left"
- "Close-up, static camera"
- "Medium shot tracking alongside subject"
- "Camera orbits around subject clockwise"

**Best Practices:**
- Start with shot type (wide, medium, close-up)
- Specify if static or moving
- Use cinematography terms (dolly, pan, tilt, orbit, zoom)
- Runway Gen-4: Keep camera simple, model thrives on simplicity

**Confidence:** HIGH (verified with Runway, Sora, Kling official guides)

#### 5. Visual Style/Aesthetic (RECOMMENDED)
**What:** Overall look, genre, aesthetic direction
**Format:** Style keywords, era, genre
**Examples:**
- "Cinematic 4K quality, shallow depth of field"
- "1970s film aesthetic, grainy 16mm"
- "iPhone-style realism"
- "Dreamy bokeh, soft focus"

**Best Practices:**
- Establish early in prompt
- Use industry terms (models trained on professional footage)
- Be consistent with other elements
- Avoid mixing contradictory styles

**Confidence:** HIGH (verified across platforms)

#### 6. Lighting (RECOMMENDED)
**What:** Light quality, direction, mood
**Format:** Descriptive lighting terms
**Examples:**
- "Golden hour with long shadows"
- "Soft diffused light from above"
- "Dramatic side lighting with strong contrast"
- "Natural sunlight through window"

**Best Practices:**
- Use photography/film lighting terms
- Specify direction if important
- Consider time of day in environment section

**Confidence:** MEDIUM (important but often integrated into environment/style)

#### 7. Technical Parameters (OPTIONAL - Tool Specific)
**What:** Platform-specific controls
**Format:** Varies by platform

**Pika Parameters:**
- `-camera` (zoom, pan, rotate)
- `-motion` (0-4, controls movement intensity)
- `-ar` (aspect ratio: 16:9, 9:16, 1:1, 4:5)
- `-gs` (guidance scale: 8-24, default 12)
- `-fps` (8-24)
- `-neg` (negative prompt for exclusions)

**Kling 2.6 Pro:**
- `++` notation for emphasis on key elements
- Negative prompts in separate field
- Technical specs as stylistic cues (lens type, aperture)

**Sora 2:**
- Duration handled via API parameter (4/8/12 seconds)
- Resolution in API call, not prompt
- Professional production terms (180° shutter, 65mm photochemical)

**Runway Gen-4:**
- No special syntax
- Avoid negative phrasing
- Model thrives on simplicity

**Confidence:** MEDIUM (platform-specific, verified where documentation accessible)

#### 8. Audio Intent (OPTIONAL - Sora 2 specific)
**What:** Soundscape, dialogue cues
**Format:** Ambient sounds, dialogue markers
**Examples:**
- "clinking coffee cups, soft jazz background"
- "two friends chatting in café"
- "ocean waves crashing, seagulls calling"

**Best Practices:**
- Only supported in Sora 2 (as of 2025-01)
- Describe ambience, not music details
- Include dialogue context if relevant

**Confidence:** MEDIUM (Sora-specific feature)

---

## Tool-Specific Prompt Formats

### 1. Runway Gen-4 (Current as of 2025-01)

**Official Source:** [Gen-4 Video Prompting Guide](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)

**Philosophy:** "Thrives on prompt simplicity" - start simple, iterate with detail

**Structure:**
```
[Camera shot] of [subject] [action] in [environment], [style/lighting]
```

**Example:**
```
Medium shot of a golden retriever slowly turning its head toward camera in a sunny park with green grass, cinematic lighting with soft shadows
```

**Key Guidelines:**
- Single scene focus (5-10 second clips)
- Avoid conversational language
- No negative phrasing ("the camera doesn't move")
- Describe what SHOULD be included, not what shouldn't
- For image-to-video: Use general terms like "the subject" instead of re-describing what's in image

**Strengths:**
- Excellent motion quality
- Handles simplicity well
- Good with image-to-video

**Weaknesses:**
- Less control over specific technical parameters
- No parameter syntax like Pika

**Confidence:** HIGH (verified with official documentation)

---

### 2. Pika Labs 2.x (Current as of 2025-01)

**Sources:** [Pika Prompting Guide](https://pikalabsai.org/pika-labs-prompting-guide/), [Prompt Kit](https://pikartai.com/prompt/)

**Philosophy:** Structured with parameters for precise control

**Structure:**
```
[Medium/style], [genre], [subject] in [location], [action], [aesthetic] -ar [ratio] -camera [movement] -motion [0-4]
```

**Example:**
```
Cinematic medium, drama film, a woman in blue coat in a rainy street, walks toward camera slowly, 1970s aesthetic -ar 16:9 -camera pan -motion 2
```

**Key Guidelines:**
- Start with medium (cinematic, 3D animation, 2D animation)
- Add style/genre
- Use parameters for control
- Default `-motion 1`, increase for more movement
- `-gs` (guidance scale) 12 is default, higher = more adherence to prompt

**Available Features (2025):**
- Pikadditions: Add elements to existing video
- Pikaswaps: Replace elements
- Pikatwists: Transform ending

**Strengths:**
- Fine-grained control via parameters
- Consistent results with guidance scale
- Good for iteration

**Weaknesses:**
- More complex syntax
- Requires understanding parameter effects

**Confidence:** MEDIUM (verified with community guides, official docs not accessible)

---

### 3. Kling AI 2.6 Pro (Current as of 2025-01)

**Official Source:** [Kling 2.6 Pro Prompt Guide](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide)

**Philosophy:** "Specificity produces the most reliable results" - systematic, detailed prompting

**Structure:**
```
[Subject with details] + [Action with beats] + [Context/environment with 3-5 elements] + [Style with camera/lighting/mood]
```

**Example:**
```
A sleek red convertible sports car with chrome wheels. Drives along coastal highway at moderate speed, then camera gradually pulls back. Dramatic cliffs on one side, sparkling ocean on other, golden hour lighting with long shadows. Cinematic 4K quality, shallow depth of field, vibrant color grading.
```

**Key Guidelines:**
- Four required parts: Subject + Action + Context + Style
- Use `++` notation to emphasize critical components
- Include negative prompts separately (what to exclude)
- Technical specs (lens, aperture) work as stylistic cues, not actual optical control
- Professional results from "systematic iteration, not magic"

**Strengths:**
- Excellent camera control
- Strong character physics
- Cost-effective compared to competitors
- 1080p output

**Weaknesses:**
- Requires very detailed prompts (vague = poor results)
- Motion clarity critical (must explain how things move)

**Confidence:** HIGH (verified with official fal.ai documentation)

---

### 4. Sora 2 (OpenAI - Current as of 2025-01)

**Official Source:** [Sora 2 Prompting Guide](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)

**Philosophy:** "Think of prompting like briefing a cinematographer" - storyboard approach

**Structure:** Organized sections:
```
SCENE:
[Prose description of characters, costumes, scenery, environment]

CINEMATOGRAPHY:
- Shot: [framing and angle]
- Mood: [tone and atmosphere]

ACTIONS:
- [Specific movements with beats/counts]

DIALOGUE (if needed):
- [Speaker]: [line]
```

**Example:**
```
SCENE:
A woman in her 30s, brown hair, gray wool coat. A café interior, marble tables, brass fixtures, soft afternoon light through tall windows. Wet asphalt visible outside, zebra crosswalk, neon signs reflecting in puddles.

CINEMATOGRAPHY:
- Shot: Medium close-up, shallow depth of field
- Mood: Contemplative, 1970s film aesthetic

ACTIONS:
- Takes four steps to window, pauses
- Lifts coffee cup slowly, holds it
- Turns head toward street, expression softens

DIALOGUE:
None
```

**Key Guidelines:**
- Organize into distinct sections (prose + cinematography + actions + dialogue)
- Be specific ("wet asphalt, zebra crosswalk" not "beautiful street")
- List actions with beats, not vague descriptions
- Style as foundation - establish early
- API parameters (duration 4/8/12s, resolution) set in API call, not prompt
- Supports audio intent (ambient sounds, dialogue cues)

**Strengths:**
- Creates multi-angle scenes in single generation
- Excellent spatial consistency
- Supports audio/dialogue
- Professional cinematography understanding

**Weaknesses:**
- More verbose prompt structure
- Requires careful organization
- API access, not simple web interface

**Confidence:** HIGH (verified with official OpenAI Cookbook)

---

## LLM Prompt Generation Best Practices

### Why LLMs Excel at Video Prompt Generation

**Multimodal Analysis:** Models like Gemini 2.5 Pro can analyze source images and understand:
- Subject composition
- Lighting conditions
- Visual style
- Suggested motion possibilities

**Structured Output:** LLMs can generate JSON/structured data with consistent component formatting:
```typescript
interface VideoPrompt {
  subject: string;
  action: string;
  environment: string;
  camera: string;
  style: string;
  lighting?: string;
  technicalParams?: Record<string, string>;
}
```

**Template Adherence:** LLMs follow templates precisely when instructed, ensuring all required components present.

**Confidence:** HIGH (based on Gemini capabilities, verified multimodal features)

---

### Prompting the LLM to Generate Video Prompts

#### System Prompt Template (for Gemini)

```
You are a professional video prompt engineer. Generate structured video prompts for AI video generation tools (Runway, Pika, Kling, Sora).

ANALYZE the provided image and generate a video prompt with these components:

1. SUBJECT: Specific description of main subject (2-3 visual details)
2. ACTION: Precise motion with beats (e.g., "takes four steps, pauses, turns left")
3. ENVIRONMENT: Location + time + atmosphere (3-5 elements max)
4. CAMERA: Shot type + movement (use cinematography terms)
5. STYLE: Visual aesthetic, genre, era
6. LIGHTING: Light quality and direction

RULES:
- Single scene focus (5-10 seconds)
- Use strong verbs and adverbs
- Be specific, not vague ("wet asphalt" not "nice street")
- Use cinematography terms (dolly, pan, orbit, close-up)
- NO scene changes or contradictory instructions
- NO conversational language

OUTPUT FORMAT: Structured JSON
```

**Confidence:** HIGH (proven pattern for structured LLM outputs)

---

#### User Input Template

```typescript
interface VideoPromptRequest {
  sourceImageUrl: string;           // Image to analyze
  userIntent: string;               // "Make her wave" or "Zoom into her face"
  cameraStyle?: CameraStyle;        // Enum: cinematic, slow-motion, zoom-in, orbit, dolly, static
  visualEffect?: VisualEffect;      // Enum: dramatic, soft, golden-hour, noir, dreamy
  targetPlatform?: VideoPlatform;   // Enum: runway, pika, kling, sora
  duration?: number;                // 4, 5, 8, 10, 12 seconds
}
```

**Rationale:** Structured input ensures consistency, allows UI to provide dropdowns/chips, constrains LLM to valid options.

**Confidence:** HIGH (standard practice for structured LLM applications)

---

#### Response Validation with Zod

```typescript
import { z } from 'zod';

const VideoPromptSchema = z.object({
  subject: z.string().min(10).max(200),
  action: z.string().min(10).max(200),
  environment: z.string().min(10).max(200),
  camera: z.string().min(5).max(100),
  style: z.string().min(5).max(100),
  lighting: z.string().optional(),

  // Platform-specific formatted output
  runwayFormat: z.string(),      // Combined single-line prompt
  pikaFormat: z.string(),        // With parameters
  klingFormat: z.string(),       // Four-part structure
  soraFormat: z.object({         // Sectioned
    scene: z.string(),
    cinematography: z.string(),
    actions: z.string(),
  }),
});
```

**Rationale:** Runtime validation ensures LLM output is complete. If validation fails, retry or show error.

**Confidence:** HIGH (standard pattern, Zod already in TypeScript ecosystem)

---

### Common Pitfalls When Using LLMs for Video Prompts

Based on research into LLM-generated video prompts, common problems to avoid:

#### 1. Modality-Inconsistency
**Problem:** LLM generates image-style prompts instead of motion-focused prompts
**Prevention:**
- Explicitly instruct: "This is for VIDEO generation, not images. Include motion."
- Require ACTION component in schema validation
- Example in system prompt showing motion details

**Confidence:** MEDIUM (based on research paper [Prompt-A-Video](https://arxiv.org/html/2412.15156v1))

#### 2. Overcomplication
**Problem:** LLM generates prompts with multiple scene changes, conflicting instructions
**Prevention:**
- Constraint: "Single scene only, 5-10 seconds"
- Validate for contradictory terms ("fast action" + "slow contemplative")
- Limit environment to 3-5 elements max

**Confidence:** HIGH (verified across all platform documentation)

#### 3. Vague Adjectives
**Problem:** LLM uses "beautiful," "nice," "interesting" instead of specific visual terms
**Prevention:**
- System prompt rule: "NO vague adjectives. Use specific visual/technical terms."
- Post-process check: Reject prompts containing vague terms
- Provide examples of specific vs. vague

**Confidence:** HIGH (consistent guidance across platforms)

#### 4. Missing Motion Clarity
**Problem:** Static descriptions without movement specification
**Prevention:**
- Require ACTION component (validated)
- System prompt: "Describe HOW things move, not just what they look like"
- Example: "takes four steps, pauses" not "walking"

**Confidence:** HIGH (verified with multiple sources)

#### 5. Hallucination of Technical Parameters
**Problem:** LLM invents non-existent parameters or values
**Prevention:**
- Provide exact parameter list for each platform
- Validate against allowed values (e.g., Pika -motion must be 0-4)
- Use structured output with enums

**Confidence:** MEDIUM (general LLM limitation, requires validation)

#### 6. Prompt Length Issues
**Problem:** Generated prompts too long or too short for platform
**Prevention:**
- Platform-specific length constraints
- Runway: Prefer shorter, simpler
- Kling: Can handle longer, detailed
- Sora: Sectioned, can be verbose
- Zod schema min/max lengths

**Confidence:** MEDIUM (inferred from platform philosophies)

---

### Iteration Pattern

Video prompt generation works best as an iterative refinement:

```
1. Initial Generation
   - User selects image
   - Provides simple intent ("make her smile")
   - Selects camera style, effect from UI chips

2. LLM Analysis
   - Analyzes image (subject, lighting, style)
   - Combines with user intent
   - Generates structured prompt (v1)

3. User Review
   - Sees formatted prompt
   - Can refine: "make the motion slower"

4. Refinement
   - LLM updates specific component (action)
   - Creates new variant (v2)
   - Preserves previous variant for comparison

5. Export
   - User copies platform-specific format
   - Pastes into Runway/Pika/Kling/Sora
```

**Rationale:** Matches established UI pattern (variants, refinement) and video prompt best practice (iteration).

**Confidence:** HIGH (based on project requirements and industry patterns)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| LLM Provider | Gemini 2.5 Pro | OpenAI GPT-4V | Already integrated, no new API key, multimodal, cost-effective |
| LLM Provider | Gemini 2.5 Pro | Anthropic Claude 3.7 Sonnet | Would require new API key, added dependency, Gemini already proven |
| Output Format | Structured JSON with Zod | Plain text parsing | Error-prone, no runtime validation, harder to ensure completeness |
| Storage | Supabase table | JSON in image metadata | Need relational queries (variants per image), history, searchability |
| Video Generation | Copy-paste to external tools | In-app video generation | Out of scope, prohibitively expensive, not core value proposition |
| Prompt Templates | Dynamic LLM generation | Fixed templates | Less flexible, can't adapt to image analysis, requires maintenance |

**Confidence:** HIGH (based on project constraints and existing stack)

---

## Implementation Architecture

### Data Model

```typescript
// Database table: video_prompts
interface VideoPromptRecord {
  id: string;
  image_id: string;              // FK to generated_images
  user_id: string;               // FK to users
  variant_number: number;        // 1, 2, 3... for same image

  // Structured components
  subject: string;
  action: string;
  environment: string;
  camera: string;
  style: string;
  lighting: string | null;

  // User selections
  camera_style: CameraStyle;     // From UI chips
  visual_effect: VisualEffect;   // From UI chips

  // Platform-specific formatted outputs
  runway_format: string;
  pika_format: string;
  kling_format: string;
  sora_format: json;             // { scene, cinematography, actions }

  // Metadata
  created_at: timestamp;
  generation_model: string;      // "gemini-2.5-pro"
}
```

**Rationale:**
- Store both components (for editing) and formatted outputs (for copying)
- Support variants (multiple prompts per image)
- Track which selections user made (for analytics/improvement)

**Confidence:** HIGH (standard relational pattern)

---

### Server Action Flow

```typescript
// app/actions/generate-video-prompt.ts
export async function generateVideoPrompt(
  request: VideoPromptRequest
): Promise<VideoPromptRecord> {

  // 1. Validate input
  const validatedRequest = VideoPromptRequestSchema.parse(request);

  // 2. Get user's Gemini API key (encrypted in DB)
  const apiKey = await getDecryptedGeminiKey(userId);

  // 3. Call Gemini with image + system prompt
  const geminiResponse = await callGemini({
    model: "gemini-2.5-pro",
    apiKey,
    systemPrompt: VIDEO_PROMPT_SYSTEM_TEMPLATE,
    userPrompt: buildUserPrompt(request),
    imageUrl: request.sourceImageUrl,
    responseSchema: VideoPromptSchema, // Structured output
  });

  // 4. Validate response
  const validatedPrompt = VideoPromptSchema.parse(geminiResponse);

  // 5. Format for each platform
  const formatted = {
    runway: formatForRunway(validatedPrompt),
    pika: formatForPika(validatedPrompt, request.targetPlatform === 'pika'),
    kling: formatForKling(validatedPrompt),
    sora: formatForSora(validatedPrompt),
  };

  // 6. Store in database
  const record = await supabase
    .from('video_prompts')
    .insert({
      image_id: request.imageId,
      user_id: userId,
      variant_number: await getNextVariantNumber(request.imageId),
      ...validatedPrompt,
      ...formatted,
      camera_style: request.cameraStyle,
      visual_effect: request.visualEffect,
    })
    .select()
    .single();

  return record;
}
```

**Confidence:** HIGH (follows existing image generation pattern in codebase)

---

### Platform-Specific Formatters

```typescript
function formatForRunway(prompt: VideoPrompt): string {
  // Runway Gen-4: Simple structure, no parameters
  return `${prompt.camera} of ${prompt.subject} ${prompt.action} in ${prompt.environment}, ${prompt.style}${prompt.lighting ? ', ' + prompt.lighting : ''}`;
}

function formatForPika(prompt: VideoPrompt, includeTechnicalParams: boolean): string {
  // Pika: Medium, genre, subject, action, aesthetic -ar X -camera Y -motion Z
  let formatted = `Cinematic medium, ${prompt.style}, ${prompt.subject} in ${prompt.environment}, ${prompt.action}`;

  if (includeTechnicalParams) {
    formatted += ` -ar 16:9 -camera ${extractCameraMovement(prompt.camera)} -motion 2`;
  }

  return formatted;
}

function formatForKling(prompt: VideoPrompt): string {
  // Kling: Four-part structure with periods
  return `${prompt.subject}. ${prompt.action}. ${prompt.environment}${prompt.lighting ? ', ' + prompt.lighting : ''}. ${prompt.style}, ${prompt.camera}.`;
}

function formatForSora(prompt: VideoPrompt): SoraFormat {
  // Sora: Sectioned structure
  return {
    scene: `${prompt.subject}. ${prompt.environment}. ${prompt.lighting || ''}`,
    cinematography: `- Shot: ${prompt.camera}\n- Mood: ${prompt.style}`,
    actions: `- ${prompt.action}`,
  };
}
```

**Confidence:** MEDIUM (based on documented patterns, may need tuning)

---

## Quality Assurance

### Testing Strategy

1. **Prompt Component Validation**
   - Zod schema ensures all required fields
   - Min/max length validation
   - No vague adjectives check

2. **Platform Format Testing**
   - Generate prompts, test in Runway/Pika/Kling/Sora
   - Validate output quality
   - Iterate on formatters

3. **LLM Output Consistency**
   - Test same image + intent multiple times
   - Verify similar quality across runs
   - Tune system prompt if inconsistent

4. **Edge Cases**
   - Abstract images (no clear subject)
   - Multiple subjects
   - Unusual compositions
   - Low-quality source images

**Confidence:** HIGH (standard testing approach)

---

### Success Metrics

- **Prompt Completeness:** 100% of generated prompts pass Zod validation
- **User Acceptance:** >80% of generated prompts copied without refinement
- **Platform Success Rate:** When users test in external tools, >70% generate acceptable video
- **Iteration Rate:** Average 1.5 refinements per prompt (low = good initial quality)

**Confidence:** MEDIUM (metrics need validation with real usage)

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Gemini generates inconsistent prompts | Medium | Strict system prompt, Zod validation, refinement option |
| Platform APIs change formats | Low | Abstract formatters, easy to update, users copy (not API integration) |
| Generated prompts don't work in tools | High | Test across platforms, iterate on templates, user refinement option |
| Prompt length exceeds platform limits | Medium | Platform-specific length constraints in schema |
| German language requirement conflicts with English video tools | Low | Prompt UI in German, generated prompts in English (industry standard) |
| LLM hallucinates technical parameters | Medium | Validate against allowed values, provide exact lists |

**Confidence:** MEDIUM (standard risk assessment, real usage will reveal more)

---

## Open Questions for Phase-Specific Research

1. **German vs. English Prompts:**
   - UI requirement: German
   - Video AI tools: Trained primarily on English
   - Question: Generate prompts in English even though UI is German?
   - Recommendation: YES - video tools expect English, users understand
   - Requires validation with stakeholder

2. **Default Platform Target:**
   - Should prompts optimize for one platform by default?
   - Recommendation: Runway (most popular, simplest format)
   - Show all formats, let user choose

3. **AI Suggestions Implementation:**
   - "System zeigt KI-generierte Vorschläge basierend auf Bildanalyse"
   - How many suggestions? 3-5 action suggestions
   - Based on: Subject type (person -> wave/smile, car -> drive/drift)
   - Implementation: Separate Gemini call or within main prompt?

4. **Fixed Suggestions:**
   - "System zeigt feste Vorschläge für häufige Aktionen"
   - Hardcode common actions or generate fresh each time?
   - Recommendation: Generate fresh (more contextual)

**Confidence:** N/A (questions requiring stakeholder input)

---

## Sources

### Official Documentation (HIGH Confidence)
- [Gen-4 Video Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)
- [Kling 2.6 Pro Prompt Guide – fal.ai](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide)
- [Sora 2 Prompting Guide – OpenAI Cookbook](https://cookbook.openai.com/examples/sora/sora2_prompting_guide)

### Community Guides (MEDIUM Confidence)
- [Pika Labs Prompting Guide](https://pikalabsai.org/pika-labs-prompting-guide/)
- [How to Write Kling AI Prompts – Leonardo.ai](https://leonardo.ai/news/kling-ai-prompts/)
- [AI Video Generation Prompt Best Practices – Lovart.ai](https://www.lovart.ai/blog/ai-video-prompts)

### Research Papers (MEDIUM Confidence)
- [Prompt-A-Video: LLM-Aligned Video Prompting](https://arxiv.org/html/2412.15156v1)

### Industry Analyses (LOW-MEDIUM Confidence)
- [How to Actually Control Next-Gen Video AI – Medium](https://medium.com/@creativeaininja/how-to-actually-control-next-gen-video-ai-runway-kling-veo-and-sora-prompting-strategies-92ef0055658b)
- [Claude 3.7 Sonnet for Video Creation – Magic Hour](https://magichour.ai/blog/claude-37-sonnet-ai-video-creation)
- [AI Video Mistakes 2025 – Reezo.ai](https://reezo.ai/blog/common-ai-video-mistakes-how-to-avoid-them-2025)

---

## Installation

No new packages required. Existing stack sufficient:

```bash
# Already installed
# - next@16.x
# - @supabase/supabase-js
# - @google/generative-ai (Gemini)
# - zod

# Optional enhancement (if not already present)
npm install zod
```

**Confidence:** HIGH (minimal dependencies, leverage existing stack)

---

## Conclusion

**Video prompt generation is a content generation problem, not a video generation problem.** The existing stack (Gemini AI, TypeScript, Zod, Supabase) is sufficient and well-suited.

**Key Success Factors:**
1. Structured prompts with 4-8 standardized components
2. LLM system prompt that enforces specificity and cinematography terms
3. Runtime validation to ensure completeness
4. Platform-specific formatters for Runway, Pika, Kling, Sora
5. Iterative refinement with variant storage

**Confidence Level:** MEDIUM-HIGH overall
- HIGH: Core prompt structure, Gemini capabilities, architecture approach
- MEDIUM: Platform-specific formats (some verified, some inferred), LLM generation consistency
- LOW: None identified

**Next Steps for Roadmap:**
1. Phase 1: Core prompt generation with Runway format (simplest)
2. Phase 2: Add platform-specific formatters (Pika, Kling, Sora)
3. Phase 3: AI-generated action suggestions based on image analysis
4. Phase 4: Refinement and quality tuning based on user feedback

---

*Research complete. Ready for roadmap creation.*
