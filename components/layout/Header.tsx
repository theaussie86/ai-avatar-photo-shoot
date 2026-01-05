
import Link from "next/link";
import { Layers } from "lucide-react";

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
              <div className="text-xs text-muted-foreground">
                {profile?.credits || 0} Credits
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 ring-2 ring-white/10" />
          </div>
        </div>
      </div>
    </header>
  );
}
