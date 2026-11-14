import { ArrowRight, KeyRound, Sparkles, Swords, Compass, X } from 'lucide-react';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface HowToPlayModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    num: 1,
    text: '방향키로 캐릭터를 움직여요.',
    detail: '키보드 화살표(↑↓←→), WASD 또는 화면의 방향 버튼으로 미로를 탐험하세요.',
    sprite: 'player' as const,
    icon: Compass,
    accent: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  {
    num: 2,
    text: '잠긴 문을 만나면 구구단 문제를 풀어요.',
    detail: '문 앞에서는 틀려도 하트가 줄지 않아요. 힌트를 보며 차근차근 풀어 보세요!',
    sprite: 'door' as const,
    icon: KeyRound,
    accent: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  {
    num: 3,
    text: '몬스터를 만나면 구구단 공격으로 물리쳐요.',
    detail: '제한 시간 안에 답을 누르면 즉시 공격해요! 틀리거나 시간이 지나면 하트가 줄어요.',
    sprite: 'green_slime' as const,
    icon: Swords,
    accent: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    num: 4,
    text: '보물 상자를 열어 별과 아이템을 모아요.',
    detail: '별, 하트 회복 물약, 힌트 돋보기, 황금 열쇠가 숨어 있어요!',
    sprite: 'chest' as const,
    icon: Sparkles,
    accent: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  {
    num: 5,
    text: '출구에 도착하면 다음 스테이지로 이동해요.',
    detail: '초록빛 숲, 수정 동굴, 마법의 성을 모두 정복해 보세요!',
    sprite: 'exit' as const,
    icon: ArrowRight,
    accent: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
];

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div className="pixel-box relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-slate-900">
        <div className="mb-5 flex items-center justify-between border-b-2 border-amber-200 pb-3">
          <h2 id="how-to-play-title" className="font-display text-2xl text-slate-900 sm:text-3xl">
            모험 안내서 — 게임 방법
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#261C15] bg-amber-100 text-slate-900 transition-colors hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-amber-500"
            aria-label="게임 방법 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="space-y-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.num}
                className="flex items-center gap-4 rounded-xl border-2 border-[#E5DEC9] bg-white p-3.5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#261C15] bg-[#F5EFE0]">
                  <PixelSpriteCanvas kind={step.sprite} size={44} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${step.accent}`}
                    >
                      {step.num}
                    </span>
                    <p className="font-display text-lg text-slate-900">{step.text}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                    <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>{step.detail}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn min-h-[44px] rounded-xl border-2 border-[#261C15] bg-emerald-600 px-6 py-2.5 font-display text-lg text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            알겠어요! 출발하기
          </button>
        </div>
      </div>
    </div>
  );
}
