import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

const uploadFolders = [
  'profiles',
  'skills',
  'gallery',
  'gallery/covers',
  'gallery/images',
  'achievements',
  'achievements/images',
  'achievements/certificates',
  'icc',
  'thumbnails',
];

for (const folder of uploadFolders) {
  fs.mkdirSync(path.join(UPLOAD_ROOT, folder), { recursive: true });
}

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const pdfMimeTypes = new Set(['application/pdf']);
const extensionByMime: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

function isAllowedExtension(file: Express.Multer.File, allowedMimeTypes: Set<string>) {
  const extension = path.extname(file.originalname).toLowerCase();
  return allowedMimeTypes.has(file.mimetype) && (extensionByMime[file.mimetype] || []).includes(extension);
}

function makeStorage(resolveFolder: (file: Express.Multer.File) => string) {
  return multer.diskStorage({
    destination: (_req, file, cb) => {
      const folder = resolveFolder(file);
      const destination = path.join(UPLOAD_ROOT, folder);
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    },
  });
}

function makeFilter(allowedMimeTypes: Set<string>) {
  return (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (isAllowedExtension(file, allowedMimeTypes)) {
      cb(null, true);
      return;
    }
    cb(new Error('Invalid file type or extension.'));
  };
}

const profileLimitMb = Number(process.env.PROFILE_IMAGE_MAX_SIZE_MB || 3);
const galleryLimitMb = Number(process.env.GALLERY_IMAGE_MAX_SIZE_MB || 8);
const achievementLimitMb = Number(process.env.ACHIEVEMENT_IMAGE_MAX_SIZE_MB || 5);
const certLimitMb = Number(process.env.CERTIFICATE_MAX_SIZE_MB || 10);

export const uploadProfile = multer({
  storage: makeStorage(() => 'profiles'),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: profileLimitMb * 1024 * 1024 },
});

export const uploadSkillCertificate = multer({
  storage: makeStorage(() => 'skills'),
  fileFilter: makeFilter(pdfMimeTypes),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
});

export const uploadGallery = multer({
  storage: makeStorage((file) => (file.fieldname === 'cover' || file.fieldname === 'coverImage' ? 'gallery/covers' : 'gallery/images')),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: galleryLimitMb * 1024 * 1024 },
});

export const uploadAchievementFiles = multer({
  storage: makeStorage((file) => (file.fieldname === 'certificate' ? 'achievements/certificates' : 'achievements/images')),
  fileFilter: (_req, file, cb) => {
    const allowed = file.fieldname === 'certificate' ? pdfMimeTypes : imageMimeTypes;
    if (isAllowedExtension(file, allowed)) {
      cb(null, true);
      return;
    }
    cb(new Error(file.fieldname === 'certificate' ? 'Only PDF certificate files are allowed.' : 'Only JPG, PNG, and WEBP images are allowed.'));
  },
  limits: { fileSize: Math.max(achievementLimitMb, certLimitMb) * 1024 * 1024 },
});

export const uploadCertificate = uploadAchievementFiles;
export const uploadIccAttachment = multer({
  storage: makeStorage(() => 'icc'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
});
export const upload = multer({
  storage: makeStorage(() => 'uploads'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
});
