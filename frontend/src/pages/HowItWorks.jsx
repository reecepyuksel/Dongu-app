import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const pointsTable = [
    { action: 'Yeni ilan yayınlamak', points: '+50' },
    { action: 'Eşyayı başarıyla teslim etmek', points: '+150' },
    { action: 'Eşya teslim almak', points: '+20' },
    { action: 'Başarılı takas', points: '+100' },
    { action: 'Var mı ihtiyacını gidermek', points: '+200' },
    { action: 'Profilini tamamlamak', points: '+30' },
    { action: 'İlk 5 başarılı döngü', points: '+200 Bonus' },
  ];

  const ranks = [
    {
      name: 'Yeni Paylaşımcı',
      range: '0 - 250 Puan',
      containerClass: 'bg-white p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow',
      iconContainer: 'w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center',
      iconStyle: 'material-symbols-outlined text-slate-400 text-3xl',
      icon: 'child_care',
      textName: 'block font-bold text-slate-700',
      textRange: 'text-xs text-slate-400'
    },
    {
      name: 'İyilik Yolcusu',
      range: '251 - 750 Puan',
      containerClass: 'bg-white p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow',
      iconContainer: 'w-16 h-16 bg-[#cde5d8] rounded-full mx-auto mb-4 flex items-center justify-center',
      iconStyle: 'material-symbols-outlined text-[#4d6359] text-3xl',
      icon: 'hiking',
      textName: 'block font-bold text-[#4d6359]',
      textRange: 'text-xs text-slate-400'
    },
    {
      name: 'İyilik Elçisi',
      range: '751 - 2000 Puan',
      containerClass: 'bg-white p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow border-2 border-[#b2cabd]/20',
      iconContainer: 'w-16 h-16 bg-[#b2cabd]/20 rounded-full mx-auto mb-4 flex items-center justify-center',
      iconStyle: 'material-symbols-outlined text-[#b2cabd] text-3xl',
      icon: 'diversity_1',
      textName: 'block font-bold text-[#b2cabd]',
      textRange: 'text-xs text-slate-400'
    },
    {
      name: 'Döngü Ustası',
      range: '2000+ Puan',
      containerClass: 'bg-gradient-to-br from-[#05162b] to-[#1b2b41] p-6 rounded-2xl text-center shadow-lg transform scale-105',
      iconContainer: 'w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center',
      iconStyle: 'material-symbols-outlined text-white text-3xl',
      icon: 'workspace_premium',
      fill: true,
      textName: 'block font-bold text-white',
      textRange: 'text-xs text-white/60'
    },
  ];

  return (
    <div className="flex max-w-7xl mx-auto pt-24 pb-24 md:pb-8 text-[#191c1e]">
      {/* SideNavBar */}
      <aside className="hidden lg:flex flex-col p-4 space-y-2 h-[calc(100vh-6rem)] w-64 bg-[#f7f9fb] sticky top-24">
        <div className="px-4 py-6">
          <h3 className="font-[Manrope] font-black text-[#1b2b41] text-xl">Döngü Rehberi</h3>
          <p className="text-slate-500 text-xs">Güven & İyilik</p>
        </div>
        <nav className="space-y-1">
          <a className="flex items-center space-x-3 px-4 py-3 bg-white text-[#1b2b41] font-bold rounded-xl shadow-sm hover:translate-x-1 transition-transform duration-200 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">help_center</span>
            <span className="font-[Manrope] text-base">Nasıl Çalışır</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-[#f2f4f6] rounded-xl hover:translate-x-1 transition-transform duration-200 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">sync_alt</span>
            <span className="font-[Manrope] text-base">Takas Döngüsü</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-[#f2f4f6] rounded-xl hover:translate-x-1 transition-transform duration-200 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">volunteer_activism</span>
            <span className="font-[Manrope] text-base">İyilik Puanlaması</span>
          </a>
          <a className="flex items-center space-x-3 px-4 py-3 text-slate-600 hover:bg-[#f2f4f6] rounded-xl hover:translate-x-1 transition-transform duration-200 cursor-pointer active:opacity-80">
            <span className="material-symbols-outlined">workspace_premium</span>
            <span className="font-[Manrope] text-base">Unvanlar</span>
          </a>
        </nav>
        <div className="mt-auto p-4">
          <Link
            to="/dashboard"
            className="flex w-full justify-center items-center py-3 bg-gradient-to-br from-[#05162b] to-[#1b2b41] text-white rounded-full font-semibold shadow-lg hover:opacity-90 transition-opacity"
          >
            Paylaşmaya Başla
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 lg:px-12 py-8 overflow-y-auto">
        {/* Hero Section */}
        <section className="mb-16 mt-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-[Manrope] font-extrabold text-[#05162b] mb-6 leading-tight">Sistem Nasıl Çalışır?</h1>
            <p className="text-xl text-[#44474d] leading-relaxed">Eşyalarını paylaşmak veya yeni bir eşya edinmek Döngü ile çok basit! Sadece 3 adımda iyiliği çevremize yayalım.</p>
          </div>
        </section>

        {/* 3 Main Steps (Bento Grid) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-[#ffffff] p-8 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,30,0.06)] hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 bg-[#cde5d8] flex items-center justify-center rounded-2xl mb-8">
              <span className="material-symbols-outlined text-[#4d6359] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
            </div>
            <h3 className="font-[Manrope] text-2xl font-bold text-[#05162b] mb-4">Paylaş</h3>
            <p className="text-[#44474d] leading-relaxed text-sm">Kullanmadığın ama başkasının işine yarayacak eşyalarını sisteme yükle. Doğaya katkı sağlarken iyilik puanları kazan ve ihtiyacı olanları sevindir!</p>
          </div>

          <div className="bg-[#ffffff] p-8 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,30,0.06)] hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 bg-[#cde5d8] flex items-center justify-center rounded-2xl mb-8">
              <span className="material-symbols-outlined text-[#4d6359] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>swap_horizontal_circle</span>
            </div>
            <h3 className="font-[Manrope] text-2xl font-bold text-[#05162b] mb-4">Takasla</h3>
            <p className="text-[#44474d] leading-relaxed text-sm">Kendi eşyanla başkasının eşyasını takas et. İki tarafın da kazandığı, karşılıklı fayda sağlayan adil değişimlerle döngüye aktif olarak katıl.</p>
          </div>

          <div className="bg-[#ffffff] p-8 rounded-2xl shadow-[0px_12px_32px_rgba(25,28,30,0.06)] hover:scale-[1.02] transition-transform duration-300">
            <div className="w-14 h-14 bg-[#cde5d8] flex items-center justify-center rounded-2xl mb-8">
              <span className="material-symbols-outlined text-[#4d6359] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>search_check</span>
            </div>
            <h3 className="font-[Manrope] text-2xl font-bold text-[#05162b] mb-4">Ara (Var mı?)</h3>
            <p className="text-[#44474d] leading-relaxed text-sm">Aradığın bir eşyayı topluluğa sor, elinde olanlar sana ulaşsın. İhtiyaçlarını paylaş, iyilik paylaştıkça büyüsün!</p>
          </div>
        </section>

        {/* Takas Döngüsü Section */}
        <section className="bg-[#1b2b41] text-white p-10 md:p-16 rounded-3xl mb-20 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-[Manrope] text-3xl font-bold mb-12">Takas Döngüsü Nasıl İşler?</h2>
            <div className="flex flex-col md:flex-row justify-between gap-12 relative">
              {/* Horizontal Line for Desktop */}
              <div className="hidden md:block absolute top-10 left-10 right-10 h-0.5 bg-[#8292ad] opacity-30"></div>
              
              <div className="flex-1 relative z-20">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#1b2b41] font-black text-2xl mb-6 shadow-xl">1</div>
                <h4 className="font-[Manrope] text-xl font-bold mb-3">Teklif Ver</h4>
                <p className="text-[#b7c7e4] text-sm">"Takaslık" rozeti olan eşyalara kendi eşyanı sun.</p>
              </div>
              
              <div className="flex-1 relative z-20">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#1b2b41] font-black text-2xl mb-6 shadow-xl">2</div>
                <h4 className="font-[Manrope] text-xl font-bold mb-3">Onay Bekle</h4>
                <p className="text-[#b7c7e4] text-sm">Gönderdiğin teklif mesaj kutusuna düşer.</p>
              </div>
              
              <div className="flex-1 relative z-20">
                <div className="w-20 h-20 bg-[#b2cabd] rounded-full flex items-center justify-center text-[#1b2b41] font-black text-2xl mb-6 shadow-xl">3</div>
                <h4 className="font-[Manrope] text-xl font-bold mb-3">Güvenle Takas Et</h4>
                <p className="text-[#b7c7e4] text-sm">Anlaşma sağlandığında eşyalarınızı belirlediğiniz yöntemle güvenle takas edin.</p>
              </div>
            </div>
          </div>
          {/* Abstract BG Texture */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#b2cabd]/10 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* İyilik Rehberi Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Scoring Table */}
          <div className="bg-[#f2f4f6] p-8 rounded-2xl">
            <h2 className="font-[Manrope] text-2xl font-bold text-[#05162b] mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#b2cabd]">stars</span>
              İyilik Rehberi - Puanlama
            </h2>
            <div className="space-y-4">
              {pointsTable.map((row, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl">
                  <span className="font-medium text-sm">{row.action}</span>
                  <span className="text-[#4d6359] font-bold">{row.points}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unvan Seviyeleri (Badges) */}
          <div>
            <h2 className="font-[Manrope] text-2xl font-bold text-[#05162b] mb-8">Unvan Seviyeleri</h2>
            <div className="grid grid-cols-2 gap-4">
              {ranks.map((rank, idx) => (
                <div key={idx} className={rank.containerClass}>
                  <div className={rank.iconContainer}>
                    <span 
                      className={rank.iconStyle} 
                      style={rank.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {rank.icon}
                    </span>
                  </div>
                  <span className={rank.textName}>{rank.name}</span>
                  <span className={rank.textRange}>{rank.range}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-6 py-12 border-t border-[#c4c6cd]/20">
          <Link
            to="/dashboard"
            className="px-10 py-5 bg-gradient-to-br from-[#05162b] to-[#1b2b41] text-white rounded-full font-bold text-lg shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Hemen İlan Ver
          </Link>
          <Link
            to="/?tab=REQUESTING"
            className="px-10 py-5 bg-[#cde5d8] text-[#364b41] rounded-full font-bold text-lg flex items-center gap-3 hover:bg-[#b4ccbf] transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
            Bir Şey Ara (Var mı?)
          </Link>
        </section>
      </main>
    </div>
  );
};

export default HowItWorks;
