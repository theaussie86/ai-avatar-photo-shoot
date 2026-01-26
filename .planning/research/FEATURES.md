# Features Research: Video Prompt Generation Tools

**Domain:** Video AI Prompt Generation & Builder Tools
**Research Date:** 2026-01-25
**Confidence Level:** MEDIUM (based on WebSearch verified by multiple sources)

## Executive Summary

Video prompt generation tools in 2026 follow a consistent pattern: visual prompt builders with preset controls for camera movements and film effects, AI-powered suggestion systems, and multi-variant generation workflows. The ecosystem has matured from pure text prompting to hybrid UI/prompt systems that balance ease-of-use with professional control.

**Key insight:** Users expect tools to reduce the cognitive load of prompt engineering through presets and AI suggestions, while maintaining the ability to copy prompts for use in external generation platforms (Runway, Pika, Kling).

## Table Stakes

Features users expect. Missing these makes the prompt workflow feel incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One-click copy to clipboard** | Standard workflow: generate prompt → copy → paste to external tool | Low | Must include visual feedback (toast/checkmark) |
| **Prompt preview/display** | Users need to see and review the full prompt before copying | Low | Read-only text area or card display |
| **Basic prompt structure** | Industry standard: Subject + Action + Camera + Style format | Low | Generate prompts with clear visual descriptions |
| **Camera movement presets** | All major tools (Runway, Kling, Pika) expect camera movement descriptions | Medium | Dropdown or chip selection: Static, Zoom In/Out, Pan, Orbit, Dolly, Tilt |
| **Style/mood descriptors** | Essential for cinematic quality prompts | Low | Film effects like Dramatic, Cinematic, Golden Hour, Noir, Soft |
| **Image context awareness** | Prompt must reference what's actually in the source image | Medium | AI analyzes image to generate relevant subject/scene descriptions |
| **Variant persistence** | Users need to keep prompt history and compare options | Medium | Save multiple variants per image, don't overwrite |
| **Variant navigation** | When multiple variants exist, users need clear navigation | Low | "1/2, 2/2" counter with prev/next controls |
| **Mobile-responsive UI** | Users work across devices | Medium | Especially critical for side panel layout |

**Missing any of these = tool feels amateur or incomplete**

## Differentiators

Features that make this tool better than manual prompt writing or competitor tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **AI-generated suggestions** | Reduces prompt engineering learning curve, speeds up workflow | High | Analyze image + generate context-aware action/motion suggestions |
| **Contextual preset recommendations** | Not just listing all options, but suggesting relevant ones based on image | High | "For portraits, we recommend: Slow zoom in, Golden Hour lighting" |
| **Prompt improvement/refinement** | Iteratively improve prompts without starting over | Medium | "Verbessern" button creates new variant with enhanced details |
| **Platform-specific optimization** | Tailor prompt format for target platform (Runway vs Pika vs Kling) | Medium | Each platform has nuances (Runway loves physics, Kling emphasizes motion) |
| **Batch variant generation** | Generate 3-5 variants at once for A/B testing | Medium | Matches professional workflow (test low-quality variants before final) |
| **Smart defaults from image analysis** | Auto-populate camera/style based on image characteristics | High | Portrait detected → suggest Dolly/Orbit; Landscape → suggest Pan/Zoom |
| **Prompt templates for common scenarios** | Pre-built structures for common use cases | Low | Templates: "Make character smile", "Add subtle motion", "Dramatic reveal" |
| **Variant comparison view** | Side-by-side display of multiple prompt variants | Medium | Helps users understand differences between approaches |
| **Prompt length guidance** | Real-time feedback on prompt length (optimal: 50-150 words) | Low | Visual indicator showing if prompt is too short/long |
| **Motion intensity controls** | Fine-tune how much movement is specified | Low | Slider: Subtle → Moderate → Dramatic movement |
| **Integration with existing workflow** | Seamless connection to image generation pipeline | Low | Open from image preview, inherits image context |

**Best differentiators for this project:**
1. **AI-generated suggestions** (leverages existing Gemini integration)
2. **Smart defaults from image analysis** (Gemini can analyze the uploaded image)
3. **Variant improvement workflow** (creates iterative refinement loop)

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Built-in video generation** | Out of scope, users paste prompts to external tools (Runway/Pika/Kling) | Focus on prompt quality, provide clear copy-to-clipboard workflow |
| **Overly complex prompt editor** | Users expect presets, not freeform prompt engineering | Provide UI controls (chips/dropdowns), generate prompt from selections |
| **Real-time prompt preview/rendering** | Can't preview videos without actual generation (external tools) | Show prompt text preview, not video preview |
| **Too many configuration options** | Analysis paralysis, slows workflow | Limit to 6-8 camera styles, 5-6 film effects. Keep it focused. |
| **Platform-agnostic prompts** | Different tools have different optimal prompt formats | Acknowledge target platforms, optimize for common patterns |
| **Template library/marketplace** | Scope creep, adds complexity without clear value | Generate prompts dynamically based on image analysis instead |
| **Multi-language support** | PROJECT.md explicitly states Deutsch-only | Keep UI and prompts in German, simplifies implementation |
| **Prompt version history beyond variants** | Complex UI, unclear value vs variant system | Variants (1/2, 2/2) provide sufficient history |
| **Collaborative editing** | No indication of multi-user use case | Single-user workflow, tied to image owner |
| **Advanced prompt syntax highlighting** | Users don't edit prompts directly, they configure via UI | Generate complete prompts from UI selections |

**Critical anti-feature:** Don't try to replicate the full feature set of Runway/Pika/Kling. This is a prompt generation assistant, not a video generation platform.

## UX Patterns

### Prompt Crafting Workflow (Industry Standard in 2026)

**Primary Pattern: Builder UI → AI Generation → Refine → Copy**

1. **Entry Point**: User clicks video icon on image in preview modal
2. **Context Loading**: Side panel opens, system analyzes image via AI
3. **Smart Defaults**: Panel pre-populates with AI-suggested camera/style based on image
4. **User Configuration**: User adjusts via chips/dropdowns (camera style, film effects)
5. **AI Suggestions**: System shows contextual action suggestions ("Make character smile", "Add ambient motion")
6. **Generate**: User clicks generate button
7. **Preview Prompt**: Full prompt displays in read-only area
8. **Iterate**: User can refine (creates new variant) or adjust settings and regenerate
9. **Copy**: One-click copy to clipboard with toast confirmation
10. **External Use**: User pastes to Runway/Pika/Kling

**Key UX Insight:** Modern tools minimize typing. Users select, not write. AI fills gaps.

### Variant Management Pattern

**Timeline Pattern (Common in 2026)**
- Variants displayed chronologically: oldest → newest
- Counter shows position: "Variante 2 von 3"
- Navigation: Previous/Next arrows or dot indicators
- Latest variant is "active" by default
- All variants accessible, none deleted unless explicitly removed

**Industry Benchmark:** Runway Gen-4, Pika 2.2, Kling 2.6 all support iteration workflows where users refine existing outputs rather than starting over.

### Camera & Style Selection Pattern

**Two-Tier Selection (Best Practice):**

**Tier 1: Camera Movement** (defines motion)
- Static (no camera movement)
- Cinematic (slow, smooth movements)
- Slow Motion (emphasizes time/motion)
- Zoom In / Zoom Out
- Orbit (circular motion around subject)
- Dolly (forward/backward tracking)
- Pan (left/right sweep)

**Tier 2: Film Effects** (defines mood/lighting)
- Dramatic (high contrast, bold lighting)
- Soft (diffused, gentle lighting)
- Golden Hour (warm, sunset tones)
- Noir (black & white, shadows)
- Verträumt (dreamy, soft focus)

**UI Control:** Chips or dropdown, NOT freeform text fields. Users pick, not type.

### AI Suggestion Patterns

**Two Types of Suggestions:**

1. **Contextual Analysis (Dynamic):**
   - System analyzes image via AI
   - Generates 3-5 relevant action suggestions
   - Example: Portrait detected → ["Make character smile", "Add subtle head turn", "Eyes follow camera"]
   - Displayed as clickable chips/buttons

2. **Fixed Common Actions (Static):**
   - Pre-defined library of frequent actions
   - Not image-specific, universally applicable
   - Example: ["Add ambient motion", "Zoom toward subject", "Subtle wind effect"]
   - Displayed separately or mixed with dynamic suggestions

**Implementation Note:** Gemini AI can analyze images and generate contextual suggestions. This is a HIGH-value differentiator.

### Prompt Display Pattern

**Read-Only Display Best Practices:**
- Display full generated prompt in visually distinct area (bordered card or textarea)
- Monospace or clear typography for readability
- Copy button positioned prominently (top-right or below prompt)
- Character count displayed (with guidance: 50-150 words optimal)
- No direct editing (users adjust via UI controls, then regenerate)

**Why no editing:** Users expect structured builders, not freeform text. Editing breaks the preset workflow and introduces complexity.

## Feature Dependencies

```
Image Upload & Generation (EXISTING)
  ↓
Image Preview Modal (EXISTING)
  ↓
Video Icon Button (NEW: Opens side panel)
  ↓
Image Analysis via Gemini (NEW: Extract subject/scene/context)
  ↓
┌─────────────────────────────────────────────────┐
│ Side Panel Prompt Builder (NEW)                 │
│                                                  │
│  ├─ Smart Defaults (requires Image Analysis)    │
│  ├─ Camera Style Selection (standalone)         │
│  ├─ Film Effects Selection (standalone)         │
│  ├─ AI Suggestions (requires Image Analysis)    │
│  └─ Fixed Action Suggestions (standalone)       │
└─────────────────────────────────────────────────┘
  ↓
Prompt Generation via Gemini (NEW: Combines all inputs)
  ↓
Prompt Display (NEW: Read-only preview)
  ↓
Copy to Clipboard (NEW: Browser API)
  ↓
Variant Storage in Supabase (NEW: Database table)
  ↓
Variant Navigation (NEW: Requires variant storage)
  ↓
Prompt Refinement (NEW: Creates new variant, requires Gemini)
```

**Critical Path Dependencies:**
1. **Image Analysis** blocks → Smart Defaults + AI Suggestions
2. **Prompt Generation** blocks → Display + Copy + Storage
3. **Variant Storage** blocks → Navigation + Refinement

**MVP Simplification:**
- Can launch WITHOUT AI suggestions (use only fixed suggestions)
- Can launch WITHOUT smart defaults (require manual selection)
- CANNOT launch without: Image Analysis, Prompt Generation, Copy, Storage

## MVP Recommendation

For MVP, prioritize in this order:

### Phase 1: Core Workflow (MVP)
1. **Side panel UI** (opens from image preview)
2. **Image analysis via Gemini** (extract subject/scene description)
3. **Camera style selection** (dropdown/chips: 6-8 options)
4. **Film effects selection** (dropdown/chips: 5-6 options)
5. **Prompt generation** (Gemini combines inputs into structured prompt)
6. **Prompt display** (read-only text area)
7. **Copy to clipboard** (with toast confirmation)
8. **Variant storage** (Supabase table linking prompts to images)

### Phase 2: Iteration & Intelligence
9. **Variant navigation** (previous/next, counter display)
10. **Prompt refinement** ("Verbessern" button creates enhanced variant)
11. **AI-generated suggestions** (contextual actions based on image)
12. **Fixed action suggestions** (common actions library)

### Phase 3: Polish & Optimization
13. **Smart defaults** (auto-populate camera/style based on image characteristics)
14. **Batch variant generation** (generate 3-5 variants at once)
15. **Variant comparison view** (side-by-side display)
16. **Prompt length guidance** (visual indicator)
17. **Motion intensity controls** (fine-tune movement descriptions)

### Defer to Post-MVP:
- **Platform-specific optimization**: Requires research into each platform's nuances (Runway vs Pika vs Kling)
- **Prompt templates**: Variants system provides sufficient flexibility
- **Advanced analytics**: Track which prompt patterns perform best (requires user feedback loop)

## Implementation Notes

### Prompt Generation Strategy

**Recommended Gemini Prompt Structure:**
```
Analyze this image and generate a German video animation prompt for external tools like Runway, Pika, or Kling.

Image context: [Gemini analyzes image]
Camera movement: [User selection: Cinematic/Zoom In/etc.]
Film effects: [User selection: Dramatic/Golden Hour/etc.]
Additional action: [Optional user suggestion selection]

Generate a concise prompt (50-150 words) following this structure:
[Subject description] + [Action/Motion] + [Camera movement] + [Visual style/lighting]

Focus on visual detail and motion. Be direct and descriptive. Avoid conversational language.
```

**Why this works:**
- Leverages Gemini's existing image analysis capabilities
- Provides clear structure for consistent output
- Incorporates industry best practices (subject + action + camera + style)
- Respects prompt length guidelines (50-150 words)

### Technical Considerations

**Supabase Schema (New Table):**
```sql
video_prompts
  - id (uuid, primary key)
  - image_id (uuid, foreign key to images table)
  - user_id (uuid, foreign key to users)
  - prompt_text (text)
  - camera_style (text: selected preset)
  - film_effects (text: selected preset)
  - variant_number (integer: sequential per image)
  - created_at (timestamp)
```

**State Management:**
- Use React Query for prompt fetching/caching
- Local state for UI controls (camera/style selections)
- Optimistic updates when creating new variants

**Copy to Clipboard:**
- Use Navigator Clipboard API (modern browsers)
- Fallback to document.execCommand for older browsers
- Toast notification for user feedback

## Sources

### Runway AI
- [Gen-4 Video Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)
- [Text to Video Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/42460036199443-Text-to-Video-Prompting-Guide)
- [Gen-3 Alpha Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/30586818553107-Gen-3-Alpha-Prompting-Guide)

### Pika Labs
- [Pika AI Prompts | Writing Better AI Video Prompts](https://pikartai.com/prompt/)
- [Pika Labs Prompting Guide (Writing Perfect Prompt)](https://pikalabsai.org/pika-labs-prompting-guide/)

### Kling AI
- [Kling AI Prompt Guide: Tips & Examples | Leonardo.Ai](https://leonardo.ai/news/kling-ai-prompts/)
- [Kling 2.6 Pro Prompt Guide: Unlocking Professional Video Generation | fal.ai](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide)

### General Video AI Prompting (2026)
- [How to Actually Control Next-Gen Video AI: Runway, Kling, Veo, and Sora Prompting Strategies | Medium](https://medium.com/@creativeaininja/how-to-actually-control-next-gen-video-ai-runway-kling-veo-and-sora-prompting-strategies-92ef0055658b)
- [Prompt Engineering Guide 2026 : Framework, Tips and Examples - Geeky Gadgets](https://www.geeky-gadgets.com/prompt-engineering-guide-2026/)
- [Prompt Augmentation: UX Design Patterns for Better AI Prompting](https://jakobnielsenphd.substack.com/p/prompt-augmentation)

### UX Patterns & Workflows
- [11 Prompting Tips for Building UIs That Don't Suck](https://www.builder.io/blog/prompting-tips)
- [Workflows & Prompt Engineering Templates for UX Designers | Medium](https://medium.com/@syashigupta/workflows-prompt-engineering-templates-for-ux-designers-323607e3b0e1)

### Camera Controls & UI
- [Higgsfield WAN Camera Control: Your Guide to Cinematic Motion](https://higgsfield.ai/blog/WAN-AI-Camera-Control-Your-Guide-to-Cinematic-Motion)
- [LTX-2 Camera Prompts: Master Shot Editor Controls & Keyframes - Skywork ai](https://skywork.ai/blog/ltx-2-camera-prompts-shot-editor/)
- [42 Camera Movements for AI Video Prompts - AIShotStudio](https://aishotstudio.com/42-camera-movements-ai-prompts/)

### Comparative Analysis
- [Top AI Video Generation Model Comparison in 2026: Text-to-Video Platforms](https://www.pixazo.ai/blog/ai-video-generation-models-comparison-t2v)
- [Best AI video generators: Image-to-Video tools tested (2026)](https://letsenhance.io/blog/all/best-ai-video-generators/)
