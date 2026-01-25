# Domain Pitfalls: Video Prompt Generation

**Domain:** Video AI Prompt Generation & Builder Tools
**Research Date:** 2026-01-25
**Confidence Level:** MEDIUM-HIGH

(Based on WebSearch cross-referenced with official documentation from Google Veo, research from Runway/Pika/Kling communities, and prompt engineering best practices. Direct verification with Context7 not available, but findings consistent across 15+ authoritative sources from 2025-2026.)

---

## Executive Summary

Video prompt generation for AI tools is a maturing domain with well-documented failure patterns. The research reveals four critical risk areas for this project:

1. **Prompt Quality Pitfalls** - Generated prompts that don't work well in target tools (Runway, Pika, Kling)
2. **UX Complexity Pitfalls** - Overwhelming users with too many options or insufficient guidance
3. **Technical Implementation Pitfalls** - Storage, variant management, and AI integration mistakes
4. **German Language Pitfalls** - Unique challenges with non-English prompts in English-trained video AI models

Each category below includes detection signals, prevention strategies, and phase-specific mitigation recommendations.

---

## Critical Pitfalls

Mistakes that cause rewrites, user abandonment, or fundamental feature failures.

### Pitfall 1: Conflicting Instructions in Generated Prompts

**What goes wrong:** AI generates prompts with contradictory elements like "fast-paced action + slow, contemplative mood" or "zoom in + pan left" simultaneously. The video generation model can't reconcile these and produces incoherent results.

**Why it happens:**
- Gemini combines user selections without semantic validation
- No constraint system prevents incompatible camera movements
- Template-based generation concatenates options without understanding conflicts

**Consequences:**
- Users copy prompts that consistently fail in Runway/Pika/Kling
- Trust in the system erodes ("AI suggestions don't work")
- Manual editing becomes necessary, defeating the tool's purpose
- Negative feedback loop: users stop using the feature

**Prevention:**
- **Phase 1 (MVP):** Implement mutually-exclusive controls for camera movements (radio buttons, not checkboxes). Users can only select ONE camera style at a time.
- **Phase 2 (Intelligence):** Add validation rules to Gemini system prompt: "NEVER combine zoom movements with pan/orbit. Choose ONE primary camera motion."
- **Phase 2 (Intelligence):** Test generated prompts programmatically against a ruleset before showing to users.
- **Phase 3 (Polish):** Implement smart recommendations that disable incompatible options when one is selected.

**Detection:**
- Warning signs: Users repeatedly regenerate prompts for the same image
- User feedback: "The prompts don't work when I paste them into Runway"
- Analytics: High regeneration rate (>5 variants per image on average)
- Testing: Paste generated prompts into Runway/Pika test accounts and verify video quality

**Phase Mapping:**
- **Phase 1:** Prevent at UI level (single-select controls)
- **Phase 2:** Validate in Gemini prompt engineering
- **Phase 3:** Monitor usage patterns for conflicts

**Confidence:** HIGH (consistently documented across Veo, Runway Gen-4, and Sora 2 documentation)

---

### Pitfall 2: Overly Complex Prompts from Too Many Options

**What goes wrong:** System tries to describe too many elements in one prompt (subject + background + foreground + camera + lighting + effects + audio + timing). Video AI models perform poorly with >60 words or >5 simultaneous instructions.

**Why it happens:**
- Well-intentioned feature creep: "Let's give users control over everything!"
- Misunderstanding of video AI constraints (they can't handle complex multi-part instructions)
- No prompt length enforcement or guidance
- Cumulative complexity from combining 6-8 camera styles × 5-6 film effects × lighting × duration × aspect ratio

**Consequences:**
- Generated prompts exceed optimal length (50-150 words per industry research)
- Video models produce "none of them well" results when given 5+ instructions
- Analysis paralysis: users overwhelmed by configuration options
- Poor output quality drives users away

**Prevention:**
- **Phase 1 (MVP):** Limit configuration surface area - implement ONLY camera style + film effects. Defer lighting, motion intensity, etc.
- **Phase 1 (MVP):** Enforce prompt length limits in Gemini system prompt: "Generate prompts between 50-150 words. Focus on 1 primary motion."
- **Phase 2 (Intelligence):** Add real-time character count with visual indicators (green: 50-150, yellow: 150-200, red: >200)
- **Phase 3 (Polish):** "Simplify" button that reduces prompt complexity automatically

**Detection:**
- Warning signs: Generated prompts consistently exceed 200 words
- User behavior: Many config changes before generating (decision paralysis)
- External validation: Poor video quality when tested in Runway/Pika
- Prompt analysis: >5 distinct instructions in generated text

**Phase Mapping:**
- **Phase 1:** Prevent via limited options (6-8 camera, 5-6 effects ONLY)
- **Phase 2:** Add length guidance and AI-driven simplification
- **Phase 3:** Smart defaults and complexity warnings

**Confidence:** HIGH (Hick's Law + video AI limitations documented in Google Veo, Runway Gen-4 guides)

---

### Pitfall 3: Missing Image Context in Prompts

**What goes wrong:** Generated prompts describe generic scenes ("a person standing") instead of specific image content ("young woman in red dress, outdoor garden, natural lighting"). Video AI tools require precise subject/scene description from the starting image.

**Why it happens:**
- Gemini image analysis not integrated properly
- System prompt doesn't emphasize extracting image details
- Rushing to generate without analyzing source image first
- Treating prompt generation as pure text task, not image-to-video task

**Consequences:**
- "Mismatched Starting Pose" errors in video generation (prompt says "walk forward" but image shows person sitting)
- Video morphs away from source image instead of animating it
- Continuity breaks: generated video doesn't match uploaded image aesthetic
- Users manually edit every prompt to add missing context

**Prevention:**
- **Phase 1 (MVP):** MANDATORY image analysis via Gemini before prompt generation. Never generate prompts without analyzing the image first.
- **Phase 1 (MVP):** Gemini system prompt MUST include: "First, analyze the provided image thoroughly. Extract: subject description, pose/position, environment/background, lighting conditions, color palette. Use these details in the video prompt."
- **Phase 2 (Intelligence):** Display extracted image analysis to user ("Detected: Portrait of woman, indoor setting, warm lighting") for transparency.
- **Phase 3 (Polish):** Allow users to override detected image context if analysis is wrong.

**Detection:**
- Warning signs: Generic prompts like "a scene with motion"
- User feedback: "The video doesn't match my image"
- Testing: Compare generated prompt subject description to actual image content
- Quality metric: Prompt specificity score (count of concrete descriptors)

**Phase Mapping:**
- **Phase 1:** Enforce image analysis as prerequisite (blocking)
- **Phase 2:** Make analysis results visible to users
- **Phase 3:** Add override mechanisms for bad analysis

**Confidence:** HIGH (Image-to-video workflow requirements documented in Pika, Kling, Runway guides)

---

### Pitfall 4: German Prompts in English-Trained Models

**What goes wrong:** Video AI models (Runway, Pika, Kling) are primarily trained on English prompts. German prompts may produce lower-quality videos, misunderstand terminology, or fail entirely.

**Why it happens:**
- PROJECT.md specifies Deutsch-only UI and prompts
- Video AI tools have limited German language support
- Gemini can generate German prompts, but downstream tools may not respect them
- No validation that German prompts work in target platforms

**Consequences:**
- Users paste beautifully-crafted German prompts into Runway → poor/unexpected results
- Feature appears broken when problem is language, not logic
- Users lose trust in the entire system
- May require pivot to English prompts despite German UI (confusing UX)

**Prevention:**
- **Phase 1 (MVP):** CRITICAL EARLY VALIDATION - Test 5-10 generated German prompts in actual Runway/Pika/Kling accounts during first week of Phase 1
- **Phase 1 (MVP):** If German prompts underperform, implement fallback: Generate English prompts but provide German UI labels/instructions
- **Phase 2 (Intelligence):** Add "Translate to English" toggle in UI if German prompts prove unreliable
- **Phase 2 (Intelligence):** Gemini system prompt variation: "Generate in German, but use English terminology for camera/film terms (e.g., 'tracking shot', 'golden hour') as these are industry standards"

**Detection:**
- Warning signs: User complaints about video quality from copied prompts
- Direct testing: Side-by-side comparison of German vs English prompt results in Runway
- Quality metric: Video output coherence rating (subjective evaluation)
- Community feedback: Check if other German users of Runway/Pika report similar issues

**Phase Mapping:**
- **Phase 1 WEEK 1:** Validate German prompt effectiveness immediately
- **Phase 1:** Implement fallback strategy if needed (English prompts, German UI)
- **Phase 2:** Add translation toggle as safety valve
- **Phase 3:** Monitor and optimize based on real usage

**Confidence:** MEDIUM-LOW (Gap in research - no sources specifically addressed German video prompts in 2026. Flagged in SUMMARY.md as validation risk.)

**CRITICAL:** This is the highest-risk pitfall for this specific project. Recommend allocating dedicated testing time in Phase 1 Sprint 1.

---

### Pitfall 5: Variant Storage Schema Without Ordering

**What goes wrong:** Storing multiple prompt variants without proper ordering/navigation metadata. Users generate 5 variants but can't tell which is newest, which they preferred, or what the progression was.

**Why it happens:**
- Quick database design without considering variant UX
- Missing `variant_order` or `created_at` fields
- No thought given to "Show me my last generated prompt" use case
- Treating variants as independent records instead of a sequence

**Consequences:**
- Users can't find their latest variant (confusing UI)
- No way to navigate chronologically through refinement history
- "Improve prompt" feature has no context of what came before
- Users regenerate same variant multiple times unknowingly

**Prevention:**
- **Phase 1 (Database):** Include BOTH `created_at` (chronological) AND `variant_order` (user-defined) fields in video_prompts table
- **Phase 1 (Database):** Default sort: `ORDER BY variant_order ASC, created_at DESC` (user order first, then newest)
- **Phase 2 (Iteration):** Display variant counter: "Variante 2 von 5" with clear prev/next navigation
- **Phase 3 (Polish):** Allow reordering (drag-and-drop) to update variant_order

**Detection:**
- Warning signs: User creates many similar variants (indicates they lost track)
- UX testing: Users can't find "the one I just generated"
- Database analysis: Many prompts with same config (duplicates)

**Phase Mapping:**
- **Phase 1:** Prevent via proper schema design (see ARCHITECTURE.md)
- **Phase 2:** Build navigation UI on solid data foundation
- **Phase 3:** Add advanced ordering features

**Confidence:** MEDIUM-HIGH (General database design best practices + variant management patterns from Runway/Midjourney)

---

## UX Pitfalls

Mistakes that cause frustration, confusion, or abandonment without breaking functionality.

### Pitfall 6: Analysis Paralysis from Too Many Configuration Options

**What goes wrong:** Presenting 10+ configuration dropdowns (camera, lighting, effects, mood, duration, aspect ratio, intensity, style, audio, pacing) overwhelms users. They spend 5+ minutes configuring instead of generating and testing.

**Why it happens:**
- Attempting feature parity with professional video tools
- "More options = more value" mindset
- Ignoring Hick's Law (decision time increases with choices)
- No progressive disclosure (showing advanced options upfront)

**Consequences:**
- 69.57% cart abandonment rate documented in eCommerce with overwhelming choices (applies to feature use too)
- Users give up before generating first prompt
- Professional users frustrated by time wasted on configuration
- Research shows 4% conversion with 24 options vs 31% with 6 options (jam study)

**Prevention:**
- **Phase 1 (MVP):** LIMIT to 6-8 camera styles + 5-6 film effects ONLY. Nothing else.
- **Phase 1 (MVP):** Use visual chips/cards, not dense dropdown lists
- **Phase 2 (Intelligence):** Add smart defaults from image analysis (pre-fill reasonable options)
- **Phase 3 (Polish):** "Advanced" toggle for additional options (progressive disclosure)
- **Phase 3 (Polish):** Implement recommendation system: "For portraits, we recommend: X, Y, Z" (limit to 3 suggestions)

**Detection:**
- Warning signs: Time-to-first-generation >2 minutes on average
- Analytics: High panel-open-without-generate rate (users look but don't act)
- User feedback: "I don't know what to choose"
- A/B testing: Fewer options = higher completion rate

**Phase Mapping:**
- **Phase 1:** Prevent by limiting scope (discipline)
- **Phase 2:** Smart defaults reduce decisions needed
- **Phase 3:** Progressive disclosure for power users

**Confidence:** HIGH (Laws of UX: Hick's Law, Choice Overload documented extensively. Jam study replication, Baymard Institute data)

---

### Pitfall 7: No Copy Feedback (Silent Clipboard Actions)

**What goes wrong:** User clicks "Copy" button but receives no confirmation. They're unsure if copy worked, paste to test, find empty clipboard, click Copy again 3-4 times in confusion.

**Why it happens:**
- Implementing `navigator.clipboard.writeText()` without UI feedback
- Assuming users understand silent actions
- No consideration of error cases (clipboard permissions denied)

**Consequences:**
- User uncertainty and repeated clicks
- Accessibility failure (screen readers don't announce copy success)
- Users paste to test every time instead of trusting the system
- Poor UX compared to industry standards (GitHub, VS Code show explicit feedback)

**Prevention:**
- **Phase 1 (MVP):** Toast notification on successful copy ("Prompt kopiert!")
- **Phase 1 (MVP):** Visual button state change (checkmark icon for 2 seconds)
- **Phase 1 (MVP):** Handle clipboard errors gracefully with fallback (show modal with text to manually copy)
- **Phase 2 (Polish):** Add keyboard shortcut (Cmd/Ctrl+C when prompt is focused)

**Detection:**
- Warning signs: Users clicking Copy button multiple times in quick succession
- Analytics: Multiple copy events for same prompt within 5 seconds
- User feedback: "I'm not sure if it copied"

**Phase Mapping:**
- **Phase 1:** Implement immediately (standard UX practice)
- **Phase 2:** Add keyboard shortcuts and enhanced feedback

**Confidence:** HIGH (Standard UX pattern, well-documented across UI libraries)

---

### Pitfall 8: Hiding Image While Configuring Prompt

**What goes wrong:** Prompt configuration panel obscures the source image. Users can't see what they're writing prompts for, leading to generic/mismatched prompts.

**Why it happens:**
- Full-screen modal approach instead of side panel
- Mobile-first design without considering desktop workflow
- Not following industry patterns (Runway, Pika show image + config side-by-side)

**Consequences:**
- Users generate prompts without image context
- Have to close panel to review image, losing configuration state
- Increased cognitive load (working memory of image details)
- Professional workflow disrupted (can't reference image while configuring)

**Prevention:**
- **Phase 1 (MVP):** Use Sheet component (side panel) not Dialog (modal). See ARCHITECTURE.md.
- **Phase 1 (MVP):** Include small image preview at top of panel (150-200px)
- **Phase 2 (Polish):** Responsive: Side panel on desktop (≥1024px), drawer from bottom on mobile (preserves image visibility)
- **Phase 3 (Polish):** Allow resizing panel width on desktop

**Detection:**
- Warning signs: Users frequently close and reopen panel
- UX testing: Users mention needing to "check the image again"
- Comparison: Test side panel vs modal and measure time-to-generate

**Phase Mapping:**
- **Phase 1:** Prevent via Sheet component selection (architectural decision)
- **Phase 2:** Optimize responsiveness
- **Phase 3:** Add customization

**Confidence:** HIGH (Industry standard pattern from Runway Gen-4, Pika UI, documented in FEATURES.md research)

---

### Pitfall 9: No Guidance on Prompt Quality

**What goes wrong:** System generates prompts but provides no indication of quality. Users don't know if "Kurze Szene mit Bewegung" (12 words) is too short or "Ein detaillierter..." (250 words) is too long.

**Why it happens:**
- Focus on generation mechanics without quality feedback
- No integration of research findings (optimal 50-150 words)
- Assuming Gemini always produces optimal prompts (it doesn't)

**Consequences:**
- Users copy poor-quality prompts and get bad video results
- No learning loop (users don't improve their understanding)
- System can't self-correct without feedback mechanism
- Trust erosion when prompts consistently underperform

**Prevention:**
- **Phase 2 (Intelligence):** Add visual indicator for prompt length (green: 50-150 words, yellow: 150-200, red: <50 or >200)
- **Phase 2 (Intelligence):** Show word count prominently
- **Phase 3 (Polish):** Quality checklist: ✓ Has camera movement, ✓ Describes subject, ✓ Includes style
- **Phase 3 (Polish):** "Simplify" or "Expand" suggestions based on analysis

**Detection:**
- Warning signs: Wide variance in generated prompt lengths
- User feedback: "Some prompts work great, others don't - can't tell why"
- Quality analysis: Correlation between prompt length and user regeneration rate

**Phase Mapping:**
- **Phase 1:** Enforce in Gemini system prompt (backend)
- **Phase 2:** Make visible to users (frontend feedback)
- **Phase 3:** Add actionable improvement suggestions

**Confidence:** MEDIUM-HIGH (50-150 word guideline documented across Veo, Runway, Sora 2 sources. Visual feedback is standard UX pattern.)

---

### Pitfall 10: No Empty State Guidance

**What goes wrong:** User opens video prompt panel for first time, sees empty state with config form, doesn't know what to do. "What's a tracking shot? What's cinematic? Should I fill in custom instructions?"

**Why it happens:**
- Building for power users who already understand video terminology
- No onboarding or first-use experience
- Assuming users read documentation (they don't)

**Consequences:**
- High drop-off on first use
- Random configuration selections (garbage in, garbage out)
- Support burden ("How do I use this?")
- Feature underutilization despite high value

**Prevention:**
- **Phase 1 (MVP):** Empty state with clear call-to-action: "Generiere deinen ersten Video-Prompt" with explanation
- **Phase 2 (Intelligence):** Smart defaults pre-filled on first use (user just clicks Generate)
- **Phase 2 (Intelligence):** Tooltips on camera/effect options with examples ("Tracking Shot: Camera follows subject smoothly")
- **Phase 3 (Polish):** Interactive tutorial on first use (optional, dismissible)
- **Phase 3 (Polish):** Example prompts shown in empty state ("See what's possible")

**Detection:**
- Warning signs: High panel-open rate but low generation rate
- Analytics: Many users view panel once and never return
- User feedback: "I didn't understand what to do"

**Phase Mapping:**
- **Phase 1:** Basic empty state with CTA
- **Phase 2:** Smart defaults + tooltips reduce learning curve
- **Phase 3:** Full onboarding experience

**Confidence:** MEDIUM (Standard UX best practice for new features)

---

## Technical Pitfalls

Mistakes that cause bugs, performance issues, or maintenance problems.

### Pitfall 11: Storing Prompts Without Generated Metadata

**What goes wrong:** Saving only `prompt_text` without tracking how it was generated. When prompts fail or underperform, no way to debug what configuration produced them.

**Why it happens:**
- Minimal schema design ("Just store the text!")
- Not planning for iteration and debugging
- Treating prompts as final outputs instead of experiments

**Consequences:**
- Can't analyze which camera styles work best
- No way to improve generation algorithm (no feedback data)
- Users can't recreate successful prompts (lost config)
- Support nightmare: "This prompt doesn't work" but can't see how it was made

**Prevention:**
- **Phase 1 (Database):** Store complete config in JSONB (cameraStyle, filmEffect, etc.). See ARCHITECTURE.md schema.
- **Phase 1 (Database):** Include metadata: generation_time_ms, model_used, gemini_version
- **Phase 2 (Intelligence):** Add user rating field (optional: thumbs up/down on variant)
- **Phase 3 (Analytics):** Track which configs correlate with user satisfaction

**Detection:**
- Warning signs: Can't answer "Why was this prompt generated this way?"
- Support requests: "Can you regenerate my prompt from yesterday?" (impossible without config)
- Product analytics: No data on feature usage patterns

**Phase Mapping:**
- **Phase 1:** Prevent via comprehensive schema design
- **Phase 2:** Add user feedback mechanism
- **Phase 3:** Build analytics on rich metadata

**Confidence:** HIGH (Database design best practices, documented in ARCHITECTURE.md)

---

### Pitfall 12: No Polling for Pending Prompts

**What goes wrong:** User clicks "Generate", spinner appears, but Gemini call takes 3-5 seconds. UI freezes or shows stale state. If user navigates away, pending prompt is lost or appears without notification.

**Why it happens:**
- Synchronous generation approach (waiting for API response)
- No status tracking (pending/completed/failed)
- Not handling long-running operations properly

**Consequences:**
- Poor perceived performance (feels slow and broken)
- Users create duplicate prompts thinking first one failed
- Navigation away cancels generation (work lost)
- No error recovery when API times out

**Prevention:**
- **Phase 1 (MVP):** Async pattern: Create prompt record with status='pending' immediately, then update after Gemini responds
- **Phase 1 (MVP):** React Query polling: refetch every 2 seconds while any prompt has status='pending'
- **Phase 2 (Intelligence):** Visual states: Pending (spinner), Completed (full prompt), Failed (retry button)
- **Phase 3 (Polish):** Optimistic UI: Show placeholder prompt card immediately on generate

**Detection:**
- Warning signs: Users report "nothing happens" when clicking generate
- Analytics: High generation-start but low generation-complete rate
- Error logs: Timeout errors from Gemini API

**Phase Mapping:**
- **Phase 1:** Implement async status tracking
- **Phase 2:** Add visual states and error handling
- **Phase 3:** Optimistic UI for better perceived performance

**Confidence:** HIGH (Standard async operation pattern, documented in ARCHITECTURE.md React Query section)

---

### Pitfall 13: Not Validating Config Before Gemini Call

**What goes wrong:** Passing invalid/empty config to Gemini (e.g., cameraStyle: undefined). Gemini generates generic prompt or fails, wasting API quota and user time.

**Why it happens:**
- Relying on client-side validation alone
- Not re-validating in server action
- Race conditions or state management bugs

**Consequences:**
- API quota wasted on invalid requests
- Generic prompts from incomplete context
- Security risk (malformed input could exploit prompt injection)
- Difficult to debug ("Why did it generate this?")

**Prevention:**
- **Phase 1 (MVP):** Zod schema validation on BOTH client and server. See ARCHITECTURE.md types.
- **Phase 1 (MVP):** Server action checks: `VideoPromptConfigSchema.parse(config)` before Gemini call
- **Phase 2 (Intelligence):** Sanitize customInstructions (remove control characters, limit length to 500)
- **Phase 3 (Security):** Add rate limiting per user (max 20 prompts/hour to prevent abuse)

**Detection:**
- Warning signs: Gemini errors in logs with "invalid input"
- Cost analysis: High API usage with low success rate
- User feedback: "Generated prompts are always generic"

**Phase Mapping:**
- **Phase 1:** Prevent via double validation (client + server)
- **Phase 2:** Add input sanitization
- **Phase 3:** Add rate limiting and abuse prevention

**Confidence:** HIGH (Multi-layer validation is security and reliability best practice)

---

### Pitfall 14: Missing Image-to-Prompt Context Loss

**What goes wrong:** Generating prompts for images without passing actual image data or metadata to Gemini. System generates prompts based only on user config, missing the critical image context.

**Why it happens:**
- Misunderstanding Gemini API capabilities (thinking text-only model can't handle images)
- Not reading existing image metadata before generation
- Separating image analysis from prompt generation (two-step when it should be one)

**Consequences:**
- Prompts completely generic ("a cinematic scene")
- No connection between image content and animation suggestions
- Users must manually edit every prompt to add subject details
- Feature value proposition destroyed (defeats purpose of AI assistance)

**Prevention:**
- **Phase 1 (MVP):** CRITICAL - Pass image metadata (from images.metadata JSONB) to Gemini prompt
- **Phase 1 (MVP):** If metadata insufficient, re-analyze image with Gemini vision before generating prompt
- **Phase 1 (MVP):** System prompt MUST include: "Use this image context: {subject}, {scene}, {lighting}" with actual values
- **Phase 2 (Intelligence):** Make image analysis explicit and visible to user

**Detection:**
- Warning signs: Prompts don't mention specific image subjects
- Testing: Generate prompt for portrait → check if prompt mentions "person" or specific details
- User feedback: "Prompts are too generic"

**Phase Mapping:**
- **Phase 1:** Prevent by enforcing image context in generation flow
- **Phase 2:** Enhance with explicit analysis display

**Confidence:** HIGH (Core requirement for image-to-video workflow per Runway, Pika documentation)

---

### Pitfall 15: No Gemini API Error Handling Strategy

**What goes wrong:** Gemini API fails (timeout, rate limit, invalid key) and error bubbles to user as "Something went wrong". Prompt record stays in 'pending' forever, user confused.

**Why it happens:**
- Optimistic coding ("API always works")
- No retry logic or fallback strategy
- Not considering error states in schema design

**Consequences:**
- Permanently stuck pending prompts (database pollution)
- Users don't know if they should retry or wait
- No visibility into what went wrong (debugging nightmare)
- Loss of user trust when errors are opaque

**Prevention:**
- **Phase 1 (MVP):** Update prompt status to 'failed' on error, store error message in metadata.error_message
- **Phase 1 (MVP):** User-friendly error messages: "Rate limit exceeded" → "Zu viele Anfragen. Bitte in 1 Minute erneut versuchen."
- **Phase 2 (Intelligence):** Retry button for failed prompts (calls regenerateVideoPromptAction)
- **Phase 2 (Intelligence):** Exponential backoff for rate limit errors (auto-retry after delay)
- **Phase 3 (Reliability):** Fallback to template-based generation if Gemini unavailable

**Detection:**
- Warning signs: Increase in 'pending' prompts without resolution
- Error logs: Repeated Gemini API failures
- User feedback: "It's been loading for 5 minutes"

**Phase Mapping:**
- **Phase 1:** Implement failed state and error tracking
- **Phase 2:** Add retry mechanisms
- **Phase 3:** Add fallback strategies

**Confidence:** HIGH (Standard error handling best practices, API integration patterns)

---

### Pitfall 16: RLS Policies Don't Cascade to Variants

**What goes wrong:** User deletes image, but video_prompts records remain orphaned due to missing CASCADE constraint or RLS policy. Database fills with garbage data.

**Why it happens:**
- Forgetting to set `ON DELETE CASCADE` on foreign key
- Testing only happy path (create/read/update, not delete)
- RLS policies don't prevent orphaned records (application logic issue)

**Consequences:**
- Database bloat from orphaned prompts
- Queries slow down over time
- Storage costs increase unnecessarily
- Data integrity violations

**Prevention:**
- **Phase 1 (Database):** `image_id UUID REFERENCES images(id) ON DELETE CASCADE` in schema
- **Phase 1 (Testing):** Explicitly test: Delete image → verify prompts auto-deleted
- **Phase 2 (Monitoring):** Periodic query for orphaned records (should always be 0)

**Detection:**
- Warning signs: Orphaned prompt records in database (query for prompts where image_id not in images)
- Performance: Queries slowing down due to table size
- Data audit: Record count mismatch between images and prompts

**Phase Mapping:**
- **Phase 1:** Prevent via proper schema design (see ARCHITECTURE.md)
- **Phase 2:** Add monitoring/alerts

**Confidence:** HIGH (Database referential integrity best practice)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or sub-optimal UX.

### Pitfall 17: Not Considering Mobile UX for Prompt Panel

**What goes wrong:** Side panel design works great on desktop but breaks on mobile. Panel obscures entire screen, can't see image, awkward scrolling.

**Why it happens:**
- Desktop-first design approach
- Not testing on actual mobile devices
- Using Sheet component without responsive variant

**Prevention:**
- **Phase 1 (MVP):** Use shadcn Sheet with responsive behavior: Drawer from bottom on mobile (<1024px)
- **Phase 1 (MVP):** Test on actual iPhone/Android during development
- **Phase 2 (Polish):** Adjust panel height on mobile (50% screen, not 100%)

**Detection:** Mobile user complaints, analytics showing low mobile engagement

**Phase Mapping:** Phase 1 prevention via responsive Sheet component

**Confidence:** MEDIUM-HIGH (Responsive design standard practice)

---

### Pitfall 18: Prompt Text Overflow and Line Breaks

**What goes wrong:** Generated prompts have weird line breaks, escape characters, or overflow container. Copy-paste includes unwanted formatting.

**Why it happens:**
- Not sanitizing Gemini output
- CSS word-wrap not configured
- Textarea vs div rendering differences

**Prevention:**
- **Phase 1 (MVP):** Trim whitespace, normalize line breaks in server action before storing
- **Phase 1 (MVP):** CSS: `word-wrap: break-word; white-space: pre-wrap;` on prompt display
- **Phase 2 (Polish):** Strip markdown formatting if Gemini adds it (users want plain text)

**Detection:** Visual bugs in UI, users report "weird characters" in copied prompts

**Phase Mapping:** Phase 1 prevention via text normalization

**Confidence:** MEDIUM (Common text rendering issue)

---

### Pitfall 19: No "View All Prompts for This Image" Shortcut

**What goes wrong:** User generates 5 variants, closes panel, reopens it later but has to scroll/search through all prompts to find the one for this image.

**Why it happens:**
- Panel fetches all prompts globally, not filtered by image
- No clear association in UI between image and its prompts

**Prevention:**
- **Phase 1 (MVP):** Always filter prompts by imageId in getVideoPromptsAction
- **Phase 2 (Intelligence):** Show prompt count badge on ImageCard (visual indicator)
- **Phase 3 (Polish):** "Jump to latest prompt" shortcut

**Detection:** User behavior - frequently closing/reopening panel, searching through prompts

**Phase Mapping:** Phase 1 prevention via correct query filtering

**Confidence:** HIGH (Basic filtering requirement)

---

### Pitfall 20: Fixed Suggestions Become Stale

**What goes wrong:** Hardcoded action suggestions ("Make character smile", "Add subtle motion") become irrelevant when video AI models evolve or user needs change.

**Why it happens:**
- Putting fixed suggestions directly in component code
- No mechanism to update without deployment

**Prevention:**
- **Phase 2 (Intelligence):** Store fixed suggestions in database table (easy to update)
- **Phase 3 (Advanced):** Admin panel to edit suggestions without code deploy
- **Phase 3 (Advanced):** A/B test different suggestion sets

**Detection:** User feedback "Suggestions aren't helpful", low suggestion click-through rate

**Phase Mapping:** Phase 2 prevention via database-driven suggestions

**Confidence:** MEDIUM (Feature evolution planning)

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation | Priority |
|-------|-------|----------------|------------|----------|
| **Phase 1 - MVP** | German Prompts | Video AI tools don't understand German well | Test in Runway/Pika/Kling WEEK 1, implement English fallback if needed | CRITICAL |
| **Phase 1 - MVP** | Conflicting Instructions | Users select incompatible camera movements | Single-select UI controls (radio, not checkboxes) | HIGH |
| **Phase 1 - MVP** | Missing Image Context | Prompts are generic | Mandatory Gemini image analysis before generation | HIGH |
| **Phase 1 - MVP** | Too Many Options | 15+ config fields overwhelm users | Limit to camera style + film effects ONLY | HIGH |
| **Phase 1 - MVP** | No Copy Feedback | Users uncertain if clipboard worked | Toast notification + visual button state | MEDIUM |
| **Phase 1 - Database** | Missing CASCADE | Orphaned prompts on image delete | ON DELETE CASCADE in schema | HIGH |
| **Phase 1 - Database** | No Variant Ordering | Can't navigate prompt history | created_at + variant_order fields | MEDIUM |
| **Phase 2 - Intelligence** | AI Suggestions Irrelevant | Generic suggestions don't match image | Context-aware Gemini analysis with image specifics | MEDIUM |
| **Phase 2 - Intelligence** | Prompt Too Long/Short | No quality guidance | Word count + visual indicator (50-150 optimal) | MEDIUM |
| **Phase 2 - Intelligence** | Pending Prompts Stuck | No polling for status updates | React Query refetch interval for pending prompts | HIGH |
| **Phase 3 - Polish** | Analysis Paralysis | Too many advanced options added | Progressive disclosure (hide advanced behind toggle) | MEDIUM |
| **Phase 3 - Polish** | Mobile UX Broken | Desktop-centric design | Responsive Sheet/Drawer pattern, test on devices | MEDIUM |
| **All Phases** | Gemini API Failures | No error handling strategy | Failed status, retry button, error messages in metadata | HIGH |

---

## Prevention Strategy Summary

### Phase 1 (MVP) - Critical Preventions

**Must Have:**
1. **Single-select camera controls** (prevent conflicting instructions)
2. **Mandatory image analysis** (prevent generic prompts)
3. **Limited config surface** (prevent analysis paralysis) - 6-8 camera + 5-6 effects ONLY
4. **German prompt validation** (test in external tools WEEK 1)
5. **Proper database schema** (CASCADE, variant_order, status tracking)
6. **Copy feedback** (toast + visual confirmation)
7. **Async status tracking** (pending/completed/failed states)
8. **Double validation** (Zod on client + server)

**Testing Checkpoints:**
- [ ] German prompts tested in Runway/Pika/Kling (Week 1)
- [ ] Image deletion cascades to prompts
- [ ] Generated prompts are 50-150 words
- [ ] No conflicting camera instructions possible
- [ ] Copy button shows confirmation

---

### Phase 2 (Intelligence) - Enhancement Preventions

**Must Have:**
1. **Prompt length guidance** (visual indicator, word count)
2. **Polling for pending prompts** (React Query refetch)
3. **Retry for failed prompts** (regenerate button)
4. **Context-aware AI suggestions** (Gemini image analysis → specific actions)
5. **Visual prompt states** (pending spinner, failed error, completed display)

**Nice to Have:**
1. **Quality checklist** (has camera ✓, describes subject ✓, includes style ✓)
2. **Smart defaults from image** (portrait → suggest dolly/orbit)
3. **Tooltips on options** (explain "tracking shot")

---

### Phase 3 (Polish) - Optimization Preventions

**Must Have:**
1. **Progressive disclosure** (advanced options behind toggle)
2. **Mobile optimization** (responsive Sheet/Drawer pattern)

**Nice to Have:**
1. **Onboarding flow** (first-use tutorial)
2. **Variant comparison view** (side-by-side)
3. **Simplify/Expand buttons** (auto-adjust prompt complexity)
4. **Analytics on config usage** (which cameras work best)

---

## Sources

### Video AI Prompt Engineering (2026)
- [AI Video Prompt Guide: How To Write AI Video Prompts | LTX Studio](https://ltx.studio/blog/ai-video-prompt-guide) - Common mistakes and best practices
- [Sora 2 Prompting Guide: Tips for Better AI Video Generation in 2026 | WaveSpeedAI](https://wavespeed.ai/blog/posts/sora-2-prompting-tips-better-videos-2026/) - 2026 prompting pitfalls
- [5 Common AI Video Mistakes Businesses Make](https://www.entrepreneur.com/growing-a-business/5-common-ai-video-mistakes-businesses-make-and-how-to/499769) - Business perspective on mistakes
- [Gen-4 Video Prompting Guide – Runway](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide) - Runway-specific best practices
- [Veo on Vertex AI video generation prompt guide | Google Cloud](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide) - Google Veo official guidelines
- [Best Prompts for AI Image to Video Generation](https://invideo.io/blog/best-prompts-for-ai-image-to-video/) - Image-to-video workflow pitfalls
- [How to Actually Control Next-Gen Video AI | Medium](https://medium.com/@creativeaininja/how-to-actually-control-next-gen-video-ai-runway-kling-veo-and-sora-prompting-strategies-92ef0055658b) - Cross-platform strategies

### UX & Decision Paralysis
- [Using Paradox of Choice in UX Design | UserTesting](https://www.usertesting.com/blog/how-to-use-the-paradox-of-choice-in-ux-design) - Too many options pitfall
- [Lost in Navigation: Overcoming the Paradox of Choice](https://uxpsychology.substack.com/p/lost-in-navigation-overcoming-the) - Psychological impact
- [14 Brilliant Ways to Overcome Choice Paralysis in eCommerce](https://www.convertcart.com/blog/how-to-overcome-choice-paralysis-and-increase-conversions) - 4-7 options optimal
- [Choice Overload | Laws of UX](https://lawsofux.com/choice-overload/) - Hick's Law documentation
- [Simplicity Wins over Abundance of Choice - NN/G](https://www.nngroup.com/articles/simplicity-vs-choice/) - Nielsen Norman Group research

### Prompt Engineering Best Practices (2026)
- [Prompt Engineering in 2026: Top Trends, Tools, and Techniques](https://www.promptitude.io/post/the-complete-guide-to-prompt-engineering-in-2026-trends-tools-and-best-practices) - Current trends
- [The 2026 Guide to Prompt Engineering | IBM](https://www.ibm.com/think/prompt-engineering) - Enterprise perspective
- [2026: The Year UX Finally Rewrites the Rules of AI](https://www.cmswire.com/digital-experience/2026-the-year-user-experience-finally-rewrites-the-rules-of-ai/) - UX evolution
- [Aided Prompt Understanding: UX Design Patterns](https://www.uxtigers.com/post/prompt-understanding) - Prompt UX patterns

### Prompt Versioning & Variant Management
- [Prompt Versioning: Best Practices | Latitude](https://latitude-blog.ghost.io/blog/prompt-versioning-best-practices/) - Variant management strategies
- [Prompt Versioning & Management Guide | LaunchDarkly](https://launchdarkly.com/blog/prompt-versioning-and-management/) - Enterprise patterns
- [Top 5 Prompt Versioning Tools for Enterprise AI Teams in 2026](https://www.getmaxim.ai/articles/top-5-prompt-versioning-tools-for-enterprise-ai-teams-in-2026/) - Tool comparison
- [Mastering Prompt Versioning: Best Practices for Scalable LLM Development](https://dev.to/kuldeep_paul/mastering-prompt-versioning-best-practices-for-scalable-llm-development-2mgm) - Technical implementation

### Database Design & Schema Pitfalls
- [10 Common Mistakes in Database Design | ChartDB](https://chartdb.io/blog/common-database-design-mistakes) - 2025 best practices
- [Database Design Errors to Avoid | DBSchema](https://dbschema.com/blog/design/database-design-mistakes/) - Schema mistakes
- [Three Common MySQL Database Design Mistakes | PlanetScale](https://planetscale.com/blog/three-common-mysql-database-design-mistakes) - FK and CASCADE issues
- [11 Database Schema Mistakes to Avoid | Fivetran](https://www.fivetran.com/blog/11-database-schema-mistakes-to-avoid/) - Schema anti-patterns

### AI Image/Video Generation Mistakes
- [10 Common Mistakes to Avoid When Writing AI Image Prompts](https://chatsmith.io/blogs/ai-guide/writing-ai-image-prompts-mistakes-00052) - Image prompt errors (apply to video)
- [10 Common Mistakes to Avoid in AI Video Creation](https://focalml.com/blog/10-mistakes-to-avoid-when-using-an-an-ai-movie-generator/) - Video-specific mistakes
- [6 AI Image Generator Mistakes You Must Avoid in 2026](https://www.allaboutai.com/resources/ai-image-generator-mistakes/) - 2026 mistakes
- [10 AI Image Generation Mistakes 99% Of People Make](https://www.godofprompt.ai/blog/10-ai-image-generation-mistakes-99percent-of-people-make-and-how-to-fix-them) - Common errors

### Gemini API Integration
- [Video understanding | Gemini API](https://ai.google.dev/gemini-api/docs/video-understanding) - Gemini capabilities and limitations
- [Prompt design strategies | Gemini API](https://ai.google.dev/gemini-api/docs/prompting-strategies) - Official prompting guide

---

## Confidence Assessment

| Pitfall Category | Confidence | Rationale |
|-----------------|------------|-----------|
| Prompt Quality Pitfalls | HIGH | Documented extensively in Google Veo, Runway Gen-4, Sora 2 official guides |
| UX Complexity Pitfalls | HIGH | Backed by Hick's Law, Laws of UX, Nielsen Norman Group research |
| Technical Implementation | HIGH | Standard database/API integration patterns, verified across sources |
| German Language Pitfalls | MEDIUM-LOW | Research gap - no specific German video prompt studies found. Flagged for validation. |
| Variant Management | MEDIUM-HIGH | Emerging best practices from LLM prompt versioning tools (2026) |
| Mobile Responsiveness | HIGH | Standard responsive design patterns, shadcn documentation |

**Overall Research Confidence: MEDIUM-HIGH**

Strong evidence for most pitfalls. Primary risk: German language prompt effectiveness requires Phase 1 Week 1 validation.

---

## Critical Success Factors

To avoid these pitfalls, the implementation MUST:

1. **Test German prompts in real video AI tools (Runway/Pika/Kling) during Phase 1 Week 1** - This is non-negotiable validation
2. **Limit MVP configuration to camera (6-8) + effects (5-6) ONLY** - Resist feature creep
3. **Enforce image analysis before every prompt generation** - No exceptions
4. **Implement single-select camera controls** - Prevent conflicting instructions at UI level
5. **Use proper database schema with CASCADE and variant tracking** - Foundation for everything else
6. **Provide clear copy feedback** - Basic UX hygiene
7. **Handle Gemini API errors gracefully** - Failed state, retry mechanism, error messages

**Priority Order:**
1. CRITICAL: German prompt validation (Week 1)
2. HIGH: Prevent conflicting instructions (UI design)
3. HIGH: Mandatory image context (architecture)
4. HIGH: Limited options (scope discipline)
5. MEDIUM: All other preventions follow standard best practices

---

## Ready for Roadmap

This pitfalls research identifies 20 distinct failure patterns across Critical, UX, and Technical categories. Each includes:
- Root cause analysis
- Concrete prevention strategies
- Detection signals for early warning
- Phase-specific mitigation timing

**Primary recommendation:** Allocate dedicated testing time in Phase 1 Sprint 1 for German prompt validation. This is the highest-uncertainty risk factor and could require architectural pivot (English prompts, German UI) if German underperforms.

All other pitfalls have clear prevention strategies that align with the planned phase structure in SUMMARY.md and FEATURES.md.
