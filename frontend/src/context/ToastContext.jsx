import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

const toastStyles = {
    success: {
        bg: 'bg-emerald-50 border-emerald-200',
        text: 'text-emerald-800',
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
    error: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: <XCircle className="w-5 h-5 text-red-500" />,
    },
    info: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: <Info className="w-5 h-5 text-blue-500" />,
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // 3 saniye sonra otomatik kapat
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container - Sağ alt köşe */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map(toast => {
                        const style = toastStyles[toast.type] || toastStyles.info;
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className={`${style.bg} border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 min-w-[300px] max-w-[420px]`}
                            >
                                {style.icon}
                                <p className={`${style.text} text-sm font-medium flex-1`}>
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="text-slate-400 hover:text-slate-600 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
