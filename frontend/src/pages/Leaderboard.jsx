import React, { useState, useEffect } from 'react';
import { Trophy, Star, Medal, CircleUserRound, ChevronDown, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const INITIAL_SHOW = 20;
const MAX_SHOW = 50;

const Leaderboard = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(INITIAL_SHOW);
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/users/leaderboard');
        setUsers(response.data);

        // Eğer giriş yapılmışsa ve kullanıcı listede yoksa, rank'ını bul
        if (isAuthenticated && currentUser) {
          const inList = response.data.some((u) => u.id === currentUser.id);
          if (!inList && currentUser.karma?.rank) {
            setCurrentUserRank({
              rank: currentUser.karma.rank,
              fullName: currentUser.fullName,
              karmaPoint: currentUser.karmaPoint || 0,
              avatarUrl: currentUser.avatarUrl,
            });
          }
        }
      } catch (error) {
        console.error('Liderlik tablosu alınamadı', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [isAuthenticated, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3, showCount);
  const hasMore = users.length > showCount && showCount < MAX_SHOW;

  // Podium config: [2nd, 1st, 3rd]
  const podiumConfig = [
    { index: 1, heightClass: 'h-28 md:h-36', bgColor: 'bg-slate-100', borderColor: 'border-slate-300', textColor: 'text-slate-600', medalColor: 'text-slate-400', emoji: '🥈' },
    { index: 0, heightClass: 'h-40 md:h-52', bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', medalColor: 'text-amber-400', emoji: '🥇' },
    { index: 2, heightClass: 'h-24 md:h-28', bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-600', medalColor: 'text-orange-500', emoji: '🥉' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 pt-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-200"
          >
            <Trophy className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl md:text-5xl font-black text-slate-800 font-[Outfit]"
          >
            Döngü'nün En İyi 50 İyilik Şampiyonu
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 max-w-xl mx-auto"
          >
            İyiliği paylaşarak Döngü'ye en çok katkı sağlayan kahramanlarımız!
          </motion.p>
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="flex justify-center items-end gap-3 md:gap-6 pt-8 pb-4">
            {podiumConfig.map((config, visualIdx) => {
              const user = top3[config.index];
              if (!user) return null;
              const isFirst = config.index === 0;
              const avatarSize = isFirst ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20';
              const isMe = isAuthenticated && currentUser?.id === user.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + visualIdx * 0.12, type: 'spring', stiffness: 120 }}
                  className={`flex flex-col items-center w-28 md:w-40 relative ${isMe ? 'ring-2 ring-emerald-400 rounded-2xl' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative mb-2 flex justify-center z-10">
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className={`${avatarSize} rounded-full object-cover shadow-lg border-4 ${config.borderColor}`}
                        />
                      ) : (
                        <div
                          className={`${avatarSize} bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg border-4 ${config.borderColor}`}
                        >
                          <CircleUserRound className={isFirst ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12'} />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                        <Medal className={`w-6 h-6 md:w-7 md:h-7 ${config.medalColor}`} />
                      </div>
                    </div>
                  </div>

                  {/* Podium Column */}
                  <div
                    className={`w-full rounded-t-2xl flex flex-col items-center justify-start pt-4 px-2 ${config.bgColor} border-t-2 border-l border-r ${config.borderColor} ${config.heightClass} relative overflow-hidden text-center shadow-sm`}
                  >
                    <span className="text-xl md:text-2xl mb-1 z-10">{config.emoji}</span>
                    <span className="font-bold text-slate-800 text-xs md:text-sm truncate w-full z-10 leading-tight">
                      {user.leaderboardHidden ? 'Gizli Kahraman' : user.fullName}
                      {isMe && <span className="text-emerald-500 text-[10px] block">(Sen)</span>}
                    </span>
                    <div className={`mt-1 font-extrabold ${config.textColor} text-sm md:text-base z-10 flex items-center gap-1`}>
                      <Star className="w-3 h-3 md:w-4 md:h-4 fill-current" />
                      {user.karmaPoint}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Rest of the List */}
        {rest.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs md:text-sm tracking-wider uppercase">
                  <th className="px-4 py-4 md:px-6 font-semibold w-16 text-center">Sıra</th>
                  <th className="px-4 py-4 md:px-6 font-semibold">Döngü Elçisi</th>
                  <th className="px-4 py-4 md:px-6 font-semibold text-right">İyilik Puanı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rest.map((user, idx) => {
                  const isMe = isAuthenticated && currentUser?.id === user.id;
                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors ${isMe ? 'bg-emerald-50/60' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-4 py-4 md:px-6 text-center">
                        <span className="text-slate-400 font-bold text-sm md:text-base">
                          #{idx + 4}
                        </span>
                      </td>
                      <td className="px-4 py-4 md:px-6">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                              <CircleUserRound className="w-6 h-6" />
                            </div>
                          )}
                          <span className="font-bold text-slate-700 text-sm md:text-base">
                            {user.leaderboardHidden ? 'Gizli Kahraman' : user.fullName}
                            {isMe && (
                              <span className="ml-2 text-emerald-500 text-xs font-semibold">(Sen)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 md:px-6 text-right">
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-sm">
                          <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                          {user.karmaPoint}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Daha Fazla Gör */}
            {hasMore && (
              <div className="flex justify-center py-6 border-t border-slate-100">
                <button
                  onClick={() => setShowCount(MAX_SHOW)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-95"
                >
                  <ChevronDown className="w-5 h-5" />
                  Daha Fazla Gör ({Math.min(users.length, MAX_SHOW) - showCount} kişi daha)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Sticky Bottom Bar - Kullanıcı ilk 50'de değilse */}
      {currentUserRank && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-xl">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-emerald-600 font-[Outfit]">
                #{currentUserRank.rank}
              </span>
              <div className="w-px h-8 bg-slate-200"></div>
              {currentUserRank.avatarUrl ? (
                <img
                  src={currentUserRank.avatarUrl}
                  alt={currentUserRank.fullName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-emerald-200"
                />
              ) : (
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-200">
                  <CircleUserRound className="w-5 h-5" />
                </div>
              )}
              <div>
                <span className="font-bold text-slate-800 text-sm block leading-tight">
                  {currentUserRank.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  Senin Sıran
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-bold text-sm">
              <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              {currentUserRank.karmaPoint}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
