import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options = [], value, onChange, placeholder, disabled, className = '', multiple = false, allLabel = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Filter options
    const filteredOptions = options.filter(option => 
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent body scroll when mobile sheet is open
    useEffect(() => {
        if (isOpen && window.innerWidth < 640) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Select Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border bg-white shadow-sm transition outline-none ${
                    disabled ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 
                    isOpen ? 'border-emerald-500 ring-1 ring-emerald-500 text-slate-800' : 'border-slate-200 text-slate-600 hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
            >
                <div className="flex-1 truncate pr-2 text-left">
                    {multiple ? (
                        <span className={`font-medium ${(!value || value.length === 0) && 'text-slate-400 font-normal'}`}>
                            {value && value.length > 0 
                                ? (value.length === 1 ? value[0] : `${value.length} Seçim`) 
                                : placeholder}
                        </span>
                    ) : (
                        <span className={`font-medium block truncate ${!value && 'text-slate-400 font-normal'}`}>
                            {value || placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : 'text-slate-400'}`} />
            </button>

            {/* Dropdown / Bottom Sheet */}
            <AnimatePresence>
                {isOpen && !disabled && (
                    <>
                        {/* Mobile Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/40 z-[60] sm:hidden backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[70] sm:absolute sm:bottom-auto sm:left-auto sm:top-full sm:mt-2 sm:rounded-xl sm:border sm:border-slate-100 sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:w-full sm:min-w-[200px] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[300px]"
                        >
                            {/* Mobile Handle */}
                            <div className="w-full flex justify-center py-4 sm:hidden pb-2">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            </div>

                            {/* Search Bar */}
                            <div className="p-3 sm:p-2 border-b border-slate-100 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-8 py-2.5 sm:py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                                        autoFocus={window.innerWidth >= 640} // Sadece masaüstünde otomatik odaklan
                                    />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Options List */}
                            <div className="overflow-y-auto p-2 overscroll-contain pb-8 sm:pb-2 flex-1">
                                {allLabel && !searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(multiple ? [] : '');
                                            if (!multiple) {
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }
                                        }}
                                        className={`w-full flex items-center justify-between px-4 sm:px-3 py-3 sm:py-2.5 rounded-lg text-[15px] sm:text-sm font-medium transition-colors mb-1 ${
                                            (multiple ? (!value || value.length === 0) : !value)
                                                ? 'bg-emerald-50 text-emerald-700' 
                                                : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600'
                                        }`}
                                    >
                                        <span className="italic">{allLabel}</span>
                                        {(multiple ? (!value || value.length === 0) : !value) && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                                    </button>
                                )}

                                {filteredOptions.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-slate-500">Sonuç bulunamadı</div>
                                ) : (
                                    filteredOptions.map(option => {
                                        const isSelected = multiple ? (value || []).includes(option) : value === option;
                                        return (
                                            <button
                                                key={option}
                                                type="button"
                                                onClick={() => {
                                                    if (multiple) {
                                                        const currentValues = value || [];
                                                        const newValues = isSelected 
                                                            ? currentValues.filter(v => v !== option)
                                                            : [...currentValues, option];
                                                        onChange(newValues);
                                                        // Multiple'da menü açık kalır
                                                    } else {
                                                        onChange(option);
                                                        setIsOpen(false);
                                                        setSearchTerm('');
                                                    }
                                                }}
                                                className={`w-full flex items-center justify-between px-4 sm:px-3 py-3 sm:py-2.5 rounded-lg text-[15px] sm:text-sm font-medium transition-colors mb-1 ${
                                                    isSelected 
                                                        ? 'bg-emerald-50 text-emerald-700' 
                                                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-600'
                                                }`}
                                            >
                                                {option}
                                                {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                                                {multiple && !isSelected && <div className="w-4 h-4 border border-slate-300 rounded shrink-0 opacity-50"></div>}
                                                {multiple && isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 hidden" />} {/* visually replace checkbox with check */}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchableSelect;
