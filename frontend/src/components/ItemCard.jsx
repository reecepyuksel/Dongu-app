/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import { Heart, ImageOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const ItemCard = ({
  title,
  imageUrl,
  drawDate,
  participants,
  pointValue,
  ownerAvatar,
  ownerName,
  category,
  city,
  district,
  shareType,
  postType,
  isFavorited,
  onFavoriteToggle,
  onJoinClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const locationLabel =
    city && district ? `${district}, ${city}` : district || city || 'Konum yok';

  const tag = useMemo(() => {
    if (postType === 'REQUESTING') {
      return { label: 'VAR MI?', className: 'bg-[#ffdad6] text-[#93000a]' };
    }
    if (shareType === 'exchange') {
      return { label: 'Takaslık', className: 'bg-[#1b2b41] text-white' };
    }
    return { label: 'Döngüde', className: 'bg-[#cde5d8] text-[#364b41]' };
  }, [postType, shareType]);

  const metaRight =
    postType === 'REQUESTING'
      ? 'Destek Bekliyor'
      : shareType === 'exchange'
        ? 'Takas'
        : pointValue
          ? `${pointValue} Puan`
          : `${Number(participants) || 0} Katılım`;

  const actionLabel =
    postType === 'REQUESTING'
      ? 'Bende Var!'
      : shareType === 'exchange'
        ? 'Teklif Ver'
        : 'Döngüye Katıl';

  const actionClassName =
    postType === 'REQUESTING'
      ? 'bg-[#e6e8ea] text-[#05162b]'
      : shareType === 'exchange'
        ? 'bg-[#cde5d8] text-[#364b41]'
        : 'bg-[#1b2b41] text-white';

  const drawLabel =
    drawDate && !Number.isNaN(new Date(drawDate).getTime())
      ? format(new Date(drawDate), 'd MMM', { locale: tr })
      : null;

  return (
    <motion.article
      whileHover={{ y: -4, scale: 1.01 }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_12px_32px_rgba(25,28,30,0.05)] transition-all"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eef1f3] p-3">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-3 animate-pulse rounded-[1rem] bg-[#e6e8ea]" />
        )}

        {imageError || !imageUrl ? (
          <div className="absolute inset-3 flex flex-col items-center justify-center rounded-[1rem] bg-white text-[#75777d]">
            <ImageOff className="h-10 w-10" />
            <span className="mt-1 text-xs font-semibold">Görsel Yok</span>
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden rounded-[1rem] bg-white">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.02] ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${tag.className}`}
          >
            {tag.label}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onFavoriteToggle) onFavoriteToggle(e);
          }}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-[#75777d] backdrop-blur-sm transition hover:scale-105"
          title="Favori"
        >
          <Heart
            className={`h-4 w-4 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-[#75777d]'
            }`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-[Manrope] text-[1rem] font-bold text-[#05162b]">
          {title}
        </h3>

        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#75777d]">
          <span className="truncate">{locationLabel}</span>
          {drawLabel && <span className="shrink-0">{drawLabel}</span>}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#f2f4f6] pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-6 w-6 overflow-hidden rounded-full bg-[#e0e3e5]">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt={ownerName || 'Kullanıcı'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#4d6359]">
                  {(ownerName || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="truncate text-[11px] font-semibold text-[#44474d]">
              {ownerName || 'Döngü Üyesi'}
            </span>
          </div>

          <span className="shrink-0 text-[11px] font-bold text-[#4d6359]">
            {metaRight}
          </span>
        </div>

        {category && (
          <div className="mb-3 mt-2">
            <span className="rounded-full bg-[#f2f4f6] px-2 py-1 text-[10px] font-semibold text-[#44474d]">
              {category}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            if (shareType === 'donation' && onJoinClick) {
              onJoinClick(e);
            }
          }}
          className={`mt-auto w-full rounded-full px-4 py-2.5 text-xs font-bold ${actionClassName}`}
        >
          {actionLabel}
        </button>
      </div>
    </motion.article>
  );
};
