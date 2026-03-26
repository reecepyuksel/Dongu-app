import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import {
  Star,
  Gift,
  Package,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  TrendingUp,
  HelpCircle,
  MessageCircle,
  Heart,
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ProfileStatsModal from '../components/ProfileStatsModal';
import { useAuth } from '../context/AuthContext';

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [thanksNotes, setThanksNotes] = useState([]);
  const [thanksLoading, setThanksLoading] = useState(false);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('donations'); // 'donations' | 'received'
  const [modalItems, setModalItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Auth and Chat
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${id}`);
        setProfile(res.data);
      } catch (err) {
        setError('Kullanıcı bulunamadı veya bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const fetchThanks = async () => {
      try {
        setThanksLoading(true);
        const res = await api.get(`/thanks/received/${id}`);
        setThanksNotes(Array.isArray(res.data) ? res.data : []);
      } catch {
        setThanksNotes([]);
      } finally {
        setThanksLoading(false);
      }
    };

    fetchThanks();
  }, [id]);

  const openModal = async (type) => {
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    try {
      const endpoint =
        type === 'donations'
          ? `/users/profile/${id}/donations`
          : `/users/profile/${id}/winnings`;
      const res = await api.get(endpoint);
      setModalItems(res.data || []);
    } catch (err) {
      console.error('Error fetching modal items:', err);
      setModalItems([]);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-pulse text-emerald-600 font-medium">
          Profil yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-center">
        <p className="text-slate-500 text-lg">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-emerald-600 hover:underline"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : 'U';
  const badge = profile.karmaStats?.badge;
  const stats = profile.karmaStats?.stats;

  // Tamamlama Oranı Renk Kodu
  const cr = profile.completionRate;
  let crColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let crIcon = '🌟';

  if (cr === 0) {
    crColor = 'text-slate-600 bg-slate-50 border-slate-200';
    crIcon = '💡';
  } else if (cr < 50) {
    crColor = 'text-red-700 bg-red-50 border-red-200';
    crIcon = '⚠️';
  } else if (cr < 90) {
    crColor = 'text-amber-700 bg-amber-50 border-amber-200';
    crIcon = '⭐';
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Geri Butonu */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Geri Dön
      </button>

      {/* Profil Başlığı */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 opacity-50 translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left relative z-10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 flex flex-shrink-0 items-center justify-center text-emerald-700 font-bold text-4xl shadow-inner border-4 border-white ring-2 ring-emerald-50">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-slate-900 font-[Outfit]">
                {profile.fullName}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                {profile.isVerifiedAccount && (
                  <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hesabı Doğrulanmış Kullanıcı
                  </span>
                )}
                {profile.karmaStats?.rank <= 10 && (
                  <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-xs font-bold flex items-center gap-1 shadow-sm" title="İlk 10'da yer alıyor!">
                    <Trophy className="w-3.5 h-3.5" /> Topluluk Lideri
                  </span>
                )}
                {badge && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                    {badge.emoji} {badge.name}
                  </span>
                )}
                {/* Güvenlik Rozeti: Tamamlama Oranı */}
                <div className={`flex flex-col items-start`}>
                  <div
                    className={`px-3 py-1 border rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${crColor}`}
                    title="Söz verdiği eşyaları teslim etme oranı"
                  >
                    {crIcon} Teslimat Başarısı: %{cr}
                  </div>
                  {cr === 0 && (
                    <span className="text-[10px] text-slate-400 font-medium ml-1 mt-1 bg-white/50 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-100 shadow-sm animate-pulse">
                      İlk başarılı teslimatını yaparak puanını artır!
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-sm mb-6 flex items-center justify-center md:justify-start gap-1">
              <Clock className="w-4 h-4" />
              Döngüye katılım:{' '}
              <span className="font-semibold text-slate-700">
                {format(new Date(profile.createdAt), 'MMMM yyyy', {
                  locale: tr,
                })}
              </span>
            </p>

            {(profile.bio || profile.city || profile.district) && (
              <div className="mb-6 space-y-2">
                {profile.bio && (
                  <p className="text-sm text-slate-700">{profile.bio}</p>
                )}
                {(profile.city || profile.district) && (
                  <p className="text-xs text-slate-500">
                    Konum:{' '}
                    {[profile.city, profile.district]
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                )}
              </div>
            )}

            {/* Yeni Mesaj Gönder Butonu */}
            {isAuthenticated && user?.id !== profile.id && (
              <div className="flex justify-center md:justify-start">
                <button
                  onClick={() =>
                    navigate(
                      `/chat?partnerId=${profile.id}&partnerName=${encodeURIComponent(profile.fullName)}`,
                    )
                  }
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Mesaj Gönder
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10"
      >
        {/* 1. Döngüye Kattıkları (Tıklanabilir) */}
        <div
          onClick={() => openModal('donations')}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group hover:scale-105 hover:border-emerald-200 hover:ring-2 hover:ring-emerald-50 active:scale-95"
        >
          <div className="absolute -right-4 -bottom-4 bg-emerald-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Döngüye Kattığı
            </p>
            <p className="text-3xl font-extrabold text-slate-800 font-[Outfit] flex items-baseline gap-2">
              {profile.completedLoops || 0}
              <span className="text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Eşya
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Döngüye geri kazandırdı
            </p>
            <p className="text-xs text-emerald-600 font-medium absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
              İncele
            </p>
          </div>
        </div>

        {/* 2. Alınan Eşya (Tıklanabilir) */}
        <div
          onClick={() => openModal('received')}
          className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group hover:scale-105 hover:border-blue-200 hover:ring-2 hover:ring-blue-50 active:scale-95"
        >
          <div className="absolute -right-4 -bottom-4 bg-blue-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Alınan Eşya
            </p>
            <p className="text-3xl font-extrabold text-slate-800 font-[Outfit] flex items-baseline gap-2">
              {profile.receivedItems || 0}
              <span className="text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Eşya
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-2">Yeni şans buldu</p>
            <p className="text-xs text-blue-600 font-medium absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
              İncele
            </p>
          </div>
        </div>

        {/* 3. Döngü Puanı (Animasyonlu) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Döngü Puanı
            </p>

            <div className="flex items-baseline gap-2 mb-1">
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-3xl font-extrabold font-[Outfit] text-slate-800"
              >
                {profile.karmaPoint || 0}
              </motion.p>
              <span className="text-sm font-medium text-slate-400">Puan</span>
            </div>

            {/* Rank Badge */}
            {badge && (
              <div className="mb-3">
                <span className="text-xs font-bold bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  {badge.emoji} {badge.name}
                </span>
              </div>
            )}

            {/* Animated Progress Bar */}
            {(() => {
              const kp = profile.karmaPoint || 0;
              let currentMin = 0,
                currentMax = 250;
              if (kp >= 2000) {
                currentMin = 2000;
                currentMax = 2000;
              } else if (kp >= 751) {
                currentMin = 751;
                currentMax = 2000;
              } else if (kp >= 251) {
                currentMin = 251;
                currentMax = 750;
              }

              const pct =
                kp >= 2000
                  ? 100
                  : Math.min(
                      ((kp - currentMin) / (currentMax - currentMin)) * 100,
                      100,
                    );

              return (
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                    className={`absolute h-full rounded-full ${
                      kp < 251
                        ? 'bg-amber-400'
                        : kp < 751
                          ? 'bg-slate-400'
                          : kp < 2000
                            ? 'bg-yellow-500'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                    }`}
                  />
                  {kp >= 751 && (
                    <motion.div
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: '200%', opacity: 0.4 }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        ease: 'linear',
                      }}
                      className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white to-transparent"
                    />
                  )}
                </div>
              );
            })()}

            {/* Next rank info */}
            {profile.karmaStats?.nextRankName ? (
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                {profile.karmaStats.nextRankName} seviyesine{' '}
                <span className="text-emerald-600 font-bold">
                  {profile.karmaStats.pointsToNext}
                </span>{' '}
                puan kaldı!
              </p>
            ) : (
              <p className="text-[10px] text-emerald-600 mt-2 font-bold">
                🏆 Maksimum seviyedesin!
              </p>
            )}
          </div>
        </div>

        {/* 4. Giderilen İhtiyaçlar */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:scale-105 hover:border-emerald-200 hover:ring-2 hover:ring-emerald-50 active:scale-95">
          <div className="absolute -right-4 -bottom-4 bg-emerald-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              İhtiyaç Giderilen
            </p>
            <p className="text-3xl font-extrabold text-slate-800 font-[Outfit] flex items-baseline gap-2">
              {profile.resolvedRequestsCount || 0}
            </p>
            <p className="text-xs text-slate-500 mt-2">Döngüye can verdi 🚀</p>
          </div>
        </div>

        {/* 5. Genel Sıralama */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:scale-105 hover:border-amber-200 hover:ring-2 hover:ring-amber-50 active:scale-95 col-span-2 lg:col-span-1">
          <div className="absolute -right-4 -bottom-4 bg-amber-50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500 z-0"></div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Genel Sıralama
            </p>
            <p className="text-3xl font-extrabold text-slate-800 font-[Outfit] flex items-baseline gap-2">
              #{profile.karmaStats?.rank || '-'}
            </p>
            <p className="text-xs text-slate-500 mt-2">Döngü Elçisi ✨</p>
          </div>
        </div>
      </motion.div>

      {/* Aktif Paylaşımlar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-800">
            Aktif Paylaşımları ({profile.activeItems.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.activeItems.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                Şu anda aktif bir paylaşımı bulunmuyor.
              </p>
            </div>
          ) : (
            profile.activeItems.map((item) => (
              <Link
                key={item.id}
                to={`/items/${item.id}`}
                className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-lg hover:border-emerald-100 transition-all group flex gap-4 items-center"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/150'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate mb-1 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                      Aktif
                    </span>
                    <span className="truncate">{item.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>
                      Yayınlanma:{' '}
                      {format(new Date(item.createdAt), 'dd MMM yyyy', {
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
              </Link>
            ))
          )}
        </div>
      </motion.div>

      {/* Teşekkür Notları */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mt-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-800">Teşekkür Notları</h2>
        </div>

        {thanksLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Teşekkür notları yükleniyor...
          </div>
        ) : thanksNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
            Henüz teşekkür notu yok.
          </div>
        ) : (
          <div className="space-y-3">
            {thanksNotes.map((note) => {
              const initial =
                note.sender?.fullName?.charAt(0)?.toUpperCase() || 'U';
              return (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center text-slate-600 font-bold">
                      {note.sender?.avatarUrl ? (
                        <img
                          src={note.sender.avatarUrl}
                          alt={note.sender.fullName || 'Kullanıcı'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {note.sender?.fullName || 'Kullanıcı'}
                        </p>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {note.item?.title || 'İlan'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {note.textContent}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <ProfileStatsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'donations'
            ? 'Döngüye Kattıkları'
            : 'Döngüden Aldıkları'
        }
        items={modalItems}
        loading={modalLoading}
      />
    </div>
  );
};

export default PublicProfile;
