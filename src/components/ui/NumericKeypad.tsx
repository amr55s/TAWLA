'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onConfirm?: () => void;
  showConfirm?: boolean;
  className?: string;
}

export function NumericKeypad({ 
  onKeyPress, 
  onBackspace, 
  onConfirm,
  showConfirm = false,
  className 
}: NumericKeypadProps) {
  const keys = showConfirm
    ? [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['backspace', '0', 'confirm'],
      ]
    : [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'backspace'],
      ];

  return (
    <div className={clsx('grid grid-cols-3 gap-3', className)}>
      {keys.flat().map((key, index) => {
        if (key === '') {
          return <div key={index} className="h-14" />;
        }

        if (key === 'backspace') {
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.94 }}
              onClick={onBackspace}
              className="h-14 rounded-xl bg-background-card flex items-center justify-center shadow-card transition-colors active:bg-border-light"
              aria-label="Backspace"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-heading"
              >
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </motion.button>
          );
        }

        if (key === 'confirm') {
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.94 }}
              onClick={onConfirm}
              className="h-14 rounded-xl bg-primary text-white flex items-center justify-center text-sm font-bold shadow-card transition-colors active:bg-primary/90"
              aria-label="Confirm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.button>
          );
        }

        return (
          <motion.button
            key={index}
            whileTap={{ scale: 0.94 }}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-xl bg-background-card flex items-center justify-center text-xl font-semibold text-text-heading shadow-card transition-colors active:bg-border-light"
          >
            {key}
          </motion.button>
        );
      })}
    </div>
  );
}
