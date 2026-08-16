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
  <div className="min-h-[390px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-hidden="true">
    <div className="flex items-center gap-3">
      <Skeleton className="h-16 w-16 rounded-full bg-rose-100" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="mt-6 h-44 w-full rounded-lg bg-gray-100" />
    <div className="mt-5 space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-10/12" />
      <Skeleton className="h-3 w-7/12" />
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
