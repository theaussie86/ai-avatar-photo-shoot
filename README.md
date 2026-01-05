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
- **AI Integration**: [Google Gemini API](https://ai.google.dev/) (Nano model)

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
