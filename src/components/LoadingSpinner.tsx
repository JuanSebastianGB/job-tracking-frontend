import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  glass?: boolean;
}

export function LoadingSpinner({ size = "md", className = "", glass = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const strokeSizes = {
    sm: 2,
    md: 3,
    lg: 4,
  };

  return (
    <div className={`flex items-center justify-center ${glass ? 'bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3' : ''} ${className}`}>
      <svg
        className={`${sizeClasses[size]} animate-spin-slow`}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle
          className="spinner-ring"
          cx="25"
          cy="25"
          r="20"
          stroke="url(#spinner-gradient)"
          strokeWidth={strokeSizes[size]}
          strokeLinecap="round"
          strokeDasharray="90 40"
          strokeDashoffset="0"
        />
        <circle
          cx="25"
          cy="25"
          r="12"
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth={strokeSizes[size] / 2}
          opacity="0.4"
        />
      </svg>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.2s cubic-bezier(0.4, 0.15, 0.6, 0.85) infinite;
        }
        .spinner-ring {
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm font-medium text-neutral-600 animate-pulse">{message}</p>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-6 text-base font-semibold text-neutral-700">Loading applications...</p>
      <p className="mt-2 text-sm text-neutral-400">This will only take a moment</p>
    </div>
  );
}
