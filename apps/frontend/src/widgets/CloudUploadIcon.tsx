function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

import type { HTMLMotionProps, Variants } from "framer-motion";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface CloudUploadHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface CloudUploadProps extends HTMLMotionProps<"div"> {
  size?: number;
  duration?: number;
  infinite?: boolean; // 是否循環
  interval?: number; // 每次動畫之間的間隔秒數
}

const AnimatedCloudUploadIcon = forwardRef<CloudUploadHandle, CloudUploadProps>(
  (
    {
      className,
      size = 28,
      duration = 1,
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

    // 重複設定：控制是否無限循環與間隔
    const repeatConfig = infinite
      ? {
          repeat: Infinity,
          repeatType: "reverse" as const,
          repeatDelay: interval,
        }
      : {};

    const cloudVariants: Variants = {
      normal: { strokeDashoffset: 0, opacity: 1 },
      animate: {
        strokeDashoffset: [100, 0],
        opacity: [0.4, 1],
        transition: {
          duration: 0.7 * duration,
          ease: "easeInOut",
          ...repeatConfig,
        },
      },
    };

    const shaftVariants: Variants = {
      normal: { strokeDashoffset: 0, opacity: 1 },
      animate: {
        strokeDashoffset: [30, 0],
        opacity: [0.5, 1],
        transition: {
          duration: 0.55 * duration,
          ease: "easeInOut",
          delay: 0.05,
          ...repeatConfig,
        },
      },
    };

    const headVariants: Variants = {
      normal: { y: 0, scale: 1, opacity: 1 },
      animate: {
        y: [2, -2, 0],
        scale: [1, 1.06, 1],
        opacity: [0.7, 1],
        transition: {
          duration: 0.6 * duration,
          ease: "easeInOut",
          delay: 0.1,
          ...repeatConfig,
        },
      },
    };

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
          className="lucide lucide-cloud-upload-icon lucide-cloud-upload"
        >
          <motion.g variants={groupPulse} initial="normal" animate="animate">
            <motion.path
              d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
              strokeDasharray="100"
              strokeDashoffset="100"
              variants={cloudVariants}
              initial="normal"
              animate="animate"
            />
            <motion.path
              d="M12 13v8"
              strokeDasharray="30"
              strokeDashoffset="30"
              variants={shaftVariants}
              initial="normal"
              animate="animate"
            />
            <motion.path
              d="m8 17 4-4 4 4"
              variants={headVariants}
              initial="normal"
              animate="animate"
            />
          </motion.g>
        </motion.svg>
      </motion.div>
    );
  }
);

AnimatedCloudUploadIcon.displayName = "AnimatedCloudUploadIcon";
export { AnimatedCloudUploadIcon };
