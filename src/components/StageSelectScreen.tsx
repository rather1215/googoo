import { useState } from 'react';
import {
  BookOpen,
  Check,
  Clock,
  Lock,
  LogOut,
  Play,
  RotateCcw,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { formatPlayTime, LeaderboardEntry, StudentSession } from '../game/leaderboard';
import { sound } from '../game/sound';
import { STAGE_LIST, STAGES } from '../game/stages';
import { HERO_OPTIONS, HeroId, SavedProgress, StageId } from '../game/types';
import { LeaderboardPanel } from './LeaderboardPanel';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface StageSelectScreenProps {
  progress: SavedProgress;
  studentSession: StudentSession;
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  onSelectHero: (heroId: HeroId) => void;
  onStartStage: (stageId: StageId) => void;
  onResumeRun: () => void;
  onOpenHowToPlay: () => void;
  onLogout: () => void;
  onResetProgress: () => void;
}

export function StageSelectScreen({
  progress,
  studentSession,
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  onSelectHero,
  onStartStage,
  onResumeRun,
  onOpenHowToPlay,
  onLogout,
  onResetProgress,
}: StageSelectScreenProps) {
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const hasActiveRun = Boolean(progress.activeRun);
  const activeStageName = progress.activeRun ? STAGES[progress.activeRun.stageId].name : '';

  const nextRecommendedStage: StageId =
    progress.unlockedStages.includes(3) && !progress.records[3].cleared
      ? 3
      : progress.unlockedStages.includes(2) && !progress.records[2].cleared
        ? 2
        : 1;

  const myRankIndex = leaderboard.findIndex((e) => e.studentId === studentSession.studentId);
  const myEntry = myRankIndex >= 0 ? leaderboard[myRankIndex] : null;
  const selectedHero =
    HERO_OPTIONS.find((h) => h.id === progress.selectedHero) ?? HERO_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#121A24] px-4 py-7 text-slate-100 sm:px-6 lg:py-9">
      <div className="mx-auto max-w-6xl space-y-7">
        {/* Logged-in Explorer Top Bar */}
        <header className="pixel-box rounded-3xl border-4 border-[#261C15] bg-[#FFFDF7] p-5 text-slate-900 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-3 border-[#261C15] ${selectedHero.accentBg}`}
              >
                <PixelSpriteCanvas kind="player" heroId={selectedHero.id} size={52} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700">
                  환영해요! · {selectedHero.name}
                </p>
                <h1 className="font-display text-2xl text-slate-900 sm:text-3xl">
                  {studentSession.nickname} 탐험가
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-slate-600 tabular-nums">
                  <span className="text-emerald-700">
                    현재 순위 {myRankIndex >= 0 ? `${myRankIndex + 1}위` : '-'}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>점수 {(myEntry?.score ?? 0).toLocaleString()}점</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    별 {myEntry?.stars ?? progress.totalStars}개
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1 text-sky-700">
                    <Clock className="h-4 w-4" />
                    {formatPlayTime(myEntry?.playTimeSeconds ?? progress.totalPlayTimeSeconds)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowLeaderboardModal(true)}
                className="pixel-btn inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-amber-300 px-4 py-2 font-display text-base text-slate-950 whitespace-nowrap shrink-0"
              >
                <Trophy className="h-4 w-4" />
                <span>순위표 보기</span>
              </button>

              <button
                type="button"
                onClick={onOpenHowToPlay}
                className="pixel-btn inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-4 py-2 font-display text-base text-slate-900 whitespace-nowrap shrink-0"
              >
                <BookOpen className="h-4 w-4" />
                <span>게임 방법</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-white px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 whitespace-nowrap shrink-0"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>

          {/* Quick Launch CTA */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t-2 border-amber-200 pt-4">
            <button
              type="button"
              onClick={() => onStartStage(nextRecommendedStage)}
              className="pixel-btn inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#261C15] bg-emerald-600 px-6 py-2.5 font-display text-xl text-white whitespace-nowrap shrink-0"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>스테이지 {nextRecommendedStage} 바로 출발!</span>
            </button>

            {hasActiveRun && (
              <button
                type="button"
                onClick={onResumeRun}
                className="pixel-btn inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#261C15] bg-amber-400 px-5 py-2.5 font-display text-xl text-slate-950 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-5 w-5" />
                <span>이어서 하기 ({activeStageName})</span>
              </button>
            )}
          </div>
        </header>

        {/* Character Selection Section */}
        <section aria-labelledby="hero-select-heading">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="hero-select-heading" className="font-display text-2xl text-white">
              1. 탐험가 캐릭터 고르기
            </h2>
            <p className="text-sm font-medium text-slate-300">
              원하는 캐릭터를 선택하면 미로와 전투에 바로 등장해요!
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_OPTIONS.map((hero) => {
              const isSelected = progress.selectedHero === hero.id;
              return (
                <button
                  key={hero.id}
                  type="button"
                  onClick={() => {
                    sound.playSelect();
                    onSelectHero(hero.id);
                  }}
                  aria-pressed={isSelected}
                  className={`pixel-box flex items-center gap-3.5 rounded-2xl border-4 p-4 text-left transition-transform ${
                    isSelected
                      ? 'border-amber-400 bg-[#FFFDF7] text-slate-900 ring-2 ring-amber-300 -translate-y-0.5'
                      : 'border-[#261C15] bg-[#1E2B3A] text-slate-100 hover:bg-[#263649]'
                  }`}
                >
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-[#261C15] ${
                      isSelected ? hero.accentBg : 'bg-[#2C3E52]'
                    }`}
                  >
                    <PixelSpriteCanvas kind="player" heroId={hero.id} size={52} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-emerald-700' : 'text-amber-300'
                        }`}
                      >
                        {hero.title}
                      </span>
                      {isSelected && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="font-display text-lg leading-snug">{hero.name}</p>
                    <p
                      className={`mt-1 text-xs leading-relaxed ${
                        isSelected ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      {hero.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Stage Selection Section */}
        <section aria-labelledby="stage-select-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="stage-select-heading" className="font-display text-2xl text-white">
              2. 탐험 스테이지 선택
            </h2>
            {(progress.totalStars > 0 || progress.activeRun || progress.unlockedStages.length > 1) && (
              <button
                type="button"
                onClick={onResetProgress}
                className="text-sm font-medium text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                처음부터 다시 기록하기
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {STAGE_LIST.map((stage) => {
              const unlocked = progress.unlockedStages.includes(stage.id);
              const record = progress.records[stage.id];
              const themeColors =
                stage.theme === 'forest'
                  ? 'from-emerald-700 to-green-900'
                  : stage.theme === 'cave'
                    ? 'from-sky-700 to-indigo-950'
                    : 'from-violet-700 to-slate-900';
              const monsterPreview =
                stage.id === 1 ? 'green_slime' : stage.id === 2 ? 'bat' : 'boss';

              return (
                <div
                  key={stage.id}
                  className={`pixel-box flex flex-col justify-between rounded-2xl border-4 border-[#261C15] p-5 transition-transform ${
                    unlocked
                      ? 'bg-[#FFFDF7] text-slate-900'
                      : 'bg-slate-800/90 text-slate-300'
                  }`}
                >
                  <div>
                    <div
                      className={`mb-4 flex h-24 items-center justify-between rounded-xl border-2 border-[#261C15] bg-gradient-to-br px-4 ${themeColors}`}
                    >
                      <div>
                        <p className="text-xs font-bold text-amber-200">
                          스테이지 {stage.id}
                        </p>
                        <p className="font-display text-2xl text-white">{stage.name}</p>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/25">
                        {unlocked ? (
                          <PixelSpriteCanvas kind={monsterPreview} size={52} />
                        ) : (
                          <Lock className="h-7 w-7 text-slate-300" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className={unlocked ? 'text-emerald-700' : 'text-slate-400'}>
                        {stage.dansLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className={unlocked ? 'text-slate-600' : 'text-slate-400'}>
                        난이도 {stage.difficultyLabel}
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        unlocked ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {stage.subtitle}
                    </p>

                    <div
                      className={`mt-3 text-xs font-medium tabular-nums ${
                        unlocked ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      문 {stage.doors.length}개 · 몬스터 {stage.monsters.length}마리 · 상자{' '}
                      {stage.chests.length}개
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200/70 pt-4">
                    {unlocked ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-600 tabular-nums">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                          <span>
                            {record.cleared ? `최고 별 ${record.bestStars}개` : '도전 전'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartStage(stage.id)}
                          className="pixel-btn min-h-[44px] rounded-xl border-2 border-[#261C15] bg-amber-400 px-4 py-2 font-display text-base text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-600"
                        >
                          {record.cleared ? '다시 탐험하기' : '탐험 시작'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span>이전 스테이지를 완료하면 열려요!</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="실시간 탐험대 순위표"
        >
          <div className="relative w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setShowLeaderboardModal(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#261C15] bg-amber-100 text-slate-900 hover:bg-amber-200"
              aria-label="순위표 닫기"
            >
              <X className="h-5 w-5" />
            </button>
            <LeaderboardPanel
              entries={leaderboard}
              loading={leaderboardLoading}
              error={leaderboardError}
              currentStudentId={studentSession.studentId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
