# Product Requirements Document (PRD): AI Avatar Photo Shoot App

## 1. Executive Summary
The **AI Avatar Photo Shoot App** is a web-based platform that allows users to create high-quality AI-generated avatars based on their own uploaded photos. Leveraging Google's "Nano Banana" (Gemini) AI technology, users can create personalized photo collections (e.g., "Professional Headshots", "Fantasy Avatars"). Providing a Bring Your Own Key (BYOK) model, the app ensures users can securely use their own API credentials.

## 2. Core Concepts
*   **Collection**: A grouped set of photos (e.g., a specific "Shoot") that serves as the context for generating avatars.
*   **Source Images**: High-quality user-uploaded photos used as reference.
*   **Generated Avatars**: AI-created images based on source images and prompts.
*   **BYOK (Bring Your Own Key)**: Users provide their own Google Gemini API Key to power the generation.

## 3. Product Features

### 3.1 User Authentication & Profile
*   **Sign Up / Login**: Secure authentication via Supabase Auth (Email/Password or Social Providers).
*   **User Profile**:
    *   Storage of user preferences.
    *   **Secure API Key Management**: Encrypted storage field for the user's Gemini API Key.

### 3.2 Dashboard & Collections
*   **Overview**: View all created photo shoot collections.
*   **Create Collection**:
    *   Define a name/type for the collection.
    *   Upload 4-10 reference selfies/photos.
    *   Guidelines overlay on how to choose good source photos.

### 3.3 AI Model & Generation
*   **Provider**: Google Gemini API (utilizing the "Nano Banana" model capability).
*   **Mechanism**: Server Actions interact with the Gemini API using the user's stored key.
*   **Customization**: Users can select "styles" (e.g., Corporate, Cyberpunk, Oil Painting) which map to specific system prompts.

### 3.4 Image Gallery
*   **Grid View**: Responsive masonry or grid layout of generated avatars.
*   **Interactions**:
    *   **Hover**: Revealing quick actions (Download, Delete).
    *   **Click**: Opens a full-screen, high-resolution modal.
    *   **Download**: Save full-resolution image to device.
    *   **Delete**: Remove image from database and storage.

## 4. Technical Architecture

### 4.1 Frontend
*   **Framework**: Next.js 16+ (App Router).
*   **Styling**: Tailwind CSS v4.
*   **Components**: Reusable UI components (Modals, Cards, Inputs) via shadcn ui.
*   **State Management**:
    *   **TanStack Query (React Query)**: **MANDATORY** for all client-server communication.
    *   **Queries**: Wrap all data fetching.
    *   **Mutations**: Wrap all server actions (create, update, delete).

### 4.2 Backend & Infrastructure
*   **Runtime**: Next.js Server Actions (Node.js environment).
*   **Database**: Supabase (PostgreSQL).
    *   `profiles`: User data & API keys.
    *   `collections`: Groupings of images.
    *   `images`: Metadata for all files.
*   **Storage**: Supabase Storage buckets for:
    *   `uploads`: Raw source images (secured).
    *   `generated`: AI outputs.

### 4.3 Security
*   **Row Level Security (RLS)**: Strict Supabase policies to ensure users can only see their own data.
*   **Encryption**: API tokens should be stored securely (consider pgsodium or simple encryption if strictly needed, though RLS provides a strong baseline).

## 5. User Flow
1.  **Onboarding**: User lands on page -> Registers/Logs in.
2.  **Setup**: User enters Settings -> Pastes Gemini API Key.
3.  **Creation**: Dashboard -> "New Photo Shoot" -> Upload Selfies -> Select Style -> "Generate".
4.  **Results**: User waits/receives notification -> Views Gallery -> Downloads favorites.

## 6. Future Considerations
*   Payment integration (Stripe) for premium features vs free tier.
