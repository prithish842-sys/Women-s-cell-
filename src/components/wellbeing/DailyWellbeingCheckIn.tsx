import React, { useEffect, useState } from 'react';

import {
  HeartPulse,
  RefreshCw,
} from 'lucide-react';

import api from '../../utils/api.js';

const moods = [
  { value: 'GREAT', label: 'Great', emoji: '😄' },
  { value: 'GOOD', label: 'Good', emoji: '🙂' },
  { value: 'OKAY', label: 'Okay', emoji: '😐' },
  { value: 'LOW', label: 'Low', emoji: '😔' },
  {
    value: 'OVERWHELMED',
    label: 'Overwhelmed',
    emoji: '😣',
  },
];

const sleep = [
  'POOR',
  'AVERAGE',
  'GOOD',
  'VERY_GOOD',
];

const feelings = [
  'Happy',
  'Calm',
  'Motivated',
  'Tired',
  'Anxious',
  'Stressed',
  'Lonely',
  'Sad',
  'Angry',
  'Confused',
  'Overwhelmed',
];

type CheckIn = {
  _id?: string;
  mood: string;
  stressLevel: number;
  energyLevel: number;
  sleepQuality: string;
  feelings: string[];
  reflection?: string;
};

interface DailyWellbeingCheckInProps {
  compact?: boolean;
  onSaved?: () => void;
}

export const DailyWellbeingCheckIn: React.FC<
  DailyWellbeingCheckInProps
> = ({
  compact = false,
  onSaved,
}) => {
  const [form, setForm] =
    useState<CheckIn>({
      mood: 'GOOD',
      stressLevel: 3,
      energyLevel: 3,
      sleepQuality: 'GOOD',
      feelings: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [collapsed, setCollapsed] =
    useState(false);

  useEffect(() => {
    let active = true;

    api
      .get('/wellbeing/me/today')
      .then((res) => {
        if (
          active &&
          res.data.data
        ) {
          setForm({
            ...res.data.data,
            feelings: Array.isArray(
              res.data.data.feelings,
            )
              ? res.data.data
                  .feelings
              : [],
          });
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'Could not load today’s check-in.',
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleFeeling = (
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      feelings:
        current.feelings.includes(
          value,
        )
          ? current.feelings.filter(
              (item) =>
                item !== value,
            )
          : [
              ...current.feelings,
              value,
            ],
    }));
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await api.put(
        '/wellbeing/me/today',
        form,
      );

      setForm(res.data.data);

      setMessage(
        'Today’s check-in has been saved.',
      );

      onSaved?.();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Could not save check-in.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (collapsed) {
    return (
      <section className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
        <button
          type="button"
          onClick={() =>
            setCollapsed(false)
          }
          className="inline-flex items-center gap-2 text-sm font-black text-[#2563eb]"
        >
          <HeartPulse className="h-4 w-4" />
          Check In Now
        </button>
      </section>
    );
  }

  return (
    <section
      className={`rounded-xl border border-[#e4eaff] bg-white shadow-[0_12px_26px_rgba(7,20,38,0.04)] ${
        compact
          ? 'p-4'
          : 'p-5 sm:p-6'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[#071426]">
            How are you feeling today?
          </h2>

          <p className="mt-1 text-sm font-semibold text-[#64748b]">
            Choose the emoji that feels closest.
            This optional check-in never blocks
            dashboard access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setCollapsed(true)
            }
            className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#2563eb]"
          >
            Remind Me Later
          </button>

          <button
            type="button"
            onClick={() =>
              setCollapsed(true)
            }
            className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#64748b]"
          >
            Skip Today
          </button>
        </div>
      </div>

      {loading ? (
        <div
          className="mt-5 grid grid-cols-5 gap-2"
          aria-busy="true"
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <span
              key={index}
              className="h-20 rounded-xl bg-gray-100 motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#64748b]">
              Mood
            </p>

            <div className="mt-2 grid grid-cols-5 gap-2">
              {moods.map((mood) => {
                const selected =
                  form.mood ===
                  mood.value;

                return (
                  <button
                    key={mood.value}
                    type="button"
                    aria-pressed={
                      selected
                    }
                    onClick={() =>
                      setForm(
                        (current) => ({
                          ...current,
                          mood: mood.value,
                        }),
                      )
                    }
                    className={`flex min-h-[78px] flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
                      selected
                        ? 'border-[#7c3aed] bg-[#f4f1ff] shadow-[0_8px_18px_rgba(124,58,237,0.12)]'
                        : 'border-[#e4eaff] bg-[#fbfcff] hover:border-[#cfd8ff]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="text-2xl sm:text-3xl"
                    >
                      {mood.emoji}
                    </span>

                    <span
                      className={`mt-1 text-[9px] font-black sm:text-[10px] ${
                        selected
                          ? 'text-[#6d28d9]'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#64748b]">
              Sleep Quality

              <select
                value={
                  form.sleepQuality
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    sleepQuality:
                      event.target
                        .value,
                  })
                }
                className="mt-1 w-full rounded-lg border border-[#dfe7fb] bg-white px-3 py-2.5 text-sm text-[#071426]"
              >
                {sleep.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item.replaceAll(
                        '_',
                        ' ',
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-[#64748b]">
                Stress:{' '}
                {form.stressLevel}
                /5

                <input
                  type="range"
                  min="1"
                  max="5"
                  value={
                    form.stressLevel
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      stressLevel:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                  className="mt-3 w-full accent-[#7c3aed]"
                />
              </label>

              <label className="space-y-1 text-xs font-bold text-[#64748b]">
                Energy:{' '}
                {form.energyLevel}
                /5

                <input
                  type="range"
                  min="1"
                  max="5"
                  value={
                    form.energyLevel
                  }
                  onChange={(
                    event,
                  ) =>
                    setForm({
                      ...form,
                      energyLevel:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                  className="mt-3 w-full accent-[#0891b2]"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#64748b]">
              Feelings
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {feelings.map(
                (item) => {
                  const selected =
                    form.feelings.includes(
                      item,
                    );

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        toggleFeeling(
                          item,
                        )
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        selected
                          ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                          : 'border-[#dfe7fb] bg-white text-[#52617f] hover:border-[#aebfff]'
                      }`}
                    >
                      {item}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <label className="block space-y-1 text-xs font-bold text-[#64748b]">
            Optional Reflection

            <textarea
              value={
                form.reflection ||
                ''
              }
              onChange={(
                event,
              ) =>
                setForm({
                  ...form,
                  reflection:
                    event.target
                      .value,
                })
              }
              rows={
                compact ? 2 : 4
              }
              placeholder="Want to write anything about how today is going?"
              className="mt-1 w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-normal text-[#071426]"
            />
          </label>

          {message ? (
            <p className="text-sm font-semibold text-[#059669]">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#dc2626]">
              <RefreshCw className="h-4 w-4" />
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-5 py-2.5 text-sm font-black text-white shadow-[0_10px_22px_rgba(49,102,224,0.18)] disabled:opacity-60"
          >
            {saving
              ? 'Saving...'
              : 'Save Check-In'}
          </button>
        </div>
      )}
    </section>
  );
};

export default DailyWellbeingCheckIn;
