import React from 'react';

type SkeletonProps = {
  className?: string;
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <span
    aria-hidden="true"
    className={`block rounded bg-gray-200/80 motion-safe:animate-pulse ${className}`}
  />
);

export const StatCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-gray-150 bg-white p-4 shadow-sm" aria-hidden="true">
    <Skeleton className="h-5 w-5 rounded-md bg-rose-100" />
    <Skeleton className="mt-3 h-3 w-24" />
    <Skeleton className="mt-3 h-8 w-16" />
  </div>
);

export const DashboardSkeleton: React.FC<{ cards?: number }> = ({ cards = 4 }) => (
  <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
    <div className="rounded-xl border border-gray-150 bg-white p-5 shadow-sm">
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-3 h-4 w-72 max-w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => <StatCardSkeleton key={index} />)}
    </div>
  </div>
);

export const SchemeCardSkeleton: React.FC = () => (
  <div className="flex min-h-64 flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-hidden="true">
    <div>
      <Skeleton className="h-5 w-20 bg-rose-100" />
      <Skeleton className="mt-4 h-5 w-4/5" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
      <Skeleton className="h-5 w-16 rounded-full bg-green-100" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export const MemberCardSkeleton: React.FC = () => (
  <div className="min-h-[318px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4" aria-hidden="true">
    <Skeleton className="h-[118px] w-[96px] rounded-xl bg-rose-100 sm:h-44 sm:w-full" />
    <div className="mt-4 space-y-2">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <div className="mt-5 flex items-center justify-between">
      <Skeleton className="h-7 w-24 rounded-full bg-rose-100" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

export const DetailPageSkeleton: React.FC = () => (
  <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading profile details">
    <Skeleton className="h-5 w-44" />
    <section className="overflow-hidden rounded-2xl border border-[#dfe7f6] bg-white shadow-sm">
      <div className="bg-[#102b72] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <Skeleton className="h-[190px] w-[150px] rounded-xl bg-white/20 sm:h-48 sm:w-48" />
          <div className="w-full flex-1 space-y-3">
            <Skeleton className="mx-auto h-7 w-36 bg-white/20 sm:mx-0" />
            <Skeleton className="mx-auto h-10 w-64 max-w-full bg-white/20 sm:mx-0" />
            <Skeleton className="mx-auto h-4 w-72 max-w-full bg-white/20 sm:mx-0" />
          </div>
        </div>
      </div>
      <div className="space-y-5 p-5 sm:p-8">
        <Skeleton className="h-4 w-36 bg-rose-100" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </section>
  </div>
);

export const AchievementCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-matte-beige bg-white p-5 shadow-sm" aria-hidden="true">
    <Skeleton className="h-5 w-28 bg-rose-100" />
    <Skeleton className="mt-4 h-5 w-4/5" />
    <Skeleton className="mt-3 h-16 w-full" />
    <div className="mt-5 border-t border-gray-100 pt-4">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-3 h-8 w-24" />
    </div>
  </div>
);

export const SkillCardSkeleton: React.FC = () => (
  <div className="min-h-72 rounded-lg border border-gray-200 bg-white p-5 shadow-sm" aria-hidden="true">
    <div className="flex gap-3">
      <Skeleton className="h-14 w-14 rounded-full bg-rose-100" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
    </div>
    <div className="mt-5 flex flex-wrap gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-16" />
    </div>
    <div className="mt-5 space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-10/12" />
      <Skeleton className="h-4 w-7/12" />
    </div>
  </div>
);

export const GalleryFolderSkeleton: React.FC = () => (
  <div className="min-h-[300px] rounded-2xl border border-matte-beige bg-white p-5 shadow-sm" aria-hidden="true">
    <Skeleton className="h-40 w-full rounded-xl bg-matte-cream" />
    <Skeleton className="mt-5 h-5 w-3/4" />
    <Skeleton className="mt-3 h-3 w-full" />
    <Skeleton className="mt-2 h-3 w-4/5" />
  </div>
);

export const NotificationListSkeleton: React.FC = () => (
  <div className="divide-y rounded-xl border bg-white shadow-sm" aria-busy="true" aria-label="Loading notifications">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="flex items-start gap-3 p-4">
        <Skeleton className="mt-1 h-4 w-4 rounded-full bg-rose-100" />
        <div className="flex-1">
          <Skeleton className="h-4 w-48 max-w-full" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      </div>
    ))}
  </div>
);
