import { Loader2 } from "lucide-react";

export default function Loading({ text = "Loading…", className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-24 ${className}`}
    >
      <div className="relative">
        {/* Subtle glow using primary variable, stripped of flashy gradients */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--primary)] opacity-10 blur-xl" />
        
        {/* Clean, system-aligned surface */}
        <div className="relative rounded-full border border-[var(--primary)]/10 bg-[var(--primary-light)] p-4 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}