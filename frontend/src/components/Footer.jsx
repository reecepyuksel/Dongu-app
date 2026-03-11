import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import logo from '../assets/dongu-.png';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 px-6 border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Logo & Intro */}
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="inline-block mb-4 group">
                        <img src={logo} alt="Döngü Logo" className="h-24 w-auto group-hover:scale-105 transition-all brightness-[1.3] drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                    </Link>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Kullanmadığın eşyaları paylaşarak israfı önle, iyilik puanları kazan ve sürdürülebilir bir geleceğe katkıda bulun. İyiliği dolaştır!
                    </p>
                </div>

                {/* Hızlı Linkler */}
                <div>
                    <h4 className="text-white font-bold mb-4">Keşfet</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/" className="hover:text-emerald-400 transition">Vitrin</Link></li>
                        <li><Link to="/how-it-works" className="hover:text-emerald-400 transition">Nasıl Çalışır?</Link></li>
                        <li><Link to="/about" className="hover:text-emerald-400 transition">Hakkımızda</Link></li>
                    </ul>
                </div>

                {/* Yardım & Destek */}
                <div>
                    <h4 className="text-white font-bold mb-4">Destek</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/faq" className="hover:text-emerald-400 transition">Sıkça Sorulan Sorular</Link></li>
                        <li><Link to="/privacy-policy" className="hover:text-emerald-400 transition">Güvenlik ve Gizlilik</Link></li>
                        <li><Link to="/terms-of-service" className="hover:text-emerald-400 transition">Kullanım Koşulları</Link></li>
                    </ul>
                </div>

                {/* İletişim & Sosyal Medya */}
                <div>
                    <h4 className="text-white font-bold mb-4">Bize Ulaşın</h4>
                    <p className="text-sm text-slate-400 mb-4 flex items-center gap-2 hover:text-white transition cursor-pointer">
                        <Mail className="w-4 h-4" /> support@dongu.com
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Linkedin className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Döngü. Tüm Hakları Saklıdır.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <span>İyilikle Geliştirildi.</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
