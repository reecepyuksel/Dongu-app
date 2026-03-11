import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
    return (
        <div className="bg-slate-50 min-h-screen pt-10 pb-20 px-6 font-medium">
            <div className="max-w-4xl mx-auto bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 md:p-14">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-center mb-8">
                        <img src="/src/assets/dongu-.png" alt="Döngü Logo" className="h-[80px] mix-blend-multiply brightness-[1.05] contrast-[1.1] object-contain" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-[Outfit] text-center mb-10 leading-tight">
                        Kullanım Koşulları
                    </h1>

                    <div className="space-y-8 text-slate-700 leading-relaxed text-[16px]">
                        <p className="text-sm text-slate-500 italic">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">1. Kabul ve Kapsam</h2>
                            <p>
                                Döngü platformunu ("Platform") kullanarak, bu Kullanım Koşulları'nı kabul etmiş sayılırsınız. Platform, kullanıcıların ("İlan Sahibi" ve "Yeni Sahibi") ücretsiz olarak eşya paylaşmasını ve dayanışmasını kolaylaştıran dijital bir köprüdür.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">2. Hizmet Bedeli ve Ticari Kullanım</h2>
                            <p>
                                Döngü'de listelenen hiçbir eşya için <strong>ücret talep edilemez.</strong> Platformumuz ticari amaçlı alım satım veya takas için kullanılamaz. İhlal eden kullanıcıların hesapları askıya alınır. İyilik karşılıksızdır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">3. Kullanıcı Sorumlulukları</h2>
                            <ul className="list-disc pl-5 mt-2 space-y-2">
                                <li>İlan sahipleri, eşyaların durumu (hasarlı, eksik vb.) hakkında yanıltıcı bilgi vermemelidir.</li>
                                <li>Alıcılar, bağışçıların seçimlerine ("ilk gelen alır" veya "çekiliş sonucu") saygı göstermeli ve ısrarcı davranmamalıdır.</li>
                                <li>Teslimat süreçlerinde (kargo, elden teslim) oluşabilecek aksaklıklardan kullanıcılar kendi aralarında sorumludur; Döngü lojistik hizmeti sunmaz.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">4. Hesap Güvenliği ve İletişim</h2>
                            <p>
                                Hesabınızın güvenliğinden siz sorumlusunuz. Platform içi mesajlaşmalarda saygı çerçevesinin dışına çıkılamaz, nefret söylemi veya taciz tespit edildiğinde hesap tamamen kapatılır.
                            </p>
                        </section>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsOfService;
