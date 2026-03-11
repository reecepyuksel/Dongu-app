import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Package, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Clock, Heart, Camera } from 'lucide-react';
import RealTimeAgo from './RealTimeAgo';

const ProfileStatsModal = ({ isOpen, onClose, title, items, loading }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Package className="w-6 h-6 text-emerald-600" />
                                {title}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {loading ? 'Yükleniyor...' : `Toplam ${items.length} kayıt bulundu`}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                <span className="text-slate-500 text-sm">Veriler getiriliyor...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Package className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="font-bold text-slate-700 text-lg mb-2">Henüz döngü başlatılmadı</h3>
                                <p className="text-slate-500 text-sm max-w-[250px]">
                                    Bu listede gösterilecek herhangi bir işlem bulunmuyor.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={item.id}
                                    >
                                        <Link
                                            to={`/items/${item.id}`}
                                            className="flex gap-4 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50/30 transition-all group items-center"
                                        >
                                            <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 group-hover:border-emerald-200 transition-colors">
                                                <img 
                                                    src={item.imageUrl || 'https://via.placeholder.com/150'} 
                                                    alt={item.title} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm md:text-base truncate group-hover:text-emerald-700 transition-colors">
                                                    {item.title}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        <Clock className="w-3 h-3" />
                                                        <RealTimeAgo date={item.createdAt} />
                                                    </div>
                                                    
                                                    {/* Mutlu Son Rozeti */}
                                                    {item.isConfirmed && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full shadow-sm">
                                                            <Heart className="w-3 h-3 text-teal-500 fill-teal-500" />
                                                            MUTLU SON
                                                            {item.proofImage && <Camera className="w-3 h-3 ml-0.5 text-teal-400" />}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="pl-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-600 text-slate-400 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProfileStatsModal;
