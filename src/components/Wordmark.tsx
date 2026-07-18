'use client';

/**
 * Wordmark — el logotipo de texto de la marca activa, con SU tipografía y
 * SUS tonos. Ej. CondoManager = "Condo" (oro) + "Manager" (verde) en
 * Fraunces; agente24siete = "agente"+"24"+"siete" donde SOLO "24" lleva
 * color (ocre), como su landing original. Toma la identidad del
 * BrandProvider; no impone nada.
 *
 * Si la marca no define `wordmark`, cae a `displayName` en un solo tono.
 *
 * Animaciones opcionales por parte: `spring-sweep` y `fade-slide` se
 * reproducen una sola vez al entrar en pantalla (whileInView + once).
 */

import { motion } from 'motion/react';
import { useBrand } from '../brand/BrandProvider';
import type { WordmarkTone, WordmarkAnimation } from '../brand/BrandProvider';
import {
  wordmarkVariants,
  wordmarkFadeSlideVariants,
} from './wordmarkAnimations';

const TONE_CLASS: Record<WordmarkTone, string> = {
  text: 'text-brand-text',
  primary: 'text-brand-primary',
  accent: 'text-brand-accent',
};

const TONOS_POR_DEFECTO: WordmarkTone[] = ['accent', 'primary', 'primary'];

function getAnimation(animation: WordmarkAnimation | undefined, index: number) {
  if (!animation || animation === 'none') return null;
  const anim = animation.split(',')[index]?.trim() || 'none';
  if (anim === 'spring-sweep') return 'spring-sweep';
  if (anim === 'fade-slide') return 'fade-slide';
  return null;
}

export function Wordmark({ className = '' }: { className?: string }) {
  const brand = useBrand();
  const wm = brand.wordmark;

  const parts = wm
    ? [wm.first, wm.second, wm.third].filter((parte): parte is string => parte !== undefined)
    : [brand.displayName];

  const tones = wm ? wm.tones ?? TONOS_POR_DEFECTO : ['primary'];
  const animations = wm?.animated ?? [];

  return (
    <span
      className={`font-brand-heading font-extrabold tracking-tight ${className}`}
      style={{ fontFamily: 'var(--brand-heading-font)' }}
    >
      {parts.map((parte, i) => {
        const tone = (tones[i] ?? 'primary') as WordmarkTone;
        const anim = getAnimation(animations[i], i);
        const baseClass = TONE_CLASS[tone];

        if (!anim) {
          return (
            <span key={i} className={baseClass}>
              {parte}
            </span>
          );
        }

        if (anim === 'spring-sweep') {
          return (
            <motion.span
              key={i}
              className={`relative inline-block ${baseClass}`}
              initial={{ opacity: 0, y: 20, backgroundPosition: '200% center' }}
              whileInView={{ opacity: 1, y: 0, backgroundPosition: '-200% center' }}
              viewport={{ once: true }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 18,
                mass: 0.8,
                backgroundPosition: {
                  duration: 1.2,
                  ease: 'easeInOut',
                },
              }}
              style={{
                background: 'linear-gradient(120deg, var(--brand-accent) 0%, var(--brand-accent) 40%, transparent 50%, var(--brand-accent) 60%, var(--brand-accent) 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {parte}
            </motion.span>
          );
        }

        if (anim === 'fade-slide') {
          return (
            <motion.span
              key={i}
              className={baseClass}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={wordmarkFadeSlideVariants}
            >
              {parte}
            </motion.span>
          );
        }

        return (
          <span key={i} className={baseClass}>
            {parte}
          </span>
        );
      })}
    </span>
  );
}
