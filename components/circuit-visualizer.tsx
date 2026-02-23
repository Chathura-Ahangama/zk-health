"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./glass-card";

interface CircuitVisualizerProps {
  progress: number;
}

const MATH_SYMBOLS = ["∑", "∫", "∂", "∇", "π", "σ", "λ", "Ω", "≡", "∀"];
const NODE_LABELS = ["H(x)", "σ(w)", "π(k)", "∑ᵢ", "F(p)", "∂ₙ", "R1CS", "QAP"];
const RADIUS = 130;
const CENTER = 180;
const VIEWBOX = CENTER * 2;

export function CircuitVisualizer({ progress }: CircuitVisualizerProps) {
  const nodes = useMemo(
    () =>
      NODE_LABELS.map((label, i) => {
        const angle = (i / NODE_LABELS.length) * Math.PI * 2 - Math.PI / 2;
        return {
          id: i,
          angle,
          x: CENTER + Math.cos(angle) * RADIUS,
          y: CENTER + Math.sin(angle) * RADIUS,
          label,
          delay: i * 0.12,
        };
      }),
    [],
  );

  const circumference = 2 * Math.PI * (RADIUS + 30);
  const strokeOffset = circumference * (1 - progress / 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-2xl mx-auto"
    >
      <GlassCard glow="indigo" padding="md" className="sm:p-8 overflow-hidden">
        <div className="relative flex flex-col items-center">
          {/* Floating math symbols */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
            {MATH_SYMBOLS.map((sym, i) => (
              <motion.span
                key={i}
                className="absolute text-indigo-200/40 font-mono text-lg select-none"
                style={{
                  left: `${10 + ((i * 9) % 80)}%`,
                  top: `${5 + ((i * 13) % 85)}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              >
                {sym}
              </motion.span>
            ))}
          </div>

          {/* Main SVG — responsive size */}
          <div className="relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]">
            <svg
              viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
              className="w-full h-full"
              fill="none"
            >
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS + 30}
                stroke="#e0e7ff"
                strokeWidth="3"
                opacity="0.5"
              />
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS + 30}
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                stroke="#c7d2fe"
                strokeWidth="1"
                strokeDasharray="6 6"
                opacity="0.4"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              />
              <motion.circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS * 0.6}
                stroke="#ddd6fe"
                strokeWidth="0.5"
                strokeDasharray="4 8"
                opacity="0.3"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              />

              {nodes.map((node) => (
                <motion.line
                  key={`line-${node.id}`}
                  x1={CENTER}
                  y1={CENTER}
                  x2={node.x}
                  y2={node.y}
                  stroke="#c7d2fe"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                    strokeDashoffset: [0, -16],
                  }}
                  transition={{
                    opacity: {
                      duration: 2,
                      repeat: Infinity,
                      delay: node.delay,
                    },
                    strokeDashoffset: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                      delay: node.delay,
                    },
                  }}
                />
              ))}

              {nodes.map((node, i) => {
                const next = nodes[(i + 1) % nodes.length];
                return (
                  <motion.line
                    key={`cross-${node.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="#e0e7ff"
                    strokeWidth="0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: node.delay + 0.5,
                    }}
                  />
                );
              })}

              {nodes.map((node) => (
                <motion.circle
                  key={`particle-${node.id}`}
                  r="2.5"
                  fill="#6366f1"
                  opacity="0.7"
                  initial={{ cx: CENTER, cy: CENTER }}
                  animate={{
                    cx: [CENTER, node.x, CENTER],
                    cy: [CENTER, node.y, CENTER],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: node.delay,
                    ease: "easeInOut",
                  }}
                />
              ))}

              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <radialGradient id="centerGlow">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={CENTER} cy={CENTER} r="50" fill="url(#centerGlow)" />
            </svg>

            {/* Node labels */}
            {nodes.map((node) => (
              <motion.div
                key={`label-${node.id}`}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${(node.x / VIEWBOX) * 100}%`,
                  top: `${(node.y / VIEWBOX) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: [0.85, 1, 0.85] }}
                transition={{
                  opacity: { delay: node.delay, duration: 0.4 },
                  scale: {
                    delay: node.delay + 0.4,
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <div className="flex items-center justify-center min-w-[36px] sm:min-w-[44px] h-[24px] sm:h-[28px] px-1.5 sm:px-2 rounded-lg bg-white/90 backdrop-blur-md border-[0.5px] border-indigo-200/50 shadow-sm">
                  <span className="text-[8px] sm:text-[10px] font-mono font-semibold text-indigo-600 whitespace-nowrap">
                    {node.label}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Center ZK badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-xl shadow-indigo-400/30"
                animate={{
                  scale: [1, 1.06, 1],
                  boxShadow: [
                    "0 20px 40px rgba(99,102,241,0.25)",
                    "0 20px 60px rgba(99,102,241,0.4)",
                    "0 20px 40px rgba(99,102,241,0.25)",
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <span className="text-white font-bold text-base sm:text-lg tracking-tight">
                  ZK
                </span>
                <span className="text-indigo-200 text-[8px] sm:text-[9px] font-medium mt-0.5">
                  PROVING
                </span>
              </motion.div>
            </div>
          </div>

          {/* Progress info */}
          <div className="mt-4 sm:mt-6 text-center space-y-2">
            <div className="w-48 sm:w-64 mx-auto h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Computing proof...{" "}
                <span className="font-mono text-indigo-600">
                  {Math.round(progress)}%
                </span>
              </p>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
              R1CS → QAP → Groth16
            </p>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
