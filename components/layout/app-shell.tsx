"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  KeyRound,
  Bell,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Sistemas", icon: FolderKanban },
  { href: "/credentials", label: "Cofre", icon: KeyRound },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; name?: string | null; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-60 border-b md:border-b-0 md:border-r border-card-border bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-2 p-4">
          <Image
            src="/energon-sentinel-logo.svg"
            alt="Logo"
            width={36}
            height={42}
          />
          <div>
            <div className="text-sm font-semibold gradient-text">Energon Sentinel</div>
            <div className="text-[10px] text-muted uppercase tracking-wide">
              {user.role}
            </div>
          </div>
        </div>
        <nav className="px-2 pb-4 flex md:flex-col gap-1 overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-white/10 text-foreground"
                    : "text-muted hover:bg-white/5 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:block p-3 border-t border-card-border mt-auto">
          <p className="text-xs text-muted truncate mb-2">{user.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-card-border bg-[#0A0C1F]/80 px-4 py-3 backdrop-blur-md">
          <Button
            variant="outline"
            size="sm"
            className="text-muted"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            Buscar…
            <kbd className="ml-2 hidden sm:inline text-[10px] opacity-70">⌘K</kbd>
          </Button>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 animate-fade-up">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
