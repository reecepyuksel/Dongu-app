import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const profileInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'D';

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50 sm:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        
        {/* Home */}
        <Link 
          to="/" 
          className={`relative inline-flex flex-col items-center justify-center px-1 h-full hover:bg-surface-container-lowest transition-colors group ${isActive('/') ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${isActive('/') ? 'font-bold fill-current' : ''}`}>home</span>
          <span className={`text-[10px] mt-0.5 ${isActive('/') ? 'font-extrabold' : 'font-semibold'}`}>Ana Akış</span>
        </Link>
        
        {/* Trades */}
        <Link 
          to="/trades" 
          className={`relative inline-flex flex-col items-center justify-center px-1 h-full hover:bg-surface-container-lowest transition-colors group ${isActive('/trades') ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${isActive('/trades') ? 'font-bold fill-current' : ''}`}>swap_horiz</span>
          <span className={`text-[10px] mt-0.5 ${isActive('/trades') ? 'font-extrabold' : 'font-semibold'}`}>Takas</span>
        </Link>

        {/* Add/Share (Middle Button) */}
        <div className="flex items-center justify-center h-full">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full hover:bg-primary/90 hover:scale-105 transition-all shadow-lg active:scale-95"
            title="Döngüye Ver"
          >
            <span className="material-symbols-outlined text-[32px]">add</span>
          </Link>
        </div>

        {/* Communities */}
        <Link 
          to="/topluluklar" 
          className={`relative inline-flex flex-col items-center justify-center px-1 h-full hover:bg-surface-container-lowest transition-colors group ${isActive('/topluluklar') ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <span className={`material-symbols-outlined text-[24px] ${isActive('/topluluklar') ? 'font-bold fill-current' : ''}`}>groups</span>
          <span className={`text-[10px] mt-0.5 ${isActive('/topluluklar') ? 'font-extrabold' : 'font-semibold'}`}>Topluluk</span>
        </Link>

        {/* Profile */}
        <Link 
          to="/dashboard" 
          className={`relative inline-flex flex-col items-center justify-center px-1 h-full hover:bg-surface-container-lowest transition-colors group ${isActive('/dashboard') ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}
        >
          <div className={`h-6 w-6 rounded-full overflow-hidden shrink-0 border-[2.5px] ${isActive('/dashboard') ? 'border-primary' : 'border-transparent'}`}>
             {user?.profilePhotoUrl ? (
               <img src={user.profilePhotoUrl} alt="Profil" className="h-full w-full object-cover" />
             ) : (
               <div className="flex h-full w-full items-center justify-center bg-[#1b2b41] text-[10px] font-bold text-white">
                 {profileInitial}
               </div>
             )}
          </div>
          <span className={`text-[10px] mt-1 ${isActive('/dashboard') ? 'font-extrabold' : 'font-semibold'}`}>Profil</span>
        </Link>
        
      </div>
    </div>
  );
};

export default BottomNav;
