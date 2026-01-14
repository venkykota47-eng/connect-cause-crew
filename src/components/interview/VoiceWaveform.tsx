import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  isActive: boolean;
  audioLevel?: number;
  className?: string;
  variant?: "bars" | "circle" | "pulse";
}

export const VoiceWaveform = ({
  isActive,
  audioLevel = 0,
  className,
  variant = "bars",
}: VoiceWaveformProps) => {
  const bars = 5;

  if (variant === "circle") {
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <div
          className={cn(
            "absolute rounded-full bg-primary/20 transition-all duration-150",
            isActive ? "animate-ping" : ""
          )}
          style={{
            width: `${48 + audioLevel * 20}px`,
            height: `${48 + audioLevel * 20}px`,
          }}
        />
        <div
          className={cn(
            "absolute rounded-full bg-primary/30 transition-all duration-100"
          )}
          style={{
            width: `${40 + audioLevel * 15}px`,
            height: `${40 + audioLevel * 15}px`,
          }}
        />
        <div
          className={cn(
            "relative rounded-full flex items-center justify-center",
            isActive ? "bg-destructive" : "bg-primary",
            "w-10 h-10 transition-colors"
          )}
        />
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              isActive ? "bg-destructive" : "bg-muted-foreground/30"
            )}
            style={{
              transform: isActive ? `scale(${1 + audioLevel * 0.5})` : "scale(1)",
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default: bars variant
  return (
    <div className={cn("flex items-center gap-0.5 h-6", className)}>
      {Array.from({ length: bars }).map((_, i) => {
        const centerDistance = Math.abs(i - Math.floor(bars / 2));
        const baseHeight = isActive ? 0.4 + (1 - centerDistance / bars) * 0.6 : 0.3;
        const dynamicHeight = isActive ? baseHeight + audioLevel * (0.6 - centerDistance * 0.1) : baseHeight;
        
        return (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-75",
              isActive ? "bg-destructive" : "bg-muted-foreground/40"
            )}
            style={{
              height: `${Math.min(dynamicHeight, 1) * 100}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        );
      })}
    </div>
  );
};
