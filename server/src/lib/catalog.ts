// Web ilovadagi ma'lumotnomalar bilan bir xil (src/data/mock.js) — admin formalarida ishlatiladi
export const CATEGORIES: { id: string; name: string }[] = [
  { id: 'office', name: 'Ofis ishlari' },
  { id: 'edu', name: "Ta'lim va pedagogika" },
  { id: 'med', name: "Tibbiyot va sog'liqni saqlash" },
  { id: 'nanny', name: 'Enaga va bola parvarishi' },
  { id: 'housekeeper', name: 'Uy xizmatchisi' },
  { id: 'cleaning', name: 'Tozalik xodimi' },
  { id: 'cook', name: 'Oshpaz (uy va oshxona)' },
  { id: 'caregiver', name: 'Keksalar va bemorlar parvarishi' },
  { id: 'sales', name: 'Savdo va mijozlar bilan ishlash' },
  { id: 'beauty', name: "Go'zallik va parvarish" },
  { id: 'it', name: 'IT va dizayn' },
  { id: 'home', name: 'Maishiy xizmatlar' },
  { id: 'remote', name: 'Masofaviy ish' },
  { id: 'production', name: 'Ishlab chiqarish' },
  { id: 'food', name: 'Restoran va mehmonxona' },
  { id: 'marketing', name: 'Marketing va media' },
  { id: 'finance', name: 'Moliya va buxgalteriya' },
  { id: 'law', name: 'Huquq va yuridik' },
  { id: 'logistics', name: 'Logistika va transport' },
  { id: 'other', name: 'Boshqa toifalar' },
]
export const catName = (id: string) => CATEGORIES.find((c) => c.id === id)?.name || id

export const CITIES = ['Toshkent', 'Toshkent viloyati', 'Samarqand', 'Buxoro', 'Andijon', "Farg'ona", 'Namangan', 'Navoiy', 'Qarshi', 'Nukus', 'Urganch', 'Jizzax', 'Guliston', 'Termiz']
export const JOB_TYPES = ["To'liq stavka", 'Yarim stavka', 'Masofaviy', 'Gibrid']

type Tone = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple' | 'pink'

export const JOB_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Moderatsiyada', tone: 'yellow' },
  ACTIVE: { label: 'Faol', tone: 'green' },
  REJECTED: { label: 'Rad etilgan', tone: 'red' },
  ARCHIVED: { label: 'Arxivda', tone: 'gray' },
}

export const APP_STATUS: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: 'Yangi', tone: 'blue' },
  REVIEWING: { label: "Ko'rib chiqilmoqda", tone: 'yellow' },
  INTERVIEW: { label: 'Suhbat', tone: 'purple' },
  OFFER: { label: 'Taklif', tone: 'pink' },
  HIRED: { label: 'Ishga olindi', tone: 'green' },
  REJECTED: { label: 'Rad etildi', tone: 'red' },
}

export const ROLE: Record<string, { label: string; tone: Tone }> = {
  SEEKER: { label: 'Ish izlovchi', tone: 'blue' },
  EMPLOYER: { label: 'Ish beruvchi', tone: 'purple' },
  MODERATOR: { label: 'Moderator', tone: 'yellow' },
  ADMIN: { label: 'Administrator', tone: 'pink' },
}

export const TICKET_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Javob kutmoqda', tone: 'yellow' },
  ANSWERED: { label: 'Javob berilgan', tone: 'green' },
  CLOSED: { label: 'Yopilgan', tone: 'gray' },
}

export const CONTENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PUBLISHED: { label: 'Chop etilgan', tone: 'green' },
  DRAFT: { label: 'Qoralama', tone: 'gray' },
}
