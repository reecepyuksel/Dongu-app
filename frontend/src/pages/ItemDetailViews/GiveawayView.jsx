import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Clock,
  MessageCircle,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GiveawayView = ({
  item,
  user,
  isAuthenticated,
  isOwner,
  isWinner,
  canChat,
  itemImages,
  currentImageIndex,
  setCurrentImageIndex,
  setIsLightboxOpen,
  handleJoin,
  joining,
  isJoined,
  isFavorited,
  handleFavoriteToggle,
  setConfirmModalOpen,
  handleDeliveryUpdate,
  postedAgoStr,
  timeAgoStr,
  isEnded,
  timeLeft,
  participants
}) => {
  const navigate = useNavigate();

  const activeImage = itemImages[currentImageIndex] || itemImages[0];
  const ownerName = item.owner?.fullName || 'Anonim Gönüllü';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-8 px-2">
        <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary transition-colors">İlanlar</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="cursor-pointer hover:text-primary transition-colors">{item.category || 'Diğer'}</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-medium text-primary">{item.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Gallery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-low shadow-sm cursor-pointer relative group" onClick={() => setIsLightboxOpen(true)}>
            <img 
              src={activeImage} 
              alt={item.title} 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
            />
            {/* Nav Arrows */}
            {itemImages.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-4 flex items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? itemImages.length - 1 : prev - 1); }}
                    className="p-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                </div>
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === itemImages.length - 1 ? 0 : prev + 1); }}
                    className="p-2 bg-white/50 hover:bg-white backdrop-blur-md rounded-full"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {itemImages.map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${currentImageIndex === idx ? 'border-2 border-primary' : 'bg-surface-container-low hover:opacity-80'}`}
              >
                <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details & Action */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border-0">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full tracking-wide uppercase">
                {item.status === 'AVAILABLE' ? 'DÖNGÜDE' : item.status === 'GIVEN_AWAY' ? 'TAMAMLANDI' : 'BEKLEMEDE'}
              </span>
              <div className="flex gap-2">
                 <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-outline">share</span>
                 </button>
                 <button onClick={handleFavoriteToggle} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined" style={{ color: isFavorited ? '#ba1a1a' : '', fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                 </button>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-primary mb-2 leading-tight">{item.title}</h1>
            <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-6">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>{item.city}, {item.district}</span>
              </div>
              <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">category</span>
                <span>{item.category || 'Diğer'}</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-8">
               {/* Show item points based on karma cost or simple display */}
               <span className="text-4xl font-black text-on-tertiary-container">{item.karmaCost || 100}</span>
               <span className="text-lg font-bold text-secondary">İyilik Puanı</span>
            </div>

            <div className="space-y-4 mb-10">
               <h3 className="font-bold text-primary flex items-center gap-2">
                 <span className="material-symbols-outlined text-secondary">description</span>
                 Ürün Açıklaması
               </h3>
               <p className="text-on-surface-variant leading-relaxed font-body whitespace-pre-wrap">
                 {item.description}
               </p>
            </div>

            {/* CTA Buttons */}
            {item.status === 'AVAILABLE' && !isEnded && !isOwner && (
               <>
                 {!isJoined ? (
                   <button 
                     onClick={handleJoin} 
                     disabled={joining}
                     className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
                   >
                     <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                     {joining ? 'İşleniyor...' : 'Döngüye Katıl'}
                   </button>
                 ) : (
                    <div className="w-full py-4 bg-secondary-container text-on-secondary-container rounded-[14px] font-bold flex items-center justify-center gap-2 mb-1">
                      <span className="material-symbols-outlined">check_circle</span>
                      Katılım Başarılı!
                    </div>
                 )}
                 <p className="text-center text-xs text-outline mt-4">Bu işlem {item.karmaCost || 100} İyilik Puanı karşılığında gerçekleşecektir.</p>
                 
                 {canChat && (
                    <button
                        onClick={() =>
                          navigate(
                            `/chat?partnerId=${item.owner.id}&partnerName=${encodeURIComponent(item.owner.fullName)}&itemId=${item.id}&itemTitle=${encodeURIComponent(item.title)}`
                          )
                        }
                        className="w-full mt-4 py-3 border-2 border-outline-variant/20 rounded-full font-semibold text-primary hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined">chat</span>
                        İlan Sahibine Soru Sor
                    </button>
                 )}
               </>
            )}
            
            {item.status === 'GIVEN_AWAY' && (
              <div className="w-full py-4 bg-emerald-50 text-emerald-700 rounded-xl text-center font-bold border border-emerald-100 flex flex-col items-center justify-center gap-2">
                <span className="text-2xl">🎉</span>
                Döngü Tamamlandı
              </div>
            )}
            
            {isOwner && item.status === 'AVAILABLE' && (
              <div className="w-full py-4 bg-surface-container-low text-primary rounded-xl text-center font-bold border border-surface-variant flex items-center justify-center gap-2">
                 Döngü Devam Ediyor
              </div>
            )}
          </div>

          {/* Seller Profile (LinkedIn Style) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-0 flex items-center gap-4 cursor-pointer hover:bg-surface-container-low transition-colors" onClick={() => navigate(`/profile/${item.owner?.id}`)}>
             <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-secondary-container/30 bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
               {ownerInitial}
             </div>
             <div className="flex-1">
                 <h4 className="font-bold text-primary text-lg">{ownerName}</h4>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant text-[10px] font-bold rounded uppercase tracking-tighter">
                      Onaylı Üye
                    </span>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                       <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                       {item.owner?.karmaPoint || 0} Puan
                    </div>
                 </div>
             </div>
             <button className="px-4 py-2 rounded-full border border-outline-variant text-sm font-semibold hover:bg-surface-container transition-colors">
                Profil
             </button>
          </div>

          {/* Trust Badge Section */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface-container-low/50 p-4 rounded-xl flex items-center gap-3">
               <span className="material-symbols-outlined text-secondary">verified_user</span>
               <span className="text-xs font-medium text-on-surface-variant">Güvenli Döngü</span>
             </div>
             <div className="bg-surface-container-low/50 p-4 rounded-xl flex items-center gap-3">
               <span className="material-symbols-outlined text-secondary">handshake</span>
               <span className="text-xs font-medium text-on-surface-variant text-left">
                  {item.deliveryMethods?.includes('pickup') ? 'Yüz Yüze Teslim' : 'Kargo ile Teslim'}
               </span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GiveawayView;
