import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Shirt, BookOpen, Cpu, Home as HomeIcon, Bike, Baby, Dumbbell, Music, Utensils } from 'lucide-react';

import SkeletonCard from '../components/SkeletonCard';
import FilterPanel from '../components/FilterPanel';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import heroBg from '../assets/home.png';

const tabs = [
  { id: 'all', label: 'Hepsi' },
  { id: 'donation', label: 'Döngüde' },
  { id: 'exchange', label: 'Takaslık' },
  { id: 'REQUESTING', label: 'Var Mı?' },
];

const CATEGORIES = [
  { name: 'Elektronik', icon: Cpu },
  { name: 'Giyim', icon: Shirt },
  { name: 'Kitap', icon: BookOpen },
  { name: 'Mobilya', icon: HomeIcon },
  { name: 'Ulaşım', icon: Bike },
  { name: 'Çocuk', icon: Baby },
  { name: 'Spor', icon: Dumbbell },
  { name: 'Müzik', icon: Music },
  { name: 'Mutfak', icon: Utensils },
  { name: 'Diğer', icon: Package },
];

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);
  const [activeCities, setActiveCities] = useState([]);
  const [activeDistricts, setActiveDistricts] = useState([]);

  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('home_active_tab') || 'all',
  );

  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);

  const { showToast } = useToast();

  useEffect(() => {
    sessionStorage.setItem('home_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!loading) {
      const savedScrollPos = sessionStorage.getItem('home_scroll_pos');
      if (savedScrollPos) {
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScrollPos, 10),
            behavior: 'instant',
          });
          sessionStorage.removeItem('home_scroll_pos');
        }, 100);
      }
    }
  }, [loading, items]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const queryParams = {};

        if (activeTab === 'donation' || activeTab === 'exchange') {
          queryParams.shareType = activeTab;
        } else if (activeTab === 'REQUESTING') {
          queryParams.postType = activeTab;
        }

        const res = await api.get('/items', { params: queryParams });
        // res.data is now { data: Item[], meta: { ... } }
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        console.error('Paylaşımlar yüklenirken hata:', err);
        showToast(
          'Eşyaları şu an getiremiyoruz, lütfen birazdan tekrar deneyin.',
          'error',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [showToast, activeTab]);

  useEffect(() => {
    if (isAuthenticated) {
      api
        .get('/favorites')
        .then((res) => setFavoriteIds(res.data.map((f) => f.id)))
        .catch((err) => console.error('Favoriler alınamadı:', err));
    } else {
      setFavoriteIds([]);
    }
  }, [isAuthenticated]);

  const handleFavoriteToggle = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Favorilere eklemek için giriş yapmalısınız.', 'info');
      return;
    }

    try {
      const res = await api.post(`/favorites/${id}`);
      if (res.data.isFavorited) {
        setFavoriteIds((prev) => [...prev, id]);
        showToast('Favorilere eklendi ❤️', 'success');
      } else {
        setFavoriteIds((prev) => prev.filter((fid) => fid !== id));
        showToast('Favorilerden çıkarıldı', 'info');
      }
    } catch {
      showToast('Favori işlemi başarısız oldu.', 'error');
    }
  };

  const handleJoinClick = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await api.post(`/giveaways/${id}/apply`);
      showToast('Döngüye başarıyla katıldın! 🎉', 'success');
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, applicationsCount: (i.applicationsCount || 0) + 1 }
            : i,
        ),
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Bir hata oluştu.';
      if (
        msg.includes('already applied') ||
        msg.includes('has already applied')
      ) {
        showToast('Bu döngüye zaten katılmışsınız.', 'info');
      } else if (err.response?.status === 401) {
        showToast('Döngüye katılmak için giriş yapmalısınız.', 'info');
      } else {
        showToast(msg, 'error');
      }
    }
  };

  const activeFilterCount = activeCategories.length + activeCities.length + activeDistricts.length;

  const handleApplyFilters = ({ categories, cities, districts }) => {
    setActiveCategories(categories);
    setActiveCities(cities);
    setActiveDistricts(districts);
  };

  const sortedItems = useMemo(() => {
    let copy = [...items];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      copy = copy.filter((item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategories.length > 0) {
      copy = copy.filter((item) =>
        item.category && activeCategories.includes(item.category)
      );
    }

    // City filter
    if (activeCities.length > 0) {
      copy = copy.filter((item) =>
        item.city && activeCities.some(c => item.city.toLowerCase() === c.toLowerCase())
      );
    }

    // District filter
    if (activeDistricts.length > 0) {
      copy = copy.filter((item) =>
        item.district && activeDistricts.some(d => item.district.toLowerCase() === d.toLowerCase())
      );
    }

    if (sortBy === 'popular') {
      return copy.sort(
        (a, b) => (b.applicationsCount || 0) - (a.applicationsCount || 0),
      );
    }

    if (sortBy === 'near') {
      return copy.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
    }

    return copy.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.drawDate || 0).getTime();
      const dateB = new Date(b.createdAt || b.drawDate || 0).getTime();
      return dateB - dateA;
    });
  }, [items, sortBy, searchQuery, activeCategories, activeCities, activeDistricts]);

  const handleItemClick = () => {
    sessionStorage.setItem('home_scroll_pos', window.scrollY.toString());
  };

  const resolveCardType = (item) => {
    if (item.postType === 'REQUESTING') {
      return {
        tag: 'VAR MI?',
        tagClass: 'bg-tertiary-container text-tertiary-fixed',
        actionLabel: 'Bende Var!',
        actionClass: 'bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors',
        rightLabel: 'Aranıyor',
      };
    }

    if (item.shareType === 'exchange') {
      return {
        tag: 'TAKASLIK',
        tagClass: 'bg-[#B2CABD] text-primary-container',
        actionLabel: 'Teklif Ver',
        actionClass: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed transition-colors',
        rightLabel: 'Takas',
      };
    }

    return {
      tag: 'DÖNGÜDE',
      tagClass: 'bg-primary text-white',
      actionLabel: 'Döngüye Katıl',
      actionClass: 'bg-primary-container text-white hover:opacity-90 transition-opacity',
      rightLabel: item.karmaPoint ? `${item.karmaPoint} Puan` : 'Döngüde',
    };
  };

  return (
    <>
      <main className="pt-[64px] pb-12">
        <section className="w-full mb-8 md:mb-12">
          <div className="relative overflow-hidden min-h-[360px] md:min-h-[320px] flex flex-col justify-center px-6 md:px-16 bg-primary-container text-white">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent opacity-90"></div>
              <img
                alt="Hero background"
                className="w-full h-full object-cover"
                src={heroBg}
              />
            </div>
            <div className="relative z-10 max-w-2xl py-8 md:py-0">
              <h1 className="text-3xl md:text-5xl font-extrabold font-manrope leading-tight mb-4">
                İyilik Dolaştır,<br />Dünyayı Değiştir
              </h1>
              <p className="text-base md:text-lg text-on-primary-container/80 font-body max-w-lg">
                Topluluğuna katıl, kullanmadığın eşyaları paylaş ve döngüsel ekonominin bir parçası ol.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-6 md:mb-10">
          <div className="flex flex-col gap-6">
            
            {/* Upper Row: Search & Filter (Sorting moved inside Filter conceptually) */}
            <div className="flex flex-row items-center gap-2 md:gap-4 w-full">
              <div className="flex flex-1 items-center bg-surface-container-low px-4 py-3 border border-slate-200/50 rounded-2xl transition-colors focus-within:bg-white focus-within:shadow-sm">
                <span className="material-symbols-outlined text-slate-500 mr-2 md:mr-3 text-[18px] md:text-[20px]">search</span>
                <input
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full outline-none text-slate-800 placeholder-slate-400"
                  placeholder="İhtiyacın olan eşyayı veya içeriği ara..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button
                onClick={() => setIsFilterOpen(true)}
                className={`relative flex items-center justify-center gap-2 border px-4 md:px-6 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm shrink-0 ${
                  activeFilterCount > 0
                    ? 'bg-primary text-white border-primary hover:bg-primary/90'
                    : 'bg-surface-container-low border-slate-200/50 text-primary hover:bg-[#B2CABD]/20'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">tune</span>
                <span className="hidden md:inline">Filtrele</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-[10px] font-extrabold border border-primary shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Lower Row: Centered Tabs */}
            <div className="flex justify-center w-full">
              <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 max-w-full">
                <div className="flex bg-surface-container-low p-1.5 rounded-2xl w-max mx-auto shadow-sm">
                  {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap ${
                          active
                            ? 'font-bold bg-white shadow-sm text-primary'
                            : 'font-semibold text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
          </div>
        </section>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        categories={CATEGORIES}
        initialCategories={activeCategories}
        initialCities={activeCities}
        initialDistricts={activeDistricts}
      />

        {loading ? (
          <section className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-16">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </section>
        ) : sortedItems.length === 0 ? (
          <section className="max-w-[1440px] mx-auto px-4 md:px-8">
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
              <p className="text-lg font-semibold text-on-surface-variant">
                Aradığın kriterlere uygun ilan bulunamadı.
              </p>
            </div>
          </section>
        ) : (
          <>
            <section className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-16">
              {sortedItems.map((item) => (
                <article
                  key={item.id}
                  className="group bg-surface-container-lowest rounded-2xl overflow-hidden hover:shadow-[0px_12px_32px_rgba(25,28,30,0.06)] transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
                >
                  <div className="relative aspect-square md:h-64 overflow-hidden" onClick={handleItemClick}>
                    <Link to={`/items/${item.id}`} className="block w-full h-full">
                      <img
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={(item.images && item.images[0]) || item.imageUrl || 'https://via.placeholder.com/300'}
                      />
                    </Link>
                    <span
                      className={`absolute top-2 left-2 md:top-4 md:left-4 text-[8px] md:text-[10px] font-bold tracking-widest px-2 md:px-3 py-1 rounded-full ${resolveCardType(item).tagClass}`}
                    >
                      {resolveCardType(item).tag}
                    </span>
                    <button
                      onClick={(e) => handleFavoriteToggle(e, item.id)}
                      className="absolute top-2 right-2 md:top-4 md:right-4 h-7 w-7 md:h-9 md:w-9 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center transition-colors text-error hover:bg-white"
                    >
                      {favoriteIds.includes(item.id) ? (
                        <span className="material-symbols-outlined text-[16px] md:text-[20px] fill-current">favorite</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] md:text-[20px]">favorite</span>
                      )}
                    </button>
                  </div>
                  <div className="p-3 md:p-6 flex flex-col flex-grow">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-1">
                      <h3 className="font-manrope font-bold text-sm md:text-lg leading-tight line-clamp-1">
                        {item.title}
                      </h3>
                      <span className="text-secondary font-bold text-[10px] md:text-sm whitespace-nowrap">
                        {resolveCardType(item).rightLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 text-on-surface-variant text-[10px] md:text-xs font-medium mb-4">
                      <span className="material-symbols-outlined text-[14px] md:text-sm">location_on</span>
                      <span className="truncate">
                        {item.district && item.city
                          ? `${item.district}, ${item.city}`
                          : item.city || item.district || 'Konum yok'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        if (item.shareType === 'donation') {
                          handleJoinClick(e, item.id);
                        } else {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className={`mt-auto w-full py-2 md:py-3 rounded-full font-bold text-xs md:text-sm ${resolveCardType(item).actionClass}`}
                    >
                      {resolveCardType(item).actionLabel}
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="max-w-[1440px] mx-auto px-4 md:px-8 mb-16">
              <div className="bg-[#B2CABD]/10 rounded-3xl p-6 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 md:w-64 md:h-64 bg-secondary-container/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-32 h-32 md:w-64 md:h-64 bg-primary-container/5 rounded-full blur-3xl"></div>
                <h2 className="text-2xl md:text-4xl font-extrabold font-manrope text-primary mb-4 relative z-10">
                  Bağışınla Birini Mutlu Etmeye Hazır mısın?
                </h2>
                <p className="text-sm md:text-lg text-on-secondary-container mb-8 md:mb-10 max-w-2xl mx-auto relative z-10 font-medium">
                  Kullanmadığın her eşya, bir başkasının ihtiyacı olabilir. Bugün paylaşmaya başla, iyiliği birlikte büyütelim.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                  <Link
                    to="/dashboard"
                    className="px-6 md:px-10 py-3 md:py-4 bg-gradient-to-r from-[#05162b] to-[#1b2b41] text-white rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2 hover:scale-105 transition-all"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Paylaşım Oluştur
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="px-6 md:px-10 py-3 md:py-4 bg-white text-primary border border-surface-container-high rounded-full font-bold text-base md:text-lg hover:bg-surface-container-low transition-all"
                  >
                    Nasıl Çalışır?
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default Home;
