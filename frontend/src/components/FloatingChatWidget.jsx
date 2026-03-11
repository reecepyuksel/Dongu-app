import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, ChevronLeft, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';

export default function FloatingChatWidget() {
    const { isAuthenticated, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [totalUnread, setTotalUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        
        const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3005', {
            query: { userId: user.id }
        });
        
        setSocket(newSocket);
        
        return () => newSocket.close();
    }, [isAuthenticated, user]);

    // Poll for unread count
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 5000); // Poll every 5s quicker
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // Add escape key handler
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (activeChat) setActiveChat(null);
                else setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [activeChat, isOpen]);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/messages/unread-count');
            const count = res.data.totalUnread;
            setTotalUnread(typeof count === 'number' && count > 0 ? count : 0);
        } catch (err) {
            console.error('Failed to fetch unread count', err);
            setTotalUnread(0);
        }
    };

    // Socket listeners
    useEffect(() => {
        if (!socket) return;
        
        socket.on('newMessage', (msg) => {
            if (msg.receiver?.id === user.id) {
                if (activeChat && (msg.sender?.id === activeChat.otherUser.id || msg.receiver?.id === activeChat.otherUser.id)) {
                    setMessages(prev => {
                        if (!prev.find(m => m.id === msg.id)) {
                            return [...prev, msg];
                        }
                        return prev;
                    });
                    scrollToBottom();
                    api.post(`/messages/${activeChat.itemId}/read`).catch(console.error);
                } else {
                    fetchUnreadCount();
                    if (isOpen) fetchConversations();
                }
            }
        });

        socket.on('typing', (data) => {
            if (activeChat && data.fromUserId === activeChat.otherUser.id) {
                setIsTyping(true);
            }
        });

        socket.on('stopTyping', (data) => {
            if (activeChat && data.fromUserId === activeChat.otherUser.id) {
                setIsTyping(false);
            }
        });

        return () => {
            socket.off('newMessage');
            socket.off('typing');
            socket.off('stopTyping');
        };
    }, [socket, activeChat, isOpen, user?.id]);

    // When widget opens, fetch conversations
    useEffect(() => {
        if (isOpen && !activeChat) {
            fetchConversations();
        }
    }, [isOpen, activeChat]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/messages/my-conversations');
            setConversations(res.data);
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChat = async (conversation) => {
        setActiveChat(conversation);
        setLoading(true);
        try {
            // Mark as read immediately
            await api.post(`/messages/${conversation.itemId}/read`);

            // Söhbet listesindeki sayıcıyı anlık sıfırla
            setConversations(prev => prev.map(c =>
                c.conversationId === conversation.conversationId
                    ? { ...c, unreadCount: 0 }
                    : c
            ));

            // Genel sayıcıyı güncelle
            fetchUnreadCount();

            // Fetch messages
            const res = await api.get(`/messages/${conversation.itemId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error('Failed to open chat', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        try {
            const res = await api.post(`/messages/${activeChat.itemId}`, { content: newMessage });
            // Add to list locally for instant feedback
            // The backend returns the saved message including sender
            setMessages([...messages, res.data]);
            setNewMessage('');
            scrollToBottom();
            
            // stop typing when sent
            if (socket) socket.emit('stopTyping', { toUserId: activeChat.otherUser.id, itemId: activeChat.itemId });
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        if (socket && activeChat) {
            socket.emit('typing', { toUserId: activeChat.otherUser.id, itemId: activeChat.itemId });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stopTyping', { toUserId: activeChat.otherUser.id, itemId: activeChat.itemId });
            }, 2000);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 100);
    };


    if (!isAuthenticated) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {isOpen && (
                <div className="mb-4 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right h-[500px] animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 shadow-md">
                        {activeChat ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveChat(null)} className="hover:bg-slate-800 p-1 rounded-full transition">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{activeChat.otherUser.fullName}</span>
                                    <span className="text-xs text-slate-400 truncate w-40">{activeChat.itemTitle}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <h3 className="font-semibold">Mesajlar</h3>
                                <span className="text-xs text-slate-400">Gelen kutusu</span>
                            </div>
                        )}
                        <button onClick={() => setIsOpen(false)} className="hover:bg-slate-800 p-1 rounded-full transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                        {loading && activeChat && messages.length === 0 && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                        )}

                        {!activeChat ? (
                            // Conversation List
                            <div className="divide-y divide-slate-100">
                                {loading && conversations.length === 0 && (
                                    <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-2 border-slate-300 border-t-slate-900 rounded-full"></div></div>
                                )}
                                {!loading && conversations.length === 0 && (
                                    <div className="p-10 flex flex-col items-center justify-center text-slate-400 text-center">
                                        <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm">Henüz mesajınız yok.</p>
                                    </div>
                                )}
                                {conversations.map(conv => (
                                    <div key={conv.conversationId}
                                        onClick={() => handleOpenChat(conv)}
                                        className={`p-4 hover:bg-white cursor-pointer transition flex items-center gap-3 group border-l-4 ${conv.unreadCount > 0 ? 'bg-blue-50/50 border-blue-500' : 'bg-white border-transparent hover:border-emerald-500'}`}
                                    >
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border border-slate-200">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>{conv.otherUser.fullName}</h4>
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                                    {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-emerald-600 font-medium truncate mb-0.5">{conv.itemTitle}</p>
                                            <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-slate-800 font-bold' : 'text-slate-500'}`}>
                                                {conv.lastMessage}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full shrink-0 shadow-sm">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Chat View
                            <div className="flex flex-col h-full bg-slate-50" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.length === 0 && !loading && (
                                        <div className="text-center py-10 opacity-50 text-xs">Sohbeti başlatın...</div>
                                    )}
                                    {messages.map((msg, idx) => {
                                        const isSystem = !msg.sender;
                                        const isMe = !isSystem && msg.sender.id === user.id;
                                        return (
                                            <div key={msg.id || idx} className={`flex ${isSystem ? 'justify-center' : isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative ${isSystem
                                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 text-center text-xs font-medium w-full mx-8'
                                                    : isMe
                                                        ? 'bg-slate-800 text-white rounded-br-sm'
                                                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'
                                                    }`}>
                                                    {isSystem && <span className="block mb-1 text-[10px] uppercase tracking-wider opacity-70">📢 Sistem Mesajı</span>}
                                                    <p className="leading-relaxed">{isSystem ? msg.content : msg.content}</p>
                                                    <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                                        {new Date(msg.createdAt.endsWith('Z') ? msg.createdAt : msg.createdAt + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-slate-100 text-slate-400 rounded-bl-sm rounded-2xl px-4 py-2 text-xs flex items-center gap-1 shadow-sm">
                                                <span className="font-medium text-slate-500 mr-1">Yazıyor</span>
                                                <span className="animate-bounce">.</span>
                                                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shadow-lg z-20">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        placeholder="Bir mesaj yazın..."
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-full px-5 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="bg-emerald-600 text-white p-2.5 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-200"
                                    >
                                        <Send className="w-5 h-5 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Float Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-90 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
                {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}

                {!isOpen && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full border-2 border-white animate-bounce shadow-sm">
                        {totalUnread}
                    </span>
                )}
            </button>
        </div>
    );
}
