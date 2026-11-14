import { Clock, Crown, Medal, Star, Trophy } from 'lucide-react';
import { formatPlayTime, LeaderboardEntry } from '../game/leaderboard';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  currentStudentId: string | null;
}

export function LeaderboardPanel({
  entries,
  loading,
  error,
  currentStudentId,
}: LeaderboardPanelProps) {
  const myIndex = currentStudentId
    ? entries.findIndex((e) => e.studentId === currentStudentId)
    : -1;
  const myEntry = myIndex >= 0 ? entries[myIndex] : null;

  return (
    <section
      className="pixel-box rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-5 text-slate-900 sm:p-6"
      aria-labelledby="leaderboard-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#261C15] bg-amber-300 text-slate-950">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 id="leaderboard-heading" className="font-display text-2xl text-slate-900">
              실시간 탐험대 순위표
            </h2>
            <p className="text-xs font-medium text-slate-600">
              참가 학생 {entries.length}명 · 별과 점수가 같으면 플레이 시간이 빠른 순!
            </p>
          </div>
        </div>

        {myEntry && (
          <div className="rounded-xl border-2 border-[#261C15] bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-900 tabular-nums">
            내 순위 {myIndex + 1}위 · {myEntry.score.toLocaleString()}점
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm font-medium text-slate-500">
          실시간 순위를 불러오고 있어요...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          순위를 불러오는 중 문제가 발생했어요. 잠시 후 다시 확인해 주세요.
        </div>
      ) : entries.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-display text-lg text-slate-700">
            아직 등록된 탐험가가 없어요!
          </p>
          <p className="mt-1 text-sm text-slate-500">
            별명과 비밀번호 2026으로 로그인해 첫 1등이 되어 보세요.
          </p>
        </div>
      ) : (
        <ol className="mt-4 max-h-[340px] space-y-2.5 overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.studentId === currentStudentId;

            return (
              <li
                key={entry.studentId}
                className={`flex items-center justify-between gap-3 rounded-xl border-2 px-3.5 py-2.5 transition-colors ${
                  isMe
                    ? 'border-[#261C15] bg-amber-100'
                    : 'border-[#E5DEC9] bg-white'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#261C15] font-display text-base tabular-nums ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : rank === 2
                          ? 'bg-slate-200 text-slate-900'
                          : rank === 3
                            ? 'bg-orange-300 text-slate-950'
                            : 'bg-[#F5EFE0] text-slate-700'
                    }`}
                  >
                    {rank === 1 ? (
                      <Crown className="h-4 w-4" />
                    ) : rank <= 3 ? (
                      <Medal className="h-4 w-4" />
                    ) : (
                      rank
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-display text-lg text-slate-900">
                      <span className="truncate">{entry.nickname}</span>
                      {isMe && (
                        <span className="text-xs font-bold text-emerald-700">(나)</span>
                      )}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-slate-500 tabular-nums">
                      <span className="inline-flex items-center gap-0.5 text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                        {entry.stars}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>문제 {entry.solvedCount}개</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 text-sky-700">
                        <Clock className="h-3 w-3" />
                        {formatPlayTime(entry.playTimeSeconds)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>단계 {entry.clearedStages}/3</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right tabular-nums">
                  <p className="font-display text-xl text-slate-900">
                    {entry.score.toLocaleString()}점
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
