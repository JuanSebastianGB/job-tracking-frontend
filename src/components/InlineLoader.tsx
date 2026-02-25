import React from "react";

interface InlineLoaderProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "danger" | "neutral";
  className?: string;
}

export function InlineLoader({ size = "sm", color = "primary", className = "" }: InlineLoaderProps) {
  const sizeMap = {
    sm: { width: 14, stroke: 2 },
    md: { width: 18, stroke: 2.5 },
    lg: { width: 22, stroke: 3 },
  };

  const colorMap = {
    primary: "text-white",
    danger: "text-white",
    neutral: "text-neutral-600",
  };

  const { width, stroke } = sizeMap[size];
  const cx = width / 2;
  const cy = width / 2;
  const r = (width - stroke * 2) / 2 - 2;

  return (
    <span className={`inline-flex items-center justify-center ${colorMap[color]} ${className}`}>
      <svg
        width={width}
        height={width}
        viewBox={`0 0 ${width} ${width}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray="18 10"
          strokeDashoffset="0"
          opacity="0.7"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r - 4}
          stroke="currentColor"
          strokeWidth={stroke / 2}
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    </span>
  );
}

interface ButtonLoaderProps {
  text: string;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
}

export function ButtonLoader({ text, loadingText, size = "md" }: ButtonLoaderProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <InlineLoader size={size} />
      <span>{loadingText || text}</span>
    </span>
  );
}

interface DotsLoaderProps {
  className?: string;
}

export function DotsLoader({ className = "" }: DotsLoaderProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
