import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/register', {
                fullName,
                email,
                password
            });
            showToast('Kayıt başarılı! Şimdi giriş yapabilirsiniz.', 'success');
            navigate('/login');
        } catch (err) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || 'Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="inline-flex bg-emerald-100 p-3 rounded-xl mb-4">
                        <UserPlus className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 font-[Outfit]">Aramıza Katıl</h2>
                    <p className="text-slate-500 mt-2">İyilik döngüsünün bir parçası ol.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                            placeholder="Adınız Soyadınız"
                            required
                        />
                    </div>

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
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium flex justify-center items-center gap-2"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Zaten hesabın var mı?{' '}
                    <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Giriş Yap
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
