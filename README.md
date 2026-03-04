# AI Avatar Photo Shoot

The **AI Avatar Photo Shoot App** is a premium web platform that allows users to create professional-quality AI-generated avatars based on their own photos. Utilizing a **Bring Your Own Key (BYOK)** model, users can leverage the power of **Google Gemini** while maintaining control over their API usage.

## ✨ Key Features

- **Collections**: Organize your AI photo shoots into themed galleries.
- **Source Image Management**: Upload 4-10 reference photos with built-in guidelines for best results.
- **Customizable Styles**: Select from various artistic and professional styles (Corporate, Cyberpunk, Fantasy, etc.).
- **Secure BYOK Model**: Use your own Google Gemini API key for cost transparency and privacy.
- **High-Res Gallery**: A responsive masonry grid to view, download, or manage your generated avatars.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (Email Auth, PostgreSQL, Storage)
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Flash 2.5 & Pro 3 Image models)

## 🤖 Supported Models
Users can choose between the following models for image generation:
- **gemini-2.5-flash-image** (Default): Fast and efficient.
- **gemini-3-pro-image-preview**: High fidelity, premium quality.

## 📊 Progress Tracking

The app provides real-time progress updates during image generation:

- **Stage indicators**: Shows current stage (Queued → Processing → Generating → Complete)
- **Collection progress**: Banner showing overall generation progress
- **Enhanced errors**: Specific error messages with actionable guidance

### How it works

- Progress state is stored in Trigger.dev task metadata
- Frontend polls every 3 seconds for updates
- Database only stores final results (completed/failed)
- API route `/api/trigger/runs/[runId]` fetches real-time metadata

### Error codes

- `API_KEY_INVALID`: Check your Gemini API key in Settings
- `QUOTA_EXCEEDED`: Check your quota at console.cloud.google.com
- `FILE_TIMEOUT`: Try using smaller reference images
- `GENERATION_FAILED`: Image generation failed, retry the task
- `UPLOAD_FAILED`: Failed to save image, check storage permissions

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project
- A [Google Gemini API Key](https://aistudio.google.com/)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials (see `.env.example` for reference).

### 4. Run Development Server
```bash
npm run dev
```

### 5. Supabase Automation (Optional but Recommended)
To keep your TypeScript types in sync with your Supabase schema:
```bash
npm run types:update
```
SQL migrations are managed in `./supabase/migrations`.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛡️ Security & Privacy
The app leverages **Supabase Row Level Security (RLS)** to ensure data isolation. User API keys are stored securely within their profile.

## 📁 Project Structure
- `app/`: Next.js pages, layouts, and Server Actions.
- `components/`: UI components and avatar-creator logic.
- `lib/`: Shared utilities and database client.
- `docs/`: Product Requirements and technical documentation.

---
Built with ❤️ using Next.js and Gemini.
