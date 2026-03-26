import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import {
  LogOut,
  MessageCircle,
  Heart,
  Handshake,
  Home as HomeIcon,
  Plus,
  ChevronDown,
  Settings,
  Trophy,
  Package,
  UserCircle2,
  ShieldCheck,
  Search,
  Users,
} from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationBell from './components/NotificationBell';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SettingsPage from './pages/Settings';
import Communities from './pages/Communities';
import CommunityDetail from './pages/CommunityDetail';
import logo from './assets/dongu-.png';
import api from './api';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [tradePendingCount, setTradePendingCount] = useState(0);
  const [navHidden, setNavHidden] = useState(false);
  const profileMenuRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setChatUnreadCount(0);
      setTradePendingCount(0);
      return;
    }

    let isMounted = true;

    const fetchNavbarCounts = async () => {
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
        // Silent fail: navbar badges should not block UI.
      }
    };

    fetchNavbarCounts();
    const intervalId = setInterval(fetchNavbarCounts, 12000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated, user?.id]);

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

  /* ── scroll hide/show ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastScrollY.current && y > 80) {
        setNavHidden(true);
        setIsProfileMenuOpen(false);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleConfirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm transition-transform duration-300 ${navHidden ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="relative w-full px-3 sm:px-6 lg:px-8 xl:px-14 h-16 flex items-center justify-between flex-nowrap">
        <div className="flex items-center flex-shrink-0 min-w-fit">
          <Link
            to="/"
            className="flex items-center justify-center group -ml-2 sm:-ml-2 h-full pb-1"
          >
            <img
              src={logo}
              alt="Sistem Logosu"
              className="h-[56px] sm:h-[64px] scale-[1.3] sm:scale-[1.5] origin-center w-auto mix-blend-multiply brightness-[1.05] contrast-[1.1] object-contain group-hover:scale-[1.35] sm:group-hover:scale-[1.55] transition-transform lg:scale-[1.2] lg:group-hover:scale-[1.25] xl:scale-[1.5] xl:group-hover:scale-[1.55]"
            />
          </Link>
        </div>

        <div className="hidden xl:flex ml-auto mr-8 xl:mr-12 flex-shrink-0 justify-center items-center gap-6 xl:gap-8 text-[15px] font-medium text-slate-600 px-2 lg:mx-auto">
          <Link
            to="/"
            className="hover:text-emerald-600 transition whitespace-nowrap"
          >
            Vitrin
          </Link>
          <Link
            to="/how-it-works"
            className="hover:text-emerald-600 transition whitespace-nowrap"
          >
            Nasıl Çalışır?
          </Link>
          <Link
            to="/about"
            className="hover:text-emerald-600 transition whitespace-nowrap"
          >
            Hakkımızda
          </Link>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-2 xl:gap-6 border-l border-slate-200/60 pl-3 sm:pl-4 lg:pl-3 xl:pl-6">
                <Link
                  to="/"
                  className="xl:hidden relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                  title="Anasayfa"
                >
                  <HomeIcon className="w-5 h-5" />
                  <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Vitrin
                  </span>
                </Link>

                <Link
                  to="/chat"
                  className="relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                  title="Sohbetler"
                >
                  <div className="relative">
                    <MessageCircle className="w-5 h-5" />
                    {chatUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm leading-none">
                        {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Mesajlar
                  </span>
                </Link>

                <Link
                  to="/trades"
                  className="relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                  title="Takaslar"
                >
                  <div className="relative">
                    <Handshake className="w-5 h-5" />
                    {tradePendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm leading-none">
                        {tradePendingCount > 9 ? '9+' : tradePendingCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Takaslar
                  </span>
                </Link>

                <Link
                  to="/topluluklar"
                  className="relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                  title="Topluluklar"
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Topluluklar
                  </span>
                </Link>

                <Link
                  to="/liderlik"
                  className="relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                  title="Sıralama"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                    Sıralama
                  </span>
                </Link>

                <NotificationBell />
              </div>

              <Link
                to="/dashboard"
                className="flex items-center justify-center bg-emerald-500 text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-4 py-2 rounded-xl sm:rounded-full hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 font-medium sm:text-sm lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 lg:text-xs xl:text-sm"
                title="Döngüye Kat"
              >
                <span className="hidden sm:inline mr-1.5 whitespace-nowrap">
                  Döngüye Kat
                </span>
                <Heart className="hidden sm:block w-4 h-4" />
                <Plus className="sm:hidden w-5 h-5" />
              </Link>

              <div className="relative block" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition"
                  title="Profil menüsü"
                >
                  <div className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : 'M'}
                  </div>
                  <span className="block max-w-[90px] md:max-w-[120px] lg:max-w-[90px] xl:max-w-[160px] truncate text-xs md:text-sm lg:text-[11px] xl:text-sm text-slate-700 font-medium whitespace-nowrap">
                    {user?.fullName || 'Döngü Üyesi'}
                  </span>
                  {user?.isEmailVerified && user?.isPhoneVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Güven
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-[80] overflow-hidden">
                    <div className="p-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition"
                      >
                        <UserCircle2 className="w-4 h-4" />
                        Profilim & Karnem
                      </Link>
                      <Link
                        to="/dashboard?tab=items"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Package className="w-4 h-4" />
                        İlanlarım
                      </Link>
                      <Link
                        to="/how-it-works#puan-tablosu"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Trophy className="w-4 h-4" />
                        Puan Tablosu
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition"
                      >
                        <Settings className="w-4 h-4" />
                        Ayarlar
                      </Link>

                      <div className="my-2 h-px bg-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-2 xl:gap-6 border-l border-slate-200/60 pl-3 sm:pl-4 lg:pl-3 xl:pl-6">
              <Link
                to="/"
                className="lg:hidden relative p-1 sm:p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition flex flex-col items-center justify-center gap-0.5 group"
                title="Anasayfa"
              >
                <HomeIcon className="w-5 h-5" />
                <span className="hidden md:block text-[10px] font-bold mt-0.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  Vitrin
                </span>
              </Link>
              <Link
                to="/login"
                className="block text-emerald-600 hover:text-emerald-700 font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center bg-emerald-500 text-white px-4 py-2 rounded-full hover:bg-emerald-600 transition shadow-md shadow-emerald-500/20 font-medium text-sm whitespace-nowrap"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <LogOut className="w-6 h-6 ml-1" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-8 font-[Outfit] text-center">
                Bir süreliğine döngüden ayrılıyor musun?
              </h3>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </nav>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative">
              <ScrollToTop />
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/items/:id" element={<ItemDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/trades/:tradeId" element={<TradeDetailPage />} />
                <Route path="/profile/:id" element={<PublicProfile />} />
                <Route path="/liderlik" element={<Leaderboard />} />
                <Route path="/topluluklar" element={<Communities />} />
                <Route path="/topluluk/:id" element={<CommunityDetail />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<About />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
