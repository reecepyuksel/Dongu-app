import React, { useMemo, useState } from 'react';
import {
  Camera,
  Shield,
  Bell,
  UserRound,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  X,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import citiesData from '../data/cities.json';

const tabs = [
  { id: 'profile', label: 'Genel Profil', icon: UserRound },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Guvenlik', icon: Shield },
  { id: 'security-verification', label: 'Güvenlik ve Doğrulama', icon: Shield },
  { id: 'blocked-users', label: 'Engellenen Kullanıcılar', icon: Shield },
];

const getUserDefaults = (user) => ({
  fullName: user?.fullName || '',
  bio: user?.bio || '',
  city: user?.city || '',
  district: user?.district || '',
  email: user?.email || '',
  newPassword: '',
  phone: user?.phone || '',
  avatarFile: null,
  notifyTradeOffers: user?.notifyTradeOffers ?? true,
  notifyMessages: user?.notifyMessages ?? true,
  isEmailVerified: user?.isEmailVerified ?? false,
  isPhoneVerified: user?.isPhoneVerified ?? false,
  trustScore: Number(user?.trustScore) || 0,
});

const normalizeForCompare = (form, defaults) => ({
  fullName: form.fullName.trim(),
  bio: form.bio.trim(),
  city: form.city,
  district: form.district,
  email: form.email.trim(),
  newPassword: form.newPassword,
  phone: form.phone,
  notifyTradeOffers: Boolean(form.notifyTradeOffers),
  notifyMessages: Boolean(form.notifyMessages),
  isEmailVerified: Boolean(form.isEmailVerified),
  isPhoneVerified: Boolean(form.isPhoneVerified),
  hasAvatarFile: Boolean(form.avatarFile),
  defaultsSnapshot: JSON.stringify({
    fullName: defaults.fullName.trim(),
    bio: defaults.bio.trim(),
    city: defaults.city,
    district: defaults.district,
    email: defaults.email.trim(),
    phone: defaults.phone,
    notifyTradeOffers: Boolean(defaults.notifyTradeOffers),
    notifyMessages: Boolean(defaults.notifyMessages),
    isEmailVerified: Boolean(defaults.isEmailVerified),
    isPhoneVerified: Boolean(defaults.isPhoneVerified),
  }),
});

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-800">
          {label}
        </span>
        <span className="block text-xs text-slate-500 mt-0.5">
          {description}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

export default function Settings() {
  const { user, isAuthenticated, fetchUser } = useAuth();
  const { showToast } = useToast();

  const initialDefaults = useMemo(() => getUserDefaults(user), [user]);

  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState(initialDefaults);
  const [defaults, setDefaults] = useState(initialDefaults);
  const [saving, setSaving] = useState(false);
  const [isVerifyPhoneModalOpen, setIsVerifyPhoneModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockingId, setUnblockingId] = useState(null);

  React.useEffect(() => {
    const nextDefaults = getUserDefaults(user);
    setDefaults(nextDefaults);
    setForm((prev) => ({
      ...nextDefaults,
      newPassword: prev.newPassword,
      avatarFile: prev.avatarFile,
    }));
  }, [user]);

  const districts = useMemo(
    () => citiesData.districtsData[form.city] || [],
    [form.city],
  );

  const isDirty = useMemo(() => {
    const current = normalizeForCompare(form, defaults);
    const base = JSON.parse(current.defaultsSnapshot);
    return (
      current.fullName !== base.fullName ||
      current.bio !== base.bio ||
      current.city !== base.city ||
      current.district !== base.district ||
      current.email !== base.email ||
      current.phone !== base.phone ||
      current.notifyTradeOffers !== base.notifyTradeOffers ||
      current.notifyMessages !== base.notifyMessages ||
      current.isEmailVerified !== base.isEmailVerified ||
      current.isPhoneVerified !== base.isPhoneVerified ||
      Boolean(current.newPassword) ||
      current.hasAvatarFile
    );
  }, [form, defaults]);

  const canSave = isAuthenticated && isDirty && !saving;

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null;
    updateField('avatarFile', file);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const hasFile = Boolean(form.avatarFile);

      if (hasFile) {
        const payload = new FormData();
        payload.append('fullName', form.fullName.trim());
        payload.append('bio', form.bio.trim());
        payload.append('city', form.city);
        payload.append('district', form.district);
        payload.append('email', form.email.trim());
        payload.append('phone', form.phone.trim());
        payload.append('notifyTradeOffers', String(form.notifyTradeOffers));
        payload.append('notifyMessages', String(form.notifyMessages));
        payload.append('isEmailVerified', String(form.isEmailVerified));
        payload.append('isPhoneVerified', String(form.isPhoneVerified));
        if (form.newPassword) payload.append('newPassword', form.newPassword);
        payload.append('avatar', form.avatarFile);
        await api.patch('/users/me', payload);
      } else {
        await api.patch('/users/me', {
          fullName: form.fullName.trim(),
          bio: form.bio.trim(),
          city: form.city,
          district: form.district,
          email: form.email.trim(),
          phone: form.phone.trim(),
          notifyTradeOffers: form.notifyTradeOffers,
          notifyMessages: form.notifyMessages,
          isEmailVerified: form.isEmailVerified,
          isPhoneVerified: form.isPhoneVerified,
          ...(form.newPassword ? { newPassword: form.newPassword } : {}),
        });
      }

      await fetchUser();
      const refreshedDefaults = {
        ...getUserDefaults(user),
        ...form,
        newPassword: '',
        avatarFile: null,
      };
      setDefaults(refreshedDefaults);
      setForm(refreshedDefaults);
      showToast('Ayarlar basariyla guncellendi.', 'success');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        'Ayarlar su anda kaydedilemedi. Sunucuda /users/me guncelleme endpointi olmayabilir.';
      showToast(Array.isArray(message) ? message[0] : message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const avatarPreview = useMemo(() => {
    if (!form.avatarFile) return user?.avatarUrl || null;
    return URL.createObjectURL(form.avatarFile);
  }, [form.avatarFile, user?.avatarUrl]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const fetchBlockedUsers = React.useCallback(async () => {
    try {
      setBlockedLoading(true);
      const res = await api.get('/messages/blocked-users');
      setBlockedUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      showToast('Engellenen kullanıcı listesi alınamadı.', 'error');
    } finally {
      setBlockedLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    if (activeTab === 'blocked-users') {
      fetchBlockedUsers();
    }
  }, [activeTab, fetchBlockedUsers]);

  React.useEffect(() => {
    const trustScore =
      (form.isEmailVerified ? 50 : 0) + (form.isPhoneVerified ? 50 : 0);
    if (form.trustScore !== trustScore) {
      setForm((prev) => ({ ...prev, trustScore }));
    }
  }, [form.isEmailVerified, form.isPhoneVerified, form.trustScore]);

  const handleMockEmailVerify = () => {
    if (form.isEmailVerified) return;
    setForm((prev) => ({ ...prev, isEmailVerified: true }));
    showToast(
      'E-posta doğrulandı (demo). Kaydet ile kalıcı yapabilirsin.',
      'info',
    );
  };

  const handlePhoneVerification = () => {
    if (verificationCode.trim().length < 4) {
      showToast('Lütfen geçerli bir doğrulama kodu gir.', 'error');
      return;
    }

    setForm((prev) => ({ ...prev, isPhoneVerified: true }));
    setVerificationCode('');
    setIsVerifyPhoneModalOpen(false);
    showToast(
      'Telefon doğrulandı (demo). Kaydet ile kalıcı yapabilirsin.',
      'success',
    );
  };

  const handleUnblock = async (blockedUserId) => {
    try {
      setUnblockingId(blockedUserId);
      await api.delete(`/messages/block/${blockedUserId}`);
      setBlockedUsers((prev) =>
        prev.filter((entry) => entry.blockedUser?.id !== blockedUserId),
      );
      showToast('Kullanıcının engeli kaldırıldı.', 'success');
    } catch (err) {
      showToast(
        err?.response?.data?.message || 'Engel kaldırılırken hata oluştu.',
        'error',
      );
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Ayarlar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Profilini, bildirim tercihlerini ve guvenlik bilgilerini yonet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 sm:gap-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-2 md:p-3">
          <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Genel Profil
              </h2>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Profil Fotografi
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-200 bg-slate-50 flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profil onizleme"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    Fotograf Yukle
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Isim
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Ad Soyad"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Biyografi
                  </label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-brand"
                    placeholder="Kendinden kisaca bahset"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Il
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) => {
                      const nextCity = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        city: nextCity,
                        district: '',
                      }));
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none bg-white focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Il sec</option>
                    {citiesData.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ilce
                  </label>
                  <select
                    value={form.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    disabled={!form.city}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Ilce sec</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Degisiklikleri Kaydet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Bildirimler
              </h2>
              <ToggleSwitch
                checked={form.notifyTradeOffers}
                onChange={(value) => updateField('notifyTradeOffers', value)}
                label="Takas Teklifleri"
                description="Yeni teklif geldiginde bildirim al."
              />
              <ToggleSwitch
                checked={form.notifyMessages}
                onChange={(value) => updateField('notifyMessages', value)}
                label="Mesajlar"
                description="Yeni mesaj geldiginde bildirim al."
              />

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Degisiklikleri Kaydet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-900">Guvenlik</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                  placeholder="ornek@mail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Yeni Sifre
                </label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => updateField('newPassword', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Yeni sifreni gir"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Degisiklikleri Kaydet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security-verification' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Güvenlik ve Doğrulama
              </h2>

              <div
                className={`rounded-xl border p-4 ${
                  form.isEmailVerified
                    ? 'border-green-200 bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        E-posta
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">
                        {form.email || '-'}
                      </p>
                      <span
                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          form.isEmailVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {form.isEmailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {form.isEmailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMockEmailVerify}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {form.isEmailVerified ? 'Düzenle' : 'Doğrula'}
                  </button>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  form.isPhoneVerified
                    ? 'border-green-200 bg-green-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Phone className="w-5 h-5 text-slate-500 mt-0.5" />
                    <div className="w-full">
                      <p className="text-sm font-semibold text-slate-800">
                        Telefon
                      </p>
                      <input
                        value={form.phone}
                        onChange={(e) => {
                          const nextPhone = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            phone: nextPhone,
                            isPhoneVerified: false,
                          }));
                        }}
                        placeholder="05xx xxx xx xx"
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
                      />
                      <span
                        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          form.isPhoneVerified
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {form.isPhoneVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {form.isPhoneVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVerifyPhoneModalOpen(true)}
                    disabled={!form.phone.trim()}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Doğrula
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Sosyal Medya
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Güven puanını artırmak için sosyal hesaplarını bağla.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram Bağla
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn Bağla
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Düzenle
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                Güven puanı:{' '}
                <span className="font-bold">{form.trustScore}/100</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Degisiklikleri Kaydet
                </button>
              </div>
            </div>
          )}

          {activeTab === 'blocked-users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Engellenen Kullanıcılar
              </h2>

              {blockedLoading ? (
                <p className="text-sm text-slate-500">Liste yükleniyor...</p>
              ) : blockedUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Henüz engellediğin kullanıcı yok.
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((entry) => (
                    <div
                      key={entry.id || entry.blockedUser?.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {entry.blockedUser?.fullName || 'Kullanıcı'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Bu kullanıcı ile mesajlaşma engellendi.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={unblockingId === entry.blockedUser?.id}
                        onClick={() => handleUnblock(entry.blockedUser?.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Engeli Kaldır
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-start">
            <button
              type="button"
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Hesabi Sil
            </button>
          </div>
        </section>
      </div>

      {isVerifyPhoneModalOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={() => setIsVerifyPhoneModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                Telefonu Doğrula
              </h3>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setIsVerifyPhoneModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Telefonuna gelen doğrulama kodunu gir.
            </p>
            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Doğrulama kodu"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              onClick={handlePhoneVerification}
              className="mt-4 w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-700"
            >
              Kodu Doğrula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

ToggleSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};
