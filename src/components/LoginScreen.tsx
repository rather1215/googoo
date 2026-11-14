import { useState } from 'react';
import { KeyRound, LogIn, User } from 'lucide-react';
import { LeaderboardEntry } from '../game/leaderboard';
import { HERO_OPTIONS } from '../game/types';
import { LeaderboardPanel } from './LeaderboardPanel';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface LoginScreenProps {
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  onLogin: (nickname: string, password: string) => Promise<void>;
}

export function LoginScreen({
  leaderboard,
  leaderboardLoading,
  leaderboardError,
  onLogin,
}: LoginScreenProps) {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    try {
      await onLogin(nickname, password);
      setPassword('');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : '로그인 중 문제가 발생했어요. 다시 시도해 주세요.'
      );
    } finally {
      setLoginBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121A24] px-4 py-8 text-slate-100 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-7">
        {/* Hero RPG Title Banner */}
        <section className="pixel-box relative overflow-hidden rounded-3xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-slate-900 sm:p-8">
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
              <p className="mt-4 text-sm font-medium text-slate-600">
                아래에서 학생 별명과 학급 비밀번호(2026)를 입력해 로그인하면 모험을 시작할 수 있어요.
              </p>
            </div>

            {/* Pixel Art Explorer Squad Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border-4 border-[#261C15] bg-[#1E2B3A] p-4 text-white">
                <div className="flex items-end justify-around rounded-xl border-2 border-[#33465C] bg-gradient-to-b from-[#2C4A3E] to-[#1B3028] px-3 py-5">
                  {HERO_OPTIONS.map((hero) => (
                    <div key={hero.id} className="flex flex-col items-center gap-1.5">
                      <PixelSpriteCanvas kind="player" heroId={hero.id} size={56} />
                      <span className="text-[11px] font-bold text-emerald-200">
                        {hero.title}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-sm text-slate-200">
                  로그인한 다음 탐험가와 스테이지를 고를 수 있어요!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* First Screen Main Grid: Student Login + Real-Time Leaderboard */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* Student Login Panel */}
          <section
            className="pixel-box rounded-2xl border-4 border-[#261C15] bg-[#FFFDF7] p-6 text-slate-900 lg:col-span-5"
            aria-labelledby="student-login-heading"
          >
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="flex items-center gap-3 border-b-2 border-amber-200 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#261C15] bg-emerald-500 text-white">
                  <LogIn className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="student-login-heading" className="font-display text-2xl text-slate-900">
                    탐험대 로그인
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    별명과 비밀번호(2026)를 입력하면 모험 화면으로 넘어가요!
                  </p>
                </div>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border-2 border-rose-300 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-800"
                >
                  {loginError}
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="student-nickname"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800"
                  >
                    <User className="h-4 w-4 text-emerald-700" />
                    <span>학생 별명</span>
                  </label>
                  <input
                    id="student-nickname"
                    type="text"
                    maxLength={20}
                    autoFocus
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="예: 민준, 별빛토끼"
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#261C15] bg-white px-3.5 py-2 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-amber-500"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="student-password"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800"
                  >
                    <KeyRound className="h-4 w-4 text-amber-600" />
                    <span>학급 비밀번호</span>
                  </label>
                  <input
                    id="student-password"
                    type="password"
                    inputMode="numeric"
                    maxLength={10}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 2026 입력"
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#261C15] bg-white px-3.5 py-2 text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginBusy}
                  className="pixel-btn inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border-3 border-[#261C15] bg-emerald-600 px-5 py-3 font-display text-xl text-white disabled:opacity-60"
                >
                  <LogIn className="h-5 w-5" />
                  <span>{loginBusy ? '로그인 중...' : '로그인하고 출발하기'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Real-Time Leaderboard Visible on First Screen */}
          <div className="lg:col-span-7">
            <LeaderboardPanel
              entries={leaderboard}
              loading={leaderboardLoading}
              error={leaderboardError}
              currentStudentId={null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
