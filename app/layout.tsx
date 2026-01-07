import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "AI Avatar Photo Shoot",
    template: "%s | AI Avatar Photo Shoot",
  },
  description: "Create professional AI-generated avatars for your profile photos. Transform your selfies into high-quality business headshots and creative portraits.",
  keywords: ["AI avatar", "headshots", "profile picture", "AI photos", "professional photos"],
  authors: [{ name: "AI Avatar Team" }],
  creator: "AI Avatar Team",
  publisher: "AI Avatar Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AI Avatar Photo Shoot",
    description: "Create professional AI-generated avatars for your profile photos.",
    url: "/",
    siteName: "AI Avatar Photo Shoot",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "AI Avatar Photo Shoot Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Avatar Photo Shoot",
    description: "Create professional AI-generated avatars for your profile photos.",
    images: ["/logo.png"],
    creator: "@aiavatar",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
