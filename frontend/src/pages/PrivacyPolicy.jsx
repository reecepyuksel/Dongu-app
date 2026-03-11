import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
                        Gizlilik ve Güvenlik
                    </h1>

                    <div className="space-y-8 text-slate-700 leading-relaxed text-[16px]">
                        <p className="text-sm text-slate-500 italic">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">1. Topladığımız Veriler</h2>
                            <p>
                                Döngü'ye üye olduğunuzda isminiz, e-posta adresiniz ve platform içi işlemleriniz (ilanlarınız, iyilik puanlarınız, sohbet geçmişiniz) güvenli bir şekilde saklanır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">2. Verilerin Kullanımı</h2>
                            <p>
                                Platformumuz, topladığı verileri sadece hizmet kalitesini artırmak ve kullanıcı deneyimini iyileştirmek için kullanır. Kullanıcı bilgileri kesinlikle <strong>üçüncü şahıslara veya şirketlere satılmaz.</strong>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">3. İletişim Güvenliği</h2>
                            <p>
                                Uygulama içerisindeki sohbetler şifrelenmez ancak sadece siz ve konuştuğunuz kişi tarafından erişilebilir. Kullanıcılar arasında telefon veya kişisel adres paylaşımı kendi inisiyatiflerindedir, platformumuz harici mecralara geçişinizi önermez.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-emerald-800 font-[Outfit] mb-3">4. Hesap Silme</h2>
                            <p>
                                Döngü hesabınızı, sistem üzerinden istediğiniz zaman silebilirsiniz. Hesap silindiğinde platformdaki ilanlarınız yayından kaldırılır ancak iyilik puanı kayıtları anonimleştirilerek istatistiksel veri olarak bırakılabilir.
                            </p>
                        </section>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
