import { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
export const PUBLIC_UPLOAD_ROOT = UPLOAD_ROOT;
export const PRIVATE_UPLOAD_ROOT = path.join(UPLOAD_ROOT, 'private');
export const PRIVATE_ICC_UPLOAD_ROOT = path.join(PRIVATE_UPLOAD_ROOT, 'icc');

const uploadFolders = [
  'profiles',
  'skills',
  'gallery',
  'gallery/covers',
  'gallery/images',
  'achievements',
  'achievements/images',
  'achievements/certificates',
  'private/icc',
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

function fileArrayFromRequest(req: Request) {
  const files: Express.Multer.File[] = [];
  if ((req as any).file) files.push((req as any).file);
  const requestFiles = (req as any).files;
  if (Array.isArray(requestFiles)) files.push(...requestFiles);
  else if (requestFiles && typeof requestFiles === 'object') {
    for (const value of Object.values(requestFiles)) {
      if (Array.isArray(value)) files.push(...value as Express.Multer.File[]);
    }
  }
  return files;
}

function removeUploadedFiles(files: Express.Multer.File[]) {
  for (const file of files) {
    if (file.path) fs.rmSync(file.path, { force: true });
  }
}

function hasSignature(buffer: Buffer, signature: number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

export async function validateFileSignature(file: Pick<Express.Multer.File, 'path' | 'mimetype'>) {
  const buffer = await fs.promises.readFile(file.path);
  if (file.mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (file.mimetype === 'image/webp') {
    return buffer.length >= 12
      && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
      && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (file.mimetype === 'application/pdf') {
    return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
}

const validateUploadedFileSignatures: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const files = fileArrayFromRequest(req);
  try {
    for (const file of files) {
      if (!(await validateFileSignature(file))) {
        removeUploadedFiles(files);
        return res.status(400).json({ success: false, message: 'Invalid file content.' });
      }
    }
    return next();
  } catch {
    removeUploadedFiles(files);
    return res.status(400).json({ success: false, message: 'Invalid file content.' });
  }
};

function secureUpload(upload: multer.Multer) {
  return {
    single: (fieldName: string) => [upload.single(fieldName), validateUploadedFileSignatures],
    array: (fieldName: string, maxCount?: number) => [upload.array(fieldName, maxCount), validateUploadedFileSignatures],
    fields: (fields: readonly multer.Field[]) => [upload.fields(fields), validateUploadedFileSignatures],
  };
}

const profileLimitMb = Number(process.env.PROFILE_IMAGE_MAX_SIZE_MB || 3);
const galleryLimitMb = Number(process.env.GALLERY_IMAGE_MAX_SIZE_MB || 8);
const achievementLimitMb = Number(process.env.ACHIEVEMENT_IMAGE_MAX_SIZE_MB || 5);
const certLimitMb = Number(process.env.CERTIFICATE_MAX_SIZE_MB || 10);

export const uploadProfile = secureUpload(multer({
  storage: makeStorage(() => 'profiles'),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: profileLimitMb * 1024 * 1024 },
}));

export const uploadSkillCertificate = secureUpload(multer({
  storage: makeStorage(() => 'skills'),
  fileFilter: makeFilter(pdfMimeTypes),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));

export const uploadGallery = secureUpload(multer({
  storage: makeStorage((file) => (file.fieldname === 'cover' || file.fieldname === 'coverImage' ? 'gallery/covers' : 'gallery/images')),
  fileFilter: makeFilter(imageMimeTypes),
  limits: { fileSize: galleryLimitMb * 1024 * 1024 },
}));

export const uploadAchievementFiles = secureUpload(multer({
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
}));

export const uploadCertificate = uploadAchievementFiles;
export const uploadIccAttachment = secureUpload(multer({
  storage: makeStorage(() => 'private/icc'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));
export const upload = secureUpload(multer({
  storage: makeStorage(() => 'uploads'),
  fileFilter: makeFilter(new Set([...imageMimeTypes, ...pdfMimeTypes])),
  limits: { fileSize: certLimitMb * 1024 * 1024 },
}));
