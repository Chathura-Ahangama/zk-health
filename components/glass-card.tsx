"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: "indigo" | "emerald" | "none";
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const glowMap = {
  none: "",
  indigo: "shadow-[0_0_40px_rgba(99,102,241,0.08)]",
  emerald: "shadow-[0_0_40px_rgba(16,185,129,0.08)]",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { children, className, glow = "none", padding = "md", ...props },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl",
          "bg-white/[0.72] backdrop-blur-2xl",
          "border-[0.5px] border-white/[0.35]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)]",
          glowMap[glow],
          paddingMap[padding],
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
