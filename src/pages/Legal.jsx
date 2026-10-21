import { Link } from 'react-router-dom'
import { TopBar } from '../components/UI'

// Maxfiylik siyosati va foydalanish shartlari.
// Operator rekvizitlari — launch'dan oldin yuridik shaxs ma'lumotlari bilan to'ldiring (yurist ko'rib chiqishi tavsiya etiladi).
export const LEGAL = {
  operator: 'AyolQadami',            // yuridik shaxs nomi, masalan: «AyolQadami» MChJ
  inn: '',                           // STIR (INN)
  address: "O'zbekiston Respublikasi, Toshkent shahri", // yuridik manzil
  email: '',                         // murojaatlar uchun email
  effective: '21.10.2026',           // kuchga kirgan sana
}

function Doc({ title, sections }) {
  const req = [LEGAL.inn && `STIR: ${LEGAL.inn}`, LEGAL.address, LEGAL.email && `Email: ${LEGAL.email}`].filter(Boolean).join(' · ')
  return (
    <div className="page legal">
      <TopBar title={title} />
      <div className="page-body">
        <article className="ar-text legal-doc">
          <p className="legal-meta">Kuchga kirgan sana: {LEGAL.effective} · {LEGAL.operator}{req && ` · ${req}`}</p>
          {sections.map(([h, body]) => (
            <section key={h}>
              <h2>{h}</h2>
              {body}
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}

const ul = (items) => <ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
const contact = (
  <p>
    Savollar va talablar bo&apos;yicha: ilovadagi <Link to="/support">Texnik yordam</Link> chati
    {LEGAL.email && <> yoki <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a></>}. Murojaatlar qonunchilikda belgilangan muddatda ko&apos;rib chiqiladi.
  </p>
)

export function Privacy() {
  return (
    <Doc title="Maxfiylik siyosati" sections={[
      ['1. Umumiy qoidalar', <>
        <p>Ushbu siyosat {LEGAL.operator} (keyingi o&apos;rinlarda — «Platforma», «biz») ayolqadami.uz sayti, Telegram Mini App va Telegram botlari orqali foydalanuvchilarning shaxsga doir ma&apos;lumotlarini qanday yig&apos;ishi, ishlatishi, saqlashi va himoya qilishini belgilaydi.</p>
        <p>Ma&apos;lumotlar O&apos;zbekiston Respublikasining «Shaxsga doir ma&apos;lumotlar to&apos;g&apos;risida»gi Qonuni (O&apos;RQ-547) va boshqa qonun hujjatlariga muvofiq qayta ishlanadi. Ro&apos;yxatdan o&apos;tishda tegishli belgini qo&apos;yib, siz ushbu siyosatga va ma&apos;lumotlaringizni qayta ishlashga rozilik bildirasiz.</p>
      </>],
      ['2. Qanday ma\'lumotlarni yig\'amiz', ul([
        <><b>Hisob ma&apos;lumotlari:</b> ism-familiya, telefon raqami, shahar, qiziqish sohalari; ish beruvchilar uchun — kompaniya nomi va mas&apos;ul shaxs.</>,
        <><b>Parol</b> — faqat qaytarib bo&apos;lmaydigan shifrlangan (bcrypt xesh) ko&apos;rinishda; parolingizni biz ham ko&apos;ra olmaymiz.</>,
        <><b>Google orqali kirishda:</b> email, ism va profil rasmi (Google tasdiqlagan holda).</>,
        <><b>Telegram:</b> raqamni tasdiqlashda — Telegram ID, foydalanuvchi nomi va siz o&apos;zingiz «Raqamni ulashish» tugmasi orqali yuborgan telefon raqami; botga yozgan xabarlaringiz (texnik yordam murojaatlari).</>,
        <><b>Rezyume va profil:</b> tajriba, ta&apos;lim, ko&apos;nikmalar, tillar, kutilayotgan maosh, rasm, ijtimoiy tarmoq havolalari — siz o&apos;zingiz kiritgan ma&apos;lumotlar.</>,
        <><b>Faoliyat:</b> topshirilgan arizalar va ilova xatlari, joylangan vakansiyalar, yozilgan kurslar, murojaatlar.</>,
        <><b>Texnik ma&apos;lumotlar:</b> IP manzil, kirish vaqti, qurilma va brauzer turi — xavfsizlik va suiiste&apos;mollarning oldini olish uchun.</>,
        <><b>Joylashuv</b> — faqat siz ruxsat bersangiz, xaritada yaqin vakansiyalarni ko&apos;rsatish uchun qurilmangizda ishlatiladi va serverga saqlanmaydi.</>,
      ])],
      ['3. Ma\'lumotlardan foydalanish maqsadlari', ul([
        'Hisob yaratish, kirish va telefon raqami egasini tasdiqlash;',
        'vakansiyalarni ko\'rsatish, arizangizni siz tanlagan ish beruvchiga yetkazish, mos ish va nomzodlarni tavsiya qilish;',
        'kurslar, tadbirlar va ariza holati haqida xabar berish (bildirishnomalarni sozlamalarda o\'chirish mumkin);',
        'texnik yordam ko\'rsatish va murojaatlaringizga javob berish;',
        'firibgarlik, soxta vakansiyalar va hisoblarga ruxsatsiz kirishning oldini olish;',
        'xizmat sifatini yaxshilash uchun umumlashtirilgan (shaxsni aniqlamaydigan) statistika.',
      ])],
      ['4. Ma\'lumotlaringizni kim ko\'radi', <>
        {ul([
          <><b>Ish beruvchi</b> — faqat siz ariza yuborgan vakansiya egasi: ismingiz, aloqa ma&apos;lumotlaringiz, rezyumengiz va ilova xatingiz.</>,
          <><b>Nomzodlar</b> — ish beruvchi joylagan vakansiya va kompaniya ma&apos;lumotlarini.</>,
          <><b>Platforma moderatorlari</b> — xizmat ko&apos;rsatish va qoidabuzarliklarni tekshirish uchun zarur hajmda; ularning amallari jurnalda qayd etiladi.</>,
          <><b>Davlat organlari</b> — faqat qonunda belgilangan hollarda va tartibda.</>,
        ])}
        <p>Biz shaxsga doir ma&apos;lumotlaringizni sotmaymiz va reklama maqsadida uchinchi shaxslarga bermaymiz. Google va Telegram orqali kirishda ushbu xizmatlarning o&apos;z maxfiylik siyosatlari ham amal qiladi.</p>
      </>],
      ['5. Saqlash joyi va muddati', <>
        <p>O&apos;zbekiston Respublikasi fuqarolarining shaxsga doir ma&apos;lumotlari qonun talabiga (O&apos;RQ-547, 27¹-modda) muvofiq O&apos;zbekiston Respublikasi hududida joylashgan serverlarda saqlanadi.</p>
        <p>Ma&apos;lumotlar hisobingiz faol bo&apos;lgan davrda saqlanadi. Hisob o&apos;chirilganda profil, rezyume, arizalar va murojaatlar o&apos;chiriladi; zaxira nusxalaridan 14 kun ichida avtomatik yo&apos;qoladi. Qonun talab qiladigan yozuvlar (masalan, xavfsizlik jurnali) belgilangan muddatgacha saqlanishi mumkin.</p>
      </>],
      ['6. Ma\'lumotlarni himoya qilish', ul([
        'barcha ulanishlar HTTPS (TLS) orqali shifrlanadi;',
        'parollar bcrypt bilan xeshlanadi, tasdiqlash kodlari faqat xesh ko\'rinishida va 10 daqiqa saqlanadi;',
        'admin paneliga kirish rollar bo\'yicha cheklangan va har bir amal jurnalga yoziladi;',
        'kirish urinishlari soni cheklangan, hisob bloklanganda barcha sessiyalar darhol bekor qilinadi.',
      ])],
      ['7. Sizning huquqlaringiz', <>
        {ul([
          'qaysi ma\'lumotlaringiz qayta ishlanayotganini bilish va nusxasini so\'rash;',
          'ma\'lumotlarni o\'zgartirish va to\'ldirish — Profil → Tahrirlash;',
          <>hisobni va ma&apos;lumotlarni o&apos;chirish — Sozlamalar → Foydalanuvchi → <b>Hisobni o&apos;chirish</b>;</>,
          'qayta ishlashga rozilikni qaytarib olish (bu hisobni o\'chirishga olib keladi);',
          'huquqlaringiz buzilgan deb hisoblasangiz — vakolatli davlat organiga yoki sudga murojaat qilish.',
        ])}
      </>],
      ['8. Cookie va mahalliy xotira', <p>Ilova sessiya tokeni, til va mavzu sozlamalarini brauzeringizning mahalliy xotirasida (localStorage) saqlaydi. Reklama yoki kuzatuv cookie&apos;lari ishlatilmaydi. Admin panel faqat xavfsiz (httpOnly) sessiya cookie&apos;sidan foydalanadi.</p>],
      ['9. Yosh cheklovi', <p>Platformadan 16 yoshga to&apos;lgan shaxslar foydalanishi mumkin. 16 yoshga to&apos;lmagan shaxsning ma&apos;lumotlari bizga berilganini aniqlasak, ular o&apos;chiriladi.</p>],
      ['10. O\'zgartirishlar va aloqa', <>
        <p>Siyosat o&apos;zgarganda yangi tahrir shu sahifada e&apos;lon qilinadi; muhim o&apos;zgarishlar haqida ilova orqali xabar beramiz.</p>
        {contact}
      </>],
    ]} />
  )
}

export function Terms() {
  return (
    <Doc title="Foydalanish shartlari" sections={[
      ['1. Umumiy qoidalar', <>
        <p>Ushbu shartlar {LEGAL.operator} platformasi (sayt, Telegram Mini App va botlar) bilan foydalanuvchi o&apos;rtasidagi munosabatlarni tartibga soladi. Ro&apos;yxatdan o&apos;tib yoki platformadan foydalanib, siz ushbu shartlarni va <Link to="/privacy">Maxfiylik siyosati</Link>ni qabul qilasiz.</p>
        <p>Platforma ish izlovchilar (asosan ayollar) va ish beruvchilarni bog&apos;laydi, rezyume yaratish, kurslar va QadamAI maslahatlarini taqdim etadi. Asosiy xizmatlar ish izlovchilar uchun bepul.</p>
      </>],
      ['2. Hisob', ul([
        'Ro\'yxatdan o\'tishda haqiqiy ma\'lumotlarni kiriting. Telefon raqamingiz Telegram kirish boti orqali tasdiqlanadi — faqat o\'zingizga tegishli raqamdan foydalaning.',
        'Bitta shaxs (yoki kompaniya) uchun bitta hisob. Hisobni boshqa shaxsga berish yoki sotish taqiqlanadi.',
        'Parol va tasdiqlash kodlarini hech kimga bermang. Platforma xodimlari ularni hech qachon so\'ramaydi. Hisobingiz orqali qilingan harakatlar uchun siz javobgarsiz.',
        'Hisobingizdan ruxsatsiz foydalanilganini sezsangiz, darhol parolni tiklang va texnik yordamga xabar bering.',
      ])],
      ['3. Ish izlovchilar', ul([
        'Rezyume va arizalardagi ma\'lumotlar to\'g\'ri bo\'lishi kerak; boshqa shaxsning ma\'lumotlari yoki hujjatlaridan foydalanmang.',
        'Ariza yuborganingizda rezyumengiz va aloqa ma\'lumotlaringiz shu vakansiya egasiga ko\'rinadi.',
        'Platforma ishga qabul qilinishingizni kafolatlamaydi; ishga qabul qilish to\'g\'risidagi qaror ish beruvchiga tegishli.',
      ])],
      ['4. Ish beruvchilar', <>
        <p>Vakansiyalar moderatsiyadan o&apos;tadi. Quyidagilar taqiqlanadi:</p>
        {ul([
          'mavjud bo\'lmagan, soxta yoki chalg\'ituvchi vakansiyalar; maosh va shartlarni noto\'g\'ri ko\'rsatish;',
          'nomzoddan ishga joylashtirish, o\'qitish, forma yoki hujjat uchun oldindan pul talab qilish;',
          'jinsi, yoshi, millati, dini, oilaviy holati, homiladorligi yoki nogironligi bo\'yicha qonunga zid kamsitish;',
          'tarmoq marketingi (piramida), xorijga noqonuniy ishga jo\'natish va qonunga zid faoliyatga jalb qilish;',
          'nomzodlar ma\'lumotlarini ishga qabul qilishdan boshqa maqsadda ishlatish yoki uchinchi shaxslarga berish.',
        ])}
        <p>Ish beruvchi vakansiya mazmuni va mehnat qonunchiligiga rioya qilishi uchun o&apos;zi javobgar.</p>
      </>],
      ['5. Taqiqlangan harakatlar', ul([
        'boshqa foydalanuvchilarni haqorat qilish, ta\'qib qilish, tahdid yoki spam yuborish;',
        'qonunga zid, odobsiz yoki uchinchi shaxslar huquqlarini buzuvchi kontent joylash;',
        'platformani avtomatik vositalar bilan ma\'lumot yig\'ish (scraping), xavfsizlik tizimlarini chetlab o\'tish yoki ishini buzishga urinish;',
        'boshqa shaxs yoki tashkilot nomidan harakat qilish.',
      ])],
      ['6. Kontent', <p>Siz joylagan rezyume, vakansiya va boshqa kontent sizga tegishli bo&apos;lib qoladi; ularni xizmat ko&apos;rsatish uchun (ko&apos;rsatish, ish beruvchiga yuborish, hamkor Telegram kanallarda vakansiyani e&apos;lon qilish) ishlatishimizga ruxsat berasiz. Platforma dizayni, logotipi, maqolalari va dasturiy ta&apos;minoti {LEGAL.operator}ga tegishli.</p>],
      ['7. QadamAI', <p>QadamAI tavsiyalari avtomatik yaratiladi va maslahat xarakteriga ega. Ularni yakuniy qaror sifatida emas, yordamchi vosita sifatida ishlating.</p>],
      ['8. Javobgarlikni cheklash', <p>Platforma foydalanuvchilar o&apos;rtasidagi mehnat munosabatlari tarafi emas va ish beruvchilar yoki nomzodlar bergan ma&apos;lumotlarning to&apos;liq to&apos;g&apos;riligini kafolatlamaydi. Shubhali vakansiya yoki xabarni «Shikoyat» orqali yoki texnik yordamga yuboring — biz tekshirib, choralar ko&apos;ramiz. Texnik ishlar yoki bizga bog&apos;liq bo&apos;lmagan sabablarga ko&apos;ra xizmatda vaqtincha uzilishlar bo&apos;lishi mumkin.</p>],
      ['9. Hisobni bloklash va o\'chirish', <p>Shartlar buzilganda platforma ogohlantirishsiz vakansiyani olib tashlashi, hisobni vaqtincha yoki butunlay bloklashi mumkin. Siz hisobingizni istalgan vaqtda Sozlamalar → Foydalanuvchi → «Hisobni o&apos;chirish» orqali o&apos;chira olasiz.</p>],
      ['10. Shartlarning o\'zgarishi', <p>Shartlar yangilanganda yangi tahrir shu sahifada e&apos;lon qilinadi. O&apos;zgarishdan keyin platformadan foydalanishni davom ettirish yangi tahrirga roziligingizni bildiradi.</p>],
      ['11. Nizolarni hal qilish', <p>Ushbu shartlarga O&apos;zbekiston Respublikasi qonunchiligi qo&apos;llaniladi. Nizolar avvalo muzokara yo&apos;li bilan, kelishuvga erishilmasa — O&apos;zbekiston Respublikasi sudlarida hal qilinadi.</p>],
      ['12. Aloqa', contact],
    ]} />
  )
}
