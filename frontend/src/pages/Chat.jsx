import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Search,
  MessageCircle,
  Trash2,
  Paperclip,
  FileText,
  Download,
  Loader2,
  Star,
  ShieldCheck,
  Heart,
  ExternalLink,
  ArrowLeftRight,
  Info,
  X,
  Clock,
  CheckCheck,
  MoreVertical,
  Ban,
  Flag,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ─────────────────────────────────── helpers ──────────────────────────────── */
const NAVBAR_H = 64; // px — must match the sticky Navbar h-16

/* ── Skeleton: conversation list ─ */
const ConvSkeleton = () => (
  <div className="space-y-1 p-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 rounded-xl p-3">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-[#e6e8ea] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 animate-pulse rounded-lg bg-[#e6e8ea]" />
          <div className="h-3 w-1/2 animate-pulse rounded-lg bg-[#f2f4f6]" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Skeleton: message list ─ */
const MSG_SKELETONS = [
  { mine: false, w: 'w-2/5' },
  { mine: true, w: 'w-3/5' },
  { mine: false, w: 'w-1/2' },
  { mine: true, w: 'w-2/5' },
  { mine: false, w: 'w-3/4' },
  { mine: true, w: 'w-1/3' },
  { mine: false, w: 'w-2/3' },
  { mine: true, w: 'w-1/2' },
];

const MsgSkeleton = () => (
  <div className="space-y-4 px-6 py-6">
    {MSG_SKELETONS.map((row, i) => (
      <div
        key={i}
        className={`flex ${row.mine ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`${row.w} h-10 rounded-2xl animate-pulse ${
            row.mine ? 'bg-emerald-100' : 'bg-slate-200'
          }`}
        />
      </div>
    ))}
  </div>
);

/* ── Empty state (no chat selected) ─ */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full gap-5 select-none px-8">
    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#d0e8db] bg-[#f2f8f4]">
      <MessageCircle className="h-10 w-10 text-[#4d6359]" />
    </div>
    <div className="text-center">
      <p className="mb-1 text-xl font-bold text-[#05162b]">Bir sohbet seçin</p>
      <p className="max-w-xs text-sm leading-relaxed text-[#75777d]">
        Soldan bir konuşmaya tıkla veya bir ilan sayfasından mesaj göndererek
        başla.
      </p>
    </div>
  </div>
);

/* ─────────────────────────────────── main ─────────────────────────────────── */
export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { showToast } = useToast();

  /* ── conversations state ── */
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  /* ── active chat state ── */
  const [activeChatId, setActiveChatId] = useState(null); // otherUser.id
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  /* ── sidebar panel (partner info) on desktop ── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Taciz');
  const [reportDetails, setReportDetails] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /* ── mobile: show chat window instead of list ── */
  const [mobileShowChat, setMobileShowChat] = useState(false);

  /* ── refs ── */
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ── file upload state ── */
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  /* ── auth guard ── */
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  /* ── fetch conversation list ── */
  const fetchConversations = useCallback(async (showLoad = true) => {
    try {
      if (showLoad) setConvLoading(true);
      const res = await api.get('/messages/my-conversations');
      setConversations(res.data);
    } catch {
      /* silent */
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) fetchConversations();
  }, [isAuthenticated, authLoading, fetchConversations]);

  /* ── URL param: auto-open chat from ?partnerId=... ── */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const partnerId = searchParams.get('partnerId');
    if (!partnerId) return;
    const synth = {
      conversationId: partnerId,
      itemId: searchParams.get('itemId') || 'direct',
      itemTitle: searchParams.get('itemTitle') || 'Sohbet',
      itemImageUrl: null,
      otherUser: {
        id: partnerId,
        fullName: searchParams.get('partnerName') || 'Kullanıcı',
      },
    };
    openChat(synth);
  }, [authLoading, isAuthenticated, searchParams]); // eslint-disable-line

  /* ── socket ── */
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const sock = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:3005',
      { query: { userId: user.id } },
    );
    socketRef.current = sock;

    sock.on('newMessage', (msg) => {
      fetchConversations(false);
      setMessages((prev) => {
        const belongsToActive =
          (msg.sender?.id === activeChatIdRef.current ||
            msg.receiver?.id === activeChatIdRef.current) &&
          !prev.find((m) => m.id === msg.id);
        return belongsToActive ? [...prev, msg] : prev;
      });
    });

    sock.on('typing', (data) => {
      if (data.fromUserId === activeChatIdRef.current) setIsTyping(true);
    });

    sock.on('stopTyping', (data) => {
      if (data.fromUserId === activeChatIdRef.current) setIsTyping(false);
    });

    sock.on('deleteMessage', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    sock.on('conversationDeleted', ({ deletedByUserId }) => {
      setConversations((prev) =>
        prev.filter((c) => c.otherUser?.id !== deletedByUserId),
      );
    });

    return () => sock.close();
  }, [isAuthenticated, user?.id]); // eslint-disable-line

  /* keep a live ref to activeChatId for socket closures */
  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  /* ── fetch messages for active chat ── */
  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!activeConv) return;
      try {
        if (!silent) setMsgLoading(true);
        const partnerId = activeConv.otherUser?.id;
        const itemId = activeConv.itemId;
        let res;
        if (partnerId) {
          res = await api.get(`/messages/chat/${partnerId}`);
        } else {
          res = await api.get(`/messages/${itemId}`);
        }
        setMessages(res.data.filter((m) => !m.isTradeOffer));
      } catch (err) {
        const message = err?.response?.data?.message;
        if (message === 'Bu kullanıcıya mesaj gönderemezsiniz') {
          showToast(message, 'error');
          setMessages([]);
        }
      } finally {
        if (!silent) setMsgLoading(false);
      }
    },
    [activeConv, showToast],
  );

  useEffect(() => {
    if (activeConv) fetchMessages(false);
  }, [activeConv, fetchMessages]);

  useEffect(() => {
    setIsActionsOpen(false);
    setIsReportModalOpen(false);
  }, [activeConv?.otherUser?.id]);

  /* auto-scroll */
  const isFirstScroll = useRef(true);

  useEffect(() => {
    isFirstScroll.current = true;
  }, [activeConv]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const { scrollHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: isFirstScroll.current ? 'auto' : 'smooth',
      });
      if (messages.length > 0) isFirstScroll.current = false;
    }
  }, [messages, isTyping]);

  /* fetch partner profile for detail panel */
  useEffect(() => {
    const pid = activeConv?.otherUser?.id;
    if (!pid) return;
    setPartnerProfile(null);
    api
      .get(`/users/profile/${pid}`)
      .then((res) => setPartnerProfile(res.data))
      .catch(() => {});
  }, [activeConv?.otherUser?.id]);

  /* ── open chat helper ── */
  const openChat = (conv) => {
    setActiveConv(conv);
    setActiveChatId(conv.otherUser?.id);
    setMobileShowChat(true);
    setNewMessage('');
    setMessages([]);
    setIsTyping(false);
    // mark as read
    try {
      if (conv.itemId && conv.itemId !== 'direct') {
        api.post(`/messages/${conv.itemId}/read`).catch(() => {});
      } else if (conv.otherUser?.id) {
        api.post(`/messages/chat/${conv.otherUser.id}/read`).catch(() => {});
      }
    } catch {
      /* silent */
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    );
  };

  /* ── send message (with optional attachments) ── */
  const handleSend = async (e) => {
    e?.preventDefault();
    const hasText = newMessage.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    if ((!hasText && !hasFiles) || sending || !activeConv) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      setSending(true);
      let attachmentUrls = null;
      let attachmentType = null;

      // Upload files first if any
      if (hasFiles) {
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach((f) => formData.append('files', f));
        try {
          const uploadRes = await api.post(
            '/messages/upload-attachment',
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            },
          );
          attachmentUrls = uploadRes.data.urls;
          // Determine type from first file
          const firstMime = selectedFiles[0]?.type || '';
          attachmentType = firstMime.startsWith('image/')
            ? 'image'
            : 'document';
        } catch (uploadErr) {
          showToast('Dosya yüklenemedi. Lütfen tekrar deneyin.', 'error');
          setSending(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
        setSelectedFiles([]);
      }

      const itemId = activeConv.itemId;
      const partnerId = activeConv.otherUser?.id;
      const payload = {
        content:
          content || (attachmentType === 'image' ? '📷 Fotoğraf' : '📄 Belge'),
        targetUserId: partnerId,
        ...(attachmentUrls && { attachmentUrls, attachmentType }),
      };

      if (itemId && itemId !== 'direct') {
        await api.post(`/messages/${itemId}`, payload);
      } else if (partnerId) {
        await api.post(`/messages/direct/${partnerId}`, payload);
      }
      if (socketRef.current && partnerId) {
        socketRef.current.emit('stopTyping', {
          toUserId: partnerId,
          itemId: itemId || 'direct',
        });
      }
      await fetchMessages(true);
    } catch (err) {
      setNewMessage(content);
      showToast(
        err?.response?.data?.message || 'Mesaj gönderilemedi.',
        'error',
      );
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    const partnerId = activeConv?.otherUser?.id;
    if (socketRef.current && partnerId) {
      socketRef.current.emit('typing', {
        toUserId: partnerId,
        itemId: activeConv?.itemId || 'direct',
      });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stopTyping', {
          toUserId: partnerId,
          itemId: activeConv?.itemId || 'direct',
        });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── delete conversation ── */
  const handleDeleteConversation = async (e, conv) => {
    e.stopPropagation();
    if (
      !confirm(
        `${conv.otherUser?.fullName || 'kullanıcı'} ile olan sohbeti silmek istediğinize emin misiniz?`,
      )
    )
      return;
    try {
      setDeletingId(conv.conversationId);
      await api.delete(`/messages/chat/${conv.otherUser.id}`);
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== conv.conversationId),
      );
      if (activeChatId === conv.otherUser?.id) {
        setActiveConv(null);
        setActiveChatId(null);
        setMessages([]);
        setMobileShowChat(false);
      }
      showToast('Sohbet silindi.', 'success');
    } catch {
      showToast('Sohbet silinemedi.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── delete single message ── */
  const handleDeleteMessage = async (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await api.delete(`/messages/message/${msgId}`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Mesaj silinemedi.', 'error');
      fetchMessages(true);
    }
  };

  const handleBlockUser = async () => {
    const targetId = activeConv?.otherUser?.id;
    if (!targetId) return;

    if (!confirm('Bu kullanıcıyı engellemek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/messages/block/${targetId}`);
      setConversations((prev) =>
        prev.filter((c) => c.otherUser?.id !== targetId),
      );
      setActiveConv(null);
      setActiveChatId(null);
      setMessages([]);
      setMobileShowChat(false);
      setIsActionsOpen(false);
      showToast('Kullanıcı engellendi.', 'success');
    } catch (err) {
      showToast(
        err?.response?.data?.message || 'Kullanıcı engellenemedi.',
        'error',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const targetId = activeConv?.otherUser?.id;
    if (!targetId) return;

    try {
      setActionLoading(true);
      await api.post(`/messages/report/${targetId}`, {
        reason: reportReason,
        details: reportDetails,
      });
      setIsReportModalOpen(false);
      setIsActionsOpen(false);
      setReportDetails('');
      showToast('Şikayetiniz alındı.', 'success');
    } catch (err) {
      showToast(
        err?.response?.data?.message || 'Şikayet gönderilemedi.',
        'error',
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ── current user id ── */
  let currentUserId = null;
  try {
    const token = localStorage.getItem('token');
    if (token) currentUserId = JSON.parse(atob(token.split('.')[1]))?.sub;
  } catch {
    /* invalid */
  }

  /* ── filtered conversations ── */
  const filteredConvs = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.otherUser?.fullName || '').toLowerCase().includes(q) ||
      (c.itemTitle || '').toLowerCase().includes(q)
    );
  });

  /* ── item type badge for header ── */
  const activeItemType = activeConv?.itemType;
  const typeBadge =
    activeItemType === 'exchange'
      ? { label: 'Takas', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
      : activeItemType
        ? {
            label: 'Döngü',
            cls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          }
        : null;

  /* ── sidebar content ── */
  const renderDetailPanel = (onClose) => {
    const karmaPoint = partnerProfile?.karmaPoint ?? 0;
    const completedLoops = partnerProfile?.completedLoops ?? 0;
    const completionRate = partnerProfile?.completionRate ?? 0;
    const partnerInitial = (activeConv?.otherUser?.fullName || '?')
      .charAt(0)
      .toUpperCase();
    const itemId = activeConv?.itemId;

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        {onClose && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <p className="font-bold text-sm text-slate-700">Detay Paneli</p>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}

        {/* Partner card */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow shrink-0">
              {partnerInitial}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">
                {activeConv?.otherUser?.fullName || 'Kullanıcı'}
              </p>
              <button
                onClick={() => {
                  navigate(`/profile/${activeConv?.otherUser?.id}`);
                }}
                className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                Profile Git
              </button>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Döngü Karnesi
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" /> Puan
              </span>
              <span className="text-sm font-black text-slate-800">
                {karmaPoint}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-emerald-500" /> Döngüye
                Kattığı
              </span>
              <span className="text-sm font-black text-slate-800">
                {completedLoops}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Teslimat
                Başarısı
              </span>
              <span className="text-sm font-black text-slate-800">
                %{completionRate}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {itemId && itemId !== 'direct' && (
          <div className="p-5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Aksiyon
            </p>
            {activeConv?.itemType === 'exchange' ? (
              <button
                onClick={() => navigate(`/items/${itemId}`)}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <ArrowLeftRight className="w-4 h-4" /> Takas Başlat
              </button>
            ) : (
              <button
                onClick={() => navigate(`/items/${itemId}`)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
              >
                <Heart className="w-4 h-4" /> Döngüye Katıl
              </button>
            )}
            <button
              onClick={() => navigate(`/items/${itemId}`)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e0e3e5] bg-white px-4 py-3 text-sm font-bold text-[#05162b] transition hover:bg-[#f2f4f6]"
            >
              <ExternalLink className="w-4 h-4" /> İlanı Görüntüle
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ────────────────────────────── render ────────────────────────────────── */
  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center bg-[#f7f9fb]"
        style={{ height: `calc(100vh - ${NAVBAR_H}px)` }}
      >
        <div className="animate-pulse font-medium text-[#4d6359]">
          Oturum kontrol ediliyor...
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex h-[calc(100vh-var(--navbar-height)-2rem)] w-full max-w-7xl overflow-hidden bg-white shadow-sm md:my-4 md:rounded-2xl"
      style={{ '--navbar-height': `${NAVBAR_H}px` }}
    >
      {/* ══════════════════════════ SIDEBAR (CONVERSATIONS) ══════════════════════════ */}
      <aside
        className={`
          flex w-full flex-col border-r border-[#e0e3e5]/50 bg-[#f7f9fb]/50 md:w-80 lg:w-96
          ${mobileShowChat ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Header / Search */}
        <div className="border-b border-[#e0e3e5]/50 p-4">
          <h1 className="mb-3 font-[Manrope] text-2xl font-extrabold text-[#05162b]">
            Mesajlarım
          </h1>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#75777d]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kişi veya ilan ara..."
              className="w-full rounded-xl border border-[#e6e8ea] bg-[#f2f4f6] py-2.5 pl-9 pr-4 text-sm text-[#191c1e] outline-none transition focus:border-[#c4c6cd] focus:bg-white"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <ConvSkeleton />
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <MessageCircle className="w-12 h-12 text-slate-200 mb-3" />
              {search ? (
                <p className="text-slate-400 text-sm">Sonuç bulunamadı.</p>
              ) : (
                <>
                  <p className="text-slate-500 font-semibold mb-1">
                    Henüz mesajınız yok
                  </p>
                  <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                    Bir ilana gidip "İletişime Geç" butonuna basarak
                    başlayabilirsiniz.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ul className="py-2 space-y-0.5">
              <AnimatePresence>
                {filteredConvs.map((conv) => {
                  const isActive = activeChatId === conv.otherUser?.id;
                  const initial = (conv.otherUser?.fullName || '?')
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <motion.li
                      key={conv.conversationId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="relative group px-2"
                    >
                      <button
                        onClick={() => openChat(conv)}
                        className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors border-l-4 ${
                          isActive
                            ? 'bg-[#cde5d8]/30 border-[#4d6359]'
                            : conv.unreadCount > 0
                              ? 'bg-[#f2f4f6] border-transparent hover:bg-[#eceef0]'
                              : 'hover:bg-[#eceef0] border-transparent'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {conv.itemImageUrl ? (
                            <img
                              src={conv.itemImageUrl}
                              alt={conv.itemTitle}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                              {initial}
                            </div>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3
                              className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-[#05162b]' : 'font-bold text-[#05162b]'}`}
                            >
                              {conv.otherUser?.fullName || 'Kullanıcı'}
                            </h3>
                            <span className="text-[10px] font-medium text-[#75777d] shrink-0 ml-2">
                              {formatDistanceToNow(
                                new Date(conv.lastMessageAt),
                                {
                                  addSuffix: true,
                                  locale: tr,
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#4d6359] truncate mb-1">
                            {conv.itemTitle}
                          </p>
                          <p
                            className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-[#191c1e] font-semibold' : 'text-[#44474d]'}`}
                          >
                            {conv.lastMessage}
                          </p>
                        </div>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv)}
                        disabled={deletingId === conv.conversationId}
                        className="absolute top-2 right-3 p-1.5 rounded-lg bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                        title="Sohbeti Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </aside>

      {/* ══════════════════════════ CHAT WINDOW ══════════════════════════ */}
      <section
        className={`
          flex-1 flex flex-col min-w-0 overflow-hidden
          ${!mobileShowChat ? 'hidden md:flex' : 'flex'}
        `}
      >
        {!activeConv ? (
          <EmptyState />
        ) : (
          <>
            <header className="flex shrink-0 items-center gap-4 border-b border-[#e0e3e5]/50 bg-[#f2f4f6] px-6 py-3">
              {/* Back button (mobile) */}
              <button
                onClick={() => setMobileShowChat(false)}
                className="-ml-2 rounded-full p-2 text-[#75777d] transition hover:bg-[#e0e3e5] md:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Item thumbnail */}
              <div className="w-12 h-12 shrink-0 overflow-hidden rounded-lg border border-[#e0e3e5]/50 bg-white shadow-sm">
                {activeConv.itemImageUrl ? (
                  <img
                    src={activeConv.itemImageUrl}
                    alt={activeConv.itemTitle || 'İlan'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg select-none">
                    📦
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <h2 className="font-[Manrope] text-base font-bold leading-none text-[#05162b] truncate">
                    {activeConv.itemTitle || 'Sohbet'}
                  </h2>
                  {typeBadge && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadge.cls}`}
                    >
                      {typeBadge.label}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs font-medium text-[#44474d]">
                  {activeConv.otherUser?.fullName || 'Kullanıcı'} ile sohbet ediyorsunuz
                </p>
              </div>

              {/* Detail panel toggle */}
              <button
                onClick={() => setDetailOpen(!detailOpen)}
                className={`rounded-xl p-2 transition ${detailOpen ? 'bg-[#cde5d8] text-[#364b41]' : 'text-[#75777d] hover:bg-[#f2f4f6]'}`}
                title="Detay Paneli"
              >
                <Info className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActionsOpen((prev) => !prev)}
                  className="rounded-xl p-2 text-[#75777d] hover:bg-[#f2f4f6]"
                  title="Sohbet menüsü"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isActionsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 p-1.5">
                    <button
                      type="button"
                      onClick={handleBlockUser}
                      disabled={actionLoading}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      Kullanıcıyı Engelle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Flag className="w-4 h-4" />
                      Şikayet Et
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* ── Body: messages + optional detail panel ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Messages column */}
              <div className="flex flex-col flex-1 min-h-0 min-w-0">
                {/* Message list */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto bg-[#f7f9fb]"
                >
                  {msgLoading ? (
                    <MsgSkeleton />
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-8">
                      <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-slate-400 text-sm font-medium">
                        Henüz mesaj yok.
                      </p>
                      <p className="text-slate-300 text-xs mt-1">
                        İlk mesajı siz gönderin!
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 md:px-6 py-5 space-y-2.5">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => {
                          const isSystem = !msg.sender;
                          const isMine =
                            !isSystem && msg.sender?.id === currentUserId;

                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`group flex items-end gap-1 ${
                                isSystem
                                  ? 'justify-center mx-auto'
                                  : isMine
                                    ? 'justify-end max-w-[80%] ml-auto'
                                    : 'justify-start max-w-[80%]'
                              }`}
                            >
                              {isMine && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Mesajı sil"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-[#c4c6cd] hover:text-red-500 hover:bg-red-50 mb-1 shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <div
                                className={`flex flex-col ${
                                  isSystem
                                    ? 'items-center w-full'
                                    : isMine
                                      ? 'items-end'
                                      : 'items-start'
                                }`}
                              >
                                <div
                                  className={`px-4 py-3 text-sm leading-relaxed break-words shadow-sm ${
                                    isSystem
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200 text-center w-full rounded-2xl'
                                      : isMine
                                        ? 'bg-[#cde5d8] text-[#003308] rounded-2xl rounded-tr-none'
                                        : 'bg-[#f2f4f6] text-[#44474d] rounded-2xl rounded-tl-none'
                                  }`}
                                >
                                  {isSystem && (
                                    <span className="block mb-1 text-[10px] uppercase tracking-wider opacity-70 font-bold">
                                      📢 Sistem
                                    </span>
                                )}

                                {/* Attachment rendering */}
                                {msg.attachmentUrls &&
                                  msg.attachmentUrls.length > 0 && (
                                    <div
                                      className={`mb-2 ${msg.attachmentType === 'image' ? 'space-y-2' : 'space-y-1.5'}`}
                                    >
                                      {msg.attachmentType === 'image'
                                        ? msg.attachmentUrls.map((url, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() =>
                                                setLightboxUrl(url)
                                              }
                                              className="block cursor-pointer"
                                            >
                                              <img
                                                src={url}
                                                alt="Ek görsel"
                                                className={`max-w-full rounded-xl border ${isMine ? 'border-emerald-400/30' : 'border-slate-200'} hover:opacity-90 transition`}
                                                style={{ maxHeight: 240 }}
                                              />
                                            </button>
                                          ))
                                        : msg.attachmentUrls.map((url, idx) => {
                                            const fileName = decodeURIComponent(
                                              url
                                                .split('/')
                                                .pop()
                                                ?.split('?')[0] || 'Belge',
                                            );
                                            return (
                                              <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition hover:opacity-80 ${
                                                  isMine
                                                    ? 'bg-emerald-500/30 border-emerald-400/30'
                                                    : 'bg-slate-50 border-slate-200'
                                                }`}
                                              >
                                                <FileText
                                                  className={`w-5 h-5 shrink-0 ${isMine ? 'text-emerald-100' : 'text-blue-500'}`}
                                                />
                                                <span
                                                  className={`text-xs font-medium truncate flex-1 ${isMine ? 'text-white' : 'text-slate-700'}`}
                                                >
                                                  {fileName.length > 30
                                                    ? fileName.slice(0, 27) +
                                                      '...'
                                                    : fileName}
                                                </span>
                                                <Download
                                                  className={`w-4 h-4 shrink-0 ${isMine ? 'text-emerald-200' : 'text-slate-400'}`}
                                                />
                                              </a>
                                            );
                                          })}
                                    </div>
                                  )}

                                {msg.content &&
                                    !(
                                      ['📷 Fotoğraf', '📄 Belge'].includes(
                                        msg.content,
                                      ) && msg.attachmentUrls?.length
                                    ) && <p>{msg.content}</p>}
                                </div>
                                <div
                                  className={`mt-1 flex items-center gap-1 text-[10px] text-[#75777d] ${
                                    isMine ? 'mr-1' : 'ml-1'
                                  }`}
                                >
                                  {formatDistanceToNow(
                                    new Date(
                                      msg.createdAt.endsWith('Z')
                                        ? msg.createdAt
                                        : msg.createdAt + 'Z',
                                    ),
                                    { addSuffix: true, locale: tr },
                                  )}
                                  {isMine && (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#4d6359]" />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5 shadow-sm">
                            <span className="text-xs font-medium text-slate-500 mr-1">
                              Yazıyor
                            </span>
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="w-1.5 h-1.5 bg-slate-400 rounded-full block"
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 0.6,
                                  delay: i * 0.15,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* ── Input bar ── */}
                <form
                  onSubmit={handleSend}
                  className="shrink-0 bg-white p-4"
                >
                  {/* Safety Alert */}
                  <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                    <p className="text-[11px] font-medium leading-normal text-red-900">
                      Güvenliğiniz için telefon numaranızı veya e-posta
                      adresinizi paylaşmadan önce ürünün ödemesini Döngü Güvenli
                      Ödeme sistemi üzerinden yapmanızı öneririz.
                    </p>
                  </div>

                  {/* Preview bar */}
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                      {selectedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative shrink-0 group/preview"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-500 mb-0.5" />
                              <span className="text-[8px] text-slate-500 truncate max-w-[56px] px-1">
                                {file.name.length > 8
                                  ? file.name.slice(0, 6) + '..'
                                  : file.name}
                              </span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFiles((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-red-600 transition opacity-0 group-hover/preview:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-3">
                    <div className="flex flex-1 items-end rounded-2xl bg-[#f2f4f6] p-2 transition-all focus-within:bg-white focus-within:ring-1 focus-within:ring-[#c4c6cd]">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length)
                            setSelectedFiles((prev) =>
                              [...prev, ...files].slice(0, 5),
                            );
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 text-[#75777d] transition-colors hover:text-[#05162b] disabled:opacity-40"
                        title="Fotoğraf veya Belge Ekle"
                      >
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Paperclip className="w-5 h-5" />
                        )}
                      </button>
                      <textarea
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Mesajınızı buraya yazın..."
                        rows="1"
                        className="max-h-32 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm text-[#191c1e] placeholder:text-[#75777d] focus:ring-0"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={
                        (!newMessage.trim() && !selectedFiles.length) || sending
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#05162b] text-white transition-all hover:shadow-xl hover:shadow-[#05162b]/30 active:scale-90 disabled:opacity-40 disabled:hover:shadow-none"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Right detail panel (desktop) ── */}
              <AnimatePresence>
                {detailOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="hidden md:flex flex-col border-l border-slate-200 bg-white overflow-hidden shrink-0"
                  >
                    {renderDetailPanel(() => setDetailOpen(false))}
                  </motion.aside>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </section>

      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsReportModalOpen(false)}
          >
            <motion.form
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmitReport}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5"
            >
              <h3 className="text-base font-bold text-slate-900">
                Kullanıcıyı Şikayet Et
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Şikayetiniz admin inceleme ekranına gönderilir.
              </p>

              <label className="block text-xs font-medium text-slate-600 mb-1">
                Neden
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="Taciz">Taciz</option>
                <option value="Sahte İlan">Sahte İlan</option>
                <option value="Küfür">Küfür</option>
                <option value="Dolandırıcılık Şüphesi">
                  Dolandırıcılık Şüphesi
                </option>
                <option value="Diğer">Diğer</option>
              </select>

              <label className="block text-xs font-medium text-slate-600 mt-3 mb-1">
                Detay (opsiyonel)
              </label>
              <textarea
                rows={4}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Kısa açıklama"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-emerald-200"
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm border border-slate-200 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-lg text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Gönder
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxUrl(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxUrl}
              alt="Büyük görsel"
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
