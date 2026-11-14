import { BookOpen, Lock, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import { STAGE_LIST, STAGES } from '../game/stages';
import { SavedProgress, StageId } from '../game/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface TitleScreenProps {
  progress: SavedProgress;
  onStartStage: (stageId: StageId) => void;
  onResumeRun: () => void;
  onOpenHowToPlay: () => void;
  onResetProgress: () => void;
}

export function TitleScreen({
  progress,
  onStartStage,
  onResumeRun,
  onOpenHowToPlay,
  onResetProgress,
}: TitleScreenProps) {
  const hasActiveRun = Boolean(progress.activeRun);
  const activeStageName = progress.activeRun ? STAGES[progress.activeRun.stageId].name : '';

  const nextRecommendedStage: StageId = progress.unlockedStages.includes(3) && !progress.records[3].cleared
    ? 3
    : progress.unlockedStages.includes(2) && !progress.records[2].cleared
      ? 2
      : 1;

  return (
    <div className="min-h-screen bg-[#121A24] px-4 py-8 text-slate-100 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Hero RPG Banner */}
        <section className="pixel-box relative overflow-hidden rounded-3xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-slate-900 sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-sm font-bold text-emerald-700">
                초등학교 2학년 구구단 판타지 어드벤처
              </p>
              <h1 className="font-display mt-2 text-4xl leading-tight text-slate-900 sm:text-5xl [text-wrap:balance]">
                구구단 미로 탐험대
              </h1>
              <p className="mt-3 text-lg font-medium text-slate-700 sm:text-xl">
                "구구단의 힘으로 미로를 탈출하자!"
              </p>

              {/* Primary CTA Group */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onStartStage(nextRecommendedStage)}
                  className="pixel-btn inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#261C15] bg-emerald-600 px-6 py-3 font-display text-xl text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>모험 시작하기</span>
                </button>

                {hasActiveRun && (
                  <button
                    type="button"
                    onClick={onResumeRun}
                    className="pixel-btn inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#261C15] bg-amber-400 px-5 py-3 font-display text-xl text-slate-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-600"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>이어서 하기 ({activeStageName})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenHowToPlay}
                  className="pixel-btn inline-flex min-h-[48px] items-center gap-2 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-5 py-3 font-display text-xl text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>게임 방법</span>
                </button>
              </div>

              {/* Clean unboxed summary stats */}
              {(progress.totalStars > 0 || progress.totalSolved > 0) && (
                <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-amber-200 pt-4 text-sm font-medium text-slate-700 tabular-nums">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    모은 별 {progress.totalStars}개
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                    해결한 구구단 {progress.totalSolved}문제
                  </span>
                </div>
              )}
            </div>

            {/* Pixel Art Diorama Stage Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-4 border-[#261C15] bg-[#1E2B3A] p-5 text-white">
                <div className="flex items-end justify-around rounded-xl border-2 border-[#33465C] bg-gradient-to-b from-[#2C4A3E] to-[#1B3028] px-3 py-6">
                  <div className="flex flex-col items-center gap-2">
                    <PixelSpriteCanvas kind="player" size={68} />
                    <span className="text-xs font-bold text-emerald-200">탐험가</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <PixelSpriteCanvas kind="chest" size={56} />
                    <span className="text-xs font-bold text-amber-200">보물</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <PixelSpriteCanvas kind="green_slime" size={60} />
                    <span className="text-xs font-bold text-lime-200">슬라임</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <PixelSpriteCanvas kind="boss" size={68} />
                    <span className="text-xs font-bold text-purple-200">마법사</span>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-slate-200">
                  문을 열고, 몬스터와 싸우고, 보물을 찾아 탈출하세요!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stage Selection Grid */}
        <section className="mt-8" aria-labelledby="stage-select-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="stage-select-heading" className="font-display text-2xl text-white">
              탐험 스테이지 고르기
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

                    {/* Unboxed clean metadata */}
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span className={unlocked ? 'text-emerald-700' : 'text-slate-400'}>
                        {stage.dansLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className={unlocked ? 'text-slate-600' : 'text-slate-400'}>
                        난이도 {stage.difficultyLabel}
                      </span>
                    </div>

                    <p className={`mt-2 text-sm leading-relaxed ${unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                      {stage.subtitle}
                    </p>

                    <div className={`mt-3 text-xs font-medium tabular-nums ${unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                      문 {stage.doors.length}개 · 몬스터 {stage.monsters.length}마리 · 상자 {stage.chests.length}개
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
    </div>
  );
}
