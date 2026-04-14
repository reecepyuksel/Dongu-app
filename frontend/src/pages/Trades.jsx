import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
  Trash2,
  X,
  User,
  Filter,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Trades = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('incoming');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightbox, setLightbox] = useState({
    open: false,
    images: [],
    index: 0,
    title: '',
  });

  const normalizeOffer = useCallback(
    (offer) => ({
      ...offer,
      photoUrl:
        offer.photos?.[0] ||
        offer.photoUrl ||
        offer.tradeMediaUrl ||
        offer.offeredItem?.imageUrl ||
        null,
      partner: offer.sender?.id === user?.id ? offer.receiver : offer.sender,
    }),
    [user?.id],
  );

  const fetchOffers = useCallback(
    async (showLoad = true) => {
      try {
        if (showLoad) setLoading(true);
        const response = await api.get('/messages/my-trade-offers');
        const normalized = Array.isArray(response.data)
          ? response.data.map(normalizeOffer)
          : [];
        setOffers(normalized);
      } catch (error) {
        console.error('Trade offers could not be loaded', error);
        showToast('Takas teklifleri yüklenemedi.', 'error');
      } finally {
        if (showLoad) setLoading(false);
      }
    },
    [normalizeOffer, showToast],
  );

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else {
        fetchOffers();
      }
    }
  }, [authLoading, fetchOffers, isAuthenticated, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) return;

    let userId;
    try {
      userId = JSON.parse(atob(token.split('.')[1]))?.sub;
    } catch {
      return;
    }
    if (!userId) return;

    const sock = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:3005',
      { query: { userId } },
    );

    sock.on('newMessage', (msg) => {
      if (msg?.isTradeOffer || msg?.tradeOfferId) {
        fetchOffers(false);
      }
    });

    return () => sock.close();
  }, [fetchOffers, isAuthenticated]);

  const incomingOffers = useMemo(
    () => offers.filter((offer) => offer.receiver?.id === user?.id),
    [offers, user?.id],
  );

  const outgoingOffers = useMemo(
    () => offers.filter((offer) => offer.sender?.id === user?.id),
    [offers, user?.id],
  );

  const filteredIncoming = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return incomingOffers;
    return incomingOffers.filter((offer) => {
      const title = (
        offer.offeredItem?.title ||
        offer.content ||
        ''
      ).toLowerCase();
      const item = (offer.item?.title || '').toLowerCase();
      const name = (offer.sender?.fullName || '').toLowerCase();
      return title.includes(q) || item.includes(q) || name.includes(q);
    });
  }, [incomingOffers, searchTerm]);

  const filteredOutgoing = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return outgoingOffers;
    return outgoingOffers.filter((offer) => {
      const title = (
        offer.offeredItem?.title ||
        offer.content ||
        ''
      ).toLowerCase();
      const item = (offer.item?.title || '').toLowerCase();
      const name = (offer.receiver?.fullName || '').toLowerCase();
      return title.includes(q) || item.includes(q) || name.includes(q);
    });
  }, [outgoingOffers, searchTerm]);

  const closeLightbox = () => {
    setLightbox({ open: false, images: [], index: 0, title: '' });
  };

  const openLightbox = (offer, defaultTitle) => {
    const images = (
      offer.photos && offer.photos.length > 0 ? offer.photos : [offer.photoUrl]
    ).filter(Boolean);

    if (!images.length) return;

    setLightbox({
      open: true,
      images,
      index: 0,
      title: defaultTitle,
    });
  };

  const goPrevImage = () => {
    setLightbox((prev) => {
      const len = prev.images.length;
      if (len <= 1) return prev;
      return { ...prev, index: (prev.index - 1 + len) % len };
    });
  };

  const goNextImage = () => {
    setLightbox((prev) => {
      const len = prev.images.length;
      if (len <= 1) return prev;
      return { ...prev, index: (prev.index + 1) % len };
    });
  };

  useEffect(() => {
    if (!lightbox.open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrevImage();
      if (e.key === 'ArrowRight') goNextImage();
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [lightbox.open]);

  const handleTradeResponse = async (offerId, status) => {
    try {
      setProcessingId(offerId);
      await api.post(`/messages/trade-offer/${offerId}/respond`, { status });
      showToast(
        status === 'accepted'
          ? 'Takas teklifi kabul edildi.'
          : 'Takas teklifi reddedildi.',
        'success',
      );
      fetchOffers(false);
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Takas teklifi güncellenemedi.',
        'error',
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteListing = async (itemId, itemTitle) => {
    if (!itemId) {
      showToast('Silinecek ilan bulunamadı.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `"${itemTitle || 'Bu ilan'}" ilanını silmek istediğine emin misin? Bu işlem geri alınamaz.`,
    );
    if (!confirmed) return;

    try {
      setDeletingItemId(itemId);
      await api.delete(`/giveaways/${itemId}`);
      setOffers((prev) => prev.filter((offer) => offer.item?.id !== itemId));
      showToast('İlan silindi.', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.message || 'İlan silinirken bir hata oluştu.',
        'error',
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  const renderEmptyState = (type) => (
    <div className="col-span-full hidden flex-col items-center justify-center py-20 text-center sm:flex">
      <div className="mb-8 flex h-48 w-48 items-center justify-center rounded-full bg-[#f2f4f6]">
        <Inbox className="h-16 w-16 text-[#c4c6cd]" />
      </div>
      <h2 className="mb-2 font-[Manrope] text-2xl font-bold text-[#05162b]">
        {type === 'incoming'
          ? 'Henüz Gelen Teklif Yok'
          : 'Henüz Giden Teklif Yok'}
      </h2>
      <p className="mx-auto mb-8 max-w-xs text-[#75777d]">
        {type === 'incoming'
          ? 'İlanlarını öne çıkararak daha fazla takas teklifi alabilirsin.'
          : 'Siz teklif gönderdikçe durumlarını bu panelde takip edebileceksiniz.'}
      </p>
      <button
        onClick={() => navigate(type === 'incoming' ? '/dashboard' : '/')}
        className="mx-auto flex items-center gap-2 rounded-full bg-[#05162b] px-8 py-3 font-bold text-white transition-opacity hover:opacity-90"
      >
        {type === 'incoming' ? 'Yeni İlan Ver' : "Network'e Göz At"}
      </button>
    </div>
  );

  const renderOfferCard = (offer, type) => {
    const isPendingIncoming =
      type === 'incoming' && offer.tradeStatus === 'pending';
    const isDeletingCurrentItem = deletingItemId === offer.item?.id;
    const offerTitle =
      offer.offeredItem?.title || offer.content || 'Takas Teklifi';
    const partner = type === 'incoming' ? offer.sender : offer.partner;

    let statusLabel = 'BEKLEMEDE';
    let statusClass = 'bg-white/90 text-[#05162b] backdrop-blur-md shadow-sm';
    let cardClass = '';
    let imgContainerClass = '';

    if (offer.tradeStatus === 'accepted') {
      statusLabel = 'KABUL EDİLDİ';
      statusClass = 'bg-[#cde5d8] text-[#364b41] shadow-sm';
    } else if (offer.tradeStatus === 'rejected') {
      statusLabel = 'REDDEDİLDİ';
      statusClass = 'bg-[#ffdad6] text-[#93000a] shadow-sm';
      cardClass = 'opacity-80';
      imgContainerClass = 'grayscale';
    }

    return (
      <div
        key={offer.id}
        className={`group flex flex-col rounded-xl bg-white p-5 transition-all hover:scale-[1.02] hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)] ${cardClass}`}
      >
        <div
          className={`relative mb-6 h-48 w-full overflow-hidden rounded-lg bg-[#f2f4f6] ${imgContainerClass}`}
        >
          {offer.photoUrl ? (
            <button
              type="button"
              onClick={() => openLightbox(offer, offerTitle)}
              className="h-full w-full"
            >
              <img
                src={offer.photoUrl}
                alt={offerTitle}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl">
              📦
            </div>
          )}
          <div
            className={`absolute right-3 top-3 rounded-full px-3 py-1 font-[Inter] text-xs font-bold ${statusClass}`}
          >
            {statusLabel}
          </div>
        </div>

        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {partner?.profilePhoto ? (
              <img
                src={partner.profilePhoto}
                alt={partner.fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f6] text-[#c4c6cd]">
                <User className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-[#05162b]">
                {partner?.fullName || 'Bilinmeyen Kullanıcı'}
              </p>
              <p className="font-[Inter] text-xs text-[#75777d]">
                {formatDistanceToNow(
                  new Date(
                    offer.createdAt.endsWith('Z')
                      ? offer.createdAt
                      : offer.createdAt + 'Z',
                  ),
                  { addSuffix: true, locale: tr },
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-1 line-clamp-1 text-base font-semibold text-[#05162b]">
            {offer.item?.title || 'Bilinmeyen İlan'}
          </h3>
          <p className="flex items-center gap-1 font-[Inter] text-sm text-[#51675d]">
            Teklif:{' '}
            <span className="font-bold text-[#05162b]">{offerTitle}</span>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          {isPendingIncoming && (
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleTradeResponse(offer.id, 'rejected')}
                disabled={processingId === offer.id}
                className="flex-1 rounded-full bg-[#ffdad6] py-2.5 text-[13px] font-bold text-[#93000a] transition-all hover:bg-[#ffb4ab] hover:opacity-90"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={() => handleTradeResponse(offer.id, 'accepted')}
                disabled={processingId === offer.id}
                className="flex-1 rounded-full bg-[#cde5d8] py-2.5 text-[13px] font-bold text-[#364b41] transition-all hover:bg-[#b4ccbf] hover:opacity-90"
              >
                Kabul Et
              </button>
            </div>
          )}
          {type === 'incoming' && (
            <button
              type="button"
              onClick={() =>
                handleDeleteListing(offer.item?.id, offer.item?.title)
              }
              disabled={isDeletingCurrentItem}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ffdad6] py-3 text-sm font-semibold text-[#93000a] transition-all hover:bg-[#ffb4ab] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingCurrentItem ? 'Siliniyor...' : 'İlanı Sil'}
            </button>
          )}
          <Link
            to={`/trades/${offer.id}`}
            className="block w-full rounded-full bg-[#1b2b41] py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Detayları Gör
          </Link>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-[1.5rem] bg-[#e6e8ea]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 md:px-12 lg:px-8">
      {/* Header Section */}
      <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 font-[Manrope] text-4xl font-extrabold tracking-tight text-[#05162b]">
            Takas Yönetimi
          </h1>
          <p className="text-lg text-[#75777d]">
            Sürdürülebilir bir gelecek için eşyalarını değerlendir.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-full bg-[#f2f4f6] p-1">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'incoming'
                  ? 'bg-white text-[#05162b] shadow-sm'
                  : 'text-[#75777d] hover:text-[#05162b]'
              }`}
            >
              Gelen Teklifler
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                activeTab === 'outgoing'
                  ? 'bg-white text-[#05162b] shadow-sm'
                  : 'text-[#75777d] hover:text-[#05162b]'
              }`}
            >
              Giden Teklifler
            </button>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-wrap gap-4">
        <label className="relative flex min-w-[300px] flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c4c6cd]" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-none bg-[#f2f4f6] px-12 py-4 font-[Inter] transition-all focus:bg-white focus:ring-1 focus:ring-[#05162b]/15"
            placeholder="Tekliflerde ara..."
            type="text"
          />
        </label>
        <button className="flex items-center gap-2 rounded-xl bg-[#f2f4f6] px-6 py-4 font-medium text-[#05162b] transition-colors hover:bg-[#e6e8ea]">
          <Filter className="h-5 w-5" />
          Filtrele
        </button>
      </div>

      <div
        className={`mb-6 rounded-xl px-4 py-3 text-sm ${
          activeTab === 'incoming'
            ? 'bg-[#fff3e0] text-[#8a5700]'
            : 'bg-[#edf2f7] text-[#40556b]'
        }`}
      >
        {activeTab === 'incoming'
          ? 'Kendi ilanını kaldırmak için kartın altındaki "İlanı Sil" butonunu kullanabilirsin.'
          : 'Bu sekme sadece senin gönderdiğin teklifler. Silme işlemi, ilan sahibinde olduğu için burada görünmez.'}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeTab === 'incoming'
          ? filteredIncoming.length === 0
            ? renderEmptyState('incoming')
            : filteredIncoming.map((offer) =>
                renderOfferCard(offer, 'incoming'),
              )
          : filteredOutgoing.length === 0
            ? renderEmptyState('outgoing')
            : filteredOutgoing.map((offer) =>
                renderOfferCard(offer, 'outgoing'),
              )}
      </div>

      <AnimatePresence>
        {lightbox.open && (
          <motion.div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <motion.div
              className="relative flex max-h-[85vh] max-w-[90vw] min-h-0 min-w-0 flex-col"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-2 text-slate-800"
                title="Kapat"
              >
                <X className="h-5 w-5" />
              </button>

              {lightbox.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevImage}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800"
                    title="Önceki fotoğraf"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800"
                    title="Sonraki fotoğraf"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-black/30 p-6">
                <img
                  src={lightbox.images[lightbox.index]}
                  alt={lightbox.title || 'Takas görseli'}
                  className="h-auto max-h-full w-auto max-w-full object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-between px-1 text-xs text-white/80">
                <span className="max-w-[70%] truncate">{lightbox.title}</span>
                <span>
                  {lightbox.index + 1} / {lightbox.images.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Trades;
