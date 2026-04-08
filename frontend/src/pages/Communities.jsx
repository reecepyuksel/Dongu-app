import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ShieldCheck,
  Users,
  Briefcase,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CommunityCard = ({ community, onJoin, joinLoading }) => {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {community.image ? (
            <img
              src={community.image}
              alt={community.name}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
              {community.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                {community.name}
              </h3>
              {community.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Güvenli Topluluk
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {(community.city || community.district) && (
                <span>
                  {[community.district, community.city]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          to={`/topluluk/${community.id}`}
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          İncele
        </Link>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
        {community.description ||
          'Güven odaklı, profesyonel bir dayanışma alanı.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500">Üye Sayısı</div>
          <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
            <Users className="h-4 w-4 text-slate-400" />
            {community.membersCount}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="text-xs font-medium text-slate-500">Aktif İlan</div>
          <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-800">
            <Briefcase className="h-4 w-4 text-slate-400" />
            {community.activeItemsCount}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {community.requestingCount} ihtiyaç, {community.offeringCount} vitrin
          ilanı
        </div>
        {community.isMember ? (
          <Link
            to={`/topluluk/${community.id}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Topluluğa Git
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(community.id)}
            disabled={joinLoading}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joinLoading ? 'Katılıyor...' : 'Katıl'}
          </button>
        )}
      </div>
    </article>
  );
};

const Communities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState({
    communities: [],
  });
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('POPULAR');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    image: null,
    agreementAccepted: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      if (isAuthenticated) {
        setIsCreateModalOpen(true);
      } else {
        showToast('Topluluk oluşturmak için giriş yapmalısınız.', 'info');
        navigate('/login');
      }
      navigate('/topluluklar', { replace: true });
    }
  }, [isAuthenticated, location.search, navigate, showToast]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      return;
    }

    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setIsCreateModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isCreateModalOpen]);

  const mergeCommunities = (discoverData) => {
    const joined = Array.isArray(discoverData?.joinedCommunities)
      ? discoverData.joinedCommunities
      : [];
    const suggested = Array.isArray(discoverData?.suggestedCommunities)
      ? discoverData.suggestedCommunities
      : [];

    const map = new Map();

    [...joined, ...suggested].forEach((community) => {
      const prev = map.get(community.id);
      map.set(community.id, {
        ...(prev || {}),
        ...community,
        isMember: Boolean(community.isMember || prev?.isMember),
      });
    });

    return Array.from(map.values());
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/communities/discover');
      setData({
        communities: mergeCommunities(response.data),
      });
    } catch (error) {
      showToast('Topluluklar şu anda yüklenemiyor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      image: null,
      agreementAccepted: false,
    });
  };

  const openCreateModal = () => {
    if (!isAuthenticated) {
      showToast('Topluluk oluşturmak için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    setIsCreateModalOpen(true);
  };

  const closeCreateModal = (force = false) => {
    if (creating && !force) {
      return;
    }
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleCreateInputChange = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    if (!createForm.agreementAccepted) {
      showToast('Topluluk kurallarını onaylamadan devam edemezsiniz.', 'info');
      return;
    }

    if (!createForm.name.trim() || !createForm.description.trim()) {
      showToast('Topluluk adı ve açıklama alanları zorunludur.', 'info');
      return;
    }

    try {
      setCreating(true);
      const payload = new FormData();
      payload.append('name', createForm.name.trim());
      payload.append('description', createForm.description.trim());
      if (createForm.image) {
        payload.append('image', createForm.image);
      }

      const response = await api.post('/communities', payload);
      const createdId = response?.data?.community?.id;

      showToast(
        'Topluluk oluşturuldu. Artık kurucu yönetici olarak yayındasın.',
        'success',
      );
      closeCreateModal(true);
      await fetchCommunities();

      if (createdId) {
        navigate(`/topluluk/${createdId}`);
      }
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Topluluk oluşturulurken bir sorun oluştu.',
        'error',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (communityId) => {
    if (!isAuthenticated) {
      showToast('Topluluğa katılmak için giriş yapmalısınız.', 'info');
      navigate('/login');
      return;
    }

    try {
      setJoiningId(communityId);
      await api.post(`/communities/${communityId}/join`);
      showToast(
        'Topluluğa katıldın. Mikro-Döngü artık senin için açık.',
        'success',
      );
      await fetchCommunities();
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          'Topluluğa katılırken bir sorun oluştu.',
        'error',
      );
    } finally {
      setJoiningId(null);
    }
  };

  const filteredCommunities = data.communities
    .filter((community) => {
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      return [
        community.name,
        community.description,
        community.city,
        community.district,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    })
    .sort((left, right) => {
      if (sortBy === 'ALPHA') {
        return left.name.localeCompare(right.name, 'tr');
      }

      const memberDiff = (right.membersCount || 0) - (left.membersCount || 0);
      if (memberDiff !== 0) return memberDiff;

      return left.name.localeCompare(right.name, 'tr');
    });

  return (
    <div className="min-h-screen bg-slate-100/70 pt-16">
      <section className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-100/60">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Topluluklar
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Aradığın topluluğu hızlıca bul.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Topluluklar tek akışta listelenir. Okul veya şehir ismini
                yazarak aradığın gruba kolayca ulaşabilirsin.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Okul, şehir veya topluluk adı ara..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="POPULAR">Popülerlik</option>
                  <option value="ALPHA">Alfabetik</option>
                </select>
              </div>
            </div>

            <div className="flex items-center lg:pt-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Topluluk Oluştur
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-white"
              />
            ))}
          </div>
        ) : (
          <section>
            {filteredCommunities.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                Arama kriterine uygun topluluk bulunamadı.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onJoin={handleJoin}
                    joinLoading={joiningId === community.id}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Topluluk Oluştur
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  LinkedIn tarzı profesyonel bir alan aç ve güvenli bir çevre
                  kur.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="space-y-5 px-6 py-6" onSubmit={handleCreateSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Topluluk Adı
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) =>
                    handleCreateInputChange('name', event.target.value)
                  }
                  maxLength={80}
                  placeholder="Örn: Ege Üniversitesi Döngü Kulübü"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Kapak Fotoğrafı
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50/40">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                  <span className="truncate">
                    {createForm.image
                      ? createForm.image.name
                      : 'Kapak görseli yüklemek için dosya seç'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      handleCreateInputChange(
                        'image',
                        event.target.files?.[0] || null,
                      )
                    }
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Açıklama
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(event) =>
                    handleCreateInputChange('description', event.target.value)
                  }
                  rows={5}
                  maxLength={600}
                  placeholder="Topluluğun amacı, kimler için olduğu ve paylaşım ilkeleri..."
                  className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={createForm.agreementAccepted}
                  onChange={(event) =>
                    handleCreateInputChange(
                      'agreementAccepted',
                      event.target.checked,
                    )
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Topluluk kuralları ve iyilik sözleşmesine uygun, kapsayıcı bir
                alan oluşturmayı kabul ediyorum.
              </label>

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  disabled={creating}
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={
                    creating ||
                    !createForm.agreementAccepted ||
                    !createForm.name.trim() ||
                    !createForm.description.trim()
                  }
                  className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? 'Oluşturuluyor...' : 'Topluluğu Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Communities;
