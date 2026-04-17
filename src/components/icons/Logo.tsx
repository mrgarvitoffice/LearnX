import type { ImgHTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  animate?: boolean;
}

export function Logo({ size = 24, className, animate = true, ...props }: LogoProps) {
  return (
    <motion.div
      animate={animate ? {
        filter: [
          'drop-shadow(0 0 8px rgba(255,90,47,0.4))',
          'drop-shadow(0 0 20px rgba(255,90,47,0.7))',
          'drop-shadow(0 0 8px rgba(255,90,47,0.4))'
        ]
      } : {}}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("inline-block relative", className)}
    >
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110 opacity-50" />
      <Image
        src="/icons/icon-512x512.png"
        alt="LearnX Logo"
        width={size}
        height={size}
        className="mix-blend-screen contrast-125 brightness-110 relative z-10"
        priority 
        {...props}
      />
    </motion.div>
  );
}