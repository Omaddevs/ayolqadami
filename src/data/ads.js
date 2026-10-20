// Foydalanuvchi e'lonlari: kind — 'service' (xizmat taklif qilaman) | 'seek' (ish qidiryapman)
export const AD_KINDS = [
  { id: 'service', label: 'Xizmat taklif qilaman' },
  { id: 'seek', label: 'Ish qidiryapman' },
]

export const adKindLabel = (id) => AD_KINDS.find((k) => k.id === id)?.label || id

export const ADS = [
  {
    id: 'ad1', kind: 'service', title: "Ko'ylak va libos tikaman, buyurtma olaman", category: 'production', city: 'Toshkent',
    price: 150000, author: 'Dilnoza Karimova', color: '#EC4899', phone: '+998 90 123 45 67', posted: '2 soat oldin',
    description: "10 yillik tajriba. Kundalik va bayramona liboslar, o'lchov bo'yicha tikish, ta'mirlash. Uyga kelib o'lchov olaman.",
  },
  {
    id: 'ad2', kind: 'service', title: 'Ingliz tili repetitori (IELTS, boshlang\'ich)', category: 'edu', city: 'Samarqand',
    price: 80000, author: 'Malika Rustamova', color: '#6366F6', phone: '+998 93 222 11 00', posted: 'Kecha',
    description: "Bolalar va kattalar uchun individual darslar. Onlayn yoki uyda. Birinchi dars bepul.",
  },
  {
    id: 'ad3', kind: 'seek', title: 'Buxgalter — yarim stavka ish qidiryapman', category: 'finance', city: 'Toshkent',
    price: 4000000, author: 'Nodira Aliyeva', color: '#10B981', phone: '+998 97 555 44 33', posted: '3 kun oldin',
    description: "1C, Excel, soliq hisobotlari bo'yicha 6 yil tajriba. Kunduzgi grafik yoki masofaviy ish ma'qul.",
  },
  {
    id: 'ad4', kind: 'service', title: 'Uyda manikyur va pedikyur', category: 'beauty', city: "Farg'ona",
    price: 60000, author: 'Gulnora Tursunova', color: '#F59E0B', phone: '+998 91 777 88 99', posted: '5 kun oldin',
    description: "Steril asboblar, gel-lak qoplama. Uyingizga borib xizmat ko'rsataman.",
  },
]
