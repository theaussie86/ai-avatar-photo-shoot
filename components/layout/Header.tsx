
import Link from "next/link";
import { Layers } from "lucide-react";
import { SettingsModal } from "@/components/avatar-creator/SettingsModal";

import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  user: any;
  profile: any;
}

export function Header({ user, profile }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 relative rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 border border-white/10">
            <img
              src="/logo.png"
              alt="Logo"
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            KI Foto Shooting 
          </span>
          <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border-0 ml-1">
            v{process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'}
          </Badge>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/collections"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            Meine Shootings
          </Link>
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-white">
                {profile?.full_name || user.email}
              </div>
            </div>
            <SettingsModal>
              <button className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-tr from-purple-500 to-blue-500" />
                )}
              </button>
            </SettingsModal>
          </div>
        </div>
      </div>
    </header>
  );
}
