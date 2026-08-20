"use client";

import { useEffect, useState } from "react";
import { Play, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setDropdownOpen(false);
    window.location.reload();
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <Play className="h-4 w-4 fill-white text-white" />
          </div>
          DemoPilot
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#demo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Demo
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </a>
          <a
            href="https://github.com/Hugongra/DemoPilot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            GitHub
          </a>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-stone-50"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warm text-xs font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <a
                      href="/dashboard"
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-stone-50"
                    >
                      Dashboard
                    </a>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-80"
            >
              Get Started
            </button>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Features
            </a>
            <a href="#demo" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Demo
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
              Pricing
            </a>

            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warm text-xs font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm truncate">{displayName}</span>
                </div>
                <button
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="flex items-center gap-2 text-sm text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); onOpenAuth(); }}
                className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
