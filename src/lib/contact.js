// Vakansiyadagi ish beruvchi kontaktlari: ish beruvchi e'londa ko'rsatishga ruxsat bergan usullargina
export const jobPhone = (job) => (job?.contact?.ways?.includes('phone') && job.contact.phone) || ''
export const jobTelegram = (job) => (job?.contact?.ways?.includes('telegram') && job.contact.telegram) || ''

export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`
export const tgHref = (tg) => `https://t.me/${tg.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '')}`
