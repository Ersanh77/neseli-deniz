/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useRef } from 'react';

export const SFX = {
  MATCH: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  SPECIAL_MATCH: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  BOOSTER_ACTIVATE: 'https://assets.mixkit.co/active_storage/sfx/1113/1113-preview.mp3',
  WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  LOSE: 'https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export const BG_MUSIC = {
  MENU: 'https://assets.mixkit.co/music/preview/mixkit-underwater-ocean-68.mp3',
  LEVELS: [
    'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-sun-and-ocean-585.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-bubbles-of-joy-603.mp3',
  ],
};

export function useSound(isMuted: boolean) {
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((url: string) => {
    if (isMuted) return;

    if (!audioCache.current[url]) {
      audioCache.current[url] = new Audio(url);
    }

    const audio = audioCache.current[url];
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Ignore autoplay errors for SFX
    });
  }, [isMuted]);

  return { playSound };
}
