import React from 'react';
import { Heart, Globe, Recycle, Users, PackageOpen, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-20 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-8 font-[Outfit]">Hakkımızda</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                        Döngü, israfı önleyerek <span className="text-emerald-600 font-bold">Dayanışma</span> kültürünü artırmak ve eşyalarımıza ikinci bir hayat şansı vererek sürdürülebilir bir gelecek inşa etmek amacıyla kurulmuş <span className="text-blue-600 font-bold">İhtiyaç Odaklı</span> bir platformdur.
                    </p>
                    <div className="inline-block bg-white border border-emerald-100 rounded-3xl px-8 py-6 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <p className="text-xl md:text-2xl text-slate-800 font-black italic font-[Outfit]">
                            "Döngü sadece bir pazar yeri değil, bir yardımlaşma köprüsüdür."
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                            <Recycle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 font-[Outfit]">Sıfır İsraf, Sınırsız Değer</h3>
                        <p className="text-slate-600">
                            İhtiyacımız olmayan eşyaların çöpe gitmesi yerine, onları kullanabilecek yeni sahipleriyle buluşturuyoruz. Eşyalar el değiştirdikçe hem doğa kazanıyor hem de tüketim çılgınlığı yavaşlıyor. Her paylaşım, doğaya verilmiş bir nefes!
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                            <Heart className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-4 font-[Outfit]">Gerçek İyilik, Ortak Mutluluk</h3>
                        <p className="text-slate-600">
                            Döngü sadece bir eşya takas platformu değil, karşılıksız verme ve dayanışma kültürüdür. Burada para geçmez, sadece iyilik ve güven konuşur. İyilik puanı (Karma) sistemi ile paylaştıkça büyüyen bir topluluk yaratıyoruz.
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-10 text-white text-center shadow-xl shadow-emerald-200"
                >
                    <Globe className="w-12 h-12 mx-auto mb-6 text-emerald-200" />
                    <h2 className="text-3xl font-bold mb-4 font-[Outfit]">Vizyonumuz</h2>
                    <p className="text-emerald-50 text-lg max-w-2xl mx-auto">
                        Hiçbir şeyin atılmadığı, herkesin ihtiyacına adil ve kolayca erişebildiği sürdürülebilir bir gelecek hayal ediyoruz. Birlikte, tüketim alışkanlıklarımızı "al ve at" modelinden "kullan ve paylaş" modeline dönüştürüyoruz.
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-20 mb-10 flex flex-col sm:flex-row items-center justify-center gap-6"
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

export default About;
