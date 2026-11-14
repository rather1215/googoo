import { Award, Clock, Home, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import { formatPlayTime } from '../game/leaderboard';
import { StageId, StageStats } from '../game/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface PauseModalProps {
  stageName: string;
  onResume: () => void;
  onRestartStage: () => void;
  onGoHome: () => void;
}

export function PauseModal({
  stageName,
  onResume,
  onRestartStage,
  onGoHome,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="pixel-box w-full max-w-sm rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-center text-slate-900">
        <p className="text-xs font-bold text-amber-700">{stageName}</p>
        <h2 id="pause-title" className="font-display mt-1 text-3xl">
          잠깐 쉬어 가기
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          지금까지의 탐험 기록은 안전하게 저장되어 있어요.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="pixel-btn inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-emerald-600 px-5 py-2.5 font-display text-xl text-white"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>계속 탐험하기</span>
          </button>
          <button
            type="button"
            onClick={onRestartStage}
            className="pixel-btn inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-amber-300 px-5 py-2.5 font-display text-lg text-slate-950"
          >
            <RotateCcw className="h-5 w-5" />
            <span>스테이지 처음부터</span>
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="pixel-btn inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-5 py-2.5 font-display text-lg text-slate-900"
          >
            <Home className="h-5 w-5" />
            <span>처음 화면으로</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface GameOverModalProps {
  onRespawnCheckpoint: () => void;
  onGoHome: () => void;
}

export function GameOverModal({ onRespawnCheckpoint, onGoHome }: GameOverModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="pixel-box w-full max-w-md rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-center text-slate-900">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#261C15] bg-amber-100">
          <PixelSpriteCanvas kind="player" size={64} />
        </div>
        <h2 id="gameover-title" className="font-display mt-4 text-3xl text-slate-900">
          괜찮아요! 다시 도전하면 돼요!
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          이미 열어 둔 문과 보물은 그대로 남아 있어요.
          체크포인트에서 하트 3개를 모두 채우고 다시 출발해 볼까요?
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRespawnCheckpoint}
            className="pixel-btn inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-emerald-600 px-5 py-3 font-display text-xl text-white"
          >
            <RotateCcw className="h-5 w-5" />
            <span>체크포인트에서 다시 시작</span>
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="pixel-btn inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-5 py-2.5 font-display text-lg text-slate-900"
          >
            <Home className="h-5 w-5" />
            <span>처음 화면으로</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface StageClearModalProps {
  stageId: StageId;
  stageName: string;
  stats: StageStats;
  isFinalGameClear: boolean;
  onReplay: () => void;
  onNextStage: () => void;
  onGoHome: () => void;
}

export function StageClearModal({
  stageId,
  stageName,
  stats,
  isFinalGameClear,
  onReplay,
  onNextStage,
  onGoHome,
}: StageClearModalProps) {
  const accuracy =
    stats.totalProblemsAttempted > 0
      ? Math.round((stats.firstTryCorrect / stats.totalProblemsAttempted) * 100)
      : 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-title"
    >
      <div className="pixel-box w-full max-w-lg rounded-3xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-center text-slate-900 sm:p-8">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border-3 border-[#261C15] bg-amber-100">
          {isFinalGameClear ? (
            <Trophy className="h-12 w-12 text-amber-500" />
          ) : (
            <Award className="h-12 w-12 text-emerald-600" />
          )}
        </div>

        <p className="mt-4 text-sm font-bold text-emerald-700">
          스테이지 {stageId} · {stageName}
        </p>

        <h2 id="clear-title" className="font-display mt-1 text-3xl text-slate-900 sm:text-4xl [text-wrap:balance]">
          {isFinalGameClear
            ? '축하해요! 구구단 마법사가 되었어요!'
            : '스테이지 완료!'}
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          {isFinalGameClear
            ? '초록빛 숲, 수정 동굴, 마법의 성까지 모든 모험을 멋지게 해냈어요!'
            : '구구단 실력이 쑥쑥 자랐어요. 다음 모험도 떠나 볼까요?'}
        </p>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border-2 border-[#E5DEC9] bg-[#F5EFE0] p-4 sm:grid-cols-4 tabular-nums">
          <div>
            <p className="text-xs font-bold text-slate-600">획득한 별</p>
            <p className="font-display mt-1 flex items-center justify-center gap-1 text-xl text-amber-600 sm:text-2xl">
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              <span>{stats.starsEarned}개</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">해결한 문제</p>
            <p className="font-display mt-1 text-xl text-slate-900 sm:text-2xl">
              {stats.solvedCount}개
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">첫 시도 정답률</p>
            <p className="font-display mt-1 text-xl text-emerald-700 sm:text-2xl">
              {accuracy}%
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">플레이 시간</p>
            <p className="font-display mt-1 flex items-center justify-center gap-1 text-xl text-sky-700 sm:text-2xl">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{formatPlayTime(stats.elapsedSeconds)}</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!isFinalGameClear && (
            <button
              type="button"
              onClick={onNextStage}
              className="pixel-btn inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-emerald-600 px-5 py-3 font-display text-xl text-white whitespace-nowrap shrink-0"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>다음 스테이지</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReplay}
            className="pixel-btn inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-amber-300 px-5 py-3 font-display text-lg text-slate-950 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-5 w-5" />
            <span>다시 도전하기</span>
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="pixel-btn inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-5 py-3 font-display text-lg text-slate-900 whitespace-nowrap shrink-0"
          >
            <Home className="h-5 w-5" />
            <span>처음 화면으로</span>
          </button>
        </div>
      </div>
    </div>
  );
}
