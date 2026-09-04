/**
 * Placeholder mark — swap for the real logo/wordmark assets when ready.
 */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[28%] bg-brand-green font-black text-brand-dark ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      p
    </div>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={28} />
      <span className="text-xl font-black tracking-tight">pace</span>
    </div>
  );
}
