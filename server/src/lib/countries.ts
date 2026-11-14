// Mamlakat — brauzer vaqt mintaqasi (Intl timeZone) bo'yicha. IP bazasisiz va tashqi xizmatsiz;
// VPN ishlatganlarda ham haqiqiy joylashuvga yaqinroq natija beradi
export const TZ_COUNTRY: Record<string, string> = {
  'Asia/Tashkent': 'UZ', 'Asia/Samarkand': 'UZ',
  'Europe/Moscow': 'RU', 'Europe/Samara': 'RU', 'Europe/Volgograd': 'RU', 'Europe/Kaliningrad': 'RU', 'Asia/Yekaterinburg': 'RU',
  'Asia/Omsk': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Krasnoyarsk': 'RU', 'Asia/Irkutsk': 'RU', 'Asia/Yakutsk': 'RU', 'Asia/Vladivostok': 'RU',
  'Asia/Almaty': 'KZ', 'Asia/Qostanay': 'KZ', 'Asia/Aqtobe': 'KZ', 'Asia/Aqtau': 'KZ', 'Asia/Atyrau': 'KZ', 'Asia/Oral': 'KZ', 'Asia/Qyzylorda': 'KZ',
  'Asia/Bishkek': 'KG', 'Asia/Dushanbe': 'TJ', 'Asia/Ashgabat': 'TM', 'Asia/Kabul': 'AF', 'Asia/Baku': 'AZ', 'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM',
  'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA', 'Europe/Minsk': 'BY',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Tehran': 'IR',
  'Asia/Seoul': 'KR', 'Asia/Tokyo': 'JP', 'Asia/Shanghai': 'CN', 'Asia/Urumqi': 'CN', 'Asia/Hong_Kong': 'HK', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK', 'Asia/Bangkok': 'TH', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID',
  'Europe/London': 'GB', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Vienna': 'AT', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Tallinn': 'EE',
  'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Athens': 'GR',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Phoenix': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
}

export const COUNTRY_NAMES: Record<string, string> = {
  UZ: "O'zbekiston", RU: 'Rossiya', KZ: "Qozog'iston", KG: "Qirg'iziston", TJ: 'Tojikiston', TM: 'Turkmaniston', AF: "Afg'oniston",
  AZ: 'Ozarbayjon', GE: 'Gruziya', AM: 'Armaniston', TR: 'Turkiya', UA: 'Ukraina', BY: 'Belarus', AE: 'BAA', SA: 'Saudiya Arabistoni',
  QA: 'Qatar', KW: 'Quvayt', IR: 'Eron', KR: 'Janubiy Koreya', JP: 'Yaponiya', CN: 'Xitoy', HK: 'Gonkong', IN: 'Hindiston', PK: 'Pokiston',
  TH: 'Tailand', SG: 'Singapur', MY: 'Malayziya', ID: 'Indoneziya', GB: 'Buyuk Britaniya', DE: 'Germaniya', FR: 'Fransiya', PL: 'Polsha',
  CZ: 'Chexiya', IT: 'Italiya', ES: 'Ispaniya', NL: 'Niderlandiya', AT: 'Avstriya', LV: 'Latviya', LT: 'Litva', EE: 'Estoniya',
  FI: 'Finlandiya', SE: 'Shvetsiya', HU: 'Vengriya', RO: 'Ruminiya', BG: 'Bolgariya', GR: 'Gretsiya', US: 'AQSH', CA: 'Kanada', AU: 'Avstraliya',
}

export const flag = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐')

// timeZone → mamlakat; topilmasa til kodidagi mintaqa (uz-UZ → UZ)
export function countryOf(tz: string, lang: string): string | null {
  if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]
  const m = lang.match(/^[a-z]{2,3}-([A-Z]{2})$/)
  return m ? m[1] : null
}
