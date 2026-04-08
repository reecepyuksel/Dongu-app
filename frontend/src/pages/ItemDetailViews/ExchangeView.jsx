import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExchangeView = ({
  item,
  ownerName,
  ownerInitial,
  canChat,
  itemImages,
  currentImageIndex,
  setCurrentImageIndex,
  setTradeModalOpen,
  isFavorited,
  handleFavoriteToggle,
  isOwner,
  tradeOfferCount
}) => {
  const navigate = useNavigate();
  const activeImage = itemImages[currentImageIndex] || itemImages[0];

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-on-surface-variant text-sm">
        <span onClick={() => navigate('/')} className="hover:text-primary transition-colors cursor-pointer">Ana Sayfa</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="hover:text-primary transition-colors cursor-pointer">{item.category || 'Diğer'}</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-semibold text-primary">{item.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Image Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden aspect-[4/3] relative shadow-sm group">
            <img 
              src={activeImage} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute top-4 left-4 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg font-[Manrope]">
                Takaslık
            </div>
            
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
          
          {/* Image Gallery Thumbs */}
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {itemImages.map((img, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition-all ${currentImageIndex === idx ? 'border-2 border-emerald-400' : 'hover:ring-2 hover:ring-emerald-200'}`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details Section */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Product Header */}
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border-0">
             <div className="flex justify-between items-start mb-2">
                 <h1 className="text-3xl font-extrabold text-primary tracking-tight font-[Manrope]">{item.title}</h1>
                 <button onClick={handleFavoriteToggle} className="p-2 text-outline-variant hover:text-error transition-colors">
                     <span className="material-symbols-outlined" style={{ color: isFavorited ? '#ba1a1a' : '', fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                 </button>
             </div>
             
             <div className="flex items-center gap-2 mb-6">
                 <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                 <span className="text-secondary font-semibold text-sm">Takas Tekliflerine Açık</span>
                 <span className="text-outline-variant mx-2">•</span>
                 <div className="flex items-center text-on-surface-variant text-sm">
                     <span className="material-symbols-outlined text-sm mr-1">location_on</span>
                     {item.city}, {item.district}
                 </div>
             </div>

             <div className="p-4 bg-secondary-container/30 rounded-xl mb-6">
                 {item.tradePreferences ? (
                    <p className="text-on-secondary-container text-sm leading-relaxed">
                       <span className="font-bold">Arananlar:</span> {item.tradePreferences}
                    </p>
                 ) : (
                    <p className="text-on-secondary-container text-sm leading-relaxed">
                       Belirli bir arayış yok. Her türlü takas teklifine açık.
                    </p>
                 )}
             </div>

             {/* Action Buttons */}
             {item.status === 'AVAILABLE' && !isOwner && (
               <div className="flex flex-col gap-3">
                   <button 
                     onClick={() => setTradeModalOpen(true)}
                     className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                   >
                       <span className="material-symbols-outlined">swap_horiz</span>
                       Teklif Ver
                   </button>
                   {canChat && (
                     <button 
                       onClick={() => navigate(`/chat?partnerId=${item.owner.id}&partnerName=${encodeURIComponent(item.owner.fullName)}&itemId=${item.id}&itemTitle=${encodeURIComponent(item.title)}`)}
                       className="w-full py-3 bg-secondary-container text-on-secondary-container rounded-full font-semibold hover:bg-secondary-container/80 transition-all flex items-center justify-center gap-2"
                     >
                         <span className="material-symbols-outlined">chat</span>
                         Soru Sor
                     </button>
                   )}
               </div>
             )}

             {isOwner && (
                <button 
                  onClick={() => navigate('/trades')}
                  className="w-full py-4 bg-tertiary-fixed-dim/20 text-on-tertiary-fixed-variant rounded-full font-bold text-lg shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">inbox</span>
                    Teklifleri Gör ({tradeOfferCount})
                </button>
             )}
          </div>

          {/* Seller Card (LinkedIn Inspired) */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-0">
             <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-4">İlan Sahibi</h3>
             <div className="flex items-center gap-4 mb-4">
                 <div className="w-14 h-14 rounded-full bg-slate-200 object-cover ring-2 ring-emerald-50 flex items-center justify-center font-bold text-slate-500 text-xl overflow-hidden cursor-pointer" onClick={() => navigate(`/profile/${item.owner?.id}`)}>
                    {item.owner?.avatar ? <img src={item.owner.avatar} className="w-full h-full object-cover" /> : ownerInitial}
                 </div>
                 <div>
                     <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => navigate(`/profile/${item.owner?.id}`)}>
                         <span className="font-bold text-on-surface">{ownerName}</span>
                         <span className="material-symbols-outlined text-blue-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                     </div>
                     <p className="text-sm text-on-surface-variant">{item.owner?.karmaPoint || 0} Puan</p>
                 </div>
             </div>

             <div className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl">
                 <div className="flex-1 text-center border-r border-outline-variant/30">
                     <p className="text-xs text-outline mb-1 uppercase">Sistem</p>
                     <p className="text-lg font-bold text-emerald-600">Onaylı</p>
                 </div>
                 <div className="flex-1 text-center">
                     <p className="text-xs text-outline mb-1 uppercase">Teslimat</p>
                     <p className="text-xs mt-2 font-bold text-primary">{item.deliveryMethods?.includes('pickup') ? 'Elden Teslim' : 'Kargo / Param Güvende'}</p>
                 </div>
             </div>

             <button onClick={() => navigate(`/profile/${item.owner?.id}`)} className="w-full mt-4 py-2 border-2 border-outline-variant/20 rounded-xl text-sm font-semibold text-primary hover:bg-surface-container transition-colors">
                 Profili İncele
             </button>
          </div>

          {/* Description & Details */}
          <div className="bg-surface-container-low p-6 rounded-2xl">
             <h3 className="text-sm font-bold text-primary mb-3">İlan Detayları</h3>
             <div className="space-y-4">
                 <p className="text-sm text-on-surface-variant leading-relaxed pt-2 whitespace-pre-wrap">
                     {item.description}
                 </p>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExchangeView;
