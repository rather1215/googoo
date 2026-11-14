import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Clock, Heart, Lightbulb, ShieldAlert, Sparkles, Swords } from 'lucide-react';
import { pickQuestion } from '../game/questions';
import { sound } from '../game/sound';
import { HERO_OPTIONS, HeroId, MonsterEntity, Question } from '../game/types';
import { MultiplicationHintVisual } from './MultiplicationHintVisual';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface BattleModalProps {
  monster: MonsterEntity;
  heroId: HeroId;
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

const SPARK_VECTORS = [
  { sx: '-34px', sy: '-28px' },
  { sx: '36px', sy: '-30px' },
  { sx: '-40px', sy: '8px' },
  { sx: '42px', sy: '10px' },
  { sx: '-24px', sy: '34px' },
  { sx: '28px', sy: '32px' },
];

export function BattleModal({
  monster,
  heroId,
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
  const turnSeconds = monster.isBoss ? 10 : 12;
  const heroInfo = HERO_OPTIONS.find((h) => h.id === heroId) ?? HERO_OPTIONS[0];

  const [monsterHp, setMonsterHp] = useState(monster.hp);
  const [ghostMonsterHp, setGhostMonsterHp] = useState(monster.hp);
  const [question, setQuestion] = useState<Question>(initialQuestion);
  const [pickedChoice, setPickedChoice] = useState<{ value: number; correct: boolean } | null>(null);
  const [wrongCountOnCurrent, setWrongCountOnCurrent] = useState(0);
  const [hintRevealedByItem, setHintRevealedByItem] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    monster.isBoss
      ? '최종 보스 구구단 마법사가 나타났다! 제한 시간 안에 정답을 눌러 공격하세요!'
      : `${monster.name}이(가) 나타났다! 제한 시간 안에 답을 누르면 바로 공격해요!`
  );
  const [statusTone, setStatusTone] = useState<'neutral' | 'good' | 'bad'>('neutral');

  // Visual combat animation state
  const [isAnimatingHit, setIsAnimatingHit] = useState(false);
  const [heroLunging, setHeroLunging] = useState(false);
  const [monsterLunging, setMonsterLunging] = useState(false);
  const [monsterHitFlash, setMonsterHitFlash] = useState(false);
  const [playerHurtFlash, setPlayerHurtFlash] = useState(false);
  const [monsterRecoilTick, setMonsterRecoilTick] = useState(0);
  const [heroHurtTick, setHeroHurtTick] = useState(0);
  const [arenaFlashTone, setArenaFlashTone] = useState<'none' | 'hit' | 'hurt'>('none');
  const [monsterDamagePopup, setMonsterDamagePopup] = useState<{ key: number; label: string } | null>(
    null
  );
  const [playerDamagePopup, setPlayerDamagePopup] = useState<{ key: number; label: string } | null>(
    null
  );
  const [playerHitShake, setPlayerHitShake] = useState(false);
  const [battleEnding, setBattleEnding] = useState<'none' | 'victory' | 'defeat'>('none');

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<number>(turnSeconds);
  const lastTickSecRef = useRef<number>(turnSeconds);
  const timeoutHandledRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // Trailing white/amber ghost damage bar animation for game-style Enemy HP UI
  useEffect(() => {
    if (ghostMonsterHp === monsterHp) return;
    const id = window.setTimeout(() => {
      setGhostMonsterHp(monsterHp);
    }, 380);
    return () => window.clearTimeout(id);
  }, [ghostMonsterHp, monsterHp]);

  const triggerMonsterCounterAttack = useCallback(
    (reason: 'wrong' | 'timeout') => {
      sound.playWrong();
      setIsAnimatingHit(true);
      setMonsterLunging(true);
      setPlayerHitShake(true);
      setPlayerHurtFlash(true);
      setArenaFlashTone('hurt');
      setHeroHurtTick((t) => t + 1);
      setPlayerDamagePopup({ key: Date.now(), label: '-1 하트!' });

      const remaining = onPlayerHurt();

      scheduleTimer(() => {
        setMonsterLunging(false);
        setPlayerHitShake(false);
        setPlayerHurtFlash(false);
        setArenaFlashTone('none');
      }, 480);

      if (remaining <= 0) {
        sound.playGameOver();
        setBattleEnding('defeat');
        setStatusTone('bad');
        setStatusMessage('하트가 모두 사라졌어요! 체크포인트에서 다시 힘내자!');
        scheduleTimer(() => {
          onGameOver();
        }, 900);
      } else {
        setWrongCountOnCurrent((prev) => prev + 1);
        setStatusTone('bad');
        setStatusMessage(
          reason === 'timeout'
            ? '시간 초과! 몬스터가 먼저 공격했어요! 힌트를 보고 다시 도전해요!'
            : '아쉬워요! 힌트를 확인하고 같은 문제를 다시 맞혀 보자!'
        );
        scheduleTimer(() => {
          setPickedChoice(null);
          setIsAnimatingHit(false);
          setPlayerDamagePopup(null);
          timeoutHandledRef.current = false;
          lastTickSecRef.current = turnSeconds;
          setTimeLeft(turnSeconds);
        }, 520);
      }
    },
    [onGameOver, onPlayerHurt, scheduleTimer, turnSeconds]
  );

  // Instant attack when clicking or pressing 1-4
  const handleInstantAttack = useCallback(
    (choice: number) => {
      if (battleEnding !== 'none' || isAnimatingHit) return;

      const isCorrect = choice === question.answer;
      const isFirstTry = wrongCountOnCurrent === 0;
      setPickedChoice({ value: choice, correct: isCorrect });
      onRecordAttempt(question.key, isCorrect, isFirstTry);

      if (isCorrect) {
        sound.playAttack();
        const isFastHit = timeLeft >= turnSeconds - 4;
        setIsAnimatingHit(true);
        setHeroLunging(true);
        setMonsterHitFlash(true);
        setArenaFlashTone('hit');
        setMonsterRecoilTick((t) => t + 1);
        setMonsterDamagePopup({
          key: Date.now(),
          label: isFastHit ? '번개 공격! -1' : '-1 명중!',
        });

        const nextHp = monsterHp - 1;
        setMonsterHp(nextHp);

        scheduleTimer(() => {
          setHeroLunging(false);
          setMonsterHitFlash(false);
          setArenaFlashTone('none');
        }, 440);

        if (nextHp <= 0) {
          scheduleTimer(() => {
            sound.playDefeatMonster();
            setBattleEnding('victory');
            setStatusTone('good');
            setStatusMessage(
              monster.isBoss
                ? '대단해요! 구구단 마법사를 물리쳤어요!'
                : `${monster.name}을(를) 멋지게 물리쳤어요! (별 +${monster.rewardStars})`
            );
            scheduleTimer(() => {
              onVictory(monster.rewardStars);
            }, 820);
          }, 380);
        } else {
          setStatusTone('good');
          setStatusMessage(
            isFastHit
              ? `번개 같은 정답! ${monster.name}에게 강력한 피해를 주었어요!`
              : `명중! ${monster.name}의 체력을 깎았어요! 다음 공격을 준비하세요!`
          );
          scheduleTimer(() => {
            setWrongCountOnCurrent(0);
            setHintRevealedByItem(false);
            setPickedChoice(null);
            setMonsterDamagePopup(null);
            const nextQ = pickQuestion(monster.dans, question.key, wrongPool);
            setQuestion(nextQ);
            timeoutHandledRef.current = false;
            lastTickSecRef.current = turnSeconds;
            setTimeLeft(turnSeconds);
            setIsAnimatingHit(false);
          }, 540);
        }
      } else {
        triggerMonsterCounterAttack('wrong');
      }
    },
    [
      battleEnding,
      isAnimatingHit,
      monster.dans,
      monster.isBoss,
      monster.name,
      monster.rewardStars,
      monsterHp,
      onRecordAttempt,
      onVictory,
      question.answer,
      question.key,
      scheduleTimer,
      timeLeft,
      triggerMonsterCounterAttack,
      turnSeconds,
      wrongCountOnCurrent,
      wrongPool,
    ]
  );

  // Countdown tick effect
  useEffect(() => {
    if (battleEnding !== 'none' || isAnimatingHit) return;

    const intervalId = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, Number((prev - 0.1).toFixed(1)));
        const nextCeil = Math.ceil(next);
        if (nextCeil <= 3 && nextCeil >= 1 && nextCeil < lastTickSecRef.current) {
          lastTickSecRef.current = nextCeil;
          sound.playTick();
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [battleEnding, isAnimatingHit]);

  // Handle timer reaching 0
  useEffect(() => {
    if (timeLeft <= 0 && !timeoutHandledRef.current && battleEnding === 'none' && !isAnimatingHit) {
      timeoutHandledRef.current = true;
      onRecordAttempt(question.key, false, wrongCountOnCurrent === 0);
      triggerMonsterCounterAttack('timeout');
    }
  }, [
    timeLeft,
    battleEnding,
    isAnimatingHit,
    onRecordAttempt,
    question.key,
    wrongCountOnCurrent,
    triggerMonsterCounterAttack,
  ]);

  // Keyboard 1-4 immediately attacks
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (battleEnding !== 'none' || isAnimatingHit) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (question.choices[idx] !== undefined) {
          e.preventDefault();
          handleInstantAttack(question.choices[idx]);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [battleEnding, isAnimatingHit, question.choices, handleInstantAttack]);

  const showHint1 = wrongCountOnCurrent >= 1 || hintRevealedByItem;
  const showHint2 = wrongCountOnCurrent >= 2 || hintRevealedByItem;

  const timeRatio = Math.max(0, Math.min(1, timeLeft / turnSeconds));
  const timerUrgent = timeLeft <= 3;
  const timerWarning = timeLeft <= 5 && timeLeft > 3;

  const enemyHpRatio = monster.maxHp > 0 ? Math.max(0, monsterHp / monster.maxHp) : 0;
  const enemyGhostRatio = monster.maxHp > 0 ? Math.max(0, ghostMonsterHp / monster.maxHp) : 0;
  const enemyHpColor =
    enemyHpRatio > 0.6
      ? 'bg-gradient-to-r from-emerald-500 to-lime-400'
      : enemyHpRatio > 0.3
        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
        : 'bg-gradient-to-r from-rose-600 to-red-400';

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
        {/* Top Battle Title */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-200 pb-2.5">
          <div>
            <p className="text-xs font-bold text-rose-700">
              {monster.isBoss ? '최종 보스전 · 전체 구구단' : '몬스터 구구단 대결'}
            </p>
            <h2 id="battle-title" className="font-display text-2xl text-slate-900">
              {monster.name}
            </h2>
          </div>

          <span className="rounded-xl border-2 border-[#261C15] bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            승리 보상: 별 +{monster.rewardStars}개
          </span>
        </div>

        {/* Game-style Battle Arena with Integrated RPG HP Bars */}
        <div
          className={`relative mt-3.5 overflow-hidden rounded-2xl border-4 border-[#261C15] px-4 py-4 sm:px-5 ${
            monster.isBoss
              ? 'bg-gradient-to-b from-[#312152] via-[#23183C] to-[#170F29]'
              : 'bg-gradient-to-b from-[#2E5241] via-[#213B2F] to-[#152820]'
          }`}
        >
          {/* Impact Screen Flash Overlay */}
          {arenaFlashTone !== 'none' && (
            <div
              key={`flash-${monsterRecoilTick}-${heroHurtTick}`}
              className={`animate-arena-flash pointer-events-none absolute inset-0 z-10 ${
                arenaFlashTone === 'hit' ? 'bg-amber-200/35' : 'bg-rose-600/45'
              }`}
              aria-hidden="true"
            />
          )}

          {/* Top Arcade VS HUD: Player Hearts vs Game-style Enemy HP Bar */}
          <div className="relative z-10 mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
            {/* Player Status Plate */}
            <div className="rounded-xl border-2 border-[#261C15] bg-slate-950/70 px-3 py-2 text-white backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-display text-sm text-emerald-300">
                  {heroInfo.name}
                </span>
                <span className="text-[11px] font-bold text-slate-300 tabular-nums">
                  HP {playerHearts}/{maxHearts}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {Array.from({ length: maxHearts }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-5 w-5 transition-transform duration-200 ${
                      i < playerHearts
                        ? 'fill-rose-500 text-rose-300 scale-100'
                        : 'fill-slate-800 text-slate-600 scale-90'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Game-style Enemy Health Bar Plate */}
            <div className="rounded-xl border-2 border-[#261C15] bg-slate-950/75 px-3 py-2 text-white backdrop-blur-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-display text-sm text-amber-300">
                  {monster.isBoss ? `BOSS · ${monster.name}` : monster.name}
                </span>
                <span className="font-display text-xs text-rose-200 tabular-nums">
                  HP {monsterHp} / {monster.maxHp}
                </span>
              </div>
              <div
                className="relative mt-1.5 h-4 w-full overflow-hidden rounded-md border-2 border-[#0B0F17] bg-slate-900 shadow-inner"
                role="progressbar"
                aria-valuenow={monsterHp}
                aria-valuemin={0}
                aria-valuemax={monster.maxHp}
                aria-label={`${monster.name} 체력`}
              >
                {/* Trailing Ghost Damage Bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber-200 transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.round(enemyGhostRatio * 100)}%` }}
                />
                {/* Actual Enemy HP Fill */}
                <div
                  className={`relative h-full transition-[width] duration-200 ease-out ${enemyHpColor}`}
                  style={{ width: `${Math.round(enemyHpRatio * 100)}%` }}
                >
                  <div className="h-1 w-full bg-white/30" />
                </div>
                {/* Segmented Tick Dividers */}
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${monster.maxHp}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: monster.maxHp }).map((_, i) => (
                    <div
                      key={i}
                      className={i > 0 ? 'border-l border-slate-950/55' : ''}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fighters Stage */}
          <div className="relative z-10 flex items-center justify-around py-2">
            {/* Player Side */}
            <div
              className={`relative flex flex-col items-center transition-transform duration-150 ${
                heroLunging ? 'translate-x-16 scale-115 -rotate-6 sm:translate-x-24' : ''
              }`}
            >
              {playerDamagePopup && (
                <div
                  key={playerDamagePopup.key}
                  className="animate-damage-pop pointer-events-none absolute -top-7 z-30 rounded-lg border-2 border-[#261C15] bg-rose-500 px-2.5 py-0.5 font-display text-sm text-white shadow whitespace-nowrap"
                >
                  {playerDamagePopup.label}
                </div>
              )}

              {/* Enemy Attack Impact Overlay on Hero */}
              {heroHurtTick > 0 && playerHurtFlash && (
                <>
                  <div
                    key={`hero-ring-${heroHurtTick}`}
                    className="animate-impact-ring pointer-events-none absolute inset-0 z-20 m-auto h-20 w-20 rounded-full border-4 border-rose-400"
                    aria-hidden="true"
                  />
                  <svg
                    key={`hero-claw-${heroHurtTick}`}
                    viewBox="0 0 100 100"
                    className="animate-slash-flash pointer-events-none absolute inset-0 z-30 m-auto h-24 w-24"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 18 L82 82 M32 14 L88 68 M12 34 L68 88"
                      stroke="#FCA5A5"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    <path
                      d="M18 18 L82 82 M32 14 L88 68 M12 34 L68 88"
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {SPARK_VECTORS.map((vec, idx) => (
                    <span
                      key={`hspark-${heroHurtTick}-${idx}`}
                      className="animate-spark-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-rose-400"
                      style={
                        {
                          '--sx': vec.sx,
                          '--sy': vec.sy,
                        } as CSSProperties
                      }
                      aria-hidden="true"
                    />
                  ))}
                </>
              )}

              <div
                key={`hero-recoil-${heroHurtTick}`}
                className={heroHurtTick > 0 && playerHitShake ? 'animate-hero-recoil' : ''}
              >
                <PixelSpriteCanvas
                  kind="player"
                  heroId={heroId}
                  size={78}
                  hurtFlash={playerHurtFlash}
                />
              </div>
            </div>

            {/* Center VS */}
            <div className="flex flex-col items-center gap-1 text-amber-300/90">
              <Swords className="h-7 w-7" />
              <span className="font-display text-xs tracking-widest">VS</span>
            </div>

            {/* Monster Side */}
            <div className="relative flex flex-col items-center">
              {monsterDamagePopup && (
                <div
                  key={monsterDamagePopup.key}
                  className="animate-damage-pop pointer-events-none absolute -top-7 z-30 rounded-lg border-2 border-[#261C15] bg-amber-300 px-3 py-0.5 font-display text-base text-slate-950 shadow whitespace-nowrap"
                >
                  {monsterDamagePopup.label}
                </div>
              )}

              {/* Player Attack Impact Overlay on Monster */}
              {monsterRecoilTick > 0 && monsterHitFlash && (
                <>
                  <div
                    key={`mon-ring-${monsterRecoilTick}`}
                    className="animate-impact-ring pointer-events-none absolute inset-0 z-20 m-auto h-24 w-24 rounded-full border-4 border-amber-300"
                    aria-hidden="true"
                  />
                  <svg
                    key={`slash-${monsterRecoilTick}`}
                    viewBox="0 0 100 100"
                    className="animate-slash-flash pointer-events-none absolute inset-0 z-30 m-auto h-28 w-28"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 84 L88 12 L76 34 L94 22 L28 90 Z"
                      fill="#FEF08A"
                      stroke="#F97316"
                      strokeWidth="4"
                    />
                    <path
                      d="M20 20 L82 80 L66 72 L78 88 L14 30 Z"
                      fill="#FFFFFF"
                      stroke="#EF4444"
                      strokeWidth="3"
                    />
                  </svg>
                  {SPARK_VECTORS.map((vec, idx) => (
                    <span
                      key={`mspark-${monsterRecoilTick}-${idx}`}
                      className="animate-spark-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-xs bg-amber-300"
                      style={
                        {
                          '--sx': vec.sx,
                          '--sy': vec.sy,
                        } as CSSProperties
                      }
                      aria-hidden="true"
                    />
                  ))}
                </>
              )}

              <div
                key={`recoil-${monsterRecoilTick}`}
                className={`transition-transform duration-150 ${
                  monsterLunging ? '-translate-x-16 scale-115 rotate-3 sm:-translate-x-24' : ''
                } ${
                  battleEnding === 'victory'
                    ? 'animate-monster-defeat'
                    : monsterRecoilTick > 0
                      ? 'animate-monster-recoil'
                      : ''
                }`}
              >
                <PixelSpriteCanvas
                  kind={monster.kind}
                  size={monster.isBoss ? 92 : 80}
                  hurtFlash={monsterHitFlash}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer Bar */}
        <div className="mt-3 rounded-xl border-2 border-[#261C15] bg-[#F5EFE0] px-3.5 py-2">
          <div className="mb-1 flex items-center justify-between text-xs font-bold tabular-nums">
            <span
              className={`inline-flex items-center gap-1.5 ${
                timerUrgent
                  ? 'text-rose-700'
                  : timerWarning
                    ? 'text-amber-700'
                    : 'text-slate-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>남은 공격 시간</span>
            </span>
            <span
              className={`font-display text-base ${
                timerUrgent
                  ? 'text-rose-600'
                  : timerWarning
                    ? 'text-amber-700'
                    : 'text-emerald-700'
              }`}
            >
              {Math.ceil(timeLeft)}초
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-[#261C15] bg-white">
            <div
              className={`h-full transition-[width] duration-100 ease-linear ${
                timerUrgent
                  ? 'bg-rose-500'
                  : timerWarning
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.round(timeRatio * 100)}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        <div
          className={`mt-2.5 flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold ${
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
        <div className="mt-3 rounded-2xl border-3 border-[#261C15] bg-[#F5EFE0] px-4 py-3.5 text-center">
          <p className="font-display text-4xl tracking-wider text-slate-900 tabular-nums sm:text-5xl">
            {question.a} × {question.b} = ?
          </p>
        </div>

        {/* Hints */}
        {showHint1 && battleEnding === 'none' && (
          <div className="mt-2.5 rounded-xl border-2 border-sky-200 bg-sky-50 p-3 text-sm text-sky-950">
            <p className="flex items-center gap-1.5 font-bold text-sky-800">
              <Lightbulb className="h-4 w-4 shrink-0" />
              <span>힌트 1: {question.hint1}</span>
            </p>
            {showHint2 && (
              <>
                <p className="mt-1 font-bold text-sky-900">
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

        {/* 4 Instant-Attack Answer Choice Buttons */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {question.choices.map((choice, idx) => {
            const isPicked = pickedChoice?.value === choice;
            return (
              <button
                key={`${question.key}_${choice}`}
                type="button"
                disabled={battleEnding !== 'none' || isAnimatingHit}
                onClick={() => handleInstantAttack(choice)}
                className={`pixel-btn flex min-h-[54px] items-center justify-center gap-1.5 rounded-xl border-3 border-[#261C15] px-3 py-2 font-display text-2xl tabular-nums transition-colors ${
                  isPicked
                    ? pickedChoice.correct
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                    : 'bg-white text-slate-900 hover:bg-amber-100'
                }`}
              >
                <span
                  className={`text-base ${
                    isPicked ? 'text-white' : 'text-amber-800'
                  }`}
                >
                  {CHOICE_CIRCLES[idx]}
                </span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        {/* Hint Action + Instruction Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          {hintItems > 0 && !hintRevealedByItem && battleEnding === 'none' ? (
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                setHintRevealedByItem(true);
                lastTickSecRef.current = turnSeconds;
                setTimeLeft(turnSeconds);
                onUseHintItem();
              }}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border-2 border-sky-400 bg-sky-50 px-4 py-1.5 text-sm font-bold text-sky-800 hover:bg-sky-100 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>힌트 돋보기 ({hintItems}개 · 시간 초기화)</span>
            </button>
          ) : (
            <p className="text-xs font-bold text-slate-600">
              정답 버튼을 누르거나 숫자 키(1~4)를 누르면 즉시 공격해요!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
