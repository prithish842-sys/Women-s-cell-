import React from 'react';
import { RefreshCw } from 'lucide-react';

export const adminCard = 'rounded-xl border border-[#dfe7f6] bg-white shadow-[0_12px_30px_rgba(7,20,38,0.06)]';
export const adminButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#1554f6,#7c2dff)] px-4 text-xs font-black text-white shadow-[0_10px_22px_rgba(37,99,235,0.22)] transition hover:translate-y-[-1px]';
export const adminGhostButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe7f6] bg-white px-4 text-xs font-black text-[#10205a] transition hover:bg-[#f7faff]';
export const adminField = 'min-h-10 rounded-lg border border-[#dfe7f6] bg-white px-3 text-xs font-semibold text-[#10205a] outline-none focus:ring-2 focus:ring-blue-200';

export const formatNumber = (value: unknown) => Number(value || 0).toLocaleString('en-IN');

export const AdminStatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'blue' | 'purple' | 'teal' | 'green' | 'orange' | 'pink';
  footer?: React.ReactNode;
}> = ({ label, value, icon: Icon, tone = 'blue', footer }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-violet-50 text-violet-700',
    teal: 'bg-cyan-50 text-cyan-700',
    green: 'bg-emerald-50 text-emerald-700',
    orange: 'bg-orange-50 text-orange-700',
    pink: 'bg-pink-50 text-pink-700',
  };
  return (
    <article className={`${adminCard} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#10205a]">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-normal text-[#071247]">{value}</p>
        </div>
        <span className={`grid h-12 w-12 place-items-center rounded-full ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </span>
      </div>
      {footer && <div className="mt-5 border-t border-[#e8eef8] pt-3 text-xs font-bold text-[#10205a]">{footer}</div>}
    </article>
  );
};

export const AdminPageHeader: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-black tracking-normal text-[#071247]">{title}</h1>
      <p className="mt-1 text-sm font-semibold text-[#415176]">{description}</p>
    </div>
    {action}
  </section>
);

export const AdminNotice: React.FC<{ type: 'error' | 'success'; children: React.ReactNode; onRetry?: () => void }> = ({ type, children, onRetry }) => (
  <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-sm font-bold ${type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
    <span>{children}</span>
    {onRetry && (
      <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    )}
  </div>
);

export const AdminSkeletonBlock: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className={`${adminCard} p-4`} aria-busy="true">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="mb-3 h-12 rounded-lg bg-[#edf3ff] motion-safe:animate-pulse last:mb-0" />
    ))}
  </div>
);
