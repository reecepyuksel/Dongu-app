import { Link } from 'react-router-dom';
import { Cloud, Heart, Leaf, Quote, Sparkles, Stars } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <section className="py-16 text-center md:py-20">
          <span className="mb-6 inline-flex rounded-full bg-[#cde5d8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#364b41]">
            Biz Kimiz?
          </span>
          <h1 className="font-[Manrope] text-5xl font-extrabold tracking-tight text-[#05162b] md:text-7xl">
            Hakkımızda
          </h1>
          <div className="mx-auto mt-8 max-w-3xl">
            <p className="relative text-2xl font-light italic leading-relaxed text-[#44474d] md:text-3xl">
              <Quote className="absolute -left-7 -top-8 h-8 w-8 text-[#b4ccbf]" />
              Döngü sadece bir pazar yeri değil, bir{' '}
              <span className="font-semibold text-[#4d6359]">
                yardımlaşma köprüsüdür.
              </span>
            </p>
          </div>
        </section>

        <section className="grid gap-12 pb-24 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <h2 className="font-[Manrope] text-4xl font-extrabold leading-tight text-[#05162b]">
              Gelecek Nesiller İçin Sorumluluk Alıyoruz
            </h2>
            <p className="text-lg leading-relaxed text-[#44474d]">
              Döngü, tüketim alışkanlıklarımızı kökten değiştirmek ve eşyaların
              yaşam süresini uzatmak amacıyla kuruldu. Bizim için bir eşyanın
              değeri, fiyat etiketi değil bir başkasının hayatında
              yaratabileceği etkidir.
            </p>
            <p className="text-lg leading-relaxed text-[#44474d]">
              Sürdürülebilirlik, dayanışma ve toplumsal faydayı merkeze alarak
              kullanılmayan her eşyanın yeni bir hikayeye başlaması için güvenli
              bir ekosistem kuruyoruz.
            </p>
          </div>

          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-[1.5rem] shadow-[0_12px_32px_rgba(25,28,30,0.08)]">
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1200&auto=format&fit=crop"
                alt="Sürdürülebilirlik"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 max-w-xs rounded-xl bg-white p-5 shadow-[0_12px_32px_rgba(25,28,30,0.1)]">
              <p className="font-[Manrope] text-xl font-extrabold text-[#05162b]">
                %100 Gönüllülük
              </p>
              <p className="mt-1 text-sm text-[#44474d]">
                Ticari kaygı gütmeden, tamamen topluluk odaklı bir paylaşım ağı.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-[#f2f4f6] px-5 py-16 sm:px-10">
          <div className="mb-12 text-center">
            <h2 className="font-[Manrope] text-4xl font-extrabold text-[#05162b]">
              Sıfır İsraf, Sınırsız Değer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-[#44474d]">
              Doğaya verdiğimiz zararı minimize etmek için eşyaları döngüye
              sokuyoruz.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-12">
            <article className="relative overflow-hidden rounded-[1.5rem] bg-white p-8 md:col-span-8">
              <h3 className="font-[Manrope] text-3xl font-extrabold text-[#05162b]">
                Çöp Değil, Gelecek
              </h3>
              <p className="mt-3 max-w-xl text-lg text-[#44474d]">
                Her yıl tonlarca kullanılabilir eşya çöpe gidiyor. Döngü ile bu
                israfın önüne geçiyor, karbon ayak izimizi birlikte
                küçültüyoruz.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d0e8db] px-4 py-2">
                <Leaf className="h-4 w-4 text-[#364b41]" />
                <span className="text-sm font-bold text-[#364b41]">
                  420kg Karbon Tasarrufu
                </span>
              </div>
              <Sparkles className="absolute -bottom-6 right-2 h-28 w-28 text-[#eceef0]" />
            </article>

            <article className="rounded-[1.5rem] bg-[#05162b] p-8 text-center text-white md:col-span-4">
              <Cloud className="mx-auto h-12 w-12 text-[#b4ccbf]" />
              <h3 className="mt-5 font-[Manrope] text-3xl font-extrabold">
                Temiz Doğa
              </h3>
              <p className="mt-3 text-sm text-[#d4e3ff]">
                Eşyalar el değiştirdikçe yeni üretim azalır, kaynaklarımız
                korunur.
              </p>
            </article>
          </div>
        </section>

        <section className="py-24">
          <div className="grid overflow-hidden rounded-[1.5rem] bg-white md:grid-cols-2">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1200&auto=format&fit=crop"
              alt="Topluluk"
              className="h-full min-h-[320px] w-full object-cover"
            />
            <div className="p-8 md:p-12">
              <h2 className="font-[Manrope] text-4xl font-extrabold leading-tight text-[#05162b]">
                Gerçek İyilik, Ortak Mutluluk
              </h2>
              <p className="mt-5 text-[#44474d]">
                Döngü&apos;de para geçmez. Burada tek para birimi Karma
                Puanları&apos;dır. Yardım ettikçe puan kazanır, topluluktan
                destek alırsın.
              </p>
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <div className="rounded-lg bg-[#cde5d8] p-2">
                    <Heart className="h-4 w-4 text-[#364b41]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#05162b]">
                      Karşılıksız Paylaşım
                    </p>
                    <p className="text-sm text-[#44474d]">
                      İhtiyacı olana ulaşmanın huzuru.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="rounded-lg bg-[#cde5d8] p-2">
                    <Stars className="h-4 w-4 text-[#364b41]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#05162b]">
                      Karma Sistemi
                    </p>
                    <p className="text-sm text-[#44474d]">
                      İyilik yaptıkça puan kazanırsın.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl pb-24">
          <div className="rounded-[1.5rem] bg-[#e6f0ec] p-10 text-center md:p-14">
            <h2 className="font-[Manrope] text-4xl font-extrabold text-[#05162b]">
              Vizyonumuz
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#44474d]">
              Hayalimiz, her mahallenin kendi içinde bir döngü kurduğu ve
              paylaşmanın en büyük erdem olduğu bir dünya. Değer odaklı ve
              birbirine bağlı topluluklar inşa etmek için çalışıyoruz.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4">
              <div>
                <p className="font-[Manrope] text-4xl font-extrabold text-[#05162b]">
                  10K+
                </p>
                <p className="text-xs text-[#75777d]">Mutlu Üye</p>
              </div>
              <div>
                <p className="font-[Manrope] text-4xl font-extrabold text-[#05162b]">
                  50K+
                </p>
                <p className="text-xs text-[#75777d]">Paylaşılan Eşya</p>
              </div>
              <div>
                <p className="font-[Manrope] text-4xl font-extrabold text-[#05162b]">
                  100+
                </p>
                <p className="text-xs text-[#75777d]">Aktif Şehir</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] bg-gradient-to-br from-[#1b2b41] to-[#05162b] p-10 text-center text-white">
          <h2 className="font-[Manrope] text-4xl font-extrabold">
            Siz de Döngü&apos;ye Katılın
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#d4e3ff]">
            Evinizde yer kaplayan ama başkasının hayatını kolaylaştıracak
            eşyalarınız mı var? Hemen başlayın.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="rounded-full bg-[#d0e8db] px-7 py-3 text-sm font-bold text-[#364b41]"
            >
              Hemen İlan Ver
            </Link>
            <Link
              to="/?tab=REQUESTING"
              className="rounded-full border border-white/30 px-7 py-3 text-sm font-bold"
            >
              Bir Şey Ara (Var mı?)
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;
