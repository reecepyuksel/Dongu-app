import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Paperclip, FileText, Download, Loader2, X } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PropTypes from 'prop-types';

/**
 * TradeChat — A trade-specific chat component bound to a single trade offer.
 * Messages here are NOT shown in the general /messages feed.
 */
const TradeChat = ({ tradeId, tradeStatus }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch existing messages
  useEffect(() => {
    if (!tradeId) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/messages/trade/${tradeId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('Trade messages load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tradeId]);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user?.id) return;

    const sock = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:3005',
      { query: { userId: user.id } },
    );

    sock.on('newMessage', (msg) => {
      // Only handle messages that belong to this trade chat
      if (msg?.tradeOfferId === tradeId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
      }
    });

    return () => sock.close();
  }, [tradeId, user?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    const hasFiles = selectedFiles.length > 0;
    if ((!text && !hasFiles) || sending) return;

    setSending(true);
    setInput('');
    try {
      let attachmentUrls = null;
      let attachmentType = null;

      if (hasFiles) {
        setUploading(true);
        const formData = new FormData();
        selectedFiles.forEach((f) => formData.append('files', f));
        try {
          const uploadRes = await api.post('/messages/upload-attachment', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          attachmentUrls = uploadRes.data.urls;
          const firstMime = selectedFiles[0]?.type || '';
          attachmentType = firstMime.startsWith('image/') ? 'image' : 'document';
        } catch {
          showToast('Dosya yüklenemedi.', 'error');
          setSending(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
        setSelectedFiles([]);
      }

      const res = await api.post(`/messages/trade/${tradeId}/message`, {
        content: text || (attachmentType === 'image' ? '📷 Fotoğraf' : '📄 Belge'),
        ...(attachmentUrls && { attachmentUrls, attachmentType }),
      });
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === res.data.id);
        return exists ? prev : [...prev, res.data];
      });
    } catch (err) {
      console.error('Send trade message error:', err);
    } finally {
      setSending(false);
    }
  };

  const isSystem = (msg) => !msg.sender;
  const isMe = (msg) => msg.sender?.id === user?.id;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-2.5 bg-emerald-400 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.8,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Henüz mesaj yok. İlk mesajı siz gönderin!
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (isSystem(msg)) {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <div className="flex items-center gap-2 bg-slate-100 text-slate-500 text-xs font-semibold px-4 py-2 rounded-full border border-slate-200">
                      <Bot className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {msg.content}
                    </div>
                  </motion.div>
                );
              }

              const mine = isMe(msg);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      mine
                        ? 'bg-emerald-600 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {!mine && (
                      <p className="text-[10px] font-bold text-emerald-600 mb-1">
                        {msg.sender?.fullName}
                      </p>
                    )}

                    {/* Attachment rendering */}
                    {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                      <div className={`mb-2 ${msg.attachmentType === 'image' ? 'space-y-2' : 'space-y-1.5'}`}>
                        {msg.attachmentType === 'image' ? (
                          msg.attachmentUrls.map((url, idx) => (
                            <button key={idx} type="button" onClick={() => setLightboxUrl(url)} className="block cursor-pointer">
                              <img src={url} alt="Ek görsel" className={`max-w-full rounded-xl border ${mine ? 'border-emerald-400/30' : 'border-slate-200'} hover:opacity-90 transition`} style={{ maxHeight: 200 }} />
                            </button>
                          ))
                        ) : (
                          msg.attachmentUrls.map((url, idx) => {
                            const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Belge');
                            return (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-2 rounded-xl border transition hover:opacity-80 ${mine ? 'bg-emerald-500/30 border-emerald-400/30' : 'bg-slate-50 border-slate-200'}`}>
                                <FileText className={`w-4 h-4 shrink-0 ${mine ? 'text-emerald-100' : 'text-blue-500'}`} />
                                <span className={`text-xs font-medium truncate flex-1 ${mine ? 'text-white' : 'text-slate-700'}`}>{fileName.length > 25 ? fileName.slice(0, 22) + '...' : fileName}</span>
                                <Download className={`w-3.5 h-3.5 shrink-0 ${mine ? 'text-emerald-200' : 'text-slate-400'}`} />
                              </a>
                            );
                          })
                        )}
                      </div>
                    )}

                    {msg.content && !(['📷 Fotoğraf', '📄 Belge'].includes(msg.content) && msg.attachmentUrls?.length) && (
                      <p>{msg.content}</p>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${mine ? 'text-emerald-200' : 'text-slate-400'}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {tradeStatus !== 'rejected' ? (
        <form
          onSubmit={handleSend}
          className="px-4 py-3 border-t border-slate-200 bg-white"
        >
          {/* Preview bar */}
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="relative shrink-0 group/preview">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-500 mb-0.5" />
                      <span className="text-[7px] text-slate-500 truncate max-w-[48px] px-0.5">{file.name.length > 6 ? file.name.slice(0, 5) + '..' : file.name}</span>
                    </div>
                  )}
                  <button type="button" onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] shadow hover:bg-red-600 transition opacity-0 group-hover/preview:opacity-100">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) setSelectedFiles((prev) => [...prev, ...files].slice(0, 5));
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition shrink-0 disabled:opacity-40"
              title="Dosya Ekle"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-slate-50"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedFiles.length) || sending}
              className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-slate-200 text-center text-sm text-slate-400 bg-slate-50">
          Bu takas reddedildiği için mesajlaşma kapalı.
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
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
};

TradeChat.propTypes = {
  tradeId: PropTypes.string.isRequired,
  tradeStatus: PropTypes.string,
};
export default TradeChat;
