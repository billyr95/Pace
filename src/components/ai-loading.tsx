import { LogoMark } from "@/components/logo";

export function AiLoading({ label, size = 22, className = "" }: { label?: string; size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} className="animate-pace-loading" />
      {label && <span className="text-xs text-secondary/50">{label}</span>}
    </div>
  );
}
