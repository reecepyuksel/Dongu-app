import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="h-full w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
      {/* Resim placeholder */}
      <div className="aspect-square bg-slate-200 relative sm:aspect-[4/5]">
        <div className="absolute left-2 top-2 bg-slate-300 rounded-full h-5 w-16" />
        <div className="absolute right-2 top-2 bg-slate-300 rounded-full h-8 w-8" />
      </div>

      {/* İçerik placeholder */}
      <div className="p-2.5 sm:p-3">
        <div className="mb-1.5 flex gap-1">
          <div className="h-4 bg-slate-200 rounded-md w-20" />
          <div className="h-4 bg-slate-200 rounded-md w-14" />
        </div>

        {/* Başlık */}
        <div className="h-4 bg-slate-200 rounded-lg w-full mb-2" />
        <div className="h-4 bg-slate-200 rounded-lg w-4/5 mb-2" />

        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-3 bg-slate-200 rounded w-12" />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <div className="h-3 bg-slate-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
