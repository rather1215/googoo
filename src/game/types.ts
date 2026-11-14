export type StageId = 1 | 2 | 3;

export type HeroId = 'explorer' | 'knight' | 'mage' | 'cat_ranger';

export interface HeroOption {
  id: HeroId;
  name: string;
  title: string;
  description: string;
  accentBg: string;
}

export const HERO_OPTIONS: HeroOption[] = [
  {
    id: 'explorer',
    name: '용감한 탐험가',
    title: '빨간 모자',
    description: '어떤 미로든 두렵지 않은 씩씩한 모험가예요.',
    accentBg: 'bg-rose-100',
  },
  {
    id: 'knight',
    name: '은빛 꼬마 기사',
    title: '황금 방패',
    description: '반짝이는 투구를 쓰고 친구들을 지키는 기사예요.',
    accentBg: 'bg-sky-100',
  },
  {
    id: 'mage',
    name: '별빛 견습 마법사',
    title: '마법 모자',
    description: '구구단 주문으로 문을 여는 똑똑한 마법사예요.',
    accentBg: 'bg-violet-100',
  },
  {
    id: 'cat_ranger',
    name: '고양이 숲 순찰대',
    title: '초록 망토',
    description: '숨겨진 보물 상자를 척척 찾아내는 재빠른 대원이에요.',
    accentBg: 'bg-emerald-100',
  },
];

export type GameScreen =
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'STAGE_CLEAR'
  | 'GAME_CLEAR';

export type Direction = 'down' | 'up' | 'left' | 'right';

export type TileChar = '#' | '.' | '~';

export type MonsterKind = 'slime' | 'green_slime' | 'blue_slime' | 'bat' | 'wizard' | 'boss';

export type ChestRewardType = 'stars' | 'heart' | 'hint' | 'golden_key';

export interface DoorEntity {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  dans: number[];
  label: string;
}

export interface MonsterEntity {
  id: string;
  kind: MonsterKind;
  name: string;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  defeated: boolean;
  dans: number[];
  rewardStars: number;
  isBoss?: boolean;
}

export interface ChestEntity {
  id: string;
  x: number;
  y: number;
  opened: boolean;
  rewardType: ChestRewardType;
  amount: number;
  label: string;
}

export interface StageDefinition {
  id: StageId;
  name: string;
  subtitle: string;
  difficultyLabel: string;
  dansLabel: string;
  dans: number[];
  theme: 'forest' | 'cave' | 'castle';
  width: number;
  height: number;
  grid: string[];
  spawn: { x: number; y: number };
  midCheckpoint: { x: number; y: number };
  bossCheckpoint?: { x: number; y: number };
  exit: { x: number; y: number };
  doors: DoorEntity[];
  monsters: MonsterEntity[];
  chests: ChestEntity[];
}

export interface Question {
  key: string;
  a: number;
  b: number;
  answer: number;
  choices: number[];
  hint1: string;
  hint2: string;
  visualItem: 'apple' | 'star' | 'block';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface StageStats {
  solvedCount: number;
  firstTryCorrect: number;
  totalProblemsAttempted: number;
  starsEarned: number;
  elapsedSeconds: number;
}

export interface ActiveRunState {
  stageId: StageId;
  heroId: HeroId;
  playerX: number;
  playerY: number;
  facing: Direction;
  hearts: number;
  maxHearts: number;
  stars: number;
  hintItems: number;
  goldenKeys: number;
  openedDoorIds: string[];
  defeatedMonsterIds: string[];
  openedChestIds: string[];
  checkpoint: { x: number; y: number };
  wrongQuestionKeys: string[];
  stats: StageStats;
}

export interface StageRecord {
  cleared: boolean;
  bestStars: number;
  bestAccuracy: number;
  solvedCount: number;
}

export interface SavedProgress {
  selectedHero: HeroId;
  unlockedStages: StageId[];
  records: Record<StageId, StageRecord>;
  totalStars: number;
  totalSolved: number;
  totalPlayTimeSeconds: number;
  activeRun: ActiveRunState | null;
}

export type ActiveInteraction =
  | { type: 'door'; door: DoorEntity }
  | { type: 'monster'; monster: MonsterEntity }
  | { type: 'chest'; chest: ChestEntity }
  | { type: 'exit' };
