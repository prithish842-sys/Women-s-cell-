import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  ImagePlus,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

import api, { resolveUploadUrl } from '../../utils/api.js';

type Workshop = {
  _id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string;
  description?: string;
  category?: string;
  startDateTime: string;
  endDateTime?: string;
  venue?: string;
  organizer?: string;
  targetAudience?: string;
  maximumParticipants?: number | null;
  posterImage?: string;
  status?: string;
  interestedCount?: number;
  attendedCount?: number;
  isPublished?: boolean;
  isCancelled?: boolean;
  createdBy?: {
    id?: string;
    name?: string;
    role?: string;
  };
};

type WorkshopRegistration = {
  _id: string;
  status: string;
  registeredAt?: string;
  attendanceMarkedAt?: string;
  student: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    registerNumber?: string;
    department?: string;
    course?: string;
    programLevel?: 'UG' | 'PG';
  };
};

type DepartmentBreakdown = {
  department: string;
  total: number;
  ug: number;
  pg: number;
};

type WorkshopForm = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  startDateTime: string;
  endDateTime: string;
  venue: string;
  organizer: string;
  targetAudience: string;
  maximumParticipants: string;
};

const CATEGORY_OPTIONS = [
  'SKILL_DEVELOPMENT',
  'AWARENESS',
  'ENTREPRENEURSHIP',
  'CAREER',
  'SAFETY',
  'HEALTH',
  'COMPETITION',
  'LEADERSHIP',
  'OTHER',
];

const createInitialForm = (): WorkshopForm => ({
  title: '',
  shortDescription: '',
  fullDescription: '',
  category: 'SKILL_DEVELOPMENT',
  startDateTime: '',
  endDateTime: '',
  venue: '',
  organizer: '',
  targetAudience: '',
  maximumParticipants: '',
});

const localDateKey = (input: Date | string) => {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const csvEscape = (value: unknown) => {
  const text = String(value ?? '');

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
};

const downloadCsv = (filename: string, rows: unknown[][]) => {
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const FacultyWorkshops: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState('');
  const [reportSummary, setReportSummary] = useState<any>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<WorkshopForm>(createInitialForm);
  const [poster, setPoster] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createMessage, setCreateMessage] = useState('');

  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [workshopResponse, dashboardResponse, updatesResponse] =
        await Promise.allSettled([
          api.get('/faculty/workshops', {
            params: {
              page: 1,
              limit: 100,
            },
          }),
          api.get('/faculty/dashboard'),
          api.get('/faculty/role-updates'),
        ]);

      if (workshopResponse.status === 'fulfilled') {
        setWorkshops(
          Array.isArray(workshopResponse.value.data?.data)
            ? workshopResponse.value.data.data
            : [],
        );
      } else {
        throw new Error('Workshop calendar request failed.');
      }

      const dashboard =
        dashboardResponse.status === 'fulfilled'
          ? dashboardResponse.value.data?.data?.metrics ||
            dashboardResponse.value.data?.data ||
            {}
          : {};

      const roleData =
        updatesResponse.status === 'fulfilled'
          ? updatesResponse.value.data?.data || {}
          : {};

      const updates = Array.isArray(roleData.updates) ? roleData.updates : [];

      setReportSummary({
        totalStudents: dashboard.totalStudents || 0,
        activeStudents: dashboard.activeStudents || 0,
        singaPenMembers: dashboard.singaPenMembers || 0,
        availableForCollaboration: dashboard.availableForCollaboration || 0,
        departmentBreakdown: Array.isArray(dashboard.departmentBreakdown)
          ? dashboard.departmentBreakdown
          : [],
        programLevelSummary: dashboard.programLevelSummary || {
          UG: 0,
          PG: 0,
        },
        roleUpdates: updates.length,
        roleSummary: roleData.summary || {
          submitted: 0,
          reviewed: 0,
          followUpRequired: 0,
          completed: 0,
        },
      });
    } catch (loadError) {
      console.error('Could not load Faculty Workshop page:', loadError);
      setError(
        'Could not load the faculty workshop calendar. Please retry after checking the backend connection.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => new Date(year, month, index + 1),
      ),
    ];
  }, [calendarMonth]);

  const workshopsByDate = useMemo(
    () =>
      workshops.reduce<Record<string, Workshop[]>>((map, workshop) => {
        const key = localDateKey(workshop.startDateTime);

        if (!key) return map;

        map[key] = [...(map[key] || []), workshop];
        return map;
      }, {}),
    [workshops],
  );

  const shownWorkshops = selectedDate
    ? workshopsByDate[selectedDate] || []
    : workshops;

  const upcomingCount = useMemo(
    () =>
      workshops.filter(
        (item) =>
          !item.isCancelled &&
          new Date(item.startDateTime).getTime() >= Date.now(),
      ).length,
    [workshops],
  );

  const totalRegistrations = useMemo(
    () =>
      workshops.reduce(
        (total, item) => total + Number(item.interestedCount || 0),
        0,
      ),
    [workshops],
  );

  const totalAttendance = useMemo(
    () =>
      workshops.reduce(
        (total, item) => total + Number(item.attendedCount || 0),
        0,
      ),
    [workshops],
  );

  const changeForm = (field: keyof WorkshopForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitWorkshop = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError('');
    setCreateMessage('');

    if (new Date(form.endDateTime) < new Date(form.startDateTime)) {
      setCreateError('End date/time cannot be earlier than start date/time.');
      return;
    }

    setCreating(true);

    try {
      const body = new FormData();

      body.append('title', form.title.trim());
      body.append('shortDescription', form.shortDescription.trim());
      body.append('fullDescription', form.fullDescription.trim());
      body.append('category', form.category);
      body.append('startDateTime', new Date(form.startDateTime).toISOString());
      body.append('endDateTime', new Date(form.endDateTime).toISOString());
      body.append('venue', form.venue.trim());
      body.append('organizer', form.organizer.trim());
      body.append('targetAudience', form.targetAudience.trim());
      body.append('isPublished', 'true');

      if (form.maximumParticipants.trim()) {
        body.append('maximumParticipants', form.maximumParticipants.trim());
      }

      if (poster) {
        body.append('poster', poster);
      }

      const response = await api.post('/faculty/workshops', body);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not create workshop.');
      }

      setCreateMessage('Workshop created and published successfully.');
      setForm(createInitialForm());
      setPoster(null);

      await load();

      window.setTimeout(() => {
        setCreateOpen(false);
        setCreateMessage('');
      }, 700);
    } catch (submitError: any) {
      setCreateError(
        submitError.response?.data?.message ||
          submitError.response?.data?.errors?.[0]?.message ||
          (submitError as Error).message ||
          'Could not create workshop.',
      );
    } finally {
      setCreating(false);
    }
  };

  const openWorkshop = async (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setRegistrations([]);
    setRegistrationsLoading(true);

    try {
      const response = await api.get(
        `/faculty/workshops/${workshop._id}/registrations`,
      );

      setRegistrations(
        Array.isArray(response.data?.data) ? response.data.data : [],
      );
    } catch (registrationError) {
      console.error('Could not load workshop registrations:', registrationError);
      setRegistrations([]);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const downloadWorkshopReport = () => {
    downloadCsv('faculty-workshop-report.csv', [
      [
        'Title',
        'Category',
        'Start',
        'End',
        'Venue',
        'Organizer',
        'Created By',
        'Status',
        'Registered / Interested',
        'Attended',
      ],
      ...workshops.map((workshop) => [
        workshop.title,
        workshop.category || '',
        new Date(workshop.startDateTime).toLocaleString(),
        workshop.endDateTime
          ? new Date(workshop.endDateTime).toLocaleString()
          : '',
        workshop.venue || '',
        workshop.organizer || '',
        workshop.createdBy?.name || '',
        workshop.status || '',
        workshop.interestedCount || 0,
        workshop.attendedCount || 0,
      ]),
    ]);
  };

  const downloadDepartmentReport = () => {
    const departments: DepartmentBreakdown[] =
      reportSummary?.departmentBreakdown || [];

    downloadCsv('faculty-student-department-report.csv', [
      ['Department', 'UG', 'PG', 'Total'],
      ...departments.map((item) => [
        item.department,
        item.ug,
        item.pg,
        item.total,
      ]),
      [],
      ['Program Level', 'Count'],
      ['UG', reportSummary?.programLevelSummary?.UG || 0],
      ['PG', reportSummary?.programLevelSummary?.PG || 0],
    ]);
  };

  const previousMonth = () => {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
    setSelectedDate('');
  };

  const nextMonth = () => {
    setCalendarMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
    setSelectedDate('');
  };

  return (
    <div className="space-y-5 fade-in-up">
      <section className="flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(110deg,#06123a,#2026a8_58%,#ec0875)] p-5 text-white shadow-[0_18px_38px_rgba(23,24,104,0.2)] sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/65">
            Workshop calendar + reports
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
            Workshops & Events
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-white/75">
            Admin and Faculty activities share the same live calendar. Create a
            workshop, review participation and download current report data from
            this single page.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-black text-[#1d4ed8]"
          >
            <Plus className="h-4 w-4" />
            Add Event / Workshop
          </button>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-black"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Published / visible events"
          value={workshops.length}
          icon={<CalendarDays className="h-5 w-5 text-[#2563eb]" />}
        />
        <Metric label="Upcoming" value={upcomingCount} />
        <Metric
          label="Registered / interested"
          value={totalRegistrations}
          icon={<Users className="h-5 w-5 text-[#7c3aed]" />}
        />
        <Metric
          label="Attendance"
          value={totalAttendance}
          icon={<ShieldCheck className="h-5 w-5 text-[#059669]" />}
        />
      </section>

      {reportSummary ? (
        <section className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#071426]">
                Faculty Reports
              </h2>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">
                The old Reports page is merged here. Department and UG/PG values
                come from live registered student records.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadWorkshopReport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#eef3ff] px-3 py-2 text-xs font-black text-[#2563eb]"
              >
                <Download className="h-4 w-4" />
                Workshop CSV
              </button>

              <button
                type="button"
                onClick={downloadDepartmentReport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#f4edff] px-3 py-2 text-xs font-black text-[#7c3aed]"
              >
                <Download className="h-4 w-4" />
                Department CSV
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <ReportMetric
              label="Students"
              value={reportSummary.totalStudents}
              icon={<Users className="h-4 w-4" />}
            />
            <ReportMetric
              label="Active"
              value={reportSummary.activeStudents}
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <ReportMetric
              label="UG"
              value={reportSummary.programLevelSummary?.UG || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <ReportMetric
              label="PG"
              value={reportSummary.programLevelSummary?.PG || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <ReportMetric
              label="Departments"
              value={reportSummary.departmentBreakdown?.length || 0}
              icon={<FileText className="h-4 w-4" />}
            />
            <ReportMetric
              label="Awaiting review"
              value={reportSummary.roleSummary?.submitted || 0}
              icon={<FileText className="h-4 w-4" />}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(reportSummary.departmentBreakdown as DepartmentBreakdown[])
              .slice(0, 9)
              .map((item) => (
                <div
                  key={item.department}
                  className="rounded-xl border border-[#edf2fb] bg-[#fbfcff] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm font-black text-[#071426]">
                      {item.department}
                    </strong>
                    <span className="text-sm font-black text-[#2563eb]">
                      {item.total}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                    <span className="rounded-lg bg-[#eef3ff] px-2 py-1.5 text-[#2563eb]">
                      UG {item.ug}
                    </span>
                    <span className="rounded-lg bg-[#f4edff] px-2 py-1.5 text-[#7c3aed]">
                      PG {item.pg}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#e4eaff] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={previousMonth}
            aria-label="Previous month"
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#dfe7fb] text-[#2563eb]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-black text-[#071426]">
              {calendarMonth.toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#52617f]">
              Marked dates contain an Admin or Faculty event.
            </p>
          </div>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="grid h-10 w-10 place-items-center rounded-lg border border-[#dfe7fb] text-[#2563eb]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-[#52617f]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <span key={day}>{day}</span>
          ))}

          {calendarDays.map((day, index) => {
            if (!day) {
              return <span key={`blank-${index}`} className="h-11" />;
            }

            const key = localDateKey(day);
            const hasEvents = Boolean(workshopsByDate[key]?.length);
            const active = selectedDate === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSelectedDate((current) => (current === key ? '' : key))
                }
                className={`relative h-11 rounded-xl border text-sm font-black ${
                  active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : hasEvents
                      ? 'border-[#cfd8ff] bg-[#eef3ff] text-[#1d4ed8]'
                      : 'border-[#edf2fb] bg-white text-[#475569]'
                }`}
              >
                {day.getDate()}

                {hasEvents ? (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
                      active ? 'bg-white' : 'bg-[#e91670]'
                    }`}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {selectedDate ? (
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className="mt-4 rounded-lg border border-[#dfe9ff] px-3 py-2 text-xs font-black text-[#2563eb]"
          >
            Show all events
          </button>
        ) : null}
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-60 animate-pulse rounded-xl border bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-black"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : shownWorkshops.length === 0 ? (
        <div className="rounded-xl border border-[#e4eaff] bg-white p-10 text-center text-sm font-semibold text-[#64748b]">
          {selectedDate
            ? 'No activities are scheduled on this date.'
            : 'No workshops or events are available yet.'}
        </div>
      ) : (
        <section>
          <div className="mb-3">
            <h2 className="text-xl font-black text-[#071426]">
              {selectedDate ? 'Events on selected date' : 'All Workshops & Events'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[#64748b]">
              View the complete event information and participation report.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shownWorkshops.map((workshop) => (
              <article
                key={workshop._id}
                className="flex overflow-hidden rounded-xl border border-[#e4eaff] bg-white shadow-sm md:block"
              >
                <div className="h-32 w-28 shrink-0 bg-[#eef3ff] md:h-40 md:w-full">
                  {workshop.posterImage ? (
                    <img
                      src={resolveUploadUrl(workshop.posterImage)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[#8ba0cc]">
                      <CalendarDays className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3 p-4 md:p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[10px] font-black uppercase text-[#2563eb]">
                      {(workshop.category || 'Workshop').replaceAll('_', ' ')}
                    </span>
                    <span className="rounded-full bg-[#ebfff5] px-2 py-1 text-[10px] font-black uppercase text-[#0a8f6f]">
                      {workshop.status || 'Published'}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-lg font-black text-[#071426]">
                    {workshop.title}
                  </h3>

                  <p className="line-clamp-2 text-xs font-semibold leading-5 text-[#64748b]">
                    {workshop.shortDescription ||
                      workshop.description ||
                      'Published workshop activity.'}
                  </p>

                  <p className="flex items-center gap-2 text-xs font-bold text-[#52617f]">
                    <CalendarDays className="h-4 w-4 shrink-0 text-[#2563eb]" />
                    {new Date(workshop.startDateTime).toLocaleString()}
                  </p>

                  <p className="flex items-center gap-2 text-xs font-bold text-[#52617f]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#ec0b76]" />
                    {workshop.venue || 'Venue pending'}
                  </p>

                  <div className="flex items-center justify-between border-t border-[#eef2fb] pt-3">
                    <span className="text-[10px] font-bold text-[#64748b]">
                      {workshop.createdBy?.name
                        ? `Added by ${workshop.createdBy.name}`
                        : workshop.organizer || 'Portal event'}
                    </span>

                    <button
                      type="button"
                      onClick={() => void openWorkshop(workshop)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563eb] px-3 py-2 text-xs font-black text-white"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06123a]/70 p-4">
          <form
            onSubmit={submitWorkshop}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-[#071426]">
                  Add Event / Workshop
                </h2>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">
                  This uses the same Workshop database as Admin and Student
                  calendars.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close create workshop"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f4f6fb] text-[#64748b]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                value={form.title}
                onChange={(value) => changeForm('title', value)}
                placeholder="Workshop / event title"
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-[#52617f]">
                  Category
                </span>
                <select
                  value={form.category}
                  onChange={(event) => changeForm('category', event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#dfe7fb] bg-white px-3 text-sm font-semibold outline-none focus:border-[#2563eb]"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <Field
                label="Start date & time"
                type="datetime-local"
                value={form.startDateTime}
                onChange={(value) => changeForm('startDateTime', value)}
              />

              <Field
                label="End date & time"
                type="datetime-local"
                value={form.endDateTime}
                onChange={(value) => changeForm('endDateTime', value)}
              />

              <Field
                label="Venue"
                value={form.venue}
                onChange={(value) => changeForm('venue', value)}
                placeholder="Venue"
              />

              <Field
                label="Organizer"
                value={form.organizer}
                onChange={(value) => changeForm('organizer', value)}
                placeholder="Women's Empowerment Cell / Department"
              />

              <Field
                label="Target audience"
                value={form.targetAudience}
                onChange={(value) => changeForm('targetAudience', value)}
                placeholder="All students / final years / etc."
                required={false}
              />

              <Field
                label="Maximum participants"
                type="number"
                value={form.maximumParticipants}
                onChange={(value) => changeForm('maximumParticipants', value)}
                placeholder="Optional"
                required={false}
              />

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black text-[#52617f]">
                  Short description
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={300}
                  value={form.shortDescription}
                  onChange={(event) =>
                    changeForm('shortDescription', event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#2563eb]"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black text-[#52617f]">
                  Full description
                </span>
                <textarea
                  required
                  minLength={20}
                  maxLength={5000}
                  value={form.fullDescription}
                  onChange={(event) =>
                    changeForm('fullDescription', event.target.value)
                  }
                  rows={5}
                  className="w-full rounded-lg border border-[#dfe7fb] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#2563eb]"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-black text-[#52617f]">
                  Poster image (optional)
                </span>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#b9c9ef] bg-[#f8fbff] p-4">
                  <ImagePlus className="h-5 w-5 text-[#2563eb]" />
                  <span className="min-w-0 flex-1 text-xs font-semibold text-[#52617f]">
                    {poster?.name || 'Choose JPG, JPEG, PNG or WEBP'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      setPoster(event.target.files?.[0] || null)
                    }
                  />
                </label>
              </label>
            </div>

            {createMessage ? (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                {createMessage}
              </p>
            ) : null}

            {createError ? (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
                {createError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-[#dfe7fb] px-4 py-2.5 text-xs font-black text-[#52617f]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#2563eb,#7c3aed)] px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {creating ? 'Creating...' : 'Create & Publish'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedWorkshop ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06123a]/70 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2563eb]">
                  {(selectedWorkshop.category || 'Workshop').replaceAll('_', ' ')}
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#071426]">
                  {selectedWorkshop.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                aria-label="Close workshop details"
                className="grid h-9 w-9 place-items-center rounded-full bg-[#f4f6fb] text-[#64748b]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedWorkshop.posterImage ? (
              <img
                src={resolveUploadUrl(selectedWorkshop.posterImage)}
                alt=""
                className="mt-5 max-h-80 w-full rounded-xl object-cover"
              />
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                label="Start"
                value={new Date(selectedWorkshop.startDateTime).toLocaleString()}
              />
              <Detail
                label="End"
                value={
                  selectedWorkshop.endDateTime
                    ? new Date(selectedWorkshop.endDateTime).toLocaleString()
                    : 'Not listed'
                }
              />
              <Detail label="Venue" value={selectedWorkshop.venue || 'Not listed'} />
              <Detail
                label="Organizer"
                value={selectedWorkshop.organizer || 'Not listed'}
              />
              <Detail
                label="Created by"
                value={
                  selectedWorkshop.createdBy?.name ||
                  selectedWorkshop.organizer ||
                  'Portal'
                }
              />
              <Detail
                label="Target audience"
                value={selectedWorkshop.targetAudience || 'Not specified'}
              />
            </div>

            <section className="mt-5 rounded-xl border border-[#edf2fb] bg-[#fbfcff] p-4">
              <h3 className="text-sm font-black text-[#071426]">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#52617f]">
                {selectedWorkshop.fullDescription ||
                  selectedWorkshop.description ||
                  selectedWorkshop.shortDescription ||
                  'No description available.'}
              </p>
            </section>

            <section className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-[#071426]">
                    Registration Report
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#64748b]">
                    Read-only Faculty view of workshop participation.
                  </p>
                </div>

                {registrations.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      downloadCsv(`${selectedWorkshop.title}-registrations.csv`, [
                        [
                          'Name',
                          'Register Number',
                          'Department',
                          'Course',
                          'UG/PG',
                          'Email',
                          'Phone',
                          'Status',
                          'Registered At',
                        ],
                        ...registrations.map((row) => [
                          row.student.name,
                          row.student.registerNumber || '',
                          row.student.department || '',
                          row.student.course || '',
                          row.student.programLevel || '',
                          row.student.email || '',
                          row.student.phone || '',
                          row.status,
                          row.registeredAt
                            ? new Date(row.registeredAt).toLocaleString()
                            : '',
                        ]),
                      ])
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#eef3ff] px-3 py-2 text-xs font-black text-[#2563eb]"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                ) : null}
              </div>

              {registrationsLoading ? (
                <div className="mt-4 h-24 animate-pulse rounded-xl bg-[#f3f6fb]" />
              ) : registrations.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-[#dfe7fb] p-5 text-center text-xs font-semibold text-[#64748b]">
                  No student registration records yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-xl border border-[#e4eaff]">
                  <table className="min-w-full divide-y divide-[#edf2fb] text-left text-xs">
                    <thead className="bg-[#f8fbff] text-[#52617f]">
                      <tr>
                        <th className="px-3 py-2.5 font-black">Student</th>
                        <th className="px-3 py-2.5 font-black">Department</th>
                        <th className="px-3 py-2.5 font-black">Level</th>
                        <th className="px-3 py-2.5 font-black">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2fb] bg-white">
                      {registrations.slice(0, 50).map((row) => (
                        <tr key={row._id}>
                          <td className="px-3 py-3">
                            <p className="font-black text-[#071426]">
                              {row.student.name}
                            </p>
                            <p className="mt-0.5 text-[10px] font-semibold text-[#64748b]">
                              {row.student.registerNumber}
                            </p>
                          </td>
                          <td className="px-3 py-3 font-semibold text-[#52617f]">
                            {row.student.department || '-'}
                          </td>
                          <td className="px-3 py-3 font-black text-[#2563eb]">
                            {row.student.programLevel || '-'}
                          </td>
                          <td className="px-3 py-3 font-black text-[#059669]">
                            {row.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Metric: React.FC<{
  label: string;
  value: number;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-[#e4eaff] bg-white p-4 shadow-sm">
    {icon}
    <p className="mt-3 text-xs font-bold text-[#52617f]">{label}</p>
    <p className="mt-1 text-2xl font-black text-[#071426]">
      {Number(value || 0)}
    </p>
  </div>
);

const ReportMetric: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-lg border border-[#eef2fb] bg-[#fbfcff] p-3">
    <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-[#64748b]">
      {icon}
      {label}
    </span>
    <p className="mt-2 text-xl font-black text-[#071426]">
      {Number(value || 0)}
    </p>
  </div>
);

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = true,
}) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-black text-[#52617f]">
      {label}
    </span>
    <input
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-[#dfe7fb] px-3 text-sm font-semibold outline-none focus:border-[#2563eb]"
    />
  </label>
);

const Detail: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div className="rounded-xl border border-[#edf2fb] bg-[#fbfcff] p-4">
    <p className="text-[10px] font-black uppercase tracking-wide text-[#64748b]">
      {label}
    </p>
    <div className="mt-1 text-sm font-black text-[#071426]">{value}</div>
  </div>
);

export default FacultyWorkshops;
