# AyolQadami — Web App (MVP)

Ayollarni ish bilan ta'minlash platformasi: vakansiyalar (hh.uz kabi), profil va rezyume (LinkedIn kabi),
**QadamAI** orqali mos kadr / mos ish topish, bepul va pullik o'quv kurslari.

## Ishga tushirish

```bash
npm install
npm run dev       # http://localhost:5173 (telefondan ham: tarmoqdagi IP orqali)
npm run build     # production build -> dist/
```

## Imkoniyatlar

| Rol | Imkoniyatlar |
|---|---|
| **Ish izlovchi** | Rezyume yaratish/tahrirlash, vakansiyalarni qidirish va filtrlash, ariza topshirish, saqlash, kurslarga yozilish, QadamAI orqali mos ish topish |
| **Ish beruvchi** | Vakansiya joylash, nomzodlar bazasi, QadamAI bilan mos kadr topish (moslik %), suhbatga taklif yuborish |

Demo: `/welcome` sahifasida "Demo bilan kirish" tugmalari. Profil → "Rolni almashtirish" orqali ikkala rolni sinab ko'rish mumkin.

## Tuzilma

```
src/
  components/Icon3D.jsx   # 3D uslubdagi SVG ikonkalar (gradient + gloss + soya)
  components/Icons.jsx    # chiziqli UI ikonkalar
  components/UI.jsx       # Layout (tab bar / sidebar), kartalar, modal
  context/AppContext.jsx  # global holat (localStorage)
  data/mock.js            # vakansiyalar, nomzodlar, kurslar, tadbirlar
  data/qadam.js           # QadamAI moslash algoritmi
  pages/                  # Auth, Home, Jobs, Courses, QadamAI, Profile, Employer, Misc
  styles/global.css       # dizayn tokenlari + responsive (mobil / planshet / desktop)
```

## Keyingi qadamlar (backend)

- `AppContext` dagi funksiyalarni REST/Supabase API chaqiruvlariga almashtirish
- `data/qadam.js` dagi `analyzeQuery`/`matchCandidates` ni server tomonda LLM (embedding + reranking) bilan almashtirish
- SMS orqali tasdiqlash (telefon raqam), Click/Payme to'lov integratsiyasi
