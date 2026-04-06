import React, { useState } from 'react';
import { Clock, ImageOff, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export const ItemCard = ({
  title,
  imageUrl,
  drawDate,
  status,
  participants,
  ownerAvatar,
  ownerName,
  category,
  city,
  district,
  selectionType,
  shareType,
  postType,
  deliveryMethods,
  isFavorited,
  onFavoriteToggle,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate if ended
  const isEnded =
    status === 'GIVEN_AWAY' ||
    status === 'DRAW_PENDING' ||
    (drawDate && new Date(drawDate) < new Date());

  const parsedDrawDate = drawDate ? new Date(drawDate) : null;
  const hasValidDrawDate =
    parsedDrawDate && !Number.isNaN(parsedDrawDate.getTime());

  // Time ago string
  const timeAgoStr = hasValidDrawDate
    ? formatDistanceToNow(parsedDrawDate, { locale: tr })
    : '';
  const dateLabel = hasValidDrawDate
    ? format(parsedDrawDate, 'd MMM', { locale: tr })
    : null;
  const locationLabel =
    city && district ? `${district}, ${city}` : district || city;
  const cardStatCount = Number(participants) || 0;
  const statLabel =
    postType === 'REQUESTING'
      ? null
      : shareType === 'exchange'
        ? `${cardStatCount} Teklif Verildi`
        : cardStatCount > 0
          ? `${cardStatCount} Kişi Katıldı`
          : null;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative h-full w-full overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl flex flex-col ${postType === 'REQUESTING' ? 'bg-blue-50/40 border border-blue-200 shadow-[0_4px_16px_rgba(59,130,246,0.2)]' : 'bg-white border border-slate-100'}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-100 sm:aspect-[4/5]">
        {/* Skeleton placeholder */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}

        {imageError || !imageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
            <ImageOff className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-sm font-medium opacity-70">Görsel Yok</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Top Badges Area */}
        <div className="absolute left-0 top-2 z-30 flex w-full items-start justify-between px-2.5 pointer-events-none sm:top-3 sm:px-3">
          {/* Left Badges */}
          <div className="flex flex-col items-start gap-1.5 pointer-events-auto sm:gap-2">
            {postType === 'REQUESTING' && (
              <div className="rounded-full border border-blue-500 bg-blue-600 px-2.5 py-1 text-[10px] font-black tracking-wide text-white shadow-sm sm:px-3 sm:text-xs">
                VAR MI
              </div>
            )}

            {/* Selection Type Badge */}
            {selectionType &&
              shareType !== 'exchange' &&
              postType !== 'REQUESTING' && (
                <div
                  className={`flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-sm sm:px-3 sm:text-xs ${selectionType === 'manual' ? 'text-violet-700' : 'text-purple-700'}`}
                >
                  <span>
                    {selectionType === 'manual' ? '👆 Döngüde' : '🎲 Çekiliş'}
                  </span>
                </div>
              )}

            {/* Trade Badge */}
            {shareType === 'exchange' && (
              <div className="flex items-center gap-1 rounded-full border border-emerald-400 bg-emerald-600/95 px-2.5 py-1 text-[10px] font-black text-white shadow-xl backdrop-blur-sm sm:px-3 sm:text-xs">
                <span className="text-xs sm:text-sm animate-pulse-slow">
                  🔄
                </span>{' '}
                TAKAS
              </div>
            )}

            {/* Completed Badge */}
            {isEnded && (
              <div className="flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-200 shadow-sm backdrop-blur-sm sm:text-xs">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>
                  {timeAgoStr ? `${timeAgoStr} önce bitti` : 'Tamamlandı'}
                </span>
              </div>
            )}
          </div>

          {/* Right Badges */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            {/* Favorite (Heart) Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onFavoriteToggle) onFavoriteToggle(e);
              }}
              className="rounded-full border border-white/50 bg-white/80 p-1.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-110 hover:bg-white group/fav sm:p-2"
            >
              <Heart
                className={`h-4 w-4 transition-colors duration-300 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover/fav:text-red-400'}`}
              />
            </button>
          </div>
        </div>

        {/* Category Badge */}
        {category && (
          <div className="absolute bottom-2 left-2 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-md sm:bottom-3 sm:left-3 sm:text-xs">
            {category}
          </div>
        )}

        {/* Hover effect overlay */}
        {!isEnded && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        {deliveryMethods && deliveryMethods.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {deliveryMethods.includes('mutual_agreement') && (
              <span className="rounded-md border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-600 sm:px-2 sm:text-[10px]">
                💬 Anlaşmalı Teslim
              </span>
            )}
            {(deliveryMethods.includes('shipping') ||
              deliveryMethods.includes('shipping_buyer') ||
              deliveryMethods.includes('shipping_seller')) && (
              <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 sm:px-2 sm:text-[10px]">
                📦 Kargo
              </span>
            )}
            {deliveryMethods.includes('pickup') && (
              <span className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 sm:px-2 sm:text-[10px]">
                📍 Gel-Al
              </span>
            )}
          </div>
        )}
        <h3 className="mb-1.5 min-h-[2.5rem] line-clamp-2 font-[Outfit] text-sm font-semibold leading-5 text-slate-800">
          {title}
        </h3>

        <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-gray-400">
          <span className="truncate text-gray-400">
            {locationLabel || 'Konum belirtilmedi'}
          </span>
          {dateLabel && (
            <span className="shrink-0 text-gray-400">{dateLabel}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full bg-slate-200">
              {ownerAvatar ? (
                <img
                  src={ownerAvatar}
                  alt="Owner"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-[9px] font-bold text-emerald-600">
                  {ownerName ? ownerName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            {ownerName && (
              <span className="truncate text-[10px] text-gray-400">
                {ownerName}
              </span>
            )}
          </div>

          {statLabel && (
            <span className="shrink-0 text-[10px] font-medium text-gray-400">
              {statLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
