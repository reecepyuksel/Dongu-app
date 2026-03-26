import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const CommunitySidebar = () => {
  const { isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setCommunities([]);
      return;
    }

    let mounted = true;

    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/communities/my');
        if (mounted) {
          setCommunities(Array.isArray(response.data) ? response.data : []);
        }
      } catch {
        if (mounted) {
          setCommunities([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCommunities();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  return (
    <aside className="xl:sticky xl:top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Topluluklarım
      </h3>

      {!isAuthenticated ? (
        <p className="text-sm text-slate-500">
          Topluluklarını görmek için giriş yap.
        </p>
      ) : loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-9 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <p className="text-sm text-slate-500">
          Henüz üye olduğun bir topluluk yok.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {communities.slice(0, 8).map((community) => (
            <li key={community.id}>
              <Link
                to={`/topluluk/${community.id}`}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {community.image ? (
                  <img
                    src={community.image}
                    alt={community.name}
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-semibold text-white">
                    {community.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="min-w-0 truncate">{community.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/topluluklar"
        className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <Users className="h-4 w-4" />
        Tüm Toplulukları Keşfet
        <ChevronRight className="h-4 w-4" />
      </Link>

      <Link
        to="/topluluklar?create=1"
        className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        + Yeni Topluluk Başlat
      </Link>
    </aside>
  );
};

export default CommunitySidebar;
