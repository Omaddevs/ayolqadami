// Viloyatlar va tumanlar — web ilovadagi src/data/resume.js (REGIONS) bilan bir xil. center — viloyat markazi [lat, lng]
export type Region = { id: string; name: string; city: string; districts: string[] }

export const REGIONS: Region[] = [
  { id: 'tashkent-city', name: 'Toshkent shahri', city: 'Toshkent', districts: [
    'Bektemir', 'Chilonzor', 'Mirobod', "Mirzo Ulug'bek", 'Olmazor', 'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yangihayot', 'Yashnobod', 'Yunusobod'] },
  { id: 'tashkent', name: 'Toshkent viloyati', city: 'Toshkent', districts: [
    'Angren sh.', 'Bekobod sh.', 'Chirchiq sh.', 'Nurafshon sh.', 'Olmaliq sh.', 'Ohangaron sh.', "Yangiyo'l sh.",
    'Bekobod', "Bo'ka", "Bo'stonliq", 'Chinoz', 'Ohangaron', "Oqqo'rg'on", "O'rtachirchiq", 'Parkent', 'Piskent', 'Qibray', 'Quyichirchiq',
    'Toshkent tumani', 'Yangiyo\'l', 'Yuqorichirchiq', 'Zangiota'] },
  { id: 'andijan', name: 'Andijon viloyati', city: 'Andijon', districts: [
    'Andijon sh.', 'Xonobod sh.', 'Andijon', 'Asaka', 'Baliqchi', "Bo'z", 'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', "Oltinko'l",
    'Paxtaobod', "Qo'rg'ontepa", 'Shahrixon', "Ulug'nor", "Xo'jaobod"] },
  { id: 'bukhara', name: 'Buxoro viloyati', city: 'Buxoro', districts: [
    'Buxoro sh.', 'Kogon sh.', 'Buxoro', "G'ijduvon", 'Jondor', 'Kogon', 'Olot', 'Peshku', "Qorako'l", 'Qorovulbozor', 'Romitan', 'Shofirkon', 'Vobkent'] },
  { id: 'fergana', name: "Farg'ona viloyati", city: "Farg'ona", districts: [
    "Farg'ona sh.", "Marg'ilon sh.", "Qo'qon sh.", 'Quvasoy sh.', 'Beshariq', "Bog'dod", 'Buvayda', "Dang'ara", "Farg'ona", 'Furqat', 'Oltiariq',
    "Qo'shtepa", 'Quva', 'Rishton', "So'x", 'Toshloq', "Uchko'prik", "O'zbekiston", 'Yozyovon'] },
  { id: 'jizzakh', name: 'Jizzax viloyati', city: 'Jizzax', districts: [
    'Jizzax sh.', 'Arnasoy', 'Baxmal', "Do'stlik", 'Forish', "G'allaorol", "Mirzacho'l", 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zafarobod', 'Zarbdor', 'Zomin'] },
  { id: 'khorezm', name: 'Xorazm viloyati', city: 'Urganch', districts: [
    'Urganch sh.', 'Xiva sh.', "Bog'ot", 'Gurlan', 'Hazorasp', "Qo'shko'pir", 'Shovot', "Tuproqqal'a", 'Urganch', 'Xiva', 'Xonqa', 'Yangiariq', 'Yangibozor'] },
  { id: 'namangan', name: 'Namangan viloyati', city: 'Namangan', districts: [
    'Namangan sh.', 'Chortoq', 'Chust', 'Davlatobod', 'Kosonsoy', 'Mingbuloq', 'Namangan', 'Norin', 'Pop', "To'raqo'rg'on", "Uchqo'rg'on", 'Uychi', "Yangiqo'rg'on"] },
  { id: 'navoi', name: 'Navoiy viloyati', city: 'Navoiy', districts: [
    'Navoiy sh.', 'Zarafshon sh.', "G'ozg'on sh.", 'Karmana', 'Konimex', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi'] },
  { id: 'kashkadarya', name: 'Qashqadaryo viloyati', city: 'Qarshi', districts: [
    'Qarshi sh.', 'Shahrisabz sh.', 'Chiroqchi', 'Dehqonobod', "G'uzor", 'Kasbi', 'Kitob', 'Koson', "Ko'kdala", 'Mirishkor', 'Muborak', 'Nishon',
    'Qamashi', 'Qarshi', 'Shahrisabz', "Yakkabog'"] },
  { id: 'karakalpak', name: "Qoraqalpog'iston Respublikasi", city: 'Nukus', districts: [
    'Nukus sh.', 'Amudaryo', 'Beruniy', "Bo'zatov", 'Chimboy', "Ellikqal'a", 'Kegeyli', "Mo'ynoq", 'Nukus', "Qanliko'l", "Qo'ng'irot", "Qorao'zak",
    'Shumanay', 'Taxiatosh', "Taxtako'pir", "To'rtko'l", "Xo'jayli"] },
  { id: 'samarkand', name: 'Samarqand viloyati', city: 'Samarqand', districts: [
    'Samarqand sh.', "Kattaqo'rg'on sh.", "Bulung'ur", 'Ishtixon', 'Jomboy', "Kattaqo'rg'on", 'Narpay', 'Nurobod', 'Oqdaryo', "Past darg'om",
    'Paxtachi', 'Payariq', "Qo'shrabot", 'Samarqand', 'Toyloq', 'Urgut'] },
  { id: 'syrdarya', name: 'Sirdaryo viloyati', city: 'Guliston', districts: [
    'Guliston sh.', 'Shirin sh.', 'Yangiyer sh.', 'Boyovut', 'Guliston', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Sirdaryo', 'Xovos'] },
  { id: 'surkhandarya', name: 'Surxondaryo viloyati', city: 'Termiz', districts: [
    'Termiz sh.', 'Angor', 'Bandixon', 'Boysun', 'Denov', "Jarqo'rg'on", 'Muzrabot', 'Oltinsoy', 'Qiziriq', "Qumqo'rg'on", 'Sariosiyo', 'Sherobod',
    "Sho'rchi", 'Termiz', 'Uzun'] },
]

// Viloyat markazlari [lat, lng] — tuman topilmasa xaritada shu nuqta
export const REGION_CENTERS: Record<string, [number, number]> = {
  'tashkent-city': [41.3111, 69.2797], tashkent: [41.0, 69.6], andijan: [40.7821, 72.3442], bukhara: [39.7681, 64.4556],
  fergana: [40.3864, 71.7864], jizzakh: [40.1158, 67.8422], khorezm: [41.55, 60.6333], namangan: [40.9983, 71.6726],
  navoi: [40.0844, 65.3792], kashkadarya: [38.8606, 65.7891], karakalpak: [42.4531, 59.6103], samarkand: [39.6542, 66.9597],
  syrdarya: [40.4897, 68.7842], surkhandarya: [37.2242, 67.2783],
}

export const findRegion = (id?: string | null) => REGIONS.find((r) => r.id === id)
// eski vakansiyalarda faqat shahar bor — shu bo'yicha viloyat
export const regionByCity = (city?: string | null) => REGIONS.find((r) => r.city === city && r.id !== 'tashkent')
