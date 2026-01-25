# Project Research Summary

**Project:** AI Avatar Photo Shoot - Video Prompt Generation
**Domain:** AI-Powered Content Creation Tools (Video Prompt Engineering)
**Researched:** 2026-01-25
**Confidence:** MEDIUM-HIGH

## Executive Summary

Video prompt generation is a maturing domain that sits between image generation and video generation workflows. Users generate AI images (already functional in this app) and need high-quality prompts to animate those images using external video AI tools like Runway Gen-4, Pika 2.x, Kling 2.6, and Sora 2. This feature is fundamentally a **content generation problem, not a video generation problem** — we generate prompts for users to copy/paste into external tools, we don't generate videos ourselves.

The research reveals a clear technical approach: leverage the existing Gemini AI integration to analyze uploaded images and generate structured video prompts based on user-selected presets (camera movement, film effects). The existing Next.js 16 + Supabase + Gemini stack is fully sufficient; no new major dependencies required. Store prompts in a new `video_prompts` table with variant support, implement a side panel UI using shadcn Sheet component, and use React Query for state management with polling for generation status. Industry research shows video AI models expect highly structured prompts with 4-8 standardized components (Subject + Action + Environment + Camera + Style + Lighting), and LLMs like Gemini excel at generating these when given proper templates.

The **highest risk** for this specific project is the German language requirement (PROJECT.md mandates Deutsch-only UI). Video AI models are primarily trained on English prompts, and there's no verified research confirming German prompts perform well in Runway/Pika/Kling. This requires immediate validation during Phase 1 Week 1 — if German prompts underperform, implement fallback strategy (English prompts with German UI labels). Other critical risks include conflicting camera instructions (prevented via single-select UI controls), missing image context (prevented via mandatory Gemini image analysis), and overwhelming users with options (prevented via limited MVP configuration surface: 6-8 camera styles + 5-6 film effects only).

## Key Findings

### Recommended Stack

**Verdict: Existing stack is sufficient. No new major dependencies.**

The video prompt generation feature integrates cleanly with the current architecture. Gemini AI (already integrated for image generation) handles prompt generation from image analysis. Supabase stores video prompt variants linked to images via foreign key. Next.js Server Actions provide secure API key handling for Gemini calls. TypeScript + Zod ensure type-safe prompt structures with runtime validation.

**Core technologies:**
- **Gemini 2.5 Flash (text model):** Prompt generation from image analysis — already integrated, multimodal capabilities (can analyze images + generate text), no additional API key needed, cost-effective
- **Supabase PostgreSQL:** Store video prompt variants with JSONB config — existing database, supports 1-to-many relationship (multiple prompts per image), RLS policies follow established patterns
- **shadcn Sheet component:** Side panel UI — responsive (drawer on mobile, panel on desktop), battle-tested, matches codebase design system
- **Zod:** Prompt validation — runtime validation of generated prompts, ensures all required components present, already in TypeScript ecosystem
- **React Query:** State management with polling — optimistic updates, real-time status tracking for pending prompts, caching for performance

**Key insight from research:** Modern video AI tools (2025-2026) expect 50-150 word prompts with clear structure: Subject (who/what) + Action (motion with beats) + Environment (where + lighting) + Camera (shot type + movement) + Style (aesthetic/genre). LLMs trained on professional cinematography terms handle this generation task better than template-based approaches.

### Expected Features

Video prompt builder tools follow a consistent pattern in 2026: visual UI with preset controls, AI-powered suggestions, multi-variant workflows, and one-click copy to clipboard. Users expect tools to reduce prompt engineering cognitive load while maintaining professional control.

**Must have (table stakes):**
- **One-click copy to clipboard with feedback:** Industry standard workflow is generate → copy → paste to Runway/Pika. Toast notification + visual confirmation required.
- **Basic prompt structure with camera/style presets:** Dropdown/chip selection for camera movements (Static, Zoom, Pan, Orbit, Dolly) and film effects (Cinematic, Dramatic, Golden Hour, Noir). Users select, not write.
- **Image context awareness:** Prompts must reference actual image content (not "a person" but "woman in red dress, outdoor garden"). Requires Gemini image analysis.
- **Variant persistence and navigation:** Multiple prompts per image with chronological tracking. Counter display ("Variante 2 von 3") with prev/next controls.
- **Mobile-responsive UI:** Side panel on desktop, drawer from bottom on mobile. Users work across devices.

**Should have (competitive differentiators):**
- **AI-generated contextual suggestions:** Analyze image → suggest relevant actions ("Make character smile" for portrait, "Add ambient motion" for landscape). Reduces learning curve, speeds workflow.
- **Smart defaults from image analysis:** Auto-populate camera/style based on image characteristics (portrait detected → suggest Dolly/Orbit).
- **Prompt improvement/refinement:** "Verbessern" button creates enhanced variant without starting over. Iterative workflow matches Runway/Pika patterns.
- **Platform-specific optimization:** Tailor prompt format for Runway (simple structure) vs Pika (with parameters) vs Kling (four-part emphasis) vs Sora (sectioned format).
- **Prompt quality guidance:** Visual indicators for length (50-150 words optimal = green, >200 = red), completeness checklist (has camera ✓, describes subject ✓).

**Defer (v2+):**
- **Built-in video generation:** Out of scope. Users paste prompts to external tools (Runway/Pika/Kling). Focus on prompt quality, not video rendering.
- **Batch variant generation:** Generate 3-5 variants simultaneously for A/B testing. Useful but not essential for MVP.
- **Prompt templates library:** Dynamic AI generation based on image analysis provides more value than static templates.
- **Variant comparison view:** Side-by-side display of multiple prompts. Nice polish feature, defer until core workflow proven.

### Architecture Approach

The architecture follows established codebase patterns: new database table with RLS policies matching existing `images` and `collections` tables, server actions in `/app/actions/video-prompt-actions.ts` parallel to `image-actions.ts`, Sheet component for UI, and React Query for state management. Integration is clean and non-invasive.

**Major components:**

1. **Database: `video_prompts` table** — Stores variants with FK to images (ON DELETE CASCADE), JSONB config for flexibility (cameraStyle, filmEffect, lighting, customInstructions), status tracking (pending/completed/failed), variant_order for user-defined sequence. RLS policies enforce user ownership. Indexes on image_id and status for performance.

2. **Server Actions: `video-prompt-actions.ts`** — `generateVideoPromptAction()` creates pending record → analyzes image → calls Gemini 2.5 Flash with structured system prompt → updates record with generated text. `getVideoPromptsAction()` fetches variants per image. `deleteVideoPromptAction()` with optimistic updates. `regenerateVideoPromptAction()` retries failed prompts. Double validation (Zod client + server) prevents invalid config.

3. **UI Components: VideoPromptPanel (Sheet)** — Side panel container with responsive behavior (Sheet on desktop ≥1024px, Drawer on mobile). Contains VideoPromptList (scrollable variants), VideoPromptConfigForm (camera/effect dropdowns with Zod validation), VideoPromptActions (copy/delete buttons). Small image preview at top for context. React Query polling every 2s while status='pending'.

4. **Gemini Integration: Text generation with image context** — System prompt defines video prompt structure (Subject + Action + Environment + Camera + Style). User prompt includes image metadata + user selections (cameraStyle, filmEffect). Temperature 0.8 for creative variation, max 200 tokens. Error handling updates status to 'failed', stores error message in metadata.error_message.

5. **State Management: React Query with optimistic updates** — Query key `['video-prompts', imageId]` for fetching, polling when pending, optimistic delete (remove from UI immediately, rollback on error). Cache invalidation on mutations. Stale-while-revalidate pattern.

**Data flow:** User opens panel → React Query fetches existing prompts → User configures camera/effect → Clicks generate → Server action creates pending record → Gemini analyzes image + generates prompt → Record updated to completed → Polling detects change → UI updates → User copies to clipboard with toast confirmation.

### Critical Pitfalls

Research identified 20 pitfalls across quality, UX, and technical categories. Top 5 critical risks requiring immediate prevention:

1. **German prompts in English-trained models (HIGHEST RISK)** — Video AI tools (Runway/Pika/Kling) primarily trained on English. German prompts may produce poor results or fail. **Mitigation:** Test 5-10 German prompts in actual Runway/Pika accounts during Phase 1 Week 1. If underperform, implement fallback: generate English prompts but provide German UI labels. Add "Translate to English" toggle. Use English terminology for camera/film terms (industry standards: "tracking shot", "golden hour") even in German prompts.

2. **Conflicting instructions in generated prompts** — AI combines user selections without semantic validation ("zoom in + pan left" simultaneously). Video models can't reconcile, produce incoherent results. **Mitigation:** Single-select controls for camera movements (radio buttons, not checkboxes) in Phase 1 UI. Gemini system prompt rule: "NEVER combine zoom with pan/orbit. Choose ONE primary motion." Validation ruleset before showing prompts to users.

3. **Missing image context in prompts** — Generic prompts ("a person standing") instead of specific image content ("young woman in red dress, outdoor garden"). Video tools require precise subject/scene from source image. **Mitigation:** Mandatory Gemini image analysis before every prompt generation (blocking prerequisite). System prompt: "First analyze image thoroughly. Extract subject, pose, environment, lighting, palette. Use these details in video prompt." Display detected analysis to user for transparency.

4. **Overly complex prompts from too many options** — System tries to describe too many elements (subject + background + camera + lighting + effects + timing). Video AI performs poorly with >60 words or >5 instructions. Analysis paralysis from configuration overload. **Mitigation:** Limit MVP to camera style (6-8 options) + film effects (5-6 options) ONLY. Defer lighting, motion intensity, mood. Gemini system prompt: "Generate 50-150 words. Focus on 1 primary motion." Real-time character count with visual indicators (green: 50-150, red: >200).

5. **No polling for pending prompts** — Gemini call takes 3-5 seconds. UI freezes or shows stale state. Users navigate away and pending prompt appears without notification. **Mitigation:** Async pattern: create pending record immediately, update after Gemini responds. React Query refetchInterval: poll every 2s while any prompt has status='pending'. Visual states: Pending (spinner), Completed (full prompt), Failed (retry button).

**Other notable pitfalls:** Analysis paralysis from overwhelming choices (mitigate: limit options), no copy feedback (add toast + visual confirmation), hiding image while configuring (use Sheet not modal), variant storage without ordering (include created_at + variant_order fields), RLS cascade failures (ON DELETE CASCADE in schema), no error handling for Gemini API failures (failed status + retry mechanism).

## Implications for Roadmap

Based on architecture dependencies and pitfall prevention timing, recommend **3-phase roadmap** focused on iterative value delivery. Each phase delivers working functionality while building foundation for next phase.

### Phase 1: Core Prompt Generation (MVP Foundation)

**Rationale:** Establish data model, core generation flow, and validate German language assumption (highest risk) before investing in intelligence features. Minimal viable workflow: user selects camera + effect → generates prompt → copies to clipboard. Proves technical feasibility and language viability.

**Delivers:**
- Database schema (video_prompts table with RLS, CASCADE, variant tracking)
- Server actions (generate, fetch, delete prompts with Gemini integration)
- Side panel UI (Sheet component with image preview)
- Basic config form (6-8 camera styles + 5-6 film effects, single-select)
- Prompt display with one-click copy + toast confirmation
- Async status tracking (pending/completed/failed states)

**Addresses features:**
- Table stakes: Copy to clipboard, basic prompt structure, image context, variant persistence
- Differentiator: Platform-specific formatters (Runway/Pika/Kling/Sora)

**Avoids pitfalls:**
- CRITICAL: German language validation (Week 1 testing checkpoint)
- Conflicting instructions (single-select UI prevents)
- Missing image context (mandatory analysis before generation)
- Too many options (limited to camera + effects only)
- No copy feedback (toast + visual state)
- Database cascade issues (proper schema)

**Research flag:** CRITICAL VALIDATION — Allocate dedicated time in Sprint 1 for German prompt testing in external tools. If German underperforms, pivot to English prompts/German UI before continuing.

---

### Phase 2: Intelligence & Iteration (AI Enhancement)

**Rationale:** Build on proven core workflow with AI-powered features that differentiate from manual prompt writing. Focus on reducing user effort (smart defaults, suggestions) and enabling refinement (variant improvement, quality guidance). Assumes Phase 1 validated German language or implemented fallback.

**Delivers:**
- AI-generated contextual suggestions (analyze image → suggest 3-5 relevant actions)
- Smart defaults from image analysis (auto-populate camera/style based on detected image type)
- Prompt improvement/refinement ("Verbessern" creates enhanced variant)
- Variant navigation UI (counter "2/3", prev/next arrows)
- Prompt quality guidance (word count, length indicator, completeness checklist)
- Fixed action suggestions library (database-driven, updateable without deploy)
- Error handling with retry (regenerate failed prompts, exponential backoff)

**Uses stack:**
- Gemini multimodal for image analysis + suggestion generation
- React Query polling for real-time pending status
- Optimistic updates for delete/regenerate actions

**Implements architecture:**
- Enhanced Gemini system prompts (context-aware suggestions)
- Metadata tracking (user ratings, generation times for analytics)
- VideoPromptCard states (pending/completed/failed with visual feedback)

**Avoids pitfalls:**
- AI suggestions irrelevant (context-aware Gemini analysis)
- Prompt too long/short (visual guidance + word count)
- Pending prompts stuck (polling + retry mechanism)
- No empty state guidance (smart defaults reduce decisions)

**Research flag:** Standard patterns — No additional research needed. AI suggestion generation follows established Gemini prompting techniques. Variant navigation is common UI pattern.

---

### Phase 3: Polish & Optimization (User Experience Refinement)

**Rationale:** Optimize based on Phase 2 usage data. Add progressive disclosure for advanced users, mobile optimization, and quality-of-life improvements. Defer features that require usage analytics (batch generation, comparison views, prompt templates).

**Delivers:**
- Progressive disclosure (advanced options behind toggle: lighting, motion intensity, custom duration)
- Mobile optimization (responsive Sheet/Drawer pattern, touch gestures)
- Keyboard shortcuts (Cmd+C to copy, Esc to close, Cmd+N for new variant)
- Prompt simplify/expand buttons (auto-adjust complexity based on analysis)
- Variant comparison view (side-by-side display of 2-3 variants)
- Empty state with examples ("See what's possible")
- Interactive tooltips on options ("Tracking Shot: Camera follows subject smoothly")
- Variant reordering (drag-and-drop to update variant_order)

**Avoids pitfalls:**
- Analysis paralysis (progressive disclosure hides complexity)
- Mobile UX broken (responsive patterns tested on devices)
- No guidance for new users (tooltips + empty state examples)

**Research flag:** Standard UX patterns — No research needed. Responsive design, keyboard shortcuts, progressive disclosure are well-documented.

---

### Phase Ordering Rationale

**Why this sequence:**

1. **Phase 1 validates highest risk first** — German language effectiveness is unknown. Testing in Week 1 prevents building features on broken foundation. If pivot needed (English prompts), impacts all subsequent work.

2. **Phase 2 builds on proven core** — Intelligence features (suggestions, defaults) require working generation flow. Can't test "smart defaults" without functional prompt generation. Iteration features (refinement, navigation) need stored variants from Phase 1.

3. **Phase 3 optimizes based on data** — Polish features like simplify/expand depend on understanding actual prompt quality distribution. Comparison views require usage patterns (which variants do users prefer?). Progressive disclosure needs data on which advanced options users actually want.

**Dependency chain:**
- Database schema (Phase 1) → Variant navigation (Phase 2) → Comparison view (Phase 3)
- Basic generation (Phase 1) → Smart defaults (Phase 2) → Progressive disclosure (Phase 3)
- Copy workflow (Phase 1) → Quality guidance (Phase 2) → Simplify/expand (Phase 3)

**Pitfall mitigation timing:**
- Phase 1: Prevent critical pitfalls at foundation (German validation, conflicting instructions, missing context)
- Phase 2: Enhance UX to avoid moderate pitfalls (quality guidance, error handling, empty states)
- Phase 3: Polish to eliminate minor pitfalls (mobile optimization, advanced features)

### Research Flags

**Phases with standard patterns (skip research-phase):**

- **Phase 1:** Database schema, Server Actions, React Query — Direct parallels to existing `image-actions.ts` and `collections` patterns in codebase. Sheet component is battle-tested shadcn pattern.
- **Phase 2:** AI suggestion generation, variant navigation — Established Gemini prompting techniques. Common UI patterns for navigation/iteration.
- **Phase 3:** Responsive design, keyboard shortcuts, progressive disclosure — Well-documented UX best practices. No domain-specific research required.

**Phases requiring validation (not research):**

- **Phase 1 Week 1 CHECKPOINT:** German prompt effectiveness testing — This is empirical validation, not research. Generate 5-10 prompts, paste into Runway/Pika/Kling test accounts, evaluate video quality vs English baseline. Go/no-go decision on language strategy.

**No phases require `/gsd:research-phase`** — Video prompt generation is a mature domain with extensive official documentation (Runway Gen-4, Pika, Kling 2.6 Pro, Sora 2 guides all published 2025-2026). Architecture patterns follow existing codebase. Stack is established and sufficient.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new dependencies. Gemini already integrated, Supabase proven, shadcn Sheet component standard. Text generation simpler than image generation. |
| Features | MEDIUM-HIGH | Table stakes well-documented across Runway/Pika communities. Differentiators (AI suggestions, smart defaults) are established patterns. German language is uncertainty. |
| Architecture | HIGH | Direct parallel to existing image generation flow. Server Actions + React Query + RLS patterns already proven in codebase. Component structure follows shadcn conventions. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls documented in official sources (Google Veo, Runway Gen-4, Sora 2). UX pitfalls backed by research (Hick's Law, Laws of UX). German language gap flagged. |

**Overall confidence: MEDIUM-HIGH**

Strong foundation with one critical uncertainty (German language). All other areas have high confidence based on official documentation, established patterns, and existing codebase parallels.

### Gaps to Address

**Primary gap: German prompt effectiveness in English-trained video AI models**
- **Severity:** CRITICAL — Could invalidate entire feature if German prompts produce poor video results
- **Detection:** Phase 1 Week 1 empirical testing (5-10 prompts in Runway/Pika/Kling)
- **Mitigation if gap confirmed:** Implement hybrid approach — English prompts (for video tools) with German UI labels (for user comprehension). Add optional "Translate to English" toggle. Use English cinematography terms in prompts regardless ("tracking shot" not "Verfolgungs-Aufnahme").
- **Timeline impact:** If pivot needed, adds 1-2 days to Phase 1 for prompt translation layer. Does not block Phase 2/3.

**Secondary gap: Optimal prompt length for each platform**
- **Severity:** MODERATE — Research suggests 50-150 words optimal, but Runway may prefer shorter, Sora longer
- **Detection:** User feedback in Phase 2 ("Pika prompts work great, Runway ones don't")
- **Mitigation:** Start with universal 50-150 word target. Add platform-specific length tuning in Phase 2 based on usage data. Gemini system prompt can adapt ("For Runway: 30-80 words, simple structure. For Kling: 80-150 words, detailed.").
- **Timeline impact:** No blocker. Refinement during Phase 2 based on feedback.

**Tertiary gap: Gemini 2.5 Flash consistency for video prompt generation**
- **Severity:** LOW — Gemini might produce inconsistent quality across generations
- **Detection:** High regeneration rates (>5 variants per image), user feedback "some prompts work, others don't"
- **Mitigation:** Strict system prompt with examples, Zod validation for completeness, temperature tuning (0.7-0.9 range testing), fallback to template-based generation if Gemini unreliable.
- **Timeline impact:** Monitoring in Phase 1/2. If quality issues emerge, allocate 2-3 days for system prompt refinement.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Gen-4 Video Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide) — Prompt structure, best practices, image-to-video workflow
- [Kling 2.6 Pro Prompt Guide – fal.ai](https://fal.ai/learn/devs/kling-2-6-pro-prompt-guide) — Four-part prompt structure, emphasis notation, technical specs
- [Sora 2 Prompting Guide – OpenAI Cookbook](https://cookbook.openai.com/examples/sora/sora2_prompting_guide) — Sectioned prompt format, cinematography approach, beat-by-beat actions
- [Veo on Vertex AI Video Generation Prompt Guide – Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide) — Subject + Action + Environment structure, 50-150 word guidance
- [Gemini API Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies) — Structured output, multimodal capabilities
- [shadcn Sheet Component](https://ui.shadcn.com/docs/components/sheet) — Side panel implementation, responsive patterns

### Secondary (MEDIUM confidence)

**Community Guides & Industry Analysis:**
- [Pika Labs Prompting Guide](https://pikalabsai.org/pika-labs-prompting-guide/) — Parameter syntax, motion controls
- [How to Actually Control Next-Gen Video AI – Medium](https://medium.com/@creativeaininja/how-to-actually-control-next-gen-video-ai-runway-kling-veo-and-sora-prompting-strategies-92ef0055658b) — Cross-platform strategies
- [Prompt-A-Video: LLM-Aligned Video Prompting Research](https://arxiv.org/html/2412.15156v1) — LLM pitfalls for video generation
- [Laws of UX: Choice Overload](https://lawsofux.com/choice-overload/) — Hick's Law, optimal option counts
- [UserTesting: Paradox of Choice in UX](https://www.usertesting.com/blog/how-to-use-the-paradox-of-choice-in-ux-design) — 4-7 options optimal

### Tertiary (FLAGGED - needs validation)

**German Language Gap:**
- No sources found specifically addressing German video prompt effectiveness in Runway/Pika/Kling (2025-2026 timeframe)
- Video AI model training data likely English-dominant based on company origins (US-based)
- **Flagged for empirical validation in Phase 1 Week 1**

---

*Research completed: 2026-01-25*

*Ready for roadmap: Yes*

**Next step:** Orchestrator should proceed to requirements definition with confidence. Phase 1 includes critical German validation checkpoint. All other architectural decisions are sound and based on verified patterns.
