import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
  secondary: "bg-[var(--primary-light)] text-[var(--primary)] hover:opacity-85",
  ghost: "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--primary)]",
};

export default function Button({
  variant = "primary",
  loading,
  disabled,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${variants[variant]} ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}