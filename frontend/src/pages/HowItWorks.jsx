import React from 'react';
import {
  PackageOpen,
  Sparkles,
  Handshake,
  ArrowRight,
  Star,
  Trophy,
  Award,
  Gem,
  Search,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const pointsTable = [
    { action: 'Yeni İlan Yayınlamak', points: '+50', emoji: '📦' },
    { action: 'Eşyayı Başarıyla Teslim Etmek', points: '+150', emoji: '🤝' },
    { action: 'Eşya Teslim Almak', points: '+20', emoji: '📬' },
    { action: 'Başarılı Takas (Her iki tarafa)', points: '+100', emoji: '🔄' },
    { action: '"Var mı?" İhtiyacını Gidermek', points: '+200', emoji: '💖' },
    { action: 'Profilini Tamamlamak', points: '+30', emoji: '👤' },
    { action: 'İlk 5 Başarılı Döngü', points: '+200 Bonus', emoji: '🎯' },
  ];

  const ranks = [
    {
      name: 'Yeni Paylaşımcı',
      range: '0 – 250 Puan',
      emoji: '🥉',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
    },
    {
      name: 'İyilik Yolcusu',
      range: '251 – 750 Puan',
      emoji: '🥈',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
    },
    {
      name: 'İyilik Elçisi',
      range: '751 – 2000 Puan',
      emoji: '🥇',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
    },
    {
      name: 'Döngü Ustası',
      range: '2000+ Puan',
      emoji: '💎',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-800 mb-4 font-[Outfit]"
          >
            Sistem Nasıl Çalışır?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Eşyalarını paylaşmak veya yeni bir eşya edinmek Döngü ile çok basit!
            Sadece 3 adımda iyiliği çevremize yayalım.
          </motion.p>
        </div>

        {/* Adımlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-[4.5rem] left-1/6 right-1/6 h-0.5 bg-slate-200 w-2/3 mx-auto z-0" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative z-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform">
              <PackageOpen className="w-10 h-10" />
            </div>
            <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs mb-4">
              Model 1
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-[Outfit]">
              Paylaş
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Kullanmadığın ama başkasının işine yarayacak eşyalarını sisteme yükle. Doğaya katkı sağlarken iyilik puanları kazan ve ihtiyacı olanları sevindir!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform">
              <Handshake className="w-10 h-10" />
            </div>
            <div className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs mb-4">
              Model 2
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-[Outfit]">
              Takasla
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Kendi eşyanla başkasının eşyasını takas et. İki tarafın da kazandığı, karşılıklı fayda sağlayan adil değişimlerle döngüye aktif olarak katıl.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative z-10 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform">
              <Search className="w-10 h-10" />
            </div>
            <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs mb-4">
              Model 3
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 font-[Outfit]">
              Ara (Var mı?)
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Aradığın bir eşyayı topluluğa sor, elinde olanlar sana ulaşsın. İhtiyaçlarını paylaş, iyilik paylaştıkça büyüsün!
            </p>
          </motion.div>
        </div>

        {/* ─── TAKAS DÖNGÜSÜ ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 border-t border-slate-200 pt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-emerald-800 font-[Outfit] mb-3 flex items-center justify-center gap-3">
              <span className="text-4xl">🔄</span> Takas Döngüsü Nasıl İşler?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Vitrin'deki eşyaları takas etmek veya kendi eşyanızla yeni bir
              teklif başlatmak çok kolay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-10">
            <div className="hidden md:block absolute top-[4.5rem] left-1/6 right-1/6 h-0.5 bg-emerald-200 w-2/3 mx-auto z-0" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative z-10 bg-gradient-to-br from-white to-emerald-50/30 p-8 rounded-3xl shadow-sm border border-emerald-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform text-3xl">
                🤝
              </div>
              <div className="bg-emerald-200 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs mb-4">
                Takas Adım 1
              </div>
              <h3 className="text-xl font-bold text-emerald-900 mb-3 font-[Outfit]">
                Teklif Ver
              </h3>
              <p className="text-emerald-700/80 text-sm font-medium">
                "Takaslık" rozeti olan eşyalara kendi eşyanı sun. Vitrininde
                aktif ilan yoksa metin veya fotoğrafla desteklediğin bir teklif
                de yapabilirsin.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="relative z-10 bg-gradient-to-br from-white to-amber-50/30 p-8 rounded-3xl shadow-sm border border-amber-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform text-3xl">
                ⏳
              </div>
              <div className="bg-amber-200 text-amber-800 font-bold px-3 py-1 rounded-full text-xs mb-4">
                Takas Adım 2
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-3 font-[Outfit]">
                Onay Bekle
              </h3>
              <p className="text-amber-800/80 text-sm font-medium">
                Gönderdiğin teklif mesaj kutusuna düşer. Karşı taraf teklifi
                değerlendirir; dilerse pazarlık yapabilir, reddedebilir veya
                onaylayabilir.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="relative z-10 bg-gradient-to-br from-white to-blue-50/30 p-8 rounded-3xl shadow-sm border border-blue-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white group-hover:scale-110 transition-transform text-3xl">
                📦
              </div>
              <div className="bg-blue-200 text-blue-800 font-bold px-3 py-1 rounded-full text-xs mb-4">
                Takas Adım 3
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-3 font-[Outfit]">
                Güvenle Takas Et
              </h3>
              <p className="text-blue-800/80 text-sm font-medium">
                Anlaşma sağlandığında eşyalarınızı belirlediğiniz yöntemle
                güvenle takas edin. Tamamlanan her takasta +100 iyilik puanı
                kazanılır!
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ─── İYİLİK REHBERİ ─── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 font-[Outfit] mb-3">
              İyilik Rehberi
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Paylaştıkça puan kazan, seviye atla ve topluluğun yıldızı ol!
            </p>
          </div>

          {/* Puan Tablosu */}
          <div
            id="puan-tablosu"
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-12 scroll-mt-24"
          >
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 font-[Outfit] flex justify-center items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Puanlama Tablosu
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {pointsTable.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-semibold text-slate-700">
                      {item.action}
                    </span>
                  </div>
                  <span className="text-emerald-600 font-extrabold text-lg font-[Outfit]">
                    {item.points}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Unvan Kartları */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800 font-[Outfit] flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" /> Unvan Seviyeleri
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ranks.map((rank, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className={`${rank.bg} ${rank.border} border rounded-2xl p-6 text-center hover:-translate-y-2 transition-transform duration-300 group`}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {rank.emoji}
                </div>
                <h4
                  className={`text-lg font-extrabold ${rank.text} font-[Outfit] mb-1`}
                >
                  {rank.name}
                </h4>
                <p className="text-sm text-slate-500 font-semibold">
                  {rank.range}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-24 mb-10 flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-1 text-center flex items-center justify-center gap-2 text-lg">
            <PackageOpen className="w-6 h-6" /> Hemen İlan Ver
          </Link>
          <Link to="/?tab=REQUESTING" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 text-center flex items-center justify-center gap-2 text-lg">
            <Search className="w-6 h-6" /> Bir Şey Ara (Var mı?)
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HowItWorks;
