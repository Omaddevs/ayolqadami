import { Card, PageHead } from '@/components/ui'

export const metadata = { title: "Yo'riqnoma" }

const ITEMS = [
  ['Moderatsiya', "Ish beruvchi saytda joylagan vakansiya «Moderatsiyada» holatiga tushadi. Vakansiyalar → «Moderatsiyada» bo'limida tasdiqlang yoki sababini yozib rad eting. Rad etish sababi ish beruvchiga ko'rinadi. Moderatsiyani Sozlamalarda o'chirish mumkin."],
  ['Foydalanuvchini bloklash', "Bloklangan foydalanuvchi barcha qurilmalardan darhol chiqariladi va qayta kira olmaydi. Hisob va ma'lumotlari saqlanib qoladi — blokdan chiqarish mumkin."],
  ["Rollar", "Administrator — barcha amallar, rollar va sozlamalar. Moderator — vakansiya, ariza, murojaat va kontent bilan ishlaydi, lekin o'chira olmaydi, rollarni va sozlamalarni o'zgartira olmaydi."],
  ['Kontent', "Kurslar, maqolalar va tadbirlar web ilovada darhol (1 daqiqagacha kesh) yangilanadi. «Qoralama» holatidagilar saytda ko'rinmaydi."],
  ['Hisobotlar', "Vakansiyalar, foydalanuvchilar va arizalar ro'yxatini joriy filtrlar bilan CSV (Excel) formatida yuklab olish mumkin."],
  ['Telegram bot', "Telegram → Bot sozlamalari: @BotFather bergan tokenni kiriting. Lokal kompyuterda «Polling», HTTPS serverda «Webhook» rejimini tanlang. Bot /start, /jobs, /help buyruqlariga javob beradi; botga yozilgan oddiy xabarlar «Murojaatlar»ga tushadi va operator javobi foydalanuvchiga bot orqali qaytadi."],
  ['Telegram kanallar', "Botni kanalga administrator qilib («Xabar joylash» huquqi bilan) qo'shing — kanal ro'yxatda o'zi paydo bo'ladi yoki @username orqali qo'lda qo'shing. Kanal sozlamalarida soha va shahar filtri hamda avtomatik yuborishni yoqing: tasdiqlangan vakansiyalar mos kanallarga o'zi chiqadi. «Post yuborish» bo'limidan ixtiyoriy e'lon yoki bot obunachilariga xabar tarqatiladi."],
  ['Xavfsizlik', "Har bir o'zgarish «Amallar jurnali»ga yoziladi. Parolni muntazam almashtiring; parol almashtirilganda boshqa qurilmalardagi sessiyalar yopiladi. Admin sessiyasi 12 soat amal qiladi."],
]

export default function HelpPage() {
  return (
    <>
      <PageHead title="Yo'riqnoma" sub="Admin panel bilan ishlash bo'yicha qisqacha" />
      <div className="grid g-2">
        {ITEMS.map(([t, d]) => (
          <Card key={t} title={t}><p className="prose" style={{ margin: 0 }}>{d}</p></Card>
        ))}
      </div>
    </>
  )
}
