import { Link } from 'react-router-dom';
import donLogo from '../assets/vector.svg';

const Footer = () => {
  return (
    <footer className="w-full mt-auto py-8 md:py-12 px-4 md:px-8 bg-white dark:bg-slate-950 border-t border-slate-200/20 dark:border-slate-800/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center h-14 w-[120px] shrink-0 overflow-hidden">
            <img src={donLogo} alt="Döngü" className="h-full w-auto mix-blend-multiply contrast-[1.2] brightness-[1.1] scale-[1.3] origin-left" />
          </div>
          <p className="font-inter text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Topluluk odaklı sürdürülebilir yaşam platformu. Eşyaların değerini biliyor, iyiliği döngüye sokuyoruz.</p>
          <div className="flex gap-4 pt-2">
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-container text-primary hover:text-[#B2CABD] transition-colors">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-container text-primary hover:text-[#B2CABD] transition-colors">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-manrope font-bold text-primary dark:text-white">Hızlı Linkler</h4>
          <div className="flex flex-col gap-3 font-inter text-sm text-slate-600 dark:text-slate-400">
            <Link className="hover:text-[#B2CABD] transition-colors" to="/">Vitrin</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/how-it-works">Nasıl Çalışır</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/about">Hakkımızda</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/how-it-works">İyilik Protokolü</Link>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-manrope font-bold text-primary dark:text-white">Kurumsal</h4>
          <div className="flex flex-col gap-3 font-inter text-sm text-slate-600 dark:text-slate-400">
            <Link className="hover:text-[#B2CABD] transition-colors" to="/privacy-policy">Gizlilik Politikası</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/terms-of-service">Kullanım Şartları</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/faq">Destek</Link>
            <Link className="hover:text-[#B2CABD] transition-colors" to="/about">İletişim</Link>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-manrope font-bold text-primary dark:text-white">Döngü'ye Katıl</h4>
          <p className="font-inter text-sm text-slate-600 dark:text-slate-400">Yeni paylaşımlardan ve topluluk haberlerinden ilk sen haberdar ol.</p>
          <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
            <input className="bg-transparent border-none focus:ring-0 text-sm font-inter w-full px-2 min-w-0" placeholder="E-posta" type="email"/>
            <button className="bg-primary text-white p-2 rounded-lg hover:opacity-90 transition-opacity shrink-0">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 md:pt-12 mt-8 md:mt-12 border-t border-slate-200/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="font-inter text-xs text-slate-500 dark:text-slate-400">© 2024 Döngü. Tüm Hakları Saklıdır.</p>
        <div className="flex gap-6">
          <span className="font-inter text-xs text-slate-500 dark:text-slate-400">Türkiye - TR</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
