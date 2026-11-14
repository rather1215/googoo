import { useCallback, useEffect, useState } from 'react';
import { Heart, Lightbulb, ShieldAlert, Sparkles, Swords } from 'lucide-react';
import { pickQuestion } from '../game/questions';
import { sound } from '../game/sound';
import { MonsterEntity, Question } from '../game/types';
import { MultiplicationHintVisual } from './MultiplicationHintVisual';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface BattleModalProps {
  monster: MonsterEntity;
  initialQuestion: Question;
  playerHearts: number;
  maxHearts: number;
  hintItems: number;
  wrongPool: string[];
  onUseHintItem: () => void;
  onRecordAttempt: (questionKey: string, isCorrect: boolean, isFirstTry: boolean) => void;
  onPlayerHurt: () => number; // returns remaining hearts
  onVictory: (rewardStars: number) => void;
  onGameOver: () => void;
}

const CHOICE_CIRCLES = ['①', '②', '③', '④'];

export function BattleModal({
  monster,
  initialQuestion,
  playerHearts,
  maxHearts,
  hintItems,
  wrongPool,
  onUseHintItem,
  onRecordAttempt,
  onPlayerHurt,
  onVictory,
  onGameOver,
}: BattleModalProps) {
  const [monsterHp, setMonsterHp] = useState(monster.hp);
  const [question, setQuestion] = useState<Question>(initialQuestion);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [wrongCountOnCurrent, setWrongCountOnCurrent] = useState(0);
  const [hintRevealedByItem, setHintRevealedByItem] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    monster.isBoss
      ? '최종 보스 구구단 마법사가 나타났다! 구구단의 힘으로 맞서 싸우자!'
      : `${monster.name}이(가) 나타났다! 답을 고르고 공격하기를 누르세요!`
  );
  const [statusTone, setStatusTone] = useState<'neutral' | 'good' | 'bad'>('neutral');
  const [monsterHitFlash, setMonsterHitFlash] = useState(false);
  const [playerHitShake, setPlayerHitShake] = useState(false);
  const [battleEnding, setBattleEnding] = useState<'none' | 'victory' | 'defeat'>('none');

  const handleAttack = useCallback(() => {
    if (selectedChoice === null || battleEnding !== 'none') return;

    const isCorrect = selectedChoice === question.answer;
    const isFirstTry = wrongCountOnCurrent === 0;
    onRecordAttempt(question.key, isCorrect, isFirstTry);

    if (isCorrect) {
      sound.playAttack();
      setMonsterHitFlash(true);
      setTimeout(() => setMonsterHitFlash(false), 320);

      const nextHp = monsterHp - 1;
      setMonsterHp(nextHp);
      setSelectedChoice(null);

      if (nextHp <= 0) {
        sound.playDefeatMonster();
        setBattleEnding('victory');
        setStatusTone('good');
        setStatusMessage(
          monster.isBoss
            ? '대단해요! 구구단 마법사를 물리쳤어요!'
            : `${monster.name}을(를) 멋지게 물리쳤어요! (별 +${monster.rewardStars})`
        );
        setTimeout(() => {
          onVictory(monster.rewardStars);
        }, 950);
      } else {
        setStatusTone('good');
        setStatusMessage(`명중! ${monster.name}에게 1의 피해를 주었어요! 다음 공격을 준비하세요!`);
        setWrongCountOnCurrent(0);
        setHintRevealedByItem(false);
        const nextQ = pickQuestion(monster.dans, question.key, wrongPool);
        setQuestion(nextQ);
      }
    } else {
      sound.playWrong();
      setPlayerHitShake(true);
      setTimeout(() => setPlayerHitShake(false), 380);

      const remaining = onPlayerHurt();
      setSelectedChoice(null);

      if (remaining <= 0) {
        sound.playGameOver();
        setBattleEnding('defeat');
        setStatusTone('bad');
        setStatusMessage('하트가 모두 사라졌어요! 체크포인트에서 다시 힘내자!');
        setTimeout(() => {
          onGameOver();
        }, 850);
      } else {
        setWrongCountOnCurrent((prev) => prev + 1);
        setStatusTone('bad');
        setStatusMessage('아쉬워요! 다시 도전해 보세요. 힌트를 확인하고 같은 문제를 풀어 보자!');
      }
    }
  }, [
    selectedChoice,
    battleEnding,
    question.answer,
    question.key,
    wrongCountOnCurrent,
    onRecordAttempt,
    monsterHp,
    monster.isBoss,
    monster.name,
    monster.rewardStars,
    monster.dans,
    wrongPool,
    onVictory,
    onPlayerHurt,
    onGameOver,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (battleEnding !== 'none') return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (question.choices[idx] !== undefined) {
          sound.playSelect();
          setSelectedChoice(question.choices[idx]);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (selectedChoice !== null) {
          e.preventDefault();
          handleAttack();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [battleEnding, handleAttack, question.choices, selectedChoice]);

  const showHint1 = wrongCountOnCurrent >= 1 || hintRevealedByItem;
  const showHint2 = wrongCountOnCurrent >= 2 || hintRevealedByItem;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="battle-title"
    >
      <div
        className={`pixel-box max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-5 text-slate-900 sm:p-6 ${
          playerHitShake ? 'animate-hit-shake' : ''
        }`}
      >
        {/* Top Combat Header: Monster HP & Player Hearts */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-200 pb-3">
          <div>
            <p className="text-xs font-bold text-rose-700">
              {monster.isBoss ? '최종 보스전 · 전체 구구단' : '몬스터 구구단 대결'}
            </p>
            <h2 id="battle-title" className="font-display text-2xl text-slate-900">
              {monster.name}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Monster HP */}
            <div className="flex items-center gap-2 rounded-xl border-2 border-[#261C15] bg-rose-50 px-3 py-1.5">
              <span className="text-xs font-bold text-rose-800">적 체력</span>
              <div className="flex items-center gap-1 tabular-nums">
                {Array.from({ length: monster.maxHp }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3.5 w-3.5 rounded-sm border border-[#261C15] ${
                      i < monsterHp ? 'bg-rose-500' : 'bg-slate-200'
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs font-bold text-rose-900">
                  {monsterHp}/{monster.maxHp}
                </span>
              </div>
            </div>

            {/* Player Hearts */}
            <div className="flex items-center gap-1.5 rounded-xl border-2 border-[#261C15] bg-white px-3 py-1.5">
              <span className="text-xs font-bold text-slate-700">내 하트</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: maxHearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-4 w-4 ${
                      i < playerHearts
                        ? 'fill-rose-500 text-rose-600'
                        : 'fill-slate-200 text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Battle Arena Visual */}
        <div
          className={`mt-4 flex items-center justify-around rounded-2xl border-3 border-[#261C15] px-4 py-5 ${
            monster.isBoss
              ? 'bg-gradient-to-b from-[#2C1F47] to-[#1A132B]'
              : 'bg-gradient-to-b from-[#2A4A3B] to-[#1B3126]'
          }`}
        >
          <div className="flex flex-col items-center">
            <PixelSpriteCanvas kind="player" size={76} />
            <span className="mt-1 text-xs font-bold text-emerald-200">나 (탐험가)</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-amber-300">
            <Swords className="h-8 w-8" />
            <span className="font-display text-sm">VS</span>
          </div>

          <div
            className={`flex flex-col items-center transition-transform duration-150 ${
              monsterHitFlash ? 'scale-90 -translate-y-1' : ''
            } ${battleEnding === 'victory' ? 'scale-0 opacity-0' : ''}`}
          >
            <PixelSpriteCanvas
              kind={monster.kind}
              size={monster.isBoss ? 92 : 78}
              hurtFlash={monsterHitFlash}
            />
            <span className="mt-1 text-xs font-bold text-amber-200">{monster.name}</span>
          </div>
        </div>

        {/* Status Message */}
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold ${
            statusTone === 'good'
              ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
              : statusTone === 'bad'
                ? 'border-rose-300 bg-rose-50 text-rose-900'
                : 'border-amber-200 bg-amber-50 text-slate-800'
          }`}
        >
          {statusTone === 'bad' && <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />}
          <span>{statusMessage}</span>
        </div>

        {/* Question Box */}
        <div className="mt-4 rounded-2xl border-3 border-[#261C15] bg-[#F5EFE0] px-4 py-4 text-center">
          <p className="font-display text-4xl tracking-wider text-slate-900 tabular-nums sm:text-5xl">
            {question.a} × {question.b} = ?
          </p>
        </div>

        {/* Hints */}
        {showHint1 && battleEnding === 'none' && (
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

        {/* 4 Answer Choice Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {question.choices.map((choice, idx) => {
            const isSelected = selectedChoice === choice;
            return (
              <button
                key={choice}
                type="button"
                disabled={battleEnding !== 'none'}
                onClick={() => {
                  sound.playSelect();
                  setSelectedChoice(choice);
                }}
                className={`pixel-btn flex min-h-[54px] items-center justify-center gap-1.5 rounded-xl border-3 border-[#261C15] px-3 py-2.5 font-display text-2xl tabular-nums transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-600'
                    : 'bg-white text-slate-900 hover:bg-amber-50'
                }`}
              >
                <span className="text-base text-amber-800">{CHOICE_CIRCLES[idx]}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        {/* Attack + Hint Action Row */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {hintItems > 0 && !hintRevealedByItem && battleEnding === 'none' ? (
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setHintRevealedByItem(true);
                onUseHintItem();
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-sky-400 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-800 hover:bg-sky-100 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>힌트 돋보기 ({hintItems}개)</span>
            </button>
          ) : (
            <p className="text-xs font-medium text-slate-500">
              답을 고른 뒤 공격하기 버튼을 누르세요!
            </p>
          )}

          <button
            type="button"
            disabled={selectedChoice === null || battleEnding !== 'none'}
            onClick={handleAttack}
            className="pixel-btn inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border-3 border-[#261C15] bg-rose-600 px-6 py-3 font-display text-xl text-white disabled:cursor-not-allowed disabled:opacity-45 sm:flex-initial whitespace-nowrap shrink-0"
          >
            <Swords className="h-5 w-5" />
            <span>공격하기!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
