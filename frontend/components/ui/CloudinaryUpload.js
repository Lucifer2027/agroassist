'use client';

import React from 'react';
import { CldUploadButton, CldImage } from 'next-cloudinary';
import { Upload } from 'lucide-react';

/**
 * Reusable Cloudinary Next.js Starter Component
 * Supports direct Cloudinary upload & optimized rendering via next-cloudinary
 */
export function CloudinaryUpload({
  cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'agroassist',
  onUploadSuccess,
  onUploadError,
  uploadPreset = 'agroassist_unsigned',
  buttonText = 'Upload Image with Cloudinary',
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <CldUploadButton
        cloudName={cloudName}
        uploadPreset={uploadPreset}
        onSuccess={(result) => {
          if (result?.info && onUploadSuccess) {
            onUploadSuccess(result.info);
          }
        }}
        onError={(err) => {
          if (onUploadError) {
            onUploadError(err);
          }
        }}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition-colors cursor-pointer"
      >
        <Upload className="w-4 h-4" />
        <span>{buttonText}</span>
      </CldUploadButton>
    </div>
  );
}

export function CloudinaryImage({ src, alt, width = 800, height = 600, className = '' }) {
  if (!src) return null;

  // If public ID or Cloudinary URL is provided, use CldImage where appropriate
  if (typeof src === 'string' && !src.startsWith('http') && !src.startsWith('data:')) {
    return (
      <CldImage
        src={src}
        alt={alt || 'Crop Image'}
        width={width}
        height={height}
        className={className}
        crop="fit"
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Crop Image'}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
