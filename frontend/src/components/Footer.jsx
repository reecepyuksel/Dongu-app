import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import logo from '../assets/dongu-.png';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 px-6 border-t border-slate-800 mt-auto">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
                {/* Logo & Intro */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-2 lg:pr-12">
                    <Link to="/" className="inline-block mb-4 group">
                        <img src={logo} alt="Döngü Logo" className="h-24 w-auto group-hover:scale-105 transition-all brightness-[1.3] drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" />
                    </Link>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                        Döngü; eşyaların paylaşıldığı, ihtiyaçların giderildiği ve iyiliğin ödüllendirildiği bir yardımlaşma topluluğudur. Sen de döngüye katıl, geleceği birlikte koruyalım.
                    </p>
                </div>

                {/* Keşfet */}
                <div>
                    <h4 className="text-white font-bold mb-4">Keşfet</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/" className="hover:text-emerald-500 transition-colors">Vitrin</Link></li>
                        <li>
                            <Link to="/how-it-works" className="hover:text-emerald-500 transition-colors inline-flex items-center gap-2 group">
                                Var mı?
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                    200 Puan
                                </span>
                            </Link>
                        </li>
                        <li><Link to="/liderlik" className="hover:text-emerald-500 transition-colors">İyilik Şampiyonları</Link></li>
                    </ul>
                </div>

                {/* Destek */}
                <div>
                    <h4 className="text-white font-bold mb-4">Destek</h4>
                    <ul className="space-y-3 text-sm">
                        <li><Link to="/how-it-works#puan-tablosu" className="hover:text-emerald-500 transition-colors">Puan Sistemi Nedir?</Link></li>
                        <li><Link to="/how-it-works" className="hover:text-emerald-500 transition-colors">Nasıl Çalışır?</Link></li>
                        <li><Link to="/privacy-policy" className="hover:text-emerald-500 transition-colors">Güvenlik ve Gizlilik</Link></li>
                        <li><Link to="/faq" className="hover:text-emerald-500 transition-colors">Sıkça Sorulan Sorular</Link></li>
                    </ul>
                </div>

                {/* Kurumsal & Bize Ulaşın */}
                <div>
                    <h4 className="text-white font-bold mb-4">Kurumsal</h4>
                    <ul className="space-y-3 text-sm mb-6">
                        <li><Link to="/about" className="hover:text-emerald-500 transition-colors">Hakkımızda</Link></li>
                        <li><Link to="/terms-of-service" className="hover:text-emerald-500 transition-colors">Kullanım Koşulları</Link></li>
                    </ul>

                    <h4 className="text-white font-bold mb-4">Bize Ulaşın</h4>
                    <p className="text-sm text-slate-400 mb-4 flex items-center gap-2 hover:text-emerald-500 transition-colors cursor-pointer">
                        <Mail className="w-4 h-4" /> support@dongu.com
                    </p>
                    <div className="flex gap-3">
                        <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Instagram className="w-[18px] h-[18px]" />
                        </a>
                        <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Twitter className="w-[18px] h-[18px]" />
                        </a>
                        <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-emerald-500 hover:text-white rounded-full flex items-center justify-center transition-all text-slate-400">
                            <Linkedin className="w-[18px] h-[18px]" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
                <p>&copy; 2026 Döngü. Tüm Hakları Saklıdır.</p>
                <div className="flex gap-4 mt-3 md:mt-0">
                    <span>İyilikle Geliştirildi. 🌱</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
