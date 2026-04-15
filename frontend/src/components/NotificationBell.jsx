import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Info,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';

const typeStyles = {
  SUCCESS: {
    icon: Sparkles,
    bg: 'bg-[#d0e8db]',
    iconColor: 'text-[#364b41]',
    badge: 'bg-[#4d6359]',
  },
  WARNING: {
    icon: TriangleAlert,
    bg: 'bg-[#fff3e0]',
    iconColor: 'text-[#a15f00]',
    badge: 'bg-[#a15f00]',
  },
  INFO: {
    icon: Info,
    bg: 'bg-[#d4e3ff]',
    iconColor: 'text-[#38485f]',
    badge: 'bg-[#38485f]',
  },
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);

  const popSoundUrl =
    'data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAAAH+GCAAAAOEwAA4XAACIQAAgQAAAEAAAIgAAACAAA//NExJQAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqoAAAH+GCAAAAOEwAA4XAACIQAAgQAAAEAAAIgAAACAAA';
  const audioRef = useRef(new Audio(popSoundUrl));

  // Poll unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    const NOTIFICATION_POLL_MS = 20000;

    const pollUnread = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };

    fetchUnreadCount();
    const interval = setInterval(pollUnread, NOTIFICATION_POLL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count);
    } catch (err) {
      // silent
    }
  };

  // Web Sockets for Real-time Notifications & Sounds
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) return;

    const userId = JSON.parse(atob(token.split('.')[1]))?.sub;
    if (!userId) return;

    const newSocket = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:3005',
      {
        query: { userId },
      },
    );

    setSocket(newSocket);

    return () => newSocket.close();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const playPopSound = () => {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      } catch (e) {}
    };

    socket.on('newNotification', (incomingNotification) => {
      playPopSound();

      if (incomingNotification?.id) {
        setUnreadCount((prev) => prev + 1);
        setNotifications((prev) => {
          const exists = prev.some(
            (notification) => notification.id === incomingNotification.id,
          );
          if (exists) {
            return prev;
          }

          return [incomingNotification, ...prev];
        });
      } else {
        fetchUnreadCount();
        if (isOpen) fetchNotifications();
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, [socket, isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
      setShowAll(false);
      setActiveFilter('all');
    }
    setIsOpen(!isOpen);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* silent */
    }
  };

  const resolveNotificationCategory = (notification) => {
    const text =
      `${notification?.title || ''} ${notification?.message || ''}`.toLowerCase();

    if (text.includes('takas')) return 'trade';
    if (text.includes('teslimat')) return 'trade';
    if (text.includes('mesaj')) return 'message';
    if (text.includes('katılımcı')) return 'system';
    if (text.includes('çekiliş')) return 'system';
    if (text.includes('aradığın ürün')) return 'system';
    if (text.includes('ihtiyaç')) return 'system';
    if (text.includes('yeni sahibi')) return 'system';

    return 'system';
  };

  const getNotificationTarget = (notification) => {
    if (!notification?.relatedId) return null;
    return `/items/${notification.relatedId}`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    const target = getNotificationTarget(notification);
    if (target) {
      setIsOpen(false);
      navigate(target);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Şimdi';
    if (diffMin < 60) return `${diffMin} dk önce`;
    if (diffHour < 24) return `${diffHour} saat önce`;
    if (diffDay < 7) return `${diffDay} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;

    return notifications.filter((notification) => {
      const category = resolveNotificationCategory(notification);
      if (activeFilter === 'trade') {
        return category === 'trade' || category === 'message';
      }
      return category === 'system';
    });
  }, [activeFilter, notifications]);

  const visibleNotifications = useMemo(
    () =>
      showAll ? filteredNotifications : filteredNotifications.slice(0, 10),
    [filteredNotifications, showAll],
  );

  const unreadInList = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative rounded-full bg-white p-2 text-[#4d6359] shadow-[0_8px_20px_rgba(25,28,30,0.08)] transition hover:bg-[#f2f4f6]"
        title="Bildirimler"
      >
        <Bell
          className={`h-5 w-5 transition ${isOpen ? 'text-[#05162b]' : 'text-[#4d6359]'}`}
        />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ba1a1a] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:right-0 top-full z-[120] mt-3 w-[90vw] sm:w-[400px] flex flex-col overflow-hidden rounded-2xl border border-[#e6e8ea] bg-[#ffffff] shadow-[0px_12px_32px_rgba(25,28,30,0.06)] font-[Manrope]">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#f2f4f6]/50 p-5">
            <div>
              <h2 className="text-lg font-bold text-[#1b2b41]">Bildirimler</h2>
              <p className="font-[Inter] text-xs text-[#75777d]">
                Hareketlerini ve mesajlarını buradan takip et
              </p>
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadInList === 0}
              className="font-[Inter] text-xs font-semibold text-[#1b2b41] transition-colors hover:text-[#4d6359]"
            >
              Tümünü okundu yap
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#f2f4f6] px-2 py-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-[Inter] text-xs transition-transform duration-200 active:scale-95 ${
                activeFilter === 'all'
                  ? 'bg-[#b2cabd]/20 font-semibold text-[#1b2b41]'
                  : 'text-[#75777d] hover:bg-[#e0e3e5]'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              Tümü
            </button>
            <button
              onClick={() => setActiveFilter('trade')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-[Inter] text-xs transition-transform duration-200 active:scale-95 ${
                activeFilter === 'trade'
                  ? 'bg-[#b2cabd]/20 font-semibold text-[#1b2b41]'
                  : 'text-[#75777d] hover:bg-[#e0e3e5]'
              }`}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Takas
            </button>
            <button
              onClick={() => setActiveFilter('system')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 font-[Inter] text-xs transition-transform duration-200 active:scale-95 ${
                activeFilter === 'system'
                  ? 'bg-[#b2cabd]/20 font-semibold text-[#1b2b41]'
                  : 'text-[#75777d] hover:bg-[#e0e3e5]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sistem
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && filteredNotifications.length === 0 && (
              <div className="flex justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e6e8ea] border-t-[#4d6359]"></div>
              </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
              <div className="py-12 text-center">
                <Bell className="mx-auto mb-3 h-10 w-10 text-[#c4c6cd]" />
                <p className="text-sm font-semibold text-[#75777d]">
                  Bu sekmede gösterilecek bildirim yok
                </p>
              </div>
            )}

            {visibleNotifications.map((notif) => {
              const style = typeStyles[notif.type] || typeStyles.INFO;
              const IconComponent = style.icon;
              const target = getNotificationTarget(notif);
              const isTradeNotification =
                resolveNotificationCategory(notif) === 'trade' ||
                resolveNotificationCategory(notif) === 'message';

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notif);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`group relative flex w-full cursor-pointer gap-4 border-b border-[#f2f4f6] p-4 text-left transition-colors hover:bg-[#f7f9fb] last:border-0 ${notif.isRead ? 'opacity-80' : ''}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${notif.isRead ? 'bg-[#f2f4f6] text-[#75777d]' : `${style.bg} ${style.iconColor}`}`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>

                  <div className="flex min-w-0 flex-grow flex-col">
                    <div className="flex items-start justify-between">
                      <span className="truncate text-sm font-bold text-[#1b2b41]">
                        {notif.title}
                      </span>
                      <span className="shrink-0 font-[Inter] text-[10px] text-[#75777d]">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 font-[Inter] text-xs text-[#51675d]">
                      {notif.message}
                    </p>

                    {target && notif.type === 'SUCCESS' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNotificationClick(notif);
                          setIsOpen(false);
                        }}
                        className="mt-3 w-full rounded-lg bg-[#4d6359] py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#364b41]"
                      >
                        {isTradeNotification
                          ? 'Takas Detayına Git'
                          : 'İlana Git'}
                      </button>
                    )}

                    {target && notif.type !== 'SUCCESS' && (
                      <div className="mt-3 flex gap-3">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNotificationClick(notif);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-1.5 rounded-full bg-[#E0E7FF] px-3 py-1.5 text-[11px] font-medium text-[#4F46E5] transition-all hover:bg-[#D1D9FF] active:scale-95"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Detay
                        </button>

                        {!notif.isRead && (
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await markNotificationAsRead(notif.id);
                            }}
                            className="rounded-full bg-[#f2f4f6] px-3 py-1.5 text-[11px] font-medium text-[#1b2b41] transition-all hover:bg-[#e6e8ea] active:scale-95"
                          >
                            Okundu yap
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!notif.isRead && (
                    <div className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#b2cabd]" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#f2f4f6]/30 p-4 text-center">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1b2b41] transition-colors hover:text-[#4d6359]"
            >
              {showAll ? 'Daha Az Göster' : 'Tüm Bildirimleri Gör'}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
