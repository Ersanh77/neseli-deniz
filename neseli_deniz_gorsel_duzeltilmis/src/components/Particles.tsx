/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ParticlesProps {
  x: string;
  y: string;
  color: string;
}

export default function Particles({ x, y, color }: ParticlesProps) {
  const particles: Particle[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `${i}-${Math.random()}`,
    x: (Math.random() - 0.5) * 150,
    y: (Math.random() - 0.5) * 150,
    color,
    size: Math.random() * 5 + 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            left: x,
            top: y,
            x: "-50%",
            y: "-50%",
            opacity: 1, 
            scale: 1 
          }}
          animate={{ 
            x: p.x, 
            y: p.y, 
            opacity: 0, 
            scale: 0,
            rotate: Math.random() * 360
          }}
          transition={{ 
            duration: 0.8, 
            ease: "circOut" 
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: p.color,
            boxShadow: `0 0 15px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
