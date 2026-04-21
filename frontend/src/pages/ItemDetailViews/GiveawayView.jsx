import React from 'react';
import { useNavigate } from 'react-router-dom';
import ItemPhotoStage from '../../components/ItemPhotoStage';

const GiveawayView = ({
  item,
  isOwner,
  canChat,
  itemPhotos,
  currentImageIndex,
  setCurrentImageIndex,
  setIsLightboxOpen,
  handleJoin,
  joining,
  isJoined,
  isFavorited,
  handleFavoriteToggle,
  isEnded,
}) => {
  const navigate = useNavigate();
  const activePhoto = itemPhotos[currentImageIndex] || itemPhotos[0];
  const ownerName = item.owner?.fullName || 'Anonim Gönüllü';
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const ownerAvatar = item.owner?.avatarUrl || null;

  return (
    <>
      <nav className="mb-8 flex items-center gap-2 px-1 text-sm text-on-surface-variant">
        <span
          onClick={() => navigate('/')}
          className="cursor-pointer transition-colors hover:text-primary"
        >
          Ana Sayfa
        </span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="cursor-pointer hover:text-primary transition-colors">
          İlanlarım
        </span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-medium text-on-surface">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-4">
          <ItemPhotoStage
            photo={activePhoto}
            alt={item.title}
            onOpen={() => setIsLightboxOpen(true)}
            className="w-full"
            maxViewportHeight={56}
          >
            {itemPhotos.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-4 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? itemPhotos.length - 1 : prev - 1,
                      );
                    }}
                    className="p-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full"
                  >
                    <span className="material-symbols-outlined">
                      chevron_left
                    </span>
                  </button>
                </div>
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === itemPhotos.length - 1 ? 0 : prev + 1,
                      );
                    }}
                    className="p-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full"
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </button>
                </div>
              </>

              <div className="absolute right-4 top-4 rounded-full bg-secondary-container/90 px-3 py-1.5 text-xs font-semibold text-on-secondary-container shadow-sm backdrop-blur-md">
                İkinci Şans
              </div>
            )}
          <div className="grid grid-cols-4 gap-3">
            {itemPhotos.map((photo, idx) => (
                <button
                key={idx}
                  type="button"
                onClick={() => setCurrentImageIndex(idx)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                    currentImageIndex === idx
                      ? 'border-primary-container'
                      : 'border-transparent hover:border-primary-container/50'
                  }`}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${idx}`}
                  className="w-full h-full object-cover"
                />
                </button>
            ))}
          </div>
        </div>

          <div className="flex flex-col space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-headline text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">
                  {item.title}
                </h1>
                <button
                  onClick={handleFavoriteToggle}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-primary"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      color: isFavorited ? '#ba1a1a' : '',
                      fontVariationSettings: isFavorited
                        ? "'FILL' 1"
                        : "'FILL' 0",
                    }}
                  >
                    favorite
                  </span>
                </button>
            </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span>{item.city}, {item.district}</span>
              </div>
                <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5">
                  <span className="material-symbols-outlined text-[18px]">category</span>
                <span>{item.category || 'Diğer'}</span>
              </div>
                <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-3 py-1.5">
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  <span>{item.createdAt ? 'Yeni eklendi' : 'Tarih bilinmiyor'}</span>
                </div>
            </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center gap-4">
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    alt={ownerName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-lg font-bold text-on-secondary-fixed-variant">
                    {ownerInitial}
                  </div>
                )}
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    {ownerName}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-amber-500 fill">star</span>
                    <span>{item.owner?.karmaPoint || 0} Puan</span>
                  </div>
                </div>
            </div>

              {canChat && (
                <button
                  onClick={() =>
                    navigate(
                      `/chat?partnerId=${item.owner.id}&partnerName=${encodeURIComponent(item.owner.fullName)}&itemId=${item.id}&itemTitle=${encodeURIComponent(item.title)}`,
                    )
                  }
                  className="w-full rounded-full bg-secondary-container px-5 py-2.5 text-sm font-medium text-on-secondary-container transition-colors hover:bg-[#b4ccbf] sm:w-auto"
                >
                  Mesaj Gönder
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                İlan Detayı
              </h2>
              <p className="font-body leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            <div className="pt-2">
              {item.status === 'AVAILABLE' && !isEnded && !isOwner && !isJoined && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-primary-container py-4 text-lg font-bold text-on-primary transition-all duration-300 active:scale-95 hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)]"
                >
                  <span className="material-symbols-outlined fill">handshake</span>
                  {joining ? 'İşleniyor...' : 'Döngüye Katıl'}
                </button>
              )}

              {isJoined && (
                <div className="w-full rounded-full bg-secondary-container py-4 text-center font-bold text-on-secondary-container">
                  Katılım Başarılı
              </div>
            )}

              {item.status === 'GIVEN_AWAY' && (
                <div className="w-full rounded-full bg-emerald-50 py-4 text-center font-bold text-emerald-700">
                  Döngü Tamamlandı
              </div>
            )}

              <p className="mt-3 text-center text-xs text-on-surface-variant">
                Bu eşyayı talep ederek döngüsel ekonomiye katkıda bulunuyorsunuz.
              </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GiveawayView;
