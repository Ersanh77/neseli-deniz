/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export default function BoardAtmosphere() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none z-0">
      {/* Water Flow Effect (Subtle shifting gradients) */}
      <motion.div 
        className="absolute inset-0 opacity-10 bg-gradient-to-tr from-blue-400 via-transparent to-emerald-400"
        animate={{ 
          x: [-30, 30, -30],
          y: [-20, 20, -20],
          scale: [1, 1.2, 1],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      />
      
      {/* Secondary caustic-like light layer */}
      <motion.div 
        className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.05, 0.15, 0.05],
          x: [10, -10, 10]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Seaweed - Left Side */}
      <div className="absolute bottom-0 left-4 flex gap-4 items-end opacity-40">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={`weed-l-${i}`}
            className="w-4 bg-emerald-600/40 rounded-t-full origin-bottom"
            style={{ height: `${20 + i * 15}%` }}
            animate={{ rotate: [-2, 5, -2] }}
            transition={{ 
              duration: 3 + i, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      {/* Seaweed - Right Side */}
      <div className="absolute bottom-0 right-4 flex gap-4 items-end opacity-40">
        {[1, 2].map((i) => (
          <motion.div
            key={`weed-r-${i}`}
            className="w-3 bg-blue-600/30 rounded-t-full origin-bottom"
            style={{ height: `${30 + i * 10}%` }}
            animate={{ rotate: [3, -4, 3] }}
            transition={{ 
              duration: 4 + i, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.3
            }}
          />
        ))}
      </div>

      {/* Passing Fish Silhouettes */}
      {[1, 2].map((i) => (
        <motion.div
          key={`passing-fish-${i}`}
          className="absolute text-white/5 text-xl select-none"
          initial={{ x: i === 1 ? -50 : 650, y: 100 + i * 150 }}
          animate={{ 
            x: i === 1 ? 650 : -50,
            y: [null, 100 + i * 150 + 20, 100 + i * 150 - 20, 100 + i * 150]
          }}
          transition={{ 
            x: { duration: 20 + i * 10, repeat: Infinity, ease: "linear", delay: i * 5 },
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {i === 1 ? '🐟' : '🐠'}
        </motion.div>
      ))}

      {/* Ambient Bubbles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`ambient-bubble-${i}`}
          className="absolute rounded-full bg-white/20 border border-white/30"
          style={{ 
            width: `${Math.random() * 8 + 4}px`, 
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            bottom: '-10px'
          }}
          animate={{ 
            y: -600,
            x: [0, 15, -15, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: 8 + Math.random() * 5, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
}
