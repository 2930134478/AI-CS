"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = "" }: FadeInProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={
        reduceMotion
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 12, filter: "blur(2px)" }
      }
      whileInView={
        reduceMotion
          ? { opacity: 1, y: 0 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.42,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}

interface FadeInStaggerProps {
  children: ReactNode;
  className?: string;
}

export function FadeInStagger({ children, className = "" }: FadeInStaggerProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: reduceMotion ? { opacity: 1 } : { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.06,
            delayChildren: reduceMotion ? 0 : 0.03,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FadeInItemProps {
  children: ReactNode;
  className?: string;
}

export function FadeInItem({ children, className = "" }: FadeInItemProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10, filter: "blur(2px)" },
        visible: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  );
}
