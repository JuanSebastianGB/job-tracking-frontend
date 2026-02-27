import React from "react";

// Design tokens for consistent glassmorphism
const glassStyles = {
  // Glass effect enabled - frosted glass appearance
  glass: {
    light: "bg-white/70 backdrop-blur-xl border border-white/20",
    dark: "dark:bg-black/30 dark:backdrop-blur-xl dark:border-gray-700/50",
  },
  // Glass effect disabled - solid appearance
  solid: {
    light: "bg-white border border-neutral-200",
    dark: "dark:bg-gray-900 dark:border-gray-700",
  },
} as const;

// Shadow tokens
const shadows = {
  card: "shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)]",
  elevated: "shadow-[0_8px_30px_-3px_rgba(0,0,0,0.1)]",
  hover: "shadow-[0_20px_40px_-4px_rgba(0,0,0,0.12)]",
} as const;

const transitions = {
  default: "transition-all duration-300 ease-out",
} as const;

export interface GlassCardProps {
  /** Enable glassmorphism effect with backdrop blur */
  glass?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
  /** Enable hover effects */
  hover?: boolean;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export function GlassCard({
  glass = false,
  className = "",
  children,
  hover = false,
  padding = "md",
}: GlassCardProps) {
  const glassClasses = glass
    ? `${glassStyles.glass.light} ${glassStyles.glass.dark}`
    : `${glassStyles.solid.light} ${glassStyles.solid.dark}`;

  const hoverClasses = hover
    ? `hover:${shadows.hover} hover:-translate-y-1 ${shadows.card} ${transitions.default}`
    : shadows.card;

  const paddingClass = paddingMap[padding];

  return (
    <div
      className={`
        rounded-2xl
        ${glassClasses}
        ${hoverClasses}
        ${paddingClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Text contrast utility - ensures AA standard in both modes
export const textContrast = {
  primary: "text-neutral-900 dark:text-white",
  secondary: "text-neutral-600 dark:text-neutral-300",
  muted: "text-neutral-500 dark:text-neutral-400",
} as const;

export default GlassCard;
