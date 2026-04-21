import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import ItemPhotoStage from '../../components/ItemPhotoStage';

const RequestView = ({
  item,
  ownerName,
  ownerInitial,
  itemPhotos,
  handleBendeVarClick,
  joining,
  isOwner,
  isFavorited,
  handleFavoriteToggle,
  postedAgoStr,
}) => {
  const navigate = useNavigate();
  const activePhoto = itemPhotos[0] || null;

  return (
    <>
      <nav className="mb-8 flex items-center gap-2 text-sm text-on-surface-variant">
        <span
          onClick={() => navigate('/')}
          className="hover:text-primary cursor-pointer transition-colors"
        >
          Anasayfa
        </span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="cursor-pointer">{item.category || 'İlanlar'}</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-semibold text-primary">Var mı?</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Illustration/Visual Representation */}
        <div className="lg:col-span-7">
          <ItemPhotoStage photo={activePhoto} alt={item.title}>
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  search
                </span>
                Var mı? (Aranıyor)
              </span>
            </div>
            {(!item.imageUrl || item.imageUrl === '') && (
              <div className="p-6 bg-gradient-to-t from-black/20 to-transparent absolute bottom-0 w-full">
                <p className="text-white text-sm font-medium opacity-90 italic">
                  Temsili Görseldir
                </p>
              </div>
            )}
          </ItemPhotoStage>

          <div className="mt-6 bg-surface-container-low p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-primary mb-4">İlan Detayı</h3>
            <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap">
              {item.description}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              <div className="bg-surface-container-lowest p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">Durum</span>
                <span className="font-semibold text-primary">
                  {item.status === 'AVAILABLE' ? 'Aktif' : 'Bulundu'}
                </span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">
                  Puan Ödülü
                </span>
                <span className="font-semibold text-primary">
                  {item.karmaCost || 100}
                </span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl">
                <span className="text-xs text-slate-500 block mb-1">
                  Yayın Tarihi
                </span>
                <span className="font-semibold text-primary text-sm">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    locale: tr,
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Details and Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-extrabold text-primary leading-tight">
                Aranıyor: {item.title}
              </h1>
              <button
                onClick={handleFavoriteToggle}
                className="text-slate-400 hover:text-error transition-colors"
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

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-lg">
                  location_on
                </span>
                <span className="text-sm">
                  {item.city}, {item.district}
                </span>
              </div>
            </div>

            {/* Main Action Button */}
            {item.status === 'AVAILABLE' && !isOwner && (
              <>
                <button
                  onClick={handleBendeVarClick}
                  disabled={joining}
                  className="w-full bg-gradient-to-r from-[#05162b] to-[#1b2b41] text-white py-3.5 rounded-full font-bold text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {joining ? 'İşleniyor...' : 'Bende Var!'}
                </button>
                <p className="text-center text-xs text-on-surface-variant mt-4 px-4">
                  Bu butona tıklayarak ilan sahibine eşyanın fotoğraflarını
                  gönderebilir ve iletişime geçebilirsiniz.
                </p>
              </>
            )}
            {isOwner && (
              <div className="w-full p-4 bg-surface-container text-primary font-bold rounded-xl text-center border border-outline-variant/30">
                Senin İLANIN (Arayıştasın)
              </div>
            )}
            {item.status !== 'AVAILABLE' && (
              <div className="w-full p-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-center border border-emerald-100 flex justify-center items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">
                  check_circle
                </span>
                Bu ihtiyaç karşılandı!
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <div
              className="flex items-center gap-4 mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${item.owner?.id}`)}
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full object-cover border-2 border-secondary-fixed bg-secondary-fixed text-white flex items-center justify-center text-xl font-bold overflow-hidden">
                  {item.owner?.avatar ? (
                    <img
                      src={item.owner.avatar}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    ownerInitial
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-secondary text-white p-1 rounded-full border-2 border-white">
                  <span
                    className="material-symbols-outlined text-[10px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-primary text-lg">{ownerName}</h4>
                <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <span
                    className="material-symbols-outlined text-sm text-yellow-500"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-bold text-primary">
                    {item.owner?.karmaPoint || 0} Puan
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/profile/${item.owner?.id}`)}
              className="w-full mt-4 py-3 rounded-xl bg-secondary-container text-on-secondary-container font-semibold text-sm hover:opacity-90 transition-all"
            >
              Profili İncele
            </button>
          </div>

          <div className="bg-secondary-fixed p-6 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-on-secondary-fixed mb-2">
                <span className="material-symbols-outlined text-xl">
                  volunteer_activism
                </span>
                <span className="font-bold uppercase text-[10px] tracking-widest">
                  İyilik Protokolü
                </span>
              </div>
              <p className="text-on-secondary-fixed-variant text-sm font-medium">
                Döngü'de paylaşılan her eşya, karbon ayak izimizi azaltır ve
                topluluk bağlarımızı güçlendirir.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">eco</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestView;
