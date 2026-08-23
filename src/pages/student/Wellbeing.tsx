import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  Brain,
  HeartPulse,
  Lightbulb,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';

import api from '../../utils/api.js';

import { useLanguage } from '../../contexts/LanguageContext.js';

import { DailyWellbeingCheckIn } from '../../components/wellbeing/DailyWellbeingCheckIn.js';

import {
  getDailyWellbeingTip,
  WELLBEING_TIP_COUNT,
} from '../../utils/wellbeingTips.js';

const moodEmoji: Record<string, string> = {
  GREAT: '😄',
  GOOD: '🙂',
  OKAY: '😐',
  LOW: '😔',
  OVERWHELMED: '😣',
};

export const StudentWellbeing: React.FC = () => {
  const { language } = useLanguage();

  const [rows, setRows] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dailyTip = useMemo(
    () => getDailyWellbeingTip(language),
    [language],
  );

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [historyRes, privacyRes] =
        await Promise.all([
          api.get(
            '/wellbeing/me/check-ins',
            {
              params: {
                days: 30,
              },
            },
          ),
          api.get(
            '/wellbeing/me/privacy',
          ),
        ]);

      setRows(
        historyRes.data.data || [],
      );

      setTrends(
        historyRes.data.meta
          ?.trends || null,
      );

      setPrivacy(
        privacyRes.data.data,
      );
    } catch {
      setError(
        'Could not load wellbeing data.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updatePrivacy = async (
    patch: any,
  ) => {
    const next = {
      ...privacy,
      ...patch,
    };

    setPrivacy(next);

    await api.put(
      '/wellbeing/me/privacy',
      {
        personalizeAiWithCheckIns:
          !!next.personalizeAiWithCheckIns,
        storeAiChatHistory:
          !!next.storeAiChatHistory,
      },
    );
  };

  const deleteCheckIn = async (
    id: string,
  ) => {
    await api.delete(
      `/wellbeing/me/check-ins/${id}`,
    );

    await load();
  };

  return (
    <div className="space-y-5 fade-in-up">
      {/* =============================================================== */}
      {/* WELLBEING HERO / REFERENCE-STYLE INTRO                          */}
      {/* =============================================================== */}

      <section className="overflow-hidden rounded-[24px] border border-[#e3e8ff] bg-[linear-gradient(110deg,#f5f2ff,#fff8fc_48%,#eef8ff)] p-5 shadow-[0_16px_36px_rgba(7,20,38,0.05)] sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.86fr] lg:items-stretch">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#7c3aed] shadow-sm">
              <HeartPulse className="h-4 w-4" />
              Student Wellbeing
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#071426] sm:text-4xl">
              Wellbeing
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#52617f]">
              Check in with yourself,
              understand your recent
              patterns and use supportive
              tools whenever you need
              them.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/student/wellbeing/chat"
                className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_22px_rgba(49,102,224,0.18)]"
              >
                <Brain className="h-4 w-4" />
                AI Companion
              </Link>

              <Link
                to="/student/wellbeing/support"
                className="inline-flex items-center gap-2 rounded-lg border border-[#c9d6ff] bg-white px-4 py-2.5 text-xs font-black text-[#2563eb]"
              >
                <LifeBuoy className="h-4 w-4" />
                Human Support
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#071426,#1d4ed8_42%,#7c3aed_72%,#db2777)] p-5 text-white shadow-[0_18px_34px_rgba(49,102,224,0.18)] sm:p-6">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-cyan-300/10 blur-2xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]">
                <Lightbulb className="h-4 w-4" />
                Daily Wellbeing Tip
              </span>

              <p className="mt-5 text-lg font-black leading-7 sm:text-xl">
                {dailyTip.text}
              </p>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/15 pt-4 text-[11px] font-semibold text-white/70">
                <span>
                  One tip per calendar day
                </span>

                <span>
                  {dailyTip.index + 1}/
                  {WELLBEING_TIP_COUNT}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================================== */}
      {/* 30-DAY SNAPSHOT                                                 */}
      {/* =============================================================== */}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7c3aed]" />
            <h2 className="text-sm font-black text-[#071426]">
              Check-ins
            </h2>
          </div>

          <p className="mt-3 text-3xl font-black text-[#4f46e5]">
            {trends?.checkIns ?? 0}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#64748b]">
            Recorded in the last
            30 days
          </p>
        </div>

        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-[#e91670]" />
            <h2 className="text-sm font-black text-[#071426]">
              Average stress
            </h2>
          </div>

          <p className="mt-3 text-3xl font-black text-[#ec0b76]">
            {trends?.averageStress ??
              '—'}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#64748b]">
            Self-reported scale,
            1 to 5
          </p>
        </div>

        <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-sm font-black text-[#071426]">
              Average energy
            </h2>
          </div>

          <p className="mt-3 text-3xl font-black text-[#0891b2]">
            {trends?.averageEnergy ??
              '—'}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#64748b]">
            Self-reported scale,
            1 to 5
          </p>
        </div>
      </section>

      {/* =============================================================== */}
      {/* EMOJI CHECK-IN                                                  */}
      {/* =============================================================== */}

      <DailyWellbeingCheckIn
        onSaved={load}
      />

      {/* =============================================================== */}
      {/* HISTORY + PRIVACY                                               */}
      {/* =============================================================== */}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-gray-100 motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#071426]">
                  Your check-in history
                </h2>

                <p className="mt-1 text-xs font-semibold text-[#64748b]">
                  Private,
                  self-reported
                  wellbeing records.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void load()
                }
                className="inline-flex w-fit items-center gap-1 rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#2563eb]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-[#64748b]">
                No check-ins yet.
                Complete your first
                wellbeing check-in when
                you’re ready.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {rows.map((row) => (
                  <div
                    key={row._id}
                    className="flex flex-col gap-3 rounded-xl border border-[#e6ebf7] bg-[#fbfcff] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="text-2xl"
                      >
                        {moodEmoji[
                          row.mood
                        ] || '🙂'}
                      </span>

                      <div>
                        <p className="text-sm font-black text-[#071426]">
                          {row.date} ·{' '}
                          {row.mood.replaceAll(
                            '_',
                            ' ',
                          )}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#64748b]">
                          Stress{' '}
                          {
                            row.stressLevel
                          }
                          /5 · Energy{' '}
                          {
                            row.energyLevel
                          }
                          /5 · Sleep{' '}
                          {row.sleepQuality.replaceAll(
                            '_',
                            ' ',
                          )}
                        </p>

                        {row.feelings
                          ?.length >
                        0 ? (
                          <p className="mt-1 text-xs font-semibold text-[#52617f]">
                            {row.feelings.join(
                              ', ',
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteCheckIn(
                          row._id,
                        )
                      }
                      className="inline-flex w-fit items-center gap-1 rounded-lg border border-[#f5d6df] px-2.5 py-1.5 text-xs font-black text-[#e91670]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#071426]">
                <ShieldCheck className="h-5 w-5 text-[#2563eb]" />
                Privacy Controls
              </h2>

              <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-[#52617f]">
                <input
                  type="checkbox"
                  checked={
                    !!privacy?.personalizeAiWithCheckIns
                  }
                  onChange={(e) =>
                    void updatePrivacy({
                      personalizeAiWithCheckIns:
                        e.target.checked,
                    })
                  }
                  className="mt-1 accent-[#7c3aed]"
                />

                <span>
                  Use my wellbeing
                  check-ins to
                  personalize AI
                  responses
                </span>
              </label>

              <label className="mt-3 flex items-start gap-3 text-sm font-semibold text-[#52617f]">
                <input
                  type="checkbox"
                  checked={
                    !!privacy?.storeAiChatHistory
                  }
                  onChange={(e) =>
                    void updatePrivacy({
                      storeAiChatHistory:
                        e.target.checked,
                    })
                  }
                  className="mt-1 accent-[#7c3aed]"
                />

                <span>
                  Store AI chat history
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
              <h2 className="text-lg font-black text-[#071426]">
                Common Feelings
              </h2>

              {trends
                ?.commonFeelings
                ?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {trends.commonFeelings.map(
                    (item: any) => (
                      <span
                        key={item.label}
                        className="rounded-full border border-[#dfe7fb] bg-[#f8fbff] px-3 py-1 text-xs font-black text-[#52617f]"
                      >
                        {item.label} ·{' '}
                        {item.count}
                      </span>
                    ),
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm font-semibold text-[#64748b]">
                  No feelings trend yet.
                </p>
              )}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
};

export default StudentWellbeing;
