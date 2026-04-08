import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Inbox, PencilLine, Search, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);

  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else {
        fetchConversations();
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const partnerId = searchParams.get('partnerId');
    if (!partnerId) return;

    navigate(
      `/chat?partnerId=${partnerId}&partnerName=${encodeURIComponent(searchParams.get('partnerName'))}&itemId=${searchParams.get('itemId') || 'direct'}&itemTitle=${encodeURIComponent(searchParams.get('itemTitle'))}`,
    );
  }, [authLoading, isAuthenticated, searchParams, navigate]);

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

    socket.on('newMessage', () => fetchConversations(false));
    socket.on('conversationDeleted', ({ deletedByUserId }) => {
      setConversations((prev) =>
        prev.filter((c) => c.otherUser?.id !== deletedByUserId),
      );
    });

    return () => {
      socket.off('newMessage');
      socket.off('conversationDeleted');
    };
  }, [socket]);

  const fetchConversations = async (showLoad = true) => {
    try {
      if (showLoad) setLoading(true);
      const res = await api.get('/messages/my-conversations');
      setConversations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Konuşmalar yüklenemedi:', err);
    } finally {
      if (showLoad) setLoading(false);
    }
  };

  const handleDeleteConversation = async (e, conv) => {
    e.stopPropagation();

    if (
      !confirm(
        `"${conv.itemTitle}" paylaşımındaki ${conv.otherUser?.fullName || 'kullanıcı'} ile olan konuşmayı silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(conv.conversationId);
      if (!conv.otherUser?.id) {
        throw new Error('Konuşma kullanıcısı bulunamadı.');
      }

      await api.delete(`/messages/chat/${conv.otherUser.id}`);
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== conv.conversationId),
      );
      showToast('Konuşma silindi.', 'success');
    } catch {
      showToast('Konuşma silinemedi.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const visibleConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return conversations.filter((conv) => {
      const unreadPass =
        activeFilter === 'unread' ? conv.unreadCount > 0 : true;
      if (!unreadPass) return false;
      if (!term) return true;

      const name = conv.otherUser?.fullName?.toLowerCase() || '';
      const item = conv.itemTitle?.toLowerCase() || '';
      const message = conv.lastMessage?.toLowerCase() || '';
      return (
        name.includes(term) || item.includes(term) || message.includes(term)
      );
    });
  }, [conversations, activeFilter, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <div className="h-[70vh] animate-pulse rounded-[1.5rem] bg-[#e6e8ea]" />
          <div className="hidden h-[70vh] animate-pulse rounded-[1.5rem] bg-[#eceef0] lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
      <div className="grid min-h-[68vh] gap-0 overflow-hidden rounded-[1.5rem] bg-[#f2f4f6] lg:grid-cols-[360px_1fr]">
        <aside className="flex flex-col bg-white">
          <div className="border-b border-[#f2f4f6] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="font-[Manrope] text-2xl font-extrabold text-[#05162b]">
                Mesajlar
              </h1>
              <button className="rounded-full p-2 text-[#4d6359] transition hover:bg-[#f2f4f6]">
                <PencilLine className="h-4 w-4" />
              </button>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#75777d]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sohbetlerde ara..."
                className="w-full rounded-xl bg-[#f2f4f6] py-2.5 pl-10 pr-3 text-sm outline-none transition focus:bg-white focus:ring-1 focus:ring-[#05162b]/15"
              />
            </label>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'all'
                    ? 'bg-[#cde5d8] text-[#364b41]'
                    : 'bg-[#f2f4f6] text-[#75777d]'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'unread'
                    ? 'bg-[#cde5d8] text-[#364b41]'
                    : 'bg-[#f2f4f6] text-[#75777d]'
                }`}
              >
                Okunmamış
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            <AnimatePresence>
              {visibleConversations.map((conv) => (
                <motion.button
                  key={conv.conversationId || conv.itemId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  onClick={() =>
                    navigate(
                      `/chat?partnerId=${conv.otherUser.id}&partnerName=${encodeURIComponent(conv.otherUser.fullName)}&itemId=${conv.itemId}&itemTitle=${encodeURIComponent(conv.itemTitle)}`,
                    )
                  }
                  className={`group w-full rounded-2xl p-3 text-left transition ${
                    conv.unreadCount > 0
                      ? 'bg-[#f2f4f6]'
                      : 'hover:bg-[#f2f4f6]/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#e0e3e5]">
                      {conv.itemImageUrl ? (
                        <img
                          src={conv.itemImageUrl}
                          alt={conv.itemTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#4d6359]">
                          {(conv.otherUser?.fullName || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-[#05162b]">
                          {conv.otherUser?.fullName || 'Kullanıcı'}
                        </h3>
                        <span className="shrink-0 text-[10px] font-semibold text-[#75777d]">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>

                      <p className="truncate text-xs font-semibold text-[#4d6359]">
                        {conv.itemTitle}
                      </p>
                      <p className="truncate text-xs text-[#75777d]">
                        {conv.lastMessage}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {conv.unreadCount > 0 && (
                        <span className="rounded-full bg-[#05162b] px-2 py-0.5 text-[10px] font-bold text-white">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv)}
                        disabled={deletingId === conv.conversationId}
                        className="rounded-lg p-1 text-[#9aa0a6] opacity-0 transition hover:bg-white hover:text-[#ba1a1a] group-hover:opacity-100"
                        title="Konuşmayı Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>

            {visibleConversations.length === 0 && (
              <div className="p-6 text-center">
                <Inbox className="mx-auto h-10 w-10 text-[#c4c6cd]" />
                <p className="mt-2 text-sm font-semibold text-[#44474d]">
                  Konuşma bulunamadı
                </p>
                <p className="mt-1 text-xs text-[#75777d]">
                  Yeni bir konuşma başlatmak için vitrine göz at.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 rounded-full bg-gradient-to-br from-[#05162b] to-[#1b2b41] px-5 py-2 text-xs font-bold text-white"
                >
                  Vitrine Git
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="hidden flex-col items-center justify-center bg-[#f7f9fb] p-8 lg:flex">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_12px_32px_rgba(25,28,30,0.06)]">
              <Clock className="h-8 w-8 text-[#4d6359]" />
            </div>
            <h2 className="font-[Manrope] text-3xl font-extrabold text-[#05162b]">
              Bir sohbet seçin
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#44474d]">
              Mevcut konuşmalarınızdan birine devam edin veya topluluk
              üyeleriyle yeni bir etkileşim başlatın.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Messages;
