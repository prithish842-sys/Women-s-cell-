import { resolveUploadUrl } from './api.js';
import fallbackProfile from '../assets/images/placeholders/default-profile.webp';

/*
 * Local Women’s Cell member photographs.
 *
 * This automatically loads supported image files from:
 *
 * src/assets/images/members/womens cell incharge/
 *
 * This allows existing local member photographs to be used even when
 * profileImage is not populated in the database.
 */
const localMemberImages = import.meta.glob(
  '../assets/images/members/womens cell incharge/*.{png,jpg,jpeg,webp,avif}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>;

const normalizeMemberName = (value = ''): string =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]/g, '');

const localPhotoEntries = Object.entries(localMemberImages).map(
  ([path, src]) => {
    const filename = path.split('/').pop() || path;

    return {
      key: normalizeMemberName(filename),
      src,
    };
  },
);

/*
 * Small aliases handle normal spelling/file-name differences.
 */
const memberPhotoAliases: Record<string, string[]> = {
  tharanip: [
    'tharanip',
    'tharani',
  ],

  sathypriyas: [
    'sathypriyas',
    'sathypriya',
    'sathyapriyas',
    'sathyapriya',
  ],
};

export const getMemberPhoto = (member: any): string => {
  const nameKey = normalizeMemberName(member?.name || '');

  const possibleNames = [
    nameKey,
    ...(memberPhotoAliases[nameKey] || []),
  ].filter(Boolean);

  const localPhoto = localPhotoEntries.find(({ key }) =>
    possibleNames.some(
      (candidate) =>
        key === candidate ||
        key.includes(candidate) ||
        candidate.includes(key),
    ),
  );

  /*
   * Priority:
   *
   * 1. Exact/local Women's Cell member photo
   * 2. Uploaded profile image from backend
   * 3. Existing default profile image
   */
  if (localPhoto?.src) {
    return localPhoto.src;
  }

  const uploadedPhoto = resolveUploadUrl(member?.profileImage);

  if (uploadedPhoto) {
    return uploadedPhoto;
  }

  return fallbackProfile;
};

export default getMemberPhoto;