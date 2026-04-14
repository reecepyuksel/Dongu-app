import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Users,
  ShieldCheck,
  Heart,
  RefreshCw,
  ArrowLeft,
  Calendar,
  MessageCircle,
  Truck,
  Trophy,
  Gift,
  CheckCircle,
  Camera,
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DeliveryConfirmModal from '../components/DeliveryConfirmModal';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

import WinnerSelectionModal, {
  ParticipantPanel,
} from '../components/WinnerSelectionModal';
import TradeOfferModal from '../components/TradeOfferModal';
import GiveawayView from './ItemDetailViews/GiveawayView';
import ExchangeView from './ItemDetailViews/ExchangeView';
import RequestView from './ItemDetailViews/RequestView';

const ItemDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { showToast } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestConfirmOpen, setRequestConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publicOffers, setPublicOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Scroll lock — delete confirm modal
  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [deleteConfirmOpen]);

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      setItem(response.data);

      if (isAuthenticated && response.data.owner?.id !== user?.id) {
        try {
          const checkRes = await api.get(`/giveaways/${id}/check-application`);
          setIsJoined(checkRes.data.applied);
        } catch (e) {
          // silently pass
        }
      }

      if (isAuthenticated) {
        try {
          const favRes = await api.get(`/favorites/${id}/check`);
          setIsFavorited(favRes.data.isFavorited);
        } catch (e) {
          // silently pass
        }
      }

      if (response.data.shareType === 'exchange') {
        setLoadingOffers(true);
        try {
          const offersRes = await api.get(`/messages/item/${id}/trade-offers`);
          setPublicOffers(offersRes.data);
        } catch (e) {
          console.error('Error fetching trade offers:', e);
        } finally {
          setLoadingOffers(false);
        }
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [id, isAuthenticated]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id, item?.images?.length]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      showToast('Döngüye katılmak için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    setJoining(true);
    try {
      await api.post(`/giveaways/${id}/apply`);
      setIsJoined(true);
      fetchUser();
      showToast('Harika! Döngüye başarıyla katıldın! 🎉', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Bir hata oluştu.';
      if (msg.includes('already applied')) {
        setIsJoined(true);
        showToast('Bu döngüye zaten katılmışsınız.', 'info');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleBendeVarClick = async () => {
    if (!isAuthenticated) {
      showToast('Mesaj göndermek için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    setRequestConfirmOpen(true);
  };

  const confirmStartRequestChat = () => {
    setRequestConfirmOpen(false);

    navigate(
      `/chat?partnerId=${item.owner.id}&partnerName=${encodeURIComponent(item.owner.fullName)}&itemId=${item.id}&itemTitle=${encodeURIComponent(item.title)}`,
    );
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      showToast('Favorilere eklemek için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    try {
      const res = await api.post(`/favorites/${id}`);
      setIsFavorited(res.data.isFavorited);
      if (res.data.isFavorited) {
        showToast('Favorilere eklendi ❤️', 'success');
      } else {
        showToast('Favorilerden çıkarıldı', 'info');
      }
    } catch (err) {
      showToast('Favori işlemi başarısız oldu.', 'error');
    }
  };

  const handleDeliveryUpdate = async (status) => {
    try {
      await api.patch(`/items/${id}/delivery-status`, { status });
      setItem((prev) => ({ ...prev, deliveryStatus: status }));
      if (status === 'DELIVERED') fetchUser();
      const labels = {
        SHIPPED: 'Kargoya verildi!',
        DELIVERED: 'Teslim alındı!',
      };
      showToast(labels[status] || 'Durum güncellendi.', 'success');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Durum güncellenemedi.',
        'error',
      );
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/giveaways/${id}`);
      showToast(
        'Eşyayı döngüden çıkardık, her zaman yeni şeyler ekleyebilirsin! ✨',
        'success',
      );
      navigate('/');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'İlanı kaldırırken bir hata oluştu.',
        'error',
      );
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse text-emerald-600 font-medium">
          Yükleniyor...
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-center">
        <p className="text-slate-500 text-lg">Bu eşyaya şu an ulaşılamıyor.</p>
        <Link to="/" className="mt-4 text-emerald-600 hover:underline">
          Vitrine Geri Dön
        </Link>
      </div>
    );
  }
  const timeLeft = item.drawDate
    ? formatDistanceToNow(new Date(item.drawDate), { locale: tr })
    : null;
  const participants = item.applicationsCount ?? item.applications?.length ?? 0;
  const ownerName = item.owner?.fullName || 'Anonim Gönüllü';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  const isEnded =
    item.status === 'GIVEN_AWAY' ||
    item.status === 'DRAW_PENDING' ||
    (item.drawDate && new Date(item.drawDate) < new Date());
  const timeAgoStr = item.drawDate
    ? formatDistanceToNow(new Date(item.drawDate), { locale: tr })
    : '';
  const postedAgoStr = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), {
        locale: tr,
        addSuffix: true,
      })
    : '';

  const isOwner = user?.id === item.owner?.id;
  const isWinner = user?.id === item.winner?.id;
  const canChat = isAuthenticated && !isOwner;
  const itemImages =
    item.images && item.images.length > 0
      ? item.images
      : [
          item.postType === 'REQUESTING'
            ? 'https://placehold.co/800x600/EFF6FF/2563EB?text=📸+Görsel+Bulunmuyor\nBu+ilan+bir+ihtiyaç+talebiveya+aranıyor+ilanıdır.&font=Outfit'
            : item.imageUrl ||
              'https://via.placeholder.com/800x600?text=Gorsel+Yok',
        ];
  const activeImage = itemImages[currentImageIndex] || itemImages[0];
  const tradeOfferCount = publicOffers.length;
  const tradeOfferLabel = `🔥 ${tradeOfferCount} kişi takas teklifi verdi`;

  const isPickupOnly =
    item.deliveryMethods &&
    item.deliveryMethods.length > 0 &&
    item.deliveryMethods.every((m) => m === 'pickup');

  const deliverySteps = isPickupOnly
    ? [
        { key: 'PENDING', label: 'Yeni Sahibi Belirlendi', icon: '🎉' },
        { key: 'DELIVERED', label: 'Elden Teslim Edildi', icon: '🤝' },
      ]
    : [
        { key: 'PENDING', label: 'Yeni Sahibi Belirlendi', icon: '🎉' },
        { key: 'SHIPPED', label: 'Kargolandı', icon: '📦' },
        { key: 'DELIVERED', label: 'Teslim Alındı', icon: '✅' },
      ];

  const currentDeliveryIndex = deliverySteps.findIndex(
    (s) => s.key === item.deliveryStatus,
  );

  return (
    <>
      <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto min-h-screen">
        {isOwner && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#ffd7d3] bg-[#fff1f0] px-5 py-4">
            <div>
              <p className="text-sm font-bold text-[#93000a]">
                Bu ilan sana ait
              </p>
              <p className="text-sm text-[#7a3d37]">
                İstersen bu sayfadan ilanı kaldırabilirsin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              İlanı Sil
            </button>
          </div>
        )}

        {item.shareType === 'exchange' ? (
          <ExchangeView
            item={item}
            ownerName={ownerName}
            ownerInitial={ownerInitial}
            canChat={canChat}
            itemImages={itemImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            setTradeModalOpen={setTradeModalOpen}
            isFavorited={isFavorited}
            handleFavoriteToggle={handleFavoriteToggle}
            isOwner={isOwner}
            tradeOfferCount={tradeOfferCount}
          />
        ) : item.shareType === 'request' || item.postType === 'REQUESTING' ? (
          <RequestView
            item={item}
            ownerName={ownerName}
            ownerInitial={ownerInitial}
            handleBendeVarClick={handleBendeVarClick}
            joining={joining}
            isOwner={isOwner}
            isFavorited={isFavorited}
            handleFavoriteToggle={handleFavoriteToggle}
            postedAgoStr={postedAgoStr}
          />
        ) : (
          <GiveawayView
            item={item}
            user={user}
            isAuthenticated={isAuthenticated}
            isOwner={isOwner}
            isWinner={isWinner}
            canChat={canChat}
            itemImages={itemImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            setIsLightboxOpen={setIsLightboxOpen}
            handleJoin={handleJoin}
            joining={joining}
            isJoined={isJoined}
            isFavorited={isFavorited}
            handleFavoriteToggle={handleFavoriteToggle}
            setConfirmModalOpen={setConfirmModalOpen}
            handleDeliveryUpdate={handleDeliveryUpdate}
            postedAgoStr={postedAgoStr}
            timeAgoStr={timeAgoStr}
            isEnded={isEnded}
            timeLeft={timeLeft}
            participants={participants}
          />
        )}
      </div>

      <WinnerSelectionModal
        isOpen={winnerModalOpen}
        onClose={() => setWinnerModalOpen(false)}
        itemId={item.id}
        itemTitle={item.title}
        onSuccess={() => {
          fetchItem();
          fetchUser();
        }}
      />
      <DeliveryConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        itemId={item.id}
        onSuccess={() => {
          fetchItem();
          fetchUser();
        }}
      />
      {item && (
        <TradeOfferModal
          isOpen={tradeModalOpen}
          onClose={() => setTradeModalOpen(false)}
          targetItemId={item.id}
          targetItemTitle={item.title}
          onSuccess={() => {
            setTradeModalOpen(false);
            fetchItem();
          }}
        />
      )}

      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 w-full p-4 md:p-6 flex items-center justify-between z-[110]">
              <span className="text-white font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                {currentImageIndex + 1} / {itemImages.length}
              </span>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {itemImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((p) =>
                      p === 0 ? itemImages.length - 1 : p - 1,
                    );
                  }}
                  className="absolute left-4 md:left-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white z-[110]"
                >
                  <ChevronLeft className="w-8 h-8 text-white/50 hover:text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex((p) =>
                      p === itemImages.length - 1 ? 0 : p + 1,
                    );
                  }}
                  className="absolute right-4 md:right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white z-[110]"
                >
                  <ChevronRight className="w-8 h-8 text-white/50 hover:text-white" />
                </button>
              </>
            )}
            <div
              className="w-full h-full max-w-6xl mx-auto p-4 md:p-12 flex items-center justify-center relative z-[105]"
              onClick={() => setIsLightboxOpen(false)}
            >
              <img
                src={itemImages[currentImageIndex]}
                alt={item.title}
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-6 mx-auto">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-2 font-[Outfit]">
                İlanı Silmek İstiyor Musun?
              </h3>
              <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
                Bu işlem geri alınamaz. İlanınla birlikte tüm başvurular ve
                mesajlar da silinecektir.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleting}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {requestConfirmOpen && (
          <div className="fixed inset-0 z-[115] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRequestConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative z-10 border border-slate-100"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-6 mx-auto">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 text-center mb-2 font-[Outfit]">
                Sohbet Başlatılsın mı?
              </h3>
              <p className="text-slate-500 text-center mb-8 font-medium leading-relaxed">
                Bu ihtiyacı karşılayabileceğinizi belirterek ilan sahibiyle
                doğrudan sohbet başlatacaksınız.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setRequestConfirmOpen(false)}
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Vazgeç
                </button>
                <button
                  onClick={confirmStartRequestChat}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Sohbeti Başlat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ItemDetail;
