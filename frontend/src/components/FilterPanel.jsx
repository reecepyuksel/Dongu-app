import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import citiesData from '../data/cities.json';



const FilterPanel = ({
    isOpen,
    onClose,
    onApply,
    categories,
    initialCategories,
    initialCities,
    initialDistricts,
}) => {
    const [localCategories, setLocalCategories] = useState(initialCategories || []);
    const [localCities, setLocalCities] = useState(initialCities || []);
    const [localDistricts, setLocalDistricts] = useState(initialDistricts || []);

    const cities = citiesData.cities;
    const districtsData = citiesData.districtsData;

    useEffect(() => {
        if (isOpen) {
            setLocalCategories(initialCategories || []);
            setLocalCities(initialCities || []);
            setLocalDistricts(initialDistricts || []);
        }
    }, [isOpen, initialCategories, initialCities, initialDistricts]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    const handleApply = () => {
        onApply({
            categories: localCategories,
            cities: localCities,
            districts: localDistricts,
        });
        onClose();
    };

    const handleClearAll = () => {
        setLocalCategories([]);
        setLocalCities([]);
        setLocalDistricts([]);
    };

    const toggleCategory = (catName) => {
        setLocalCategories(prev => 
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };



    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                            <h2 className="text-xl font-bold text-slate-800">Filtrele</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* Konum */}
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold text-slate-800">Konum</h3>
                                <div className="space-y-3">
                                    <div className="relative z-20">
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">İller</label>
                                        <SearchableSelect
                                            options={cities}
                                            value={localCities}
                                            onChange={(val) => {
                                                setLocalCities(val);
                                                setLocalDistricts([]);
                                            }}
                                            placeholder="Şehir Seç"
                                            multiple={true}
                                            allLabel="Tüm Şehirler"
                                        />
                                    </div>
                                    <div className="relative z-10">
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">İlçeler</label>
                                        <SearchableSelect
                                            options={localCities.length > 0 ? localCities.flatMap(city => districtsData[city] || []) : []}
                                            value={localDistricts}
                                            onChange={setLocalDistricts}
                                            placeholder="İlçe Seç"
                                            disabled={localCities.length === 0}
                                            multiple={true}
                                            allLabel={localCities.length === 1 ? `Tümü (${localCities[0]})` : "Tüm İlçeler"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Kategoriler */}
                            <div className="space-y-4 relative z-0">
                                <h3 className="text-base font-semibold text-slate-800">Kategoriler</h3>
                                <div className="space-y-2">
                                    {categories.filter(c => c.name !== 'Tümü').map((category) => {
                                        const isSelected = localCategories.includes(category.name);
                                        const Icon = category.icon;
                                        return (
                                            <button
                                                key={category.name}
                                                onClick={() => toggleCategory(category.name)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                    isSelected 
                                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                                        : 'border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5 opacity-70" />
                                                    <span className="font-medium">{category.name}</span>
                                                </div>
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'}`}>
                                                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>



                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClearAll}
                                    className="px-6 py-3 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Temizle
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20"
                                >
                                    Filtreleri Uygula
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FilterPanel;
