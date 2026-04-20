'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onClick={onClick}
      className={cn(
        'glass rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5',
        hover && 'cursor-pointer glass-hover',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
