import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Award, Briefcase, Lock, ShieldCheck, Users } from 'lucide-react';
import api from '../api';
import { ItemCard } from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/communities/${id}`);
      setData(response.data);
    } catch (error) {
      showToast('Topluluk detayları alınamadı.', 'error');
      navigate('/topluluklar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      showToast('Topluluğa katılmak için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    try {
      setJoining(true);
      const response = await api.post(`/communities/${id}/join`);
      setData(response.data);
      showToast('Topluluğa katıldın. Özel akış şimdi açık.', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Topluluğa katılım başarısız oldu.',
        'error',
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/70 px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="h-72 animate-pulse rounded-[32px] bg-white" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="h-[32rem] animate-pulse rounded-[32px] bg-white" />
            <div className="h-[32rem] animate-pulse rounded-[32px] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.community) {
    return null;
  }

  const {
    community,
    trustMessage,
    leaders,
    showcaseItems,
    requestItems,
    feedUnlocked,
  } = data;

  const renderFeedGrid = (items, emptyText) => {
    if (!feedUnlocked) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            Mikro-Döngü üyelikle açılır
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Topluluk içi ilanlar sadece üyelere görünür. Güvenli paylaşım
            akışına erişmek için önce katıl.
          </p>
          {!community.isMember && (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="mt-5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {joining ? 'Katılıyor...' : 'Topluluğa Katıl'}
            </button>
          )}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} to={`/items/${item.id}`} className="group">
            <ItemCard
              title={item.title}
              imageUrl={item.images?.[0] || item.imageUrl}
              drawDate={item.drawDate}
              status={item.status}
              participants={item.applicationsCount || 0}
              ownerAvatar={item.owner?.avatarUrl || null}
              ownerName={item.owner?.fullName || null}
              category={item.category}
              city={item.city}
              district={item.district}
              selectionType={item.selectionType}
              shareType={item.shareType}
              postType={item.postType}
              deliveryMethods={item.deliveryMethods}
            />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_40%),linear-gradient(180deg,_#f8fafc,_#eef2f7)] px-6 py-8 lg:px-10 lg:py-10">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-slate-300/20 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  {community.isVerified && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Güvenli Topluluk
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">
                  {community.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                  {community.description ||
                    'Bu topluluk, kontrollü üyelik ve güven odaklı paylaşım akışı için oluşturuldu.'}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                    <div className="text-xs font-medium text-slate-500">
                      Üye
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Users className="h-4 w-4 text-slate-400" />
                      {community.membersCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                    <div className="text-xs font-medium text-slate-500">
                      Aktif İlan
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Briefcase className="h-4 w-4 text-slate-400" />
                      {community.activeItemsCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
                    <div className="text-xs font-medium text-slate-500">
                      Konum
                    </div>
                    <div className="mt-1 text-base font-semibold text-slate-900">
                      {[community.district, community.city]
                        .filter(Boolean)
                        .join(', ') || 'Ağ genelinde'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Üyelik Durumu
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {trustMessage}
                </p>
                {community.membership && (
                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Rolün:{' '}
                    <span className="font-semibold text-slate-900">
                      {community.membership.role}
                    </span>
                  </div>
                )}
                {!community.isMember && (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="mt-5 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {joining ? 'Katılıyor...' : 'Topluluğa Katıl'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Grup Vitrini
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sadece bu topluluğa paylaşılan ilanlar.
                  </p>
                </div>
              </div>
              {renderFeedGrid(
                showcaseItems,
                'Bu topluluğun vitrininde henüz aktif ilan yok.',
              )}
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Grup Var mı?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sadece bu topluluğa özel ihtiyaç akışı.
                  </p>
                </div>
              </div>
              {renderFeedGrid(
                requestItems,
                'Bu topluluk içinde şu an aktif ihtiyaç ilanı görünmüyor.',
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Güvenli Topluluk</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Üyelik temelli görünürlük, güven puanı ve doğrulanmış kimlik
                sinyalleriyle topluluk içi etkileşimler daha kontrollü ilerler.
              </p>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900">
                <Award className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Grup Liderliği</h2>
              </div>

              <div className="mt-5 space-y-3">
                {leaders.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Liderlik tablosu için henüz yeterli veri yok.
                  </div>
                ) : (
                  leaders.map((leader, index) => (
                    <div
                      key={leader.user?.id || index}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">
                          {leader.user?.fullName || 'Döngü Üyesi'}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {leader.role} • {leader.user?.karmaPoint || 0} puan
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
