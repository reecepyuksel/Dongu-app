/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';

const DEFAULT_PHOTO_RATIO = 4 / 5;
const MIN_PHOTO_RATIO = 0.65;
const MAX_PHOTO_RATIO = 1.8;

function normalizePhotoAspectRatio(candidate) {
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    return DEFAULT_PHOTO_RATIO;
  }

  return Math.min(MAX_PHOTO_RATIO, Math.max(MIN_PHOTO_RATIO, candidate));
}

export default function ItemPhotoStage({
  photo,
  alt,
  onOpen,
  children,
  className = '',
  maxViewportHeight = 58,
}) {
  const [dynamicContainerRatio, setDynamicContainerRatio] = useState(
    normalizePhotoAspectRatio(photo?.photoAspectRatio),
  );

  useEffect(() => {
    const apiRatio = normalizePhotoAspectRatio(photo?.photoAspectRatio);

    if (photo?.photoAspectRatio) {
      setDynamicContainerRatio(apiRatio);
      return undefined;
    }

    if (!photo?.url) {
      setDynamicContainerRatio(DEFAULT_PHOTO_RATIO);
      return undefined;
    }

    let isCancelled = false;
    const probeImage = new Image();

    probeImage.onload = () => {
      if (isCancelled) return;
      const naturalWidth = probeImage.naturalWidth;
      const naturalHeight = probeImage.naturalHeight;
      const runtimeRatio =
        naturalWidth > 0 && naturalHeight > 0
          ? naturalWidth / naturalHeight
          : DEFAULT_PHOTO_RATIO;

      setDynamicContainerRatio(normalizePhotoAspectRatio(runtimeRatio));
    };

    probeImage.onerror = () => {
      if (!isCancelled) {
        setDynamicContainerRatio(DEFAULT_PHOTO_RATIO);
      }
    };

    probeImage.src = photo.url;

    return () => {
      isCancelled = true;
      probeImage.onload = null;
      probeImage.onerror = null;
    };
  }, [photo?.photoAspectRatio, photo?.url]);

  return (
    <div className={`relative flex justify-center ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-[#eef1f3] shadow-sm ${
          onOpen ? 'cursor-zoom-in' : ''
        }`}
        onClick={onOpen}
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onKeyDown={
          onOpen
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen();
                }
              }
            : undefined
        }
        style={{
          aspectRatio: String(dynamicContainerRatio),
          width: '100%',
          maxWidth: '100%',
          maxHeight: `${maxViewportHeight}vh`,
        }}
      >
        {photo?.url ? (
          <>
            <img
              src={photo.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover scale-105 blur-2xl opacity-18"
            />
            <div className="relative z-10 flex h-full w-full items-center justify-center bg-white/86 p-4 md:p-6 backdrop-blur-sm">
              <img
                src={photo.url}
                alt={alt}
                className="max-h-full max-w-full object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white text-sm font-medium text-slate-500">
            Görsel bulunamadı
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
