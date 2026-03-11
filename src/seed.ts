import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Item } from './items/entities/item.entity';
import * as bcrypt from 'bcrypt';

// Desteklenen veritabanı ayarlarını tanımlıyoruz
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'recep190',
  database: process.env.DB_NAME || 'loopp_db',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function runSeed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Veritabanına bağlanıldı.');

    const userRepository = AppDataSource.getRepository(User);
    const itemRepository = AppDataSource.getRepository(Item);

    // 1. Örnek Kullanıcılar
    console.log('Kullanıcılar ekleniyor...');
    const usersData = [
      {
        email: 'test1@example.com',
        password: await bcrypt.hash('123456', 10),
        fullName: 'Ahmet Yılmaz',
        city: 'İstanbul',
        district: 'Kadıköy',
      },
      {
        email: 'test2@example.com',
        password: await bcrypt.hash('123456', 10),
        fullName: 'Ayşe Kaya',
        city: 'Ankara',
        district: 'Çankaya',
      },
    ];

    const users: User[] = [];
    for (const data of usersData) {
      let user = await userRepository.findOne({ where: { email: data.email } });
      if (!user) {
        const newUser = userRepository.create(data as any);
        user = (await userRepository.save(newUser)) as unknown as User;
        console.log(`👤 Kullanıcı eklendi: ${user.fullName}`);
      } else {
        console.log(`⚠️ Kullanıcı zaten mevcut: ${user.email}`);
      }
      users.push(user as unknown as User);
    }

    // 2. Örnek İlanlar
    console.log('İlanlar ekleniyor...');
    const itemsData = [
      {
        title: 'Tertemiz Bebek Arabası',
        category: 'Bebek & Çocuk',
        description: 'Çocuğum büyüdüğü için hediye etmek istiyorum. Yırtık veya kırık yeri yoktur.',
        city: 'İstanbul',
        district: 'Kadıköy',
        shareType: 'donation', // ShareType.FREE
        owner: users[0],
      },
      {
        title: 'Öğrenciye Uygun Çalışma Masası',
        category: 'Mobilya',
        description: 'İhtiyaç fazlası. İsteyene ücretsiz bırakacağım, gelip alabilene verilir.',
        city: 'Ankara',
        district: 'Çankaya',
        shareType: 'donation',
        owner: users[1],
      },
      {
        title: 'Bisiklet ile Takaslık Kulaklık',
        category: 'Elektronik',
        description: 'Çok az kullanılmış kablosuz kulaklığımı bir dağ bisikleti ile takas etmek istiyorum.',
        city: 'İstanbul',
        district: 'Kadıköy',
        shareType: 'exchange', // ShareType.TRADE
        owner: users[0],
      },
    ];

    for (const data of itemsData) {
      // Basit bir varlık kontrolü (title based)
      let existingItem = await itemRepository.findOne({ where: { title: data.title } });
      if (!existingItem) {
        const newItem = itemRepository.create(data as any);
        const savedItem = (await itemRepository.save(newItem)) as unknown as Item;
        console.log(`📦 İlan eklendi: ${savedItem.title}`);
      } else {
        console.log(`⚠️ İlan zaten var: ${existingItem.title}`);
      }
    }

    console.log('🎉 Seed işlemi başarıyla tamamlandı!');
  } catch (error) {
    console.error('❌ Seed işleminde hata oluştu:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Veritabanı bağlantısı kapatıldı.');
  }
}

runSeed();
