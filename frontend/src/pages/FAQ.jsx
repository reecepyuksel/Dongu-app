import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQItem = ({ question, answer }) => {
    return (
        <div className="border border-slate-100 rounded-[16px] mb-4 bg-white overflow-hidden">
            <div className="w-full px-6 py-5 flex items-center justify-between text-left">
                <span className="font-bold text-[17px] text-slate-800 font-[Outfit] pr-4">{question}</span>
                <span className="text-emerald-500">
                    <ChevronUp className="w-5 h-5" />
                </span>
            </div>
            <div>
                <div className="px-6 pb-6 text-slate-600 leading-relaxed font-medium">
                    {answer}
                </div>
            </div>
        </div>
    );
};

const FAQ = () => {
    const faqs = [
        {
            question: "Döngü ücretli mi?",
            answer: "Kesinlikle hayır, platformumuzdaki her şey gönüllülük esasına dayanır. 'İyilik satılık değildir' mottomuz gereği tüm paylaşımlar ücretsizdir."
        },
        {
            question: "Nasıl kazanabilirim?",
            answer: "İlan sahibi, eşyasını verirken 'Çekiliş' veya 'İlk gelen alır' yönteminden birini seçer. Çekilişte sistem sürenin sonunda adil bir rastgele seçim yaparken, ilk gelende ilan sahibi adaylar arasından kendi dilediğini seçebilir."
        },
        {
            question: "Eşyamı kargolamalı mıyım?",
            answer: "Bu tamamen senin ve alıcının arasındaki iletişime bağlı. İlanı verirken 'Elden Teslim', 'Alıcı Öder' veya 'Ben Öderim' seçeneklerinden sana uyanları seçebilirsin. Geri kalanı sohbet üzerinden anlaşırsınız."
        },
        {
            question: "İyilik Puanı nedir?",
            answer: "Sistemde başkalarıyla paylaştığın her eşya sana İyilik Puanı kazandırır. Bu puan sadece sistemdeki güvenilirliği ve katkını temsil eder, maddi bir karşılığı yoktur."
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen pt-10 pb-20 px-6">
            <div className="max-w-3xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex justify-center mb-8">
                        <img src="/src/assets/dongu-.png" alt="Döngü Logo" className="h-[80px] mix-blend-multiply brightness-[1.05] contrast-[1.1] object-contain" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-[Outfit] text-center mb-4 leading-tight">
                        Sıkça Sorulan Sorular
                    </h1>
                    <p className="text-center text-slate-500 mb-10 text-[17px] font-medium">
                        Döngü hakkında merak ettiğin her şeyi burada cevaplıyoruz.
                    </p>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>

                    <div className="mt-12 text-center text-slate-500 font-medium">
                        Başka bir sorun mu var? <a href="mailto:destek@dongu.com" className="text-emerald-600 font-bold hover:underline">destek@dongu.com</a> adresinden bize ulaşabilirsin.
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FAQ;
