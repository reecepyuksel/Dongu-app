import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BrowserRouter as Router,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  LogOut,
  Mail,
  Repeat2,
  Search,
  Settings,
  UserCircle2,
  Users,
} from 'lucide-react';
import Home from './pages/Home';
import ItemDetail from './pages/ItemDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PublicProfile from './pages/PublicProfile';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Trades from './pages/Trades';
import TradeDetailPage from './pages/TradeDetailPage';
import Leaderboard from './pages/Leaderboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationBell from './components/NotificationBell';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SettingsPage from './pages/Settings';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import api from './api';
import donLogo from './assets/vector.svg';
import { io } from 'socket.io-client';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [tradePendingCount, setTradePendingCount] = useState(0);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnreadCount(0);
      setTradePendingCount(0);
      return;
    }

    let isMounted = true;
    const NAVBAR_POLL_MS = 30000;

    const fetchNavbarCounts = async () => {
      if (document.hidden) return;

      try {
        const [conversationsRes, offersRes] = await Promise.all([
          api.get('/messages/my-conversations'),
          api.get('/messages/my-trade-offers'),
        ]);

        if (!isMounted) return;

        const conversations = Array.isArray(conversationsRes.data)
          ? conversationsRes.data
          : [];
        const offers = Array.isArray(offersRes.data) ? offersRes.data : [];

        const unreadTotal = conversations.reduce(
          (sum, conv) => sum + (Number(conv.unreadCount) || 0),
          0,
        );

        const pendingIncomingTrades = offers.filter((offer) => {
          const isPending =
            String(offer?.tradeStatus || '').toLowerCase() === 'pending';
          const receiverId = offer?.receiver?.id;
          return isPending && receiverId === user?.id;
        }).length;

        setChatUnreadCount(unreadTotal);
        setTradePendingCount(pendingIncomingTrades);
      } catch {
        // silent
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchNavbarCounts();
      }
    };

    fetchNavbarCounts();
    const intervalId = setInterval(fetchNavbarCounts, NAVBAR_POLL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socket = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:3005',
      {
        query: { userId: user.id },
      },
    );

    const refreshCounts = async () => {
      if (document.hidden) return;

      try {
        const [conversationsRes, offersRes] = await Promise.all([
          api.get('/messages/my-conversations'),
          api.get('/messages/my-trade-offers'),
        ]);

        const conversations = Array.isArray(conversationsRes.data)
          ? conversationsRes.data
          : [];
        const offers = Array.isArray(offersRes.data) ? offersRes.data : [];

        const unreadTotal = conversations.reduce(
          (sum, conv) => sum + (Number(conv.unreadCount) || 0),
          0,
        );

        const pendingIncomingTrades = offers.filter((offer) => {
          const isPending =
            String(offer?.tradeStatus || '').toLowerCase() === 'pending';
          return isPending && offer?.receiver?.id === user.id;
        }).length;

        setChatUnreadCount(unreadTotal);
        setTradePendingCount(pendingIncomingTrades);
      } catch {
        // silent
      }
    };

    socket.on('newMessage', refreshCounts);
    socket.on('conversationDeleted', refreshCounts);
    socket.on('deleteMessage', refreshCounts);
    socket.on('newNotification', refreshCounts);

    return () => {
      socket.off('newMessage', refreshCounts);
      socket.off('conversationDeleted', refreshCounts);
      socket.off('deleteMessage', refreshCounts);
      socket.off('newNotification', refreshCounts);
      socket.close();
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLogoutModal]);

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const profileInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : 'D';

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white shadow-[0px_1px_0px_rgba(25,28,30,0.08)]">
        <div className="flex justify-between items-center px-4 md:px-8 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-4 lg:gap-12 h-full">
            <Link
              to="/"
              className="flex items-center h-16 w-[140px] shrink-0 overflow-hidden"
            >
              <img
                src={donLogo}
                alt="Döngü"
                className="h-full w-auto mix-blend-multiply contrast-[1.2] brightness-[1.1] scale-[1.35] origin-left"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-8 font-manrope text-sm tracking-tight">
            <Link
              to="/"
              className={`hover:text-[#1B2B41] dark:hover:text-white transition-colors duration-200 ${
                location.pathname === '/'
                  ? 'text-[#1B2B41] dark:text-white font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 font-semibold'
              }`}
            >
              Vitrin
            </Link>
            <Link
              to="/how-it-works"
              className={`hover:text-[#1B2B41] dark:hover:text-white transition-colors duration-200 ${
                location.pathname.startsWith('/how-it-works')
                  ? 'text-[#1B2B41] dark:text-white font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 font-semibold'
              }`}
            >
              Nasıl Çalışır
            </Link>
            <Link
              to="/about"
              className={`hover:text-[#1B2B41] dark:hover:text-white transition-colors duration-200 ${
                location.pathname.startsWith('/about')
                  ? 'text-[#1B2B41] dark:text-white font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 font-semibold'
              }`}
            >
              Hakkımızda
            </Link>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/liderlik"
                  className={`flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-[#B2CABD]/30 to-surface-container-low border border-[#B2CABD]/50 px-3 md:px-4 py-1.5 rounded-full hover:shadow-md hover:scale-105 transition-all ${
                    location.pathname.startsWith('/liderlik')
                      ? 'ring-2 ring-primary bg-white'
                      : ''
                  }`}
                  title="Sıralaman"
                >
                  <span
                    className={`material-symbols-outlined text-[18px] md:text-[20px] ${location.pathname.startsWith('/liderlik') ? 'text-primary fill-current' : 'text-primary'}`}
                  >
                    emoji_events
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-[11px] sm:text-xs md:text-sm text-[#1B2B41] dark:text-white">
                      Sıralama:{' '}
                      <span className="text-primary text-xs sm:text-sm">
                        #{user?.karma?.rank || user?.karmaStats?.rank || '-'}
                      </span>
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-on-surface-variant">
                  <Link
                    to="/messages"
                    className={`relative cursor-pointer transition-colors flex items-center justify-center p-1 ${
                      location.pathname.startsWith('/message') ||
                      location.pathname.startsWith('/chat')
                        ? 'text-primary'
                        : 'hover:text-primary text-on-surface-variant'
                    }`}
                    title="Mesajlar"
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] md:text-2xl ${location.pathname.startsWith('/message') || location.pathname.startsWith('/chat') ? 'font-bold fill-current' : ''}`}
                    >
                      mail
                    </span>
                    {chatUnreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[9px] font-bold text-white shadow-sm">
                        {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/trades"
                    className={`relative hidden sm:flex cursor-pointer transition-colors items-center justify-center p-1 ${
                      location.pathname.startsWith('/trade')
                        ? 'text-primary'
                        : 'hover:text-primary text-on-surface-variant'
                    }`}
                    title="Takas"
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] md:text-2xl ${location.pathname.startsWith('/trade') ? 'font-bold fill-current' : ''}`}
                    >
                      swap_horiz
                    </span>
                    {tradePendingCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[9px] font-bold text-white shadow-sm">
                        {tradePendingCount > 9 ? '9+' : tradePendingCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/topluluklar"
                    className={`hidden sm:flex relative cursor-pointer transition-colors items-center justify-center p-1 ${
                      location.pathname.startsWith('/topluluk')
                        ? 'text-primary'
                        : 'hover:text-primary text-on-surface-variant'
                    }`}
                    title="Topluluklar"
                  >
                    <span
                      className={`material-symbols-outlined text-[22px] md:text-2xl ${location.pathname.startsWith('/topluluk') ? 'font-bold fill-current' : ''}`}
                    >
                      groups
                    </span>
                  </Link>

                  <NotificationBell />
                </div>

                <div
                  className="relative ml-1 hidden sm:block"
                  ref={profileMenuRef}
                >
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full overflow-hidden border-2 border-surface-container-high shrink-0 focus:outline-none"
                    title="Profil menüsü"
                  >
                    {user?.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt="Profil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1b2b41] text-xs font-bold text-white md:text-sm">
                        {profileInitial}
                      </div>
                    )}
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full z-[80] mt-2 w-56 overflow-hidden rounded-2xl border border-surface-container-high bg-white shadow-xl">
                      <div className="p-2">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface-variant transition hover:bg-surface-container-low"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            account_circle
                          </span>
                          Profilim
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface-variant transition hover:bg-surface-container-low"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            settings
                          </span>
                          Ayarlar
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setShowLogoutModal(true);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-body text-sm text-[#ba1a1a] transition hover:bg-error-container"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            logout
                          </span>
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="font-manrope text-sm font-semibold text-primary"
                >
                  Giriş
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[#1b2b41] px-4 py-2 font-manrope text-sm font-bold text-white"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="mb-8 text-center font-manrope text-xl font-bold text-[#05162b]">
                Bir süreliğine döngüden ayrılıyor musun?
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 rounded-xl bg-surface-container-low py-3 font-bold text-on-surface-variant"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 rounded-xl bg-primary py-3 font-bold text-white"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="relative min-h-screen flex flex-col bg-[#f7f9fb] text-[#191c1e] pb-16 sm:pb-0">
              <ScrollToTop />
              <Navbar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/items/:id" element={<ItemDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/trades" element={<Trades />} />
                  <Route
                    path="/trades/:tradeId"
                    element={<TradeDetailPage />}
                  />
                  <Route path="/profile/:id" element={<PublicProfile />} />
                  <Route path="/liderlik" element={<Leaderboard />} />
                  <Route path="/topluluklar" element={<Communities />} />
                  <Route path="/topluluk/:id" element={<CommunityDetail />} />
                  <Route path="/how-it-works" element={<HowItWorks />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route
                    path="/terms-of-service"
                    element={<TermsOfService />}
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
              <Footer />
              <BottomNav />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
