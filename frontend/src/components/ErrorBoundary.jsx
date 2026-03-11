import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100"
                    >
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Oops! Bir şeyler ters gitti.</h1>
                        <p className="text-slate-500 mb-6">
                            Beklenmedik bir hata oluştu. Endişelenmeyin, bu sizin suçunuz değil.
                        </p>

                        <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40 text-xs text-slate-400 font-mono">
                            {this.state.error && this.state.error.toString()}
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Sayfayı Yenile
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                            >
                                <Home className="w-4 h-4" />
                                Anasayfa
                            </button>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
