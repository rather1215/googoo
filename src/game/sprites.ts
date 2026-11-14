import { ChestEntity, Direction, DoorEntity, FloatingText, HeroId, MonsterEntity, MonsterKind, Particle, StageDefinition } from './types';

// Draw a 16x16 pixel matrix onto a canvas context at (x, y) with pixel size s
function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  palette: Record<string, string>,
  x: number,
  y: number,
  size: number,
  flipX = false
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const px = size / cols;
  const py = size / rows;

  for (let r = 0; r < rows; r++) {
    const row = grid[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const drawCol = flipX ? cols - 1 - c : c;
      ctx.fillRect(
        Math.floor(x + drawCol * px),
        Math.floor(y + r * py),
        Math.ceil(px),
        Math.ceil(py)
      );
    }
  }
}

const HERO_PALETTES: Record<HeroId, Record<string, string>> = {
  explorer: {
    K: '#241914',
    H: '#E04F33', // red explorer cap
    h: '#FF785A',
    S: '#FFD5B5',
    s: '#F2B48D',
    E: '#1E1B18',
    B: '#3B82F6', // blue tunic
    b: '#2563EB',
    G: '#FBBF24', // gold buckle
    P: '#78350F', // boots/belt
    W: '#FFFFFF',
  },
  knight: {
    K: '#1E293B',
    H: '#CBD5E1', // silver helmet
    h: '#F8FAFC',
    S: '#FFD5B5',
    s: '#F2B48D',
    E: '#1E1B18',
    B: '#64748B', // steel armor
    b: '#475569',
    G: '#F59E0B', // gold crest/trim
    P: '#B45309', // leather boots
    W: '#FFFFFF',
  },
  mage: {
    K: '#1E1B4B',
    H: '#6D28D9', // wizard hat
    h: '#A78BFA',
    S: '#FFE0C2',
    s: '#F2B48D',
    E: '#1E1B18',
    B: '#4F46E5', // indigo robe
    b: '#3730A3',
    G: '#FDE047', // star gold trim
    P: '#312E81',
    W: '#FFFFFF',
  },
  cat_ranger: {
    K: '#1B2E20',
    H: '#F59E0B', // amber cat hood
    h: '#FDE047',
    S: '#FFE4C8',
    s: '#F2B48D',
    E: '#14532D',
    B: '#16A34A', // forest green cape
    b: '#15803D',
    G: '#FEF08A',
    P: '#78350F',
    W: '#FFFFFF',
  },
};

const PLAYER_DOWN_0 = [
  '....KKKKKK......',
  '...KHHHHhhK.....',
  '..KHHHHHHHHK....',
  '..KGGGGGGGGK....',
  '..KSSSSSSSSK....',
  '..KSESSSSESSK...',
  '..KSSSSSSSSK....',
  '...KBBBBBBK.....',
  '..KBBGGGGBBK....',
  '..KSBBBBBBSSK...',
  '..K.KPPPPK.K....',
  '....KBBBBK......',
  '....KbbKbbK.....',
  '....KPPKPPK.....',
  '....KKK.KKK.....',
  '................',
];

const PLAYER_DOWN_1 = [
  '................',
  '....KKKKKK......',
  '...KHHHHhhK.....',
  '..KHHHHHHHHK....',
  '..KGGGGGGGGK....',
  '..KSSSSSSSSK....',
  '..KSESSSSESSK...',
  '..KSSSSSSSSK....',
  '...KBBBBBBK.....',
  '..KBBGGGGBBK....',
  '..KSBBBBBBSSK...',
  '....KPPPPK......',
  '...KbbK.KbbK....',
  '...KPPK.KPPK....',
  '...KKK...KKK....',
  '................',
];

const PLAYER_UP_0 = [
  '....KKKKKK......',
  '...KHHHHhhK.....',
  '..KHHHHHHHHK....',
  '..KHHHHHHHHK....',
  '..KPPPPPPPPK....',
  '..KPPPPPPPPK....',
  '...KGGGGGGK.....',
  '...KBBBBBBK.....',
  '..KBBPPPPBBK....',
  '..KSBBBBBBSSK...',
  '....KPPPPK......',
  '....KBBBBK......',
  '....KbbKbbK.....',
  '....KPPKPPK.....',
  '....KKK.KKK.....',
  '................',
];

const PLAYER_SIDE_0 = [
  '....KKKKKK......',
  '...KHHHHhhK.....',
  '..KHHHHHHHHK....',
  '..KGGGGGGGGK....',
  '...KSSSSSSSK....',
  '...KSSSSSESK....',
  '...KSSSSSSSK....',
  '...KPPPPBBK.....',
  '..KPPKBBGBBK....',
  '..KPPKBBBBSSK...',
  '....KPPPPK......',
  '....KBBBBK......',
  '....KbbKbbK.....',
  '....KPPKPPK.....',
  '....KKK.KKK.....',
  '................',
];

const SLIME_GRID = [
  '................',
  '................',
  '......KKKK......',
  '....KKLLLLKK....',
  '...KLLHHHHLLK...',
  '..KLLHWWWWLLLK..',
  '..KLLLLLLLLLLK..',
  '.KLLLEELLLEELLK.',
  '.KLLLEELLLEELLK.',
  '.KLLLLPPPPPLLLK.',
  '.KDDDDDDDDDDDDK.',
  '..KDDDDDDDDDDK..',
  '...KKKKKKKKKK...',
  '................',
  '................',
  '................',
];

const BAT_GRID = [
  '................',
  '.KK..........KK.',
  'KWWK..KKKK..KWWK',
  'KWWWKBBBBBBKWWWK',
  'KWWWWBBBBBBWWWWK',
  '.KWWKBBEEBBKWWK.',
  '..KKKBBEEBBKKK..',
  '....KBBBBBBK....',
  '....KBWBBWBK....',
  '.....KBBBBK.....',
  '......K..K......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const WIZARD_GRID = [
  '......KKKK......',
  '.....KPPPPK.....',
  '....KPPGGPPK....',
  '...KPPPPPPPPK...',
  '..KKGGGGGGGGKK..',
  '..KSSSSSSSSSSK..',
  '...KSEESSESK....',
  '...KSSSSSSSK....',
  '..KPPPPPPPPPPK..',
  '.KPPGPPPPPPGPK..',
  '.KPPKPPPPPPKPK..',
  '..KK.KPPPPK.KK..',
  '.....KPPPPK.....',
  '....KPP..PPK....',
  '....KKK..KKK....',
  '................',
];

const BOSS_GRID = [
  '.....KKGGKK.....',
  '....KPPPPPPK....',
  '...KPPGGGGPPK...',
  '..KPPPPPPPPPPK..',
  '.KKGGGGGGGGGGKK.',
  '..KRRRRRRRRRRK..',
  '..KRREERRREERRK.',
  '..KRRRRWWWRRRRK.',
  '.KPPPPGGGGPPPPK.',
  'KPPGGPPPPPPGGPPK',
  'KPPKPPPPPPPPKPPK',
  '.KK.KPPPPPPK.KK.',
  '....KPPGGPPK....',
  '...KPPP..PPPK...',
  '...KKKK..KKKK...',
  '................',
];

const CAT_DOWN_0 = [
  '..KK........KK..',
  '.KHHK.KKKK.KhhK.',
  '.KHHHHHHHHHHHHK.',
  '..KGGGGGGGGGGK..',
  '..KSSSSSSSSSSK..',
  '..KSESSSSSESSK..',
  '..KSSSSSSSSSSK..',
  '...KBBBBBBBBK...',
  '..KBBBGGGGBBBK..',
  '..KSBBBBBBBBSSK.',
  '....KPPPPPPK....',
  '....KBBBBBBK....',
  '....KbbKKbbK....',
  '....KPPKKPPK....',
  '....KKK..KKK....',
  '................',
];

const MAGE_DOWN_0 = [
  '.....KKKKKK.....',
  '....KHHHHhhK....',
  '...KHHHHHHHHK...',
  '.KKGGGGGGGGGGKK.',
  '..KSSSSSSSSSSK..',
  '..KSESSSSSESSK..',
  '..KSSSSSSSSSSK..',
  '...KBBBBBBBBK...',
  '..KBBBGGGGBBBK..',
  '..KSBBBBBBBBSSK.',
  '....KPPPPPPK....',
  '....KBBBBBBK....',
  '....KbbKKbbK....',
  '....KPPKKPPK....',
  '....KKK..KKK....',
  '................',
];

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  facing: Direction,
  isMoving: boolean,
  time: number,
  heroId: HeroId = 'explorer',
  hurtFlash = false
) {
  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.88, size * 0.28, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  const walkFrame = isMoving && Math.floor(time / 120) % 2 === 1;
  const bobY = isMoving ? (walkFrame ? -2 : 0) : Math.sin(time / 280) * 1.5;

  let grid = PLAYER_DOWN_0;
  let flipX = false;

  if (facing === 'down') {
    if (heroId === 'cat_ranger' && !walkFrame) grid = CAT_DOWN_0;
    else if (heroId === 'mage' && !walkFrame) grid = MAGE_DOWN_0;
    else grid = walkFrame ? PLAYER_DOWN_1 : PLAYER_DOWN_0;
  } else if (facing === 'up') {
    grid = PLAYER_UP_0;
  } else if (facing === 'right') {
    grid = PLAYER_SIDE_0;
    flipX = false;
  } else {
    grid = PLAYER_SIDE_0;
    flipX = true;
  }

  let palette = HERO_PALETTES[heroId];
  if (hurtFlash) {
    const strobeWhite = Math.floor(time / 55) % 2 === 0;
    const flashPalette: Record<string, string> = {};
    for (const key of Object.keys(palette)) {
      flashPalette[key] = key === 'K' ? '#7F1D1D' : strobeWhite ? '#FFFFFF' : '#FCA5A5';
    }
    palette = flashPalette;
  }

  drawPixelGrid(ctx, grid, palette, x, y + bobY, size, flipX);
}

export function drawMonsterSprite(
  ctx: CanvasRenderingContext2D,
  kind: MonsterKind,
  x: number,
  y: number,
  size: number,
  time: number,
  isBoss = false,
  hurtFlash = false
) {
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + size * 0.88, size * (isBoss ? 0.36 : 0.28), size * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();

  const bounce = Math.sin(time / (isBoss ? 220 : 260)) * (isBoss ? 3 : 2);

  let grid = SLIME_GRID;
  let palette: Record<string, string> = {};

  if (kind === 'green_slime' || kind === 'slime') {
    grid = SLIME_GRID;
    palette = {
      K: '#14452F',
      L: '#4ADE80',
      H: '#86EFAC',
      D: '#16A34A',
      E: '#1E1B18',
      P: '#FB7185',
      W: '#FFFFFF',
    };
  } else if (kind === 'blue_slime') {
    grid = SLIME_GRID;
    palette = {
      K: '#164E63',
      L: '#38BDF8',
      H: '#7DD3FC',
      D: '#0284C7',
      E: '#1E1B18',
      P: '#F472B6',
      W: '#FFFFFF',
    };
  } else if (kind === 'bat') {
    grid = BAT_GRID;
    palette = {
      K: '#2E1065',
      W: '#A78BFA',
      B: '#7C3AED',
      E: '#FDE047',
    };
  } else if (kind === 'wizard') {
    grid = WIZARD_GRID;
    palette = {
      K: '#1E1B4B',
      P: '#4338CA',
      G: '#FBBF24',
      S: '#FDE68A',
      E: '#EF4444',
    };
  } else if (kind === 'boss') {
    grid = BOSS_GRID;
    palette = {
      K: '#1E1035',
      P: '#6D28D9',
      G: '#F59E0B',
      R: '#312E81',
      E: '#38BDF8',
      W: '#FFFFFF',
    };
  }

  if (hurtFlash) {
    // Strobe bright white and crimson when struck
    const strobeWhite = Math.floor(time / 55) % 2 === 0;
    const flashPalette: Record<string, string> = {};
    for (const key of Object.keys(palette)) {
      flashPalette[key] = key === 'K' ? '#7F1D1D' : strobeWhite ? '#FFFFFF' : '#F87171';
    }
    palette = flashPalette;
  }

  // Boss aura ring
  if (isBoss) {
    ctx.save();
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.45 + Math.sin(time / 200) * 0.25})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2 + bounce, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawPixelGrid(ctx, grid, palette, x, y + bounce, size, false);
}

export function drawChestSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  opened: boolean,
  time: number
) {
  const pad = size * 0.14;
  const w = size - pad * 2;
  const h = size * 0.62;
  const cx = x + pad;
  const cy = y + size * 0.24;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(cx + 2, cy + h - 2, w - 4, 6);

  // Dark outline
  ctx.fillStyle = '#2A180D';
  ctx.fillRect(cx - 2, cy - 2, w + 4, h + 4);

  if (opened) {
    // Open chest interior
    ctx.fillStyle = '#451A03';
    ctx.fillRect(cx, cy, w, h * 0.45);
    ctx.fillStyle = '#92400E';
    ctx.fillRect(cx, cy + h * 0.45, w, h * 0.55);
    // Gold rim
    ctx.fillStyle = '#D97706';
    ctx.fillRect(cx, cy + h * 0.4, w, 4);
  } else {
    // Closed chest lid + body
    ctx.fillStyle = '#B45309';
    ctx.fillRect(cx, cy, w, h * 0.42);
    ctx.fillStyle = '#92400E';
    ctx.fillRect(cx, cy + h * 0.42, w, h * 0.58);
    // Gold bands
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(cx + 3, cy, 4, h);
    ctx.fillRect(cx + w - 7, cy, 4, h);
    ctx.fillRect(cx, cy + h * 0.38, w, 4);
    // Lock clasp
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(cx + w / 2 - 4, cy + h * 0.34, 8, 9);

    // Twinkle sparkle
    if (Math.floor(time / 350) % 2 === 0) {
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(cx + w - 4, cy - 6, 4, 4);
    }
  }
}

export function drawDoorSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: StageDefinition['theme'],
  time: number
) {
  // Base threshold floor under door
  ctx.fillStyle = theme === 'forest' ? '#8B6B4A' : theme === 'cave' ? '#3B4258' : '#584E68';
  ctx.fillRect(x, y, size, size);

  // Heavy door frame
  ctx.fillStyle = '#2A1E17';
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

  if (theme === 'forest') {
    ctx.fillStyle = '#9A5B25';
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    ctx.fillStyle = '#7C4518';
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
  } else if (theme === 'cave') {
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
  } else {
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    ctx.fillStyle = '#5B21B6';
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
  }

  // Glowing golden padlock + "?" rune
  const glow = 0.75 + Math.sin(time / 240) * 0.25;
  ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
  const lx = x + size * 0.34;
  const ly = y + size * 0.36;
  ctx.fillRect(lx + 4, ly - 6, size * 0.2, 6);
  ctx.fillRect(lx, ly, size * 0.32, size * 0.3);
  ctx.fillStyle = '#2A1E17';
  ctx.fillRect(lx + size * 0.12, ly + size * 0.08, 4, 7);
}

export function drawExitSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const pulse = Math.sin(time / 220) * 3;

  // Outer magic portal ring
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.4 + pulse * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.31 + pulse * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#A7F3D0';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting stars
  for (let i = 0; i < 3; i++) {
    const angle = time / 450 + (i * Math.PI * 2) / 3;
    const sx = cx + Math.cos(angle) * (size * 0.36);
    const sy = cy + Math.sin(angle) * (size * 0.36);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(sx - 2, sy - 2, 5, 5);
  }
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  ch: string,
  col: number,
  row: number,
  size: number,
  theme: StageDefinition['theme'],
  time: number
) {
  const x = col * size;
  const y = row * size;
  const checker = (col + row) % 2 === 0;

  if (ch === '.') {
    if (theme === 'forest') {
      ctx.fillStyle = checker ? '#9AD66B' : '#8CCB5E';
      ctx.fillRect(x, y, size, size);
      // Subtle grass tuft / flower
      if ((col * 7 + row * 13) % 11 === 0) {
        ctx.fillStyle = '#73B346';
        ctx.fillRect(x + 10, y + 14, 4, 6);
        ctx.fillRect(x + 16, y + 12, 4, 8);
      } else if ((col * 5 + row * 3) % 17 === 0) {
        ctx.fillStyle = '#FEF08A';
        ctx.fillRect(x + size * 0.6, y + size * 0.55, 5, 5);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + size * 0.6 + 1, y + size * 0.55 + 1, 3, 3);
      }
    } else if (theme === 'cave') {
      ctx.fillStyle = checker ? '#495875' : '#404E69';
      ctx.fillRect(x, y, size, size);
      if ((col * 11 + row * 7) % 13 === 0) {
        ctx.fillStyle = '#607294';
        ctx.fillRect(x + 12, y + 18, 6, 4);
      }
    } else {
      // Castle floor with carpet runner feel
      ctx.fillStyle = checker ? '#756A87' : '#6A5F7B';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = 'rgba(30, 22, 45, 0.18)';
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      // Royal red carpet on Throne Room & main center column 11
      if (col === 11 && row >= 1 && row <= 5) {
        ctx.fillStyle = '#BE123C';
        ctx.fillRect(x + 6, y, size - 12, size);
        ctx.fillStyle = '#FBBF24';
        ctx.fillRect(x + 6, y, 3, size);
        ctx.fillRect(x + size - 9, y, 3, size);
      }
    }
    return;
  }

  // Wall '#' or Decorative Obstacle '~'
  if (ch === '~') {
    drawTile(ctx, '.', col, row, size, theme, time);
    if (theme === 'forest') {
      // Cute pond
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(x + 4, y + 6, size - 8, size - 12);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x + 6, y + 8, size - 12, size - 16);
      ctx.fillStyle = '#BAE6FD';
      const wave = Math.floor(time / 400) % 2 === 0 ? 0 : 4;
      ctx.fillRect(x + 10 + wave, y + 14, 10, 3);
    } else if (theme === 'cave') {
      // Glowing crystal cluster
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(x + 12, y + 8, 12, size - 14);
      ctx.fillStyle = '#67E8F9';
      ctx.fillRect(x + 16, y + 10, 6, size - 20);
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(x + 26, y + 16, 10, size - 22);
    } else {
      // Magic golden brazier
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + 10, y + 20, size - 20, size - 24);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(x + 14, y + 10 + (Math.floor(time / 160) % 2) * 2, size - 28, 12);
    }
    return;
  }

  // Solid wall '#'
  if (theme === 'forest') {
    // Grass under tree
    ctx.fillStyle = '#65A340';
    ctx.fillRect(x, y, size, size);
    // Trunk
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(x + size * 0.36, y + size * 0.62, size * 0.28, size * 0.34);
    // Bushy tree canopy
    ctx.fillStyle = '#1E5631';
    ctx.fillRect(x + 4, y + 6, size - 8, size * 0.62);
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(x + 6, y + 4, size - 12, size * 0.54);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x + 10, y + 8, size - 22, size * 0.24);
  } else if (theme === 'cave') {
    ctx.fillStyle = '#1E2433';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#2C354A';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 8);
    ctx.fillStyle = '#3A4663';
    ctx.fillRect(x + 5, y + 5, size - 10, size * 0.4);
    if ((col + row) % 5 === 0) {
      ctx.fillStyle = '#22D3EE';
      ctx.fillRect(x + 10, y + 8, 6, 10);
      ctx.fillStyle = '#A5F3FC';
      ctx.fillRect(x + 12, y + 9, 2, 6);
    }
  } else {
    // Castle brick wall
    ctx.fillStyle = '#2B253A';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#433A59';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 6);
    ctx.fillStyle = '#564B70';
    ctx.fillRect(x + 4, y + 4, size * 0.42, size * 0.36);
    ctx.fillRect(x + size * 0.52, y + 4, size * 0.38, size * 0.36);
    ctx.fillRect(x + 4, y + size * 0.48, size * 0.36, size * 0.34);
    ctx.fillRect(x + size * 0.46, y + size * 0.48, size * 0.44, size * 0.34);
    // Occasional wall torch
    if ((col * 3 + row * 5) % 9 === 0) {
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(x + size / 2 - 3, y + 10 + (Math.floor(time / 180) % 2) * 2, 6, 8);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(x + size / 2 - 2, y + 12, 4, 4);
    }
  }
}

export function drawInteractPrompt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  text: string,
  time: number
) {
  const bob = Math.sin(time / 200) * 3;
  const cx = x + size / 2;
  const topY = y - 10 + bob;

  ctx.save();
  ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
  const metrics = ctx.measureText(text);
  const bw = metrics.width + 16;
  const bh = 22;

  ctx.fillStyle = '#FFFDF7';
  ctx.strokeStyle = '#261C15';
  ctx.lineWidth = 2;

  const rx = cx - bw / 2;
  const ry = topY - bh;

  ctx.beginPath();
  ctx.roundRect(rx, ry, bw, bh, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1E1B18';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, ry + bh / 2 + 1);
  ctx.restore();
}

export function drawMazeScene(params: {
  ctx: CanvasRenderingContext2D;
  stage: StageDefinition;
  tileSize: number;
  playerVisualX: number;
  playerVisualY: number;
  facing: Direction;
  isMoving: boolean;
  heroId: HeroId;
  doors: DoorEntity[];
  monsters: MonsterEntity[];
  chests: ChestEntity[];
  nearbyTarget: { x: number; y: number; prompt: string } | null;
  particles: Particle[];
  floatingTexts: FloatingText[];
  time: number;
}) {
  const {
    ctx,
    stage,
    tileSize,
    playerVisualX,
    playerVisualY,
    facing,
    isMoving,
    heroId,
    doors,
    monsters,
    chests,
    nearbyTarget,
    particles,
    floatingTexts,
    time,
  } = params;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, stage.width * tileSize, stage.height * tileSize);

  // 1. Tiles
  for (let r = 0; r < stage.height; r++) {
    const rowStr = stage.grid[r];
    for (let c = 0; c < stage.width; c++) {
      drawTile(ctx, rowStr[c], c, r, tileSize, stage.theme, time);
    }
  }

  // 2. Exit portal
  drawExitSprite(ctx, stage.exit.x * tileSize, stage.exit.y * tileSize, tileSize, time);

  // 3. Chests
  for (const chest of chests) {
    drawChestSprite(ctx, chest.x * tileSize, chest.y * tileSize, tileSize, chest.opened, time);
  }

  // 4. Doors
  for (const door of doors) {
    if (!door.opened) {
      drawDoorSprite(ctx, door.x * tileSize, door.y * tileSize, tileSize, stage.theme, time);
    } else {
      // Subtle open threshold marker
      ctx.fillStyle = 'rgba(251, 191, 36, 0.22)';
      ctx.fillRect(door.x * tileSize + 6, door.y * tileSize + 6, tileSize - 12, tileSize - 12);
    }
  }

  // 5. Monsters
  for (const m of monsters) {
    if (!m.defeated) {
      drawMonsterSprite(ctx, m.kind, m.x * tileSize, m.y * tileSize, tileSize, time, m.isBoss);
    }
  }

  // 6. Highlight nearby interactable tile
  if (nearbyTarget) {
    const pulseAlpha = 0.4 + Math.sin(time / 180) * 0.25;
    ctx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      nearbyTarget.x * tileSize + 2,
      nearbyTarget.y * tileSize + 2,
      tileSize - 4,
      tileSize - 4
    );
  }

  // 7. Player
  drawPlayerSprite(
    ctx,
    playerVisualX * tileSize,
    playerVisualY * tileSize,
    tileSize,
    facing,
    isMoving,
    time,
    heroId
  );

  // 8. Interact prompt on top of target
  if (nearbyTarget) {
    drawInteractPrompt(
      ctx,
      nearbyTarget.x * tileSize,
      nearbyTarget.y * tileSize,
      tileSize,
      nearbyTarget.prompt,
      time
    );
  }

  // 9. Particles
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 10. Floating Texts
  for (const ft of floatingTexts) {
    const age = (time - ft.createdAt) / 1000;
    if (age > 1.2) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age / 1.2);
    ctx.font = 'bold 14px "Jua", "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#1E1B18';
    ctx.lineWidth = 4;
    ctx.strokeText(ft.text, ft.x, ft.y - age * 26);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y - age * 26);
    ctx.restore();
  }
}
