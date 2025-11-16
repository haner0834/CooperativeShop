"use client";

import { cn } from "./cn";
import type { HTMLMotionProps, Variants } from "framer-motion";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

export interface ChevronsHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface ChevronsProps extends HTMLMotionProps<"div"> {
  size?: number;
  duration?: number;
  isAnimated?: boolean;
  infinite?: boolean; // 是否循環動畫
  interval?: number; // 循環間隔（秒）
}

const AnimatedChevrons = forwardRef<ChevronsHandle, ChevronsProps>(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 24,
      duration = 1,
      isAnimated = true,
      infinite = true,
      interval = 0,
      ...props
    },
    ref
  ) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();
    const isControlled = useRef(false);

    useImperativeHandle(ref, () => {
      isControlled.current = true;
      return {
        startAnimation: () =>
          reduced ? controls.start("normal") : controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleEnter = useCallback(
      (e?: React.MouseEvent<HTMLDivElement>) => {
        if (!isAnimated || reduced) return;
        if (!isControlled.current) controls.start("animate");
        else onMouseEnter?.(e as any);
      },
      [controls, reduced, isAnimated, onMouseEnter]
    );

    const handleLeave = useCallback(
      (e?: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlled.current) {
          controls.start("normal");
        } else {
          onMouseLeave?.(e as any);
        }
      },
      [controls, onMouseLeave]
    );

    // 重複設定，用於循環與間隔
    const repeatConfig =
      infinite && !reduced
        ? {
            repeat: Infinity,
            repeatType: "loop" as const,
            repeatDelay: interval,
          }
        : {};

    const rightToLeft: Variants = {
      normal: { x: 0, opacity: 1 },
      animate: {
        x: [0, -4, 0],
        opacity: [1, 0.6, 1],
        transition: {
          duration: 0.9 * duration,
          ease: "easeInOut",
          delay: 0,
          ...repeatConfig,
        },
      },
    };

    const leftToRight: Variants = {
      normal: { x: 0, opacity: 1 },
      animate: {
        x: [0, 4, 0],
        opacity: [1, 0.6, 1],
        transition: {
          duration: 0.9 * duration,
          ease: "easeInOut",
          delay: 0.25,
          ...repeatConfig,
        },
      },
    };

    // 小群組脈動（跟 CloudUpload 的 groupPulse 類似）
    const groupPulse: Variants = {
      normal: { scale: 1 },
      animate: {
        scale: [1, 1.02, 1],
        transition: {
          duration: 0.6 * duration,
          ease: "easeInOut",
          ...repeatConfig,
        },
      },
    };

    return (
      <motion.div
        className={cn("inline-flex items-center justify-center", className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={controls}
          initial="normal"
        >
          <motion.g variants={groupPulse} initial="normal" animate="animate">
            <motion.path
              d="m20 17-5-5 5-5"
              variants={rightToLeft}
              stroke="currentColor"
            />
            <motion.path
              d="m4 17 5-5-5-5"
              variants={leftToRight}
              stroke="currentColor"
            />
          </motion.g>
        </motion.svg>
      </motion.div>
    );
  }
);

AnimatedChevrons.displayName = "AnimatedChevrons";
export { AnimatedChevrons };
