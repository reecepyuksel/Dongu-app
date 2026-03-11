import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
            {/* Resim placeholder */}
            <div className="h-48 bg-slate-200 relative">
                <div className="absolute top-3 right-3 bg-slate-300 rounded-full h-6 w-24" />
            </div>

            {/* İçerik placeholder */}
            <div className="p-5">
                {/* Başlık */}
                <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-4" />

                {/* Alt bilgi */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200" />
                        <div className="h-3 bg-slate-200 rounded w-24" />
                    </div>
                    <div className="h-3 bg-slate-200 rounded w-16" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
