"use client";

import { useState } from "react";
import { Play, Menu, X } from "lucide-react";

export default function Navbar({ onOpenAuth }: { onOpenAuth: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <button
            onClick={onOpenAuth}
            className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-80"
          >
            Get Started
          </button>
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
            <button
              onClick={() => { setMobileOpen(false); onOpenAuth(); }}
              className="rounded-md bg-foreground px-5 py-2 text-sm font-medium text-white"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
