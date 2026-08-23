/// <reference types="vite/client" />

import { resolveUploadUrl } from './api.js';
import fallbackProfile from '../assets/images/placeholders/default-profile.webp';

export interface PublicMember {
  _id: string;
  name: string;
  profileImage?: string | null;
  department?: string | null;
  course?: string | null;
  clubRole?: string | null;
  designation?: string | null;
  memberType?: string | null;
  academicStatus?: string | null;
  joiningAcademicYear?: string | null;
  currentStudyYear?: number | string | null;
  clubJoinedAt?: string | null;
  bio?: string | null;
  achievements?: string[];
  skills?: any[];
  entrepreneurship?: {
    interestedInEntrepreneurship?: boolean;
    businessIdea?: string;
    preferredIndustry?: string;
  };
  [key: string]: any;
}

const localMemberPhotos = import.meta.glob(
  '../assets/images/members/womens cell incharge/*.{png,jpg,jpeg,webp,avif,PNG,JPG,JPEG,WEBP,AVIF}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>;

const normalizeName = (value = '') =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const fileNameWithoutExtension = (path: string) => {
  const fileName = path.split('/').pop() || path;
  return fileName.replace(/\.[^.]+$/, '');
};

const photoIndex = Object.entries(localMemberPhotos).map(([path, src]) => ({
  key: normalizeName(fileNameWithoutExtension(path)),
  src,
}));

const aliases: Record<string, string[]> = {
  tharanip: ['tharanip', 'tharani'],
  sathypriyas: ['sathypriyas', 'sathypriya', 'sathyapriyas', 'sathyapriya'],
};

const findLocalPhoto = (memberName = '') => {
  const normalizedMemberName = normalizeName(memberName);
  if (!normalizedMemberName) return '';

  const candidates = [
    normalizedMemberName,
    ...(aliases[normalizedMemberName] || []),
  ]
    .map(normalizeName)
    .filter(Boolean);

  const exact = photoIndex.find(photo => candidates.includes(photo.key));
  if (exact) return exact.src;

  const fuzzy = photoIndex.find(photo =>
    candidates.some(candidate =>
      candidate.length >= 5
      && (photo.key.includes(candidate) || candidate.includes(photo.key)),
    ),
  );

  return fuzzy?.src || '';
};

export const getMemberPhoto = (
  member: Partial<PublicMember> | null | undefined,
): string => {
  if (!member) return fallbackProfile;

  const localPhoto = findLocalPhoto(member.name || '');
  if (localPhoto) return localPhoto;

  const uploadedPhoto = resolveUploadUrl(member.profileImage || '');
  return uploadedPhoto || fallbackProfile;
};

export const memberFallbackPhoto = fallbackProfile;
