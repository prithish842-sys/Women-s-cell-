import React from 'react';
import defaultProfileImage from '../assets/images/placeholders/default-profile.webp';
import { resolveUploadUrl } from './api.js';

export const galleryFallbackImage = '/uploads/placeholder_gallery.jpg';
export const profileFallbackImage = defaultProfileImage;

export function withResolvedImage(src?: string, fallback = galleryFallbackImage) {
  const value = src?.trim();
  return value ? resolveUploadUrl(value) : fallback;
}

export function assignImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string
) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}
