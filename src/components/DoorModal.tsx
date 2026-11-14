import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Lightbulb, Sparkles, X } from 'lucide-react';
import { sound } from '../game/sound';
import { DoorEntity, Question, StageDefinition } from '../game/types';
import { MultiplicationHintVisual } from './MultiplicationHintVisual';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface DoorModalProps {
  door: DoorEntity;
  question: Question;
  theme: StageDefinition['theme'];
  hintItems: number;
  goldenKeys: number;
  onUseHintItem: () => void;
  onWrongAttempt: (questionKey: string, isFirstTry: boolean) => void;
  onSuccess: (firstTry: boolean, usedGoldenKey: boolean) => void;
  onClose: () => void;
}

const CHOICE_CIRCLES = ['①', '②', '③', '④'];

export function DoorModal({
  door,
  question,
  theme,
  hintItems,
  goldenKeys,
  onUseHintItem,
  onWrongAttempt,
  onSuccess,
  onClose,
}: DoorModalProps) {
  const [wrongCount, setWrongCount] = useState(0);
  const [hintRevealedByItem, setHintRevealedByItem] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChoice = useCallback(
    (choice: number) => {
      if (solved) return;
      if (choice === question.answer) {
        sound.playDoorOpen();
        setSolved(true);
        setFeedback('정답이에요! 마법의 문이 스르르 열려요!');
        setTimeout(() => {
          onSuccess(wrongCount === 0, false);
        }, 750);
      } else {
        sound.playWrong();
        const isFirstTry = wrongCount === 0;
        const nextWrong = wrongCount + 1;
        setWrongCount(nextWrong);
        setShake(true);
        setTimeout(() => setShake(false), 380);
        setFeedback('아쉬워요! 힌트를 보고 다시 계산해 보세요. (문 문제에서는 하트가 줄지 않아요!)');
        onWrongAttempt(question.key, isFirstTry);
      }
    },
    [solved, question.answer, question.key, wrongCount, onSuccess, onWrongAttempt]
  );

  const handleGoldenKey = () => {
    if (solved || goldenKeys <= 0) return;
    sound.playDoorOpen();
    setSolved(true);
    setFeedback('황금 열쇠가 반짝이며 문이 열렸어요!');
    setTimeout(() => {
      onSuccess(true, true);
    }, 750);
  };

  const handleUseHint = () => {
    if (hintItems <= 0 || hintRevealedByItem || solved) return;
    sound.playSelect();
    setHintRevealedByItem(true);
    onUseHintItem();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !solved) {
        onClose();
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (question.choices[idx] !== undefined) {
          handleChoice(question.choices[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChoice, onClose, question.choices, solved]);

  const showHint1 = wrongCount >= 1 || hintRevealedByItem;
  const showHint2 = wrongCount >= 2 || hintRevealedByItem;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="door-modal-title"
    >
      <div
        className={`pixel-box relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-slate-900 ${
          shake ? 'animate-hit-shake' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b-2 border-amber-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-[#261C15] bg-[#F5EFE0]">
              <PixelSpriteCanvas kind="door" size={44} theme={theme} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700">{door.label}</p>
              <h2 id="door-modal-title" className="font-display text-2xl text-slate-900">
                마법의 문을 열어 보세요!
              </h2>
            </div>
          </div>

          {!solved && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#261C15] bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="나중에 열기"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Question Display */}
        <div className="mt-5 rounded-2xl border-3 border-[#261C15] bg-[#F5EFE0] px-4 py-6 text-center">
          <p className="font-display text-5xl tracking-wider text-slate-900 tabular-nums sm:text-6xl">
            {question.a} × {question.b} = ?
          </p>
        </div>

        {/* Feedback / Encouragement */}
        {feedback && (
          <div
            className={`mt-4 rounded-xl border-2 px-4 py-2.5 text-sm font-bold ${
              solved
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : 'border-amber-300 bg-amber-50 text-amber-900'
            }`}
          >
            {feedback}
          </div>
        )}

        {/* Progressive Learning Hints */}
        {showHint1 && !solved && (
          <div className="mt-3 rounded-xl border-2 border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-950">
            <p className="flex items-center gap-1.5 font-bold text-sky-800">
              <Lightbulb className="h-4 w-4 shrink-0" />
              <span>힌트 1: {question.hint1}</span>
            </p>
            {showHint2 && (
              <>
                <p className="mt-1.5 font-bold text-sky-900">
                  힌트 2: {question.hint2}
                </p>
                <MultiplicationHintVisual
                  a={question.a}
                  b={question.b}
                  item={question.visualItem}
                />
              </>
            )}
          </div>
        )}

        {/* 4 Answer Choices */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {question.choices.map((choice, idx) => {
            const isCorrectAndSolved = solved && choice === question.answer;
            return (
              <button
                key={choice}
                type="button"
                disabled={solved}
                onClick={() => handleChoice(choice)}
                className={`pixel-btn flex min-h-[56px] items-center justify-center gap-2 rounded-xl border-3 border-[#261C15] px-4 py-3 font-display text-2xl tabular-nums transition-colors ${
                  isCorrectAndSolved
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-slate-900 hover:bg-amber-100'
                }`}
              >
                <span className="text-lg text-amber-700">{CHOICE_CIRCLES[idx]}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        {/* Utility Items */}
        {!solved && (hintItems > 0 || goldenKeys > 0) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-3">
            {hintItems > 0 && !hintRevealedByItem && (
              <button
                type="button"
                onClick={handleUseHint}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border-2 border-sky-400 bg-sky-50 px-3 py-1.5 text-sm font-bold text-sky-800 hover:bg-sky-100 whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>힌트 돋보기 쓰기 ({hintItems}개)</span>
              </button>
            )}
            {goldenKeys > 0 && (
              <button
                type="button"
                onClick={handleGoldenKey}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border-2 border-amber-500 bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900 hover:bg-amber-200 whitespace-nowrap shrink-0"
              >
                <KeyRound className="h-4 w-4" />
                <span>황금 열쇠로 바로 열기 ({goldenKeys}개)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
