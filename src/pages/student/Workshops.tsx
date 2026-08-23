import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

import api, {
  resolveUploadUrl,
} from '../../utils/api.js';

import { WorkshopRegistrationModal } from '../../components/workshops/WorkshopRegistrationModal.js';

const dateKey = (date: Date) => {
  const local = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const year = local.getFullYear();
  const month = String(
    local.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    local.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const StudentWorkshops: React.FC = () => {
  const [workshops, setWorkshops] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    registrationWorkshop,
    setRegistrationWorkshop,
  ] = useState<any>(null);

  const [
    selectedWorkshop,
    setSelectedWorkshop,
  ] = useState<any>(null);

  const [
    selectedDate,
    setSelectedDate,
  ] = useState('');

  const [calendarCursor, setCalendarCursor] =
    useState(() => {
      const now = new Date();

      return new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );
    });

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(
        '/students/me/workshops',
      );

      setWorkshops(
        Array.isArray(res.data.data)
          ? res.data.data
          : [],
      );
    } catch {
      setError(
        'Could not load published workshops and events.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const calendarDays = useMemo(() => {
    const first = new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth(),
      1,
    );

    const daysInMonth = new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth() + 1,
      0,
    ).getDate();

    const leading =
      first.getDay();

    return [
      ...Array.from(
        {
          length: leading,
        },
        () => null,
      ),

      ...Array.from(
        {
          length:
            daysInMonth,
        },
        (_, index) =>
          new Date(
            calendarCursor.getFullYear(),
            calendarCursor.getMonth(),
            index + 1,
          ),
      ),
    ];
  }, [calendarCursor]);

  const workshopsByDate =
    useMemo(() => {
      return workshops.reduce<
        Record<string, any[]>
      >((map, workshop) => {
        const key = dateKey(
          new Date(
            workshop.startDateTime,
          ),
        );

        map[key] = [
          ...(map[key] || []),
          workshop,
        ];

        return map;
      }, {});
    }, [workshops]);

  const shownWorkshops =
    useMemo(() => {
      if (selectedDate) {
        return (
          workshopsByDate[
            selectedDate
          ] || []
        );
      }

      return workshops;
    }, [
      selectedDate,
      workshops,
      workshopsByDate,
    ]);

  const registeredCount =
    workshops.filter(
      (workshop) =>
        [
          'REGISTERED',
          'ATTENDED',
        ].includes(
          workshop
            .participations?.[0]
            ?.status,
        ),
    ).length;

  const interestedCount =
    workshops.filter(
      (workshop) =>
        workshop
          .participations?.[0]
          ?.status ===
        'INTERESTED',
    ).length;

  const interest = async (
    id: string,
    status: string,
  ) => {
    try {
      await api.post(
        `/students/me/workshops/${id}/interest`,
        {
          status,
        },
      );

      await load();
    } catch {
      setError(
        'Could not update workshop interest.',
      );
    }
  };

  const moveMonth = (
    amount: number,
  ) => {
    setCalendarCursor(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            amount,
          1,
        ),
    );

    setSelectedDate('');
  };

  return (
    <div className="space-y-5 fade-in-up">
      {/* =============================================================== */}
      {/* INTRO                                                           */}
      {/* =============================================================== */}

      <section className="rounded-[24px] bg-[linear-gradient(135deg,#eef3ff,#f5f1ff_58%,#fff2f8)] p-5 shadow-[0_12px_30px_rgba(7,20,38,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2563eb]">
              Learn &amp; grow
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#071426]">
              Workshops &amp; Events
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#475569]">
              Admin and Faculty
              published activities
              appear automatically in
              the calendar and list
              below.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void load()
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#dfe7fb] bg-white px-4 py-2.5 text-xs font-black text-[#2563eb]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      {/* =============================================================== */}
      {/* LIVE COUNTS                                                     */}
      {/* =============================================================== */}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <CalendarDays className="h-5 w-5 text-[#2563eb]" />

          <p className="mt-3 text-xs font-bold text-[#52617f]">
            Published events
          </p>

          <p className="mt-1 text-2xl font-black text-[#071426]">
            {workshops.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <Users className="h-5 w-5 text-[#ec0b76]" />

          <p className="mt-3 text-xs font-bold text-[#52617f]">
            Your registrations
          </p>

          <p className="mt-1 text-2xl font-black text-[#071426]">
            {registeredCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)]">
          <Sparkles className="h-5 w-5 text-[#7c3aed]" />

          <p className="mt-3 text-xs font-bold text-[#52617f]">
            Interested
          </p>

          <p className="mt-1 text-2xl font-black text-[#071426]">
            {interestedCount}
          </p>
        </div>
      </section>

      {/* =============================================================== */}
      {/* CALENDAR                                                        */}
      {/* =============================================================== */}

      <section className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-[0_12px_26px_rgba(7,20,38,0.04)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[#071426]">
              {calendarCursor.toLocaleString(
                undefined,
                {
                  month: 'long',
                  year: 'numeric',
                },
              )}
            </h2>

            <p className="mt-1 text-xs font-semibold text-[#52617f]">
              Dates with published
              activities are marked.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedDate ? (
              <button
                type="button"
                onClick={() =>
                  setSelectedDate('')
                }
                className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#52617f]"
              >
                Show All
              </button>
            ) : null}

            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                moveMonth(-1)
              }
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7fb] text-[#2563eb]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                moveMonth(1)
              }
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7fb] text-[#2563eb]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-[#64748b] sm:gap-2 sm:text-xs">
          {[
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
          ].map((day) => (
            <span key={day}>
              {day}
            </span>
          ))}

          {calendarDays.map(
            (day, index) => {
              if (!day) {
                return (
                  <span
                    key={`blank-${index}`}
                    className="h-10 sm:h-11"
                  />
                );
              }

              const key =
                dateKey(day);

              const eventCount =
                workshopsByDate[
                  key
                ]?.length || 0;

              const active =
                selectedDate ===
                key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      active
                        ? ''
                        : key,
                    )
                  }
                  className={`relative h-10 rounded-lg border text-xs font-black transition sm:h-11 sm:rounded-xl sm:text-sm ${
                    active
                      ? 'border-[#2563eb] bg-[#2563eb] text-white'
                      : eventCount > 0
                        ? 'border-[#cfd8ff] bg-[#eef3ff] text-[#1d4ed8]'
                        : 'border-[#edf2fb] bg-white text-[#475569]'
                  }`}
                >
                  {day.getDate()}

                  {eventCount > 0 ? (
                    <>
                      <span
                        className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                          active
                            ? 'bg-white'
                            : 'bg-[#e91670]'
                        }`}
                      />

                      <span className="sr-only">
                        {eventCount}{' '}
                        event
                        {eventCount ===
                        1
                          ? ''
                          : 's'}
                      </span>
                    </>
                  ) : null}
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* =============================================================== */}
      {/* LIST                                                            */}
      {/* =============================================================== */}

      {loading ? (
        <div className="h-48 animate-pulse rounded-xl border border-[#e4eaff] bg-white" />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : workshops.length ===
        0 ? (
        <div className="rounded-xl border border-[#e4eaff] bg-white py-12 text-center text-sm font-semibold text-[#64748b]">
          No published workshops
          yet.
        </div>
      ) : shownWorkshops.length ===
        0 ? (
        <div className="rounded-xl border border-[#e4eaff] bg-white py-10 text-center text-sm font-semibold text-[#64748b]">
          No workshop is scheduled
          on the selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {shownWorkshops.map(
            (workshop) => {
              const participation =
                workshop
                  .participations?.[0];

              return (
                <article
                  key={workshop._id}
                  className="overflow-hidden rounded-[22px] border border-[#edf2fb] bg-white shadow-[0_12px_28px_rgba(7,20,38,0.04)]"
                >
                  {workshop.posterImage ? (
                    <img
                      src={resolveUploadUrl(
                        workshop.posterImage,
                      )}
                      alt=""
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-32 place-items-center bg-[linear-gradient(135deg,#eef3ff,#f5f1ff)]">
                      <CalendarDays className="h-10 w-10 text-[#7c3aed]" />
                    </div>
                  )}

                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-[10px] font-bold text-[#2563eb]">
                        {
                          workshop.status
                        }
                      </span>

                      {workshop.category ? (
                        <span className="rounded-full bg-[#fff0f6] px-2 py-0.5 text-[10px] font-bold text-[#e91670]">
                          {workshop.category.replaceAll(
                            '_',
                            ' ',
                          )}
                        </span>
                      ) : null}

                      {participation ? (
                        <span className="rounded-full bg-[#ebfff5] px-2 py-0.5 text-[10px] font-bold text-[#0a8f6f]">
                          {
                            participation.status
                          }
                        </span>
                      ) : null}
                    </div>

                    <h3 className="text-xl font-black tracking-[-0.02em] text-[#071426]">
                      {workshop.title}
                    </h3>

                    <p className="line-clamp-3 text-xs font-semibold leading-5 text-[#52617f]">
                      {
                        workshop.shortDescription
                      }
                    </p>

                    <p className="flex items-center gap-1 text-[11px] font-semibold text-[#64748b]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(
                        workshop.startDateTime,
                      ).toLocaleString()}
                    </p>

                    <p className="flex items-center gap-1 text-[11px] font-semibold text-[#64748b]">
                      <MapPin className="h-3.5 w-3.5" />
                      {workshop.venue ||
                        'Venue pending'}
                    </p>

                    <div className="flex flex-wrap gap-2 border-t border-[#edf2fb] pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedWorkshop(
                            workshop,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#2563eb]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View Details
                      </button>

                      {!participation ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void interest(
                                workshop._id,
                                'INTERESTED',
                              )
                            }
                            className="rounded-lg border border-[#dfe7fb] px-3 py-2 text-xs font-black text-[#7c3aed]"
                          >
                            Interested
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setRegistrationWorkshop(
                                workshop,
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-3 py-2 text-xs font-black text-white shadow-[0_10px_20px_rgba(49,102,224,0.2)]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Register
                          </button>
                        </>
                      ) : participation.status ===
                        'INTERESTED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRegistrationWorkshop(
                              workshop,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-3 py-2 text-xs font-black text-white"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Register
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* DETAILS MODAL                                                   */}
      {/* =============================================================== */}

      {selectedWorkshop ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 grid place-items-center bg-[#020817]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedWorkshop(
                null,
              );
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedWorkshop.title} details`}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_80px_rgba(2,8,23,0.35)]"
          >
            {selectedWorkshop.posterImage ? (
              <img
                src={resolveUploadUrl(
                  selectedWorkshop.posterImage,
                )}
                alt=""
                className="h-56 w-full object-cover"
              />
            ) : null}

            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-full bg-[#eef3ff] px-2.5 py-1 text-[10px] font-black text-[#2563eb]">
                    {selectedWorkshop.category?.replaceAll(
                      '_',
                      ' ',
                    ) ||
                      'WORKSHOP'}
                  </span>

                  <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#071426]">
                    {
                      selectedWorkshop.title
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close details"
                  onClick={() =>
                    setSelectedWorkshop(
                      null,
                    )
                  }
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#dfe7fb] text-[#52617f]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailRow
                  label="Starts"
                  value={new Date(
                    selectedWorkshop.startDateTime,
                  ).toLocaleString()}
                />

                <DetailRow
                  label="Ends"
                  value={new Date(
                    selectedWorkshop.endDateTime,
                  ).toLocaleString()}
                />

                <DetailRow
                  label="Venue"
                  value={
                    selectedWorkshop.venue ||
                    'Venue pending'
                  }
                />

                <DetailRow
                  label="Organizer"
                  value={
                    selectedWorkshop.organizer ||
                    'Not specified'
                  }
                />
              </div>

              <p className="mt-5 whitespace-pre-line text-sm font-semibold leading-7 text-[#52617f]">
                {
                  selectedWorkshop.fullDescription ||
                  selectedWorkshop.shortDescription
                }
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegistrationWorkshop(
                      selectedWorkshop,
                    );

                    setSelectedWorkshop(
                      null,
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-2.5 text-xs font-black text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Register
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedWorkshop(
                      null,
                    )
                  }
                  className="rounded-lg border border-[#dfe7fb] px-4 py-2.5 text-xs font-black text-[#52617f]"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <WorkshopRegistrationModal
        workshop={
          registrationWorkshop
        }
        open={
          !!registrationWorkshop
        }
        onClose={() =>
          setRegistrationWorkshop(
            null,
          )
        }
        onSuccess={load}
      />
    </div>
  );
};

const DetailRow: React.FC<{
  label: string;
  value: string;
}> = ({
  label,
  value,
}) => (
  <div className="rounded-xl border border-[#e4eaff] bg-[#f8fbff] p-3">
    <span className="text-[10px] font-black uppercase tracking-wide text-[#64748b]">
      {label}
    </span>

    <p className="mt-1 text-sm font-black leading-5 text-[#071426]">
      {value}
    </p>
  </div>
);

export default StudentWorkshops;
