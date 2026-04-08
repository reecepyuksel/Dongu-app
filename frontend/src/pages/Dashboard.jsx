import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Eye,
  Gift,
  Grid2X2,
  Heart,
  ArrowLeftRight,
  HandHeart,
  Medal,
  MessageCircle,
  MoreVertical,
  Plus,
  Share2,
  Trophy,
  Truck,
  User,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import CreateItemModal from '../components/CreateItemModal';
import DeliveryConfirmModal from '../components/DeliveryConfirmModal';
import { ItemCard } from '../components/ItemCard';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('items');
  const [myItems, setMyItems] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myFavorites, setMyFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedConfirmItemId, setSelectedConfirmItemId] = useState(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      showToast('Paneli görmek için giriş yapmalısınız.', 'info');
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate, showToast]);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, appsRes, favRes] = await Promise.all([
        api.get('/users/me/items'),
        api.get('/users/me/applications'),
        api.get('/favorites'),
      ]);

      setMyItems(Array.isArray(itemsRes.data) ? itemsRes.data : []);
      setMyApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      setMyFavorites(Array.isArray(favRes.data) ? favRes.data : []);
    } catch (err) {
      console.error('Dashboard verisi yüklenemedi:', err);
      showToast('Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
  }, [fetchData, isAuthenticated]);

  const handleDeliveryUpdate = async (itemId, status) => {
    try {
      await api.patch(`/items/${itemId}/delivery-status`, { status });

      setMyItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, deliveryStatus: status } : item,
        ),
      );
      setMyApplications((prev) =>
        prev.map((app) =>
          app.item?.id === itemId
            ? { ...app, item: { ...app.item, deliveryStatus: status } }
            : app,
        ),
      );

      const labels = {
        SHIPPED: 'Kargoya verildi! 📦',
        DELIVERED: 'Teslim alındı! ✅',
      };
      showToast(labels[status], 'success');
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Durum güncellenemedi.',
        'error',
      );
    }
  };

  const handleFavoriteToggle = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await api.post(`/favorites/${id}`);
      if (!res.data.isFavorited) {
        setMyFavorites((prev) => prev.filter((item) => item.id !== id));
        showToast('Favorilerden çıkarıldı', 'info');
      } else {
        fetchData();
        showToast('Favorilere eklendi ❤️', 'success');
      }
    } catch {
      showToast('Favori işlemi başarısız oldu.', 'error');
    }
  };

  const statusColors = {
    AVAILABLE: 'bg-[#d0e8db] text-[#364b41]',
    DRAW_PENDING: 'bg-[#fff3e0] text-[#a15f00]',
    GIVEN_AWAY: 'bg-[#eceef0] text-[#44474d]',
    IN_TRADE: 'bg-[#d4e3ff] text-[#38485f]',
  };

  const statusLabels = {
    AVAILABLE: 'Aktif',
    DRAW_PENDING: 'Çekiliş Bekliyor',
    GIVEN_AWAY: 'Tamamlandı',
    IN_TRADE: 'Takas Sürecinde',
  };

  const deliveryLabels = (item) => {
    const hasShipping = item?.deliveryMethods?.some((m) =>
      m.includes('shipping'),
    );
    const isHandDelivery = !hasShipping;

    return {
      PENDING: {
        label: isHandDelivery ? 'Teslimat Bekleniyor' : 'Kargo Bekleniyor',
        color: isHandDelivery
          ? 'bg-[#d4e3ff] text-[#38485f]'
          : 'bg-[#fff3e0] text-[#a15f00]',
      },
      SHIPPED: { label: 'Kargolandı', color: 'bg-[#d4e3ff] text-[#38485f]' },
      DELIVERED: {
        label: isHandDelivery ? 'Elden Teslim Edildi' : 'Teslim Edildi',
        color: 'bg-[#d0e8db] text-[#364b41]',
      },
    };
  };

  const newOwnerCount = myApplications.filter(
    (a) => a.status === 'WON' || a.item?.winner?.id === user?.id,
  ).length;
  const successfulTradesCount = user?.successfulTradesCount || 0;

  const latestItems = useMemo(() => myItems.slice(0, 3), [myItems]);
  const progressPercent = Math.min(
    100,
    Math.round(((user?.karmaPoint || 0) / 1000) * 100),
  );

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-sm font-semibold text-[#4d6359]">
          Yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-24 md:px-8 md:pt-28">
      <section className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <aside className="space-y-6 md:col-span-4 lg:col-span-3">
          <div className="rounded-3xl border border-[#c4c6cd]/20 bg-white p-6 text-center shadow-sm">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#75777d]">
              Profil Merkezi
            </p>
            <div className="mx-auto mb-4 flex h-24 w-24 rotate-3 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#cde5d8] to-[#b7c7e4] text-3xl font-extrabold text-[#05162b] shadow-lg transition duration-300 hover:rotate-0">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>

            <h1 className="font-[Manrope] text-3xl font-extrabold text-[#05162b]">
              {user?.fullName}
            </h1>
            <p className="mt-1 text-sm text-[#44474d]">
              İyilik Elçisi • {user?.city || 'Türkiye'}
            </p>

            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#d0e8db] px-3 py-1 text-xs font-bold text-[#364b41]">
              <User className="h-3.5 w-3.5" /> Premium Üye
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f2f4f6] p-3">
                <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">
                  #{user?.karma?.rank || '-'}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#75777d]">
                  Sıralama
                </p>
              </div>
              <div className="rounded-xl bg-[#f2f4f6] p-3">
                <p className="font-[Manrope] text-2xl font-extrabold text-[#4d6359]">
                  {user?.karmaPoint || 0}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#75777d]">
                  Etki Puanı
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const text = `Döngü'de ${myItems.length} eşyayı paylaşıma kattım, ${user?.karmaPoint || 0} İyilik Puanına ulaştım! #Döngü`;
                if (navigator.share) {
                  navigator
                    .share({
                      title: 'Döngü Başarımım',
                      text,
                      url: window.location.origin,
                    })
                    .catch(console.error);
                } else {
                  navigator.clipboard.writeText(text);
                  showToast('Başarım panoya kopyalandı.', 'success');
                }
              }}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#05162b] to-[#1b2b41] px-4 py-3 text-sm font-bold text-white"
            >
              <Share2 className="h-4 w-4" /> Profilini Paylaş
            </button>
          </div>

          <div className="rounded-3xl border border-[#c4c6cd]/20 bg-white p-5 shadow-sm">
            <h3 className="font-[Manrope] text-lg font-bold text-[#05162b]">
              Uzmanlık & İlgi
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Sürdürülebilirlik', 'Eğitim', 'Mentörlük', 'Topluluk'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#f2f4f6] px-2.5 py-1 text-xs font-semibold text-[#44474d]"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-[#05162b] p-6 text-white">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#4d6359]/35 blur-2xl" />
            <h4 className="relative z-10 text-sm font-bold">Premium Üyelik</h4>
            <p className="relative z-10 mt-2 text-xs text-[#d4e3ff]">
              Daha fazla kişiye ulaş ve etki puanını artır.
            </p>
            <button className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs font-bold text-white">
              Hemen Yükselt <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        <div className="space-y-6 md:col-span-8 lg:col-span-9">
          <section className="rounded-3xl border border-[#c4c6cd]/20 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#4d6359]">
                  İyilik Yolculuğu
                </span>
                <h2 className="mt-1 font-[Manrope] text-3xl font-extrabold text-[#05162b]">
                  Kıdemli Küratör Yolunda
                </h2>
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#75777d]">
                    Sıralama
                  </p>
                  <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">
                    #{user?.karma?.rank || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#75777d]">
                    Etki Puanı
                  </p>
                  <p className="font-[Manrope] text-2xl font-extrabold text-[#4d6359]">
                    {user?.karmaPoint || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#eceef0] p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#05162b] to-[#4d6359]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-[#75777d]">
                <span>Seviye 4</span>
                <span className="text-[#05162b]">
                  Son {Math.max(0, 1000 - (user?.karmaPoint || 0))} puan
                </span>
                <span>Seviye 5</span>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="group rounded-3xl bg-[#f2f4f6] p-6 text-center transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#05162b] shadow-sm transition-transform group-hover:scale-110">
                <Grid2X2 className="h-6 w-6" />
              </div>
              <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">{myItems.length}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#75777d]">Paylaşılan</p>
            </div>
            <div className="group rounded-3xl bg-[#f2f4f6] p-6 text-center transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#4d6359] shadow-sm transition-transform group-hover:scale-110">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">{successfulTradesCount}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#75777d]">Takas</p>
            </div>
            <div className={`group rounded-3xl bg-[#f2f4f6] p-6 text-center transition-all duration-300 hover:bg-white hover:shadow-xl ${newOwnerCount === 0 ? 'opacity-60' : ''}`}>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-400 shadow-sm transition-transform group-hover:scale-110">
                <HandHeart className="h-6 w-6" />
              </div>
              <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">{newOwnerCount}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#75777d]">İhtiyaç Giderilen</p>
            </div>
            <div className="group rounded-3xl bg-[#f2f4f6] p-6 text-center transition-all duration-300 hover:bg-white hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#82db7e] shadow-sm transition-transform group-hover:scale-110">
                <Medal className="h-6 w-6" />
              </div>
              <p className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">2</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-[#75777d]">Kazanılan</p>
            </div>
          </div>

          <section>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-[Manrope] text-xl font-extrabold text-[#05162b]">Döngüye Kattıklarım</h3>
              <button
                onClick={() => setActiveTab('items')}
                className="text-sm font-semibold text-[#4d6359] hover:underline underline-offset-4"
              >
                Tümünü Gör
              </button>
            </div>
            <div className="space-y-4">
              {latestItems.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center text-sm text-[#75777d] shadow-sm">
                  Henüz paylaşım yok.
                </div>
              ) : (
                latestItems.map((item) => (
                  <Link
                    to={`/items/${item.id}`}
                    key={item.id}
                    className="group flex items-center gap-6 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f2f4f6]">
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/80'}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h4 className="truncate font-bold text-[#05162b]">{item.title}</h4>
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            statusColors[item.status] || 'bg-[#eceef0] text-[#44474d]'
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#75777d]">
                        {item.category || 'Genel'} kategorisinde paylaşıldı.
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-[#9aa0a6]">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Eye className="h-4 w-4" /> {item.viewCount || 0}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs">
                          <Heart className="h-4 w-4" /> {item.favCount || item.applicationsCount || 0}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="shrink-0 p-2 text-[#9aa0a6] transition hover:text-[#05162b]"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-[#1b2b41] p-10 text-white">
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4d6359]/20 blur-[80px]" />
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="max-w-lg">
                <h3 className="font-[Manrope] text-3xl font-extrabold">
                  Senin Değerlerin Başkasının İhtiyacı Olabilir
                </h3>
                <p className="mt-4 text-lg text-[#b7c7e4]">
                  Hemen yeni bir eşyanı listele, topluluğa katkıda bulun ve puanlarını artır.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-3 rounded-full bg-[#4d6359] px-10 py-5 text-lg font-extrabold text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-5 w-5" /> Paylaşmaya Başla
              </button>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap gap-2 rounded-xl bg-[#f2f4f6] p-1">
          <button
            onClick={() => setActiveTab('items')}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              activeTab === 'items'
                ? 'bg-white text-[#05162b]'
                : 'text-[#75777d] hover:text-[#05162b]'
            }`}
          >
            Döngüye Kattıklarım ({myItems.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              activeTab === 'applications'
                ? 'bg-white text-[#05162b]'
                : 'text-[#75777d] hover:text-[#05162b]'
            }`}
          >
            Katıldıklarım ({myApplications.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              activeTab === 'favorites'
                ? 'bg-white text-[#05162b]'
                : 'text-[#75777d] hover:text-[#05162b]'
            }`}
          >
            Favorilerim ({myFavorites.length})
          </button>
        </div>

        {activeTab === 'items' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {myItems.length === 0 ? (
              <div className="rounded-[1.5rem] bg-white p-12 text-center">
                <Gift className="mx-auto h-10 w-10 text-[#c4c6cd]" />
                <p className="mt-2 text-sm font-semibold text-[#44474d]">
                  Henüz bir eşya paylaşmadınız.
                </p>
              </div>
            ) : (
              myItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] bg-white p-4 shadow-[0_12px_32px_rgba(25,28,30,0.04)]"
                >
                  <Link
                    to={`/items/${item.id}`}
                    className="group flex items-center gap-4"
                  >
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/100'}
                      alt={item.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#05162b]">
                        {item.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            statusColors[item.status] ||
                            'bg-[#eceef0] text-[#44474d]'
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>

                        {item.deliveryStatus &&
                          (() => {
                            const labels = deliveryLabels(item);
                            const info = labels[item.deliveryStatus];
                            const hasShipping = item.deliveryMethods?.some(
                              (m) => m.includes('shipping'),
                            );

                            return (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${info?.color}`}
                              >
                                {!hasShipping ? (
                                  '🤝'
                                ) : (
                                  <Truck className="mr-1 inline h-3 w-3" />
                                )}
                                {info?.label}
                              </span>
                            );
                          })()}

                        <span className="inline-flex items-center gap-1 text-xs text-[#75777d]">
                          <Clock className="h-3 w-3" />
                          {format(
                            new Date(item.drawDate || item.createdAt),
                            'dd MMM yyyy',
                            {
                              locale: tr,
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#9aa0a6] transition group-hover:text-[#4d6359]" />
                  </Link>

                  {['GIVEN_AWAY', 'IN_TRADE'].includes(item.status) &&
                    item.deliveryStatus === 'PENDING' && (
                      <div className="mt-3 pl-20">
                        {!item.deliveryMethods?.some((m) =>
                          m.includes('shipping'),
                        ) ? (
                          <button
                            onClick={() =>
                              handleDeliveryUpdate(item.id, 'DELIVERED')
                            }
                            className="rounded-lg bg-[#cde5d8] px-4 py-2 text-sm font-bold text-[#364b41]"
                          >
                            Elden Teslim Ettim
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleDeliveryUpdate(item.id, 'SHIPPED')
                            }
                            className="rounded-lg bg-[#d4e3ff] px-4 py-2 text-sm font-bold text-[#38485f]"
                          >
                            Kargoladım
                          </button>
                        )}
                      </div>
                    )}
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'favorites' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {myFavorites.length === 0 ? (
              <div className="rounded-[1.5rem] bg-white p-12 text-center">
                <Heart className="mx-auto h-10 w-10 text-[#c4c6cd]" />
                <p className="mt-2 text-sm font-semibold text-[#44474d]">
                  Henüz favorilere eklediğiniz bir paylaşım yok.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {myFavorites.map((item) => (
                  <Link to={`/items/${item.id}`} key={item.id}>
                    <ItemCard
                      title={item.title}
                      imageUrl={
                        (item.images && item.images[0]) ||
                        item.imageUrl ||
                        'https://via.placeholder.com/300'
                      }
                      drawDate={item.drawDate}
                      participants={item.applicationsCount || 0}
                      ownerAvatar={item.owner?.avatarUrl || null}
                      ownerName={item.owner?.fullName || null}
                      category={item.category}
                      city={item.city}
                      district={item.district}
                      postType={item.postType}
                      shareType={item.shareType}
                      isFavorited={true}
                      onFavoriteToggle={(e) => handleFavoriteToggle(e, item.id)}
                    />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'applications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {myApplications.length === 0 ? (
              <div className="rounded-[1.5rem] bg-white p-12 text-center">
                <Trophy className="mx-auto h-10 w-10 text-[#c4c6cd]" />
                <p className="mt-2 text-sm font-semibold text-[#44474d]">
                  Henüz bir çekilişe katılmadınız.
                </p>
              </div>
            ) : (
              myApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-[1.25rem] bg-white p-4 shadow-[0_12px_32px_rgba(25,28,30,0.04)]"
                >
                  <Link
                    to={`/items/${app.item?.id}`}
                    className="group flex items-center gap-4"
                  >
                    <img
                      src={
                        app.item?.imageUrl || 'https://via.placeholder.com/100'
                      }
                      alt={app.item?.title}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-[#05162b]">
                        {app.item?.title || 'Bilinmeyen Ürün'}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {app.isWinner ? (
                          <span className="rounded-full bg-[#fff3e0] px-2 py-0.5 text-xs font-semibold text-[#a15f00]">
                            Yeni Sahibi Sensin
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#d4e3ff] px-2 py-0.5 text-xs font-semibold text-[#38485f]">
                            Katıldın
                          </span>
                        )}

                        {app.isWinner &&
                          app.item?.deliveryStatus &&
                          (() => {
                            const labels = deliveryLabels(app.item);
                            const info = labels[app.item.deliveryStatus];
                            const hasShipping = app.item.deliveryMethods?.some(
                              (m) => m.includes('shipping'),
                            );

                            return (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${info?.color}`}
                              >
                                {!hasShipping ? (
                                  '🤝'
                                ) : (
                                  <Truck className="mr-1 inline h-3 w-3" />
                                )}
                                {info?.label}
                              </span>
                            );
                          })()}

                        <span className="text-xs text-[#75777d]">
                          {formatDistanceToNow(new Date(app.appliedAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#9aa0a6] transition group-hover:text-[#4d6359]" />
                  </Link>

                  {app.isWinner && (
                    <div className="mt-3 flex flex-wrap gap-2 pl-20">
                      {!app.item?.deliveryMethods?.some((m) =>
                        m.includes('shipping'),
                      )
                        ? app.item?.deliveryStatus === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedConfirmItemId(app.item?.id);
                                setConfirmModalOpen(true);
                              }}
                              className="rounded-lg bg-[#cde5d8] px-4 py-2 text-sm font-bold text-[#364b41]"
                            >
                              Elden Teslim Aldım
                            </button>
                          )
                        : app.item?.deliveryStatus === 'SHIPPED' && (
                            <button
                              onClick={() => {
                                setSelectedConfirmItemId(app.item?.id);
                                setConfirmModalOpen(true);
                              }}
                              className="rounded-lg bg-[#cde5d8] px-4 py-2 text-sm font-bold text-[#364b41]"
                            >
                              Teslim Aldım
                            </button>
                          )}

                      <Link
                        to={`/items/${app.item?.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#d4e3ff] px-4 py-2 text-sm font-bold text-[#38485f]"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Mesaj Gönder
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </section>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onItemCreated={fetchData}
      />

      <DeliveryConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        itemId={selectedConfirmItemId}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default Dashboard;
