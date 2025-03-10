'use client';

import { cn } from "@/lib/utils";

interface WaveLoaderProps {
  className?: string;
  color?: string;
  barCount?: number;
  height?: number;
  width?: number;
  gap?: number;
}

export function WaveLoader({ 
  className, 
  color = "currentColor", 
  barCount = 5,
  height = 12,
  width = 2,
  gap = 2
}: WaveLoaderProps) {
  return (
    <div 
      className={cn("flex items-center", className)}
      style={{ gap: `${gap}px` }}
    >
      {[...Array(barCount)].map((_, i) => (
        <div
          key={i}
          className="animate-wave"
          style={{ 
            height: `${height}px`,
            width: `${width}px`,
            backgroundColor: color,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
} 