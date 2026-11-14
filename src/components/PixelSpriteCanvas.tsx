import { useEffect, useRef } from 'react';
import {
  drawChestSprite,
  drawDoorSprite,
  drawExitSprite,
  drawMonsterSprite,
  drawPlayerSprite,
} from '../game/sprites';
import { HeroId, MonsterKind, StageDefinition } from '../game/types';

export type SpritePreviewKind =
  | 'player'
  | 'chest'
  | 'door'
  | 'exit'
  | MonsterKind;

interface PixelSpriteCanvasProps {
  kind: SpritePreviewKind;
  heroId?: HeroId;
  size?: number;
  theme?: StageDefinition['theme'];
  hurtFlash?: boolean;
  animate?: boolean;
  className?: string;
}

export function PixelSpriteCanvas({
  kind,
  heroId = 'explorer',
  size = 80,
  theme = 'forest',
  hurtFlash = false,
  animate = true,
  className = '',
}: PixelSpriteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const render = (time: number) => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, size, size);

      if (kind === 'player') {
        drawPlayerSprite(ctx, 0, 0, size, 'down', false, time, heroId, hurtFlash);
      } else if (kind === 'chest') {
        drawChestSprite(ctx, 0, 0, size, false, time);
      } else if (kind === 'door') {
        drawDoorSprite(ctx, 0, 0, size, theme, time);
      } else if (kind === 'exit') {
        drawExitSprite(ctx, 0, 0, size, time);
      } else {
        drawMonsterSprite(ctx, kind, 0, 0, size, time, kind === 'boss', hurtFlash);
      }

      if (animate) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [kind, heroId, size, theme, hurtFlash, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`pixel-canvas block shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
