import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Gift } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { showToast } = useToast();

    // Eğer zaten giriş yapmışsa anasayfaya yönlendir
    if (isAuthenticated) {
        navigate('/');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            showToast('Hoş geldin! Başarıyla giriş yaptın.', 'success');
            navigate('/');
        } catch (err) {
            console.error('Login failed:', err);
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex bg-emerald-100 p-3 rounded-xl mb-4">
                        <Gift className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 font-[Outfit]">Hoş Geldiniz</h2>
                    <p className="text-slate-500 mt-2">Döngüye katılmak ve hikayelere ortak olmak için giriş yapın.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-slate-600">Beni hatırla</span>
                        </label>
                        <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">Şifremi unuttum</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium flex justify-center items-center gap-2"
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Hesabın yok mu?{' '}
                    <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Hemen Kayıt Ol
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
