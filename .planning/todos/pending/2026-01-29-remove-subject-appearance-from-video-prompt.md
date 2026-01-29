---
created: 2026-01-29T21:45
title: Remove subject appearance description from video prompt
area: generation
files:
  - lib/video-prompts.ts:12-13
  - app/actions/video-prompt-actions.ts
---

## Problem

The video prompt generation system always includes a description of the subject's physical appearance (face, hair, features) as part of the generated prompt. This is redundant because the reference image is always sent alongside the prompt for video generation. Worse, the text description of the person's appearance often causes the video model to alter the person's look, resulting in inconsistencies between the source image and the generated video.

The system prompt at `lib/video-prompts.ts:12` instructs the model to "Briefly describe what you see in the image (person, pose, environment, mood)" — the person description portion is the culprit.

## Solution

Modify the video prompt generation instructions to exclude physical appearance descriptions of the subject. It's acceptable to describe what the person is wearing (clothing, accessories) but not their facial features, hair, skin tone, or other identifying physical characteristics. The image itself provides that context.

Adjust the system prompt / generation instructions so that:
- Clothing and outfit descriptions are retained
- Physical appearance / look descriptions are removed
- Pose and environment descriptions are retained
