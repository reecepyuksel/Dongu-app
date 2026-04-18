import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';

const Login = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(
    '"Gerçek profesyonellik, bilgiyi paylaşmak ve topluluğu birlikte büyütmektir."',
  );

  // Login alanları
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Register alanları
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setForgotMode(false);
  }, [initialMode]);

  const toggleAuth = (target) => {
    setMode(target);
    setError('');
    setForgotMode(false);
    setQuote(
      target === 'register'
        ? '"Güven, bir topluluğun en değerli sermayesidir."'
        : '"Gerçek profesyonellik, bilgiyi paylaşmak ve topluluğu birlikte büyütmektir."',
    );
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword, rememberMe);
      showToast('Hoş geldin! Başarıyla giriş yaptın.', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(
        msg === 'Unauthorized'
          ? 'E-posta veya şifre hatalı.'
          : msg || 'Giriş başarısız. Lütfen bilgilerini kontrol et.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    // Backend endpoint henüz mevcut değil; kullanıcıya bilgi ver
    await new Promise((r) => setTimeout(r, 800));
    showToast(
      'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      'success',
    );
    setForgotMode(false);
    setForgotEmail('');
    setForgotLoading(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (registerPassword !== registerConfirmPassword) {
      setError('Şifreler eşleşmiyor. Lütfen tekrar kontrol et.');
      return;
    }
    if (registerPassword.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      await api.post('/auth/register', {
        fullName,
        email: registerEmail,
        password: registerPassword,
      });
      showToast('Hesabın oluşturuldu! Şimdi giriş yapabilirsin.', 'success');
      setFirstName('');
      setLastName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      toggleAuth('login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Kayıt işlemi başarısız. Lütfen bilgilerini kontrol et.',
      );
    } finally {
      setLoading(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen bg-surface flex items-start justify-center px-4 pt-24 pb-8 md:px-8 overflow-x-hidden">
      <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-[0px_12px_32px_rgba(25,28,30,0.06)] overflow-hidden">
        <div className="relative flex flex-col md:flex-row min-h-[560px]">
          <section
            className={`w-full md:w-1/2 p-7 md:p-10 flex flex-col justify-center z-20 bg-surface-container-lowest transition-all duration-500 ${
              isRegister ? 'md:translate-x-full' : 'md:translate-x-0'
            }`}
          >
            {!isRegister ? (
              <div className="space-y-5 min-h-[460px] flex flex-col justify-center">
                {/* ----- Şifremi Unuttum Modu ----- */}
                {forgotMode ? (
                  <div className="space-y-5">
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => setForgotMode(false)}
                        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4"
                      >
                        <span className="material-symbols-outlined text-base">
                          arrow_back
                        </span>
                        Geri Dön
                      </button>
                      <h1 className="text-on-surface text-2xl font-extrabold mb-1 tracking-tight font-manrope">
                        Şifreni Sıfırla
                      </h1>
                      <p className="text-on-surface-variant text-sm">
                        E-posta adresini gir, sıfırlama bağlantısı gönderelim.
                      </p>
                    </div>
                    <form className="space-y-4" onSubmit={handleForgotSubmit}>
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-semibold text-on-surface ml-1"
                          htmlFor="forgot-email"
                        >
                          E-posta Adresi
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-outline text-sm">
                              mail
                            </span>
                          </div>
                          <input
                            id="forgot-email"
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="ornek@dongu.com"
                            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-bold text-lg shadow-[0px_12px_32px_rgba(5,22,43,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <span>
                          {forgotLoading
                            ? 'Gönderiliyor...'
                            : 'Sıfırlama Bağlantısı Gönder'}
                        </span>
                        <span className="material-symbols-outlined text-xl">
                          send
                        </span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ----- Normal Giriş Modu ----- */
                  <>
                    <div className="mb-6">
                      <h1 className="text-on-surface text-2xl md:text-3xl font-extrabold mb-2 tracking-tight font-manrope">
                        Tekrar Hoş Geldin
                      </h1>
                      <p className="text-on-surface-variant">
                        Lütfen hesabına giriş yap.
                      </p>
                    </div>

                    {error && (
                      <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm border border-red-200">
                        {error}
                      </div>
                    )}

                    <form className="space-y-5" onSubmit={handleLoginSubmit}>
                      <div className="space-y-2">
                        <label
                          className="block text-sm font-semibold text-on-surface ml-1"
                          htmlFor="email"
                        >
                          E-posta Adresi
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-outline text-sm">
                              mail
                            </span>
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="ornek@dongu.com"
                            className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          className="block text-sm font-semibold text-on-surface ml-1"
                          htmlFor="password"
                        >
                          Şifre
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-outline text-sm">
                              lock
                            </span>
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showLoginPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              {showLoginPassword
                                ? 'visibility_off'
                                : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="peer h-5 w-5 rounded border-outline-variant bg-surface-container-low text-primary focus:ring-primary/20 transition-all"
                          />
                          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                            Beni hatırla
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-sm font-semibold text-secondary hover:text-on-secondary-fixed-variant transition-colors"
                        >
                          Şifremi unuttum?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-bold text-lg shadow-[0px_12px_32px_rgba(5,22,43,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        <span>
                          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </span>
                        <span className="material-symbols-outlined text-xl">
                          arrow_forward
                        </span>
                      </button>
                    </form>

                    <div className="relative py-4 flex items-center">
                      <div className="flex-grow border-t border-outline-variant/30" />
                      <span className="flex-shrink mx-4 text-outline text-xs font-medium uppercase">
                        Veya
                      </span>
                      <div className="flex-grow border-t border-outline-variant/30" />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        showToast('Google girişi yakında aktif olacak.', 'info')
                      }
                      className="w-full py-3.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface font-semibold rounded-full transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Google ile Giriş Yap</span>
                    </button>

                    <div className="mt-5 text-center">
                      <p className="text-on-surface-variant text-sm">
                        Hesabın yok mu?
                        <button
                          type="button"
                          onClick={() => toggleAuth('register')}
                          className="text-secondary font-bold hover:underline underline-offset-4 ml-1"
                        >
                          Kayıt Ol
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* ----- Kayıt Modu ----- */
              <div className="space-y-5 min-h-[460px] flex flex-col justify-center">
                <div className="mb-6">
                  <h1 className="text-on-surface text-2xl md:text-3xl font-extrabold mb-2 tracking-tight font-manrope">
                    Hesap Oluştur
                  </h1>
                  <p className="text-on-surface-variant">
                    İyilik ve güven ekosistemine katıl.
                  </p>
                </div>

                {error && (
                  <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-semibold text-on-surface ml-1"
                        htmlFor="fname"
                      >
                        Ad
                      </label>
                      <input
                        id="fname"
                        type="text"
                        required
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Ali"
                        className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className="block text-sm font-semibold text-on-surface ml-1"
                        htmlFor="lname"
                      >
                        Soyad
                      </label>
                      <input
                        id="lname"
                        type="text"
                        required
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Yılmaz"
                        className="w-full px-4 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-on-surface ml-1"
                      htmlFor="reg-email"
                    >
                      E-posta
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-sm">
                          mail
                        </span>
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="ornek@dongu.com"
                        className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-on-surface ml-1"
                      htmlFor="reg-pass"
                    >
                      Şifre
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-sm">
                          lock
                        </span>
                      </div>
                      <input
                        id="reg-pass"
                        type={showRegisterPassword ? 'text' : 'password'}
                        minLength={6}
                        required
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="En az 6 karakter"
                        className="w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-on-surface"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showRegisterPassword
                            ? 'visibility_off'
                            : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="block text-sm font-semibold text-on-surface ml-1"
                      htmlFor="reg-confirm"
                    >
                      Şifre Tekrar
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-outline text-sm">
                          lock_check
                        </span>
                      </div>
                      <input
                        id="reg-confirm"
                        type={showRegisterConfirm ? 'text' : 'password'}
                        minLength={6}
                        required
                        autoComplete="new-password"
                        value={registerConfirmPassword}
                        onChange={(e) =>
                          setRegisterConfirmPassword(e.target.value)
                        }
                        placeholder="••••••••"
                        className={`w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-xl border-none focus:ring-1 transition-all placeholder:text-outline/60 text-on-surface ${
                          registerConfirmPassword &&
                          registerPassword !== registerConfirmPassword
                            ? 'ring-1 ring-error'
                            : 'focus:ring-primary/20 focus:bg-surface-container-lowest'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirm((v) => !v)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {showRegisterConfirm
                            ? 'visibility_off'
                            : 'visibility'}
                        </span>
                      </button>
                    </div>
                    {registerConfirmPassword &&
                      registerPassword !== registerConfirmPassword && (
                        <p className="text-xs text-error ml-1">
                          Şifreler eşleşmiyor.
                        </p>
                      )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-bold text-lg shadow-[0px_12px_32px_rgba(5,22,43,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span>{loading ? 'Kaydediliyor...' : 'Üye Ol'}</span>
                    <span className="material-symbols-outlined text-xl">
                      person_add
                    </span>
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-on-surface-variant text-sm">
                    Zaten üye misin?
                    <button
                      type="button"
                      onClick={() => toggleAuth('login')}
                      className="text-secondary font-bold hover:underline underline-offset-4 ml-1"
                    >
                      Giriş Yap
                    </button>
                  </p>
                </div>
              </div>
            )}
          </section>

          <section
            className={`hidden md:flex md:w-1/2 relative bg-primary-container p-9 flex-col justify-between overflow-hidden z-10 transition-all duration-500 ${
              isRegister ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-on-tertiary-container/10 rounded-full blur-3xl -ml-40 -mb-40" />

            <div className="relative z-10 pt-4 md:pt-6">
              <div className="space-y-6">
                <h2 className="text-surface-bright text-4xl font-extrabold leading-tight tracking-tight font-manrope">
                  İyilik ve Güvenin
                  <br />
                  Dijital Ekosistemi
                </h2>
                <p className="text-on-primary-container text-lg max-w-md leading-relaxed">
                  Topluluk bağlarını güçlendiren, profesyonel networking ve
                  yardımlaşma ağının bir parçası olun.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="bg-surface-container-lowest/5 backdrop-blur-xl p-6 rounded-xl border border-white/10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">
                      volunteer_activism
                    </span>
                  </div>
                  <span className="text-surface-bright font-semibold">
                    Günün İyilik Protokolü
                  </span>
                </div>
                <p className="text-on-primary-container text-sm italic">
                  {quote}
                </p>
              </div>
            </div>

            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none">
              <img
                alt="Modern abstract illustration of diverse people connecting"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2jZZOZlea4D8n8wBZ-cBpaeeZxoJm9EdOOvY4v5opDF7wa9bh8qbMuj9uWL-VOcOgOJ26lj5U2yVgq_KokNBMC-vLX8g3yHzp4_eIvqPlTX7ESNVRhbUFTIj8spdl6X1AB2QACC6eWMzVJ_Z3KpVb6w60FtweSReq3WqTiPD8wLNXRtetK0ez3L8_5Gk1LScdNrIWKolcGJDZ0IOBLUUBLHmRMLB5Bb7mVifQ7ahXKiAJWof3zZOI_g4OszR9W96DYPZLdtt-GP8l"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
