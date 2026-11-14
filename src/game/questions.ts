import { Question } from './types';

function getEulReul(n: number): string {
  // 2(이), 4(사), 5(오), 9(구) -> 를 | 3(삼), 6(육), 7(칠), 8(팔) -> 을
  const noBatchim = [2, 4, 5, 9];
  return noBatchim.includes(n) ? '를' : '을';
}

function buildRepeatedAddition(a: number, b: number): string {
  return Array.from({ length: b }, () => a).join(' + ');
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateChoices(a: number, b: number): number[] {
  const answer = a * b;
  const candidates = new Set<number>();

  // Pedagogically realistic 2nd-grade multiplication distractors
  const nearOffsets = [
    a * (b - 1),
    a * (b + 1),
    (a - 1) * b,
    (a + 1) * b,
    answer + 2,
    answer - 2,
    answer + 4,
    answer - 4,
    answer + 10,
    answer - 10,
    a + b,
  ];

  // Also include swapped digits if 2-digit answer (e.g. 54 vs 45)
  if (answer >= 12) {
    const tens = Math.floor(answer / 10);
    const ones = answer % 10;
    if (ones > 0 && ones !== tens) {
      candidates.add(ones * 10 + tens);
    }
  }

  for (const val of nearOffsets) {
    if (val > 2 && val <= 90 && val !== answer) {
      candidates.add(val);
    }
  }

  const pool = shuffle(Array.from(candidates));
  const picked = pool.slice(0, 3);

  // Fallback safeguard in case fewer than 3 distractors were picked
  let offset = 1;
  while (picked.length < 3) {
    const candidate = answer + offset;
    if (candidate !== answer && !picked.includes(candidate)) {
      picked.push(candidate);
    }
    offset = offset > 0 ? -offset : -offset + 1;
  }

  return shuffle([answer, ...picked]);
}

export function createQuestion(a: number, b: number): Question {
  const answer = a * b;
  const visualItems: Array<'apple' | 'star' | 'block'> = ['apple', 'star', 'block'];
  const visualItem = visualItems[(a + b) % visualItems.length];

  return {
    key: `${a}x${b}`,
    a,
    b,
    answer,
    choices: generateChoices(a, b),
    hint1: `${a}${getEulReul(a)} ${b}번 더하면 얼마일까요?`,
    hint2: `${buildRepeatedAddition(a, b)} 를 차근차근 계산해 보세요!`,
    visualItem,
  };
}

export function pickQuestion(
  dans: number[],
  lastQuestionKey: string | null,
  wrongPool: string[]
): Question {
  // 35% chance to review a previously missed question from this stage/session if available and matching dans or review
  if (wrongPool.length > 0 && Math.random() < 0.35) {
    const eligible = wrongPool.filter((k) => {
      if (k === lastQuestionKey) return false;
      const [aStr] = k.split('x');
      return dans.includes(Number(aStr));
    });
    if (eligible.length > 0) {
      const pickedKey = eligible[Math.floor(Math.random() * eligible.length)];
      const [a, b] = pickedKey.split('x').map(Number);
      return createQuestion(a, b);
    }
  }

  const allPairs: Array<[number, number]> = [];
  for (const a of dans) {
    for (let b = 2; b <= 9; b++) {
      const key = `${a}x${b}`;
      if (key !== lastQuestionKey) {
        allPairs.push([a, b]);
      }
    }
  }

  const [a, b] = allPairs[Math.floor(Math.random() * allPairs.length)];
  return createQuestion(a, b);
}
