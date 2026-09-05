export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/pace-logo.svg"
      alt="pace"
      className={className}
      style={{ height: size, width: "auto", aspectRatio: "99.64 / 117.77" }}
    />
  );
}

export function LogoWordmark({ height = 28, className = "" }: { height?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={height} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/pace-title.svg"
        alt="pace"
        style={{ height: height * 0.72, width: "auto", aspectRatio: "279.57 / 93.28" }}
      />
    </div>
  );
}
