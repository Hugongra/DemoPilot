import { Play } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5 text-sm font-bold tracking-tight">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Play className="h-3 w-3 fill-white text-white" />
          </div>
          DemoPilot
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
          <a href="#" className="transition-colors hover:text-foreground">Terms</a>
          <a href="#" className="transition-colors hover:text-foreground">Docs</a>
          <a href="#" className="transition-colors hover:text-foreground">Twitter</a>
        </div>

        <p className="text-sm text-muted-foreground">
          &copy; 2026 DemoPilot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
