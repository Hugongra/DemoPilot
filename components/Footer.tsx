import { Play, GitBranch } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2.5 text-sm font-bold tracking-tight">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
            <Play className="h-3 w-3 fill-white text-white" />
          </div>
          DemoPilot
          <span className="ml-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Open Source
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <a href="https://github.com/Hugongra/DemoPilot" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-foreground">
            <GitBranch className="h-3.5 w-3.5" /> GitHub
          </a>
          <a href="https://github.com/Hugongra/DemoPilot/issues" target="_blank" rel="noopener noreferrer"
            className="transition-colors hover:text-foreground">Issues</a>
          <a href="https://github.com/Hugongra/DemoPilot/discussions" target="_blank" rel="noopener noreferrer"
            className="transition-colors hover:text-foreground">Discussions</a>
          <a href="https://github.com/Hugongra/DemoPilot/blob/main/LICENSE" target="_blank" rel="noopener noreferrer"
            className="transition-colors hover:text-foreground">License</a>
        </div>

        <p className="text-sm text-muted-foreground">
          MIT License &middot; &copy; 2026 DemoPilot
        </p>
      </div>
    </footer>
  );
}
