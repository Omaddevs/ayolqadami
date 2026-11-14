import type { Job } from '@prisma/client'
import { ActionForm } from './action-form'
import { JOB_STATUS, JOB_TYPES, catName } from '@/lib/catalog'
import { EMPLOYMENT_GROUPS } from '@/lib/employment'
import { regionByCity } from '@/lib/regions'
import { JobLocationFields } from './job-location-fields'
import type { CategoryNode } from '@/lib/categories'
import { saveJob } from '@/app/admin/(panel)/actions'
import { toDateInput } from '@/lib/dates'

// Soha tanlovi: bo'limli sohalar guruh bo'lib chiqadi — «it» (butun soha) yoki «it/frontend» (bo'lim) yuboriladi
export function JobForm({ job, companies, categories }: { job?: Job | null; companies: string[]; categories: CategoryNode[] }) {
  const d = job
  const current = d ? (d.subcategory ? `${d.category}/${d.subcategory}` : d.category) : ''
  const known = new Set(categories.flatMap((c) => [c.slug, ...c.children.map((s) => `${c.slug}/${s.slug}`)]))
  const det = (d?.details && typeof d.details === 'object' && !Array.isArray(d.details) ? d.details : {}) as Record<string, unknown>
  const str = (v: unknown) => (v == null ? '' : String(v))
  const chosen = new Set(Array.isArray(det.employment) ? (det.employment as string[]) : [])
  const countIn = (items: string[]) => items.filter((t) => chosen.has(t)).length
  const contact = (det.contact && typeof det.contact === 'object' ? det.contact : {}) as { name?: string; phone?: string; telegram?: string }
  const allTypes = new Set([...JOB_TYPES, ...EMPLOYMENT_GROUPS.flatMap((g) => g.items)])
  const off = (c: { active: boolean }) => (c.active ? '' : " (o'chirilgan)")
  return (
    <ActionForm action={saveJob} cancelHref="/admin/jobs">
      {d && <input type="hidden" name="id" value={d.id} />}
      <div className="form-grid">
        <div className="field full"><label htmlFor="title">Lavozim *</label><input id="title" className="input" name="title" defaultValue={d?.title} required minLength={3} maxLength={120} /></div>
        <div className="field">
          <label htmlFor="companyName">Kompaniya *</label>
          <input id="companyName" className="input" name="companyName" list="companies" defaultValue={d?.companyName} required maxLength={120} />
          <datalist id="companies">{companies.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
        <div className="field">
          <label htmlFor="category">Soha *</label>
          <select id="category" className="select" name="category" defaultValue={current} required>
            <option value="" disabled>Tanlang</option>
            {/* kategoriyalarda yo'q (o'chirib yuborilgan) soha — vakansiyada saqlanib qoladi */}
            {current && !known.has(current) && <option value={current}>{catName(d!.category)}{d!.subcategory ? ` / ${d!.subcategory}` : ''}</option>}
            {categories.map((c) => (c.children.length ? (
              <optgroup key={c.id} label={c.name + off(c)}>
                <option value={c.slug}>{c.name} — barcha bo&apos;limlar</option>
                {c.children.map((s) => <option key={s.id} value={`${c.slug}/${s.slug}`}>{s.name + off(s)}</option>)}
              </optgroup>
            ) : <option key={c.id} value={c.slug}>{c.name + off(c)}</option>))}
          </select>
          <small>Bo&apos;limlar «Kategoriyalar» sahifasida qo&apos;shiladi</small>
        </div>
        <JobLocationFields
          region={d?.region || (d ? regionByCity(d.city)?.id || '' : 'tashkent-city')} district={d?.district || ''} legacyCity={d?.city}
          address={str(det.address)} mapUrl={str(det.mapUrl)}
          lat={det.geo === 'manual' ? str(det.lat) : ''} lng={det.geo === 'manual' ? str(det.lng) : ''}
        />
        <div className="field">
          <label htmlFor="type">Bandlik turi (asosiy) *</label>
          <select id="type" className="select" name="type" defaultValue={d?.type || JOB_TYPES[0]}>
            {d?.type && !allTypes.has(d.type) && <option>{d.type}</option>}
            <optgroup label="Asosiy (saytdagi filtr)">{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</optgroup>
            {EMPLOYMENT_GROUPS.map((g) => <optgroup key={g.name} label={g.name}>{g.items.map((t) => <option key={t}>{t}</option>)}</optgroup>)}
          </select>
        </div>
        <div className="field"><label htmlFor="salaryFrom">Maosh (dan), so&apos;m</label><input id="salaryFrom" className="input" name="salaryFrom" type="number" min={0} step={100000} defaultValue={d?.salaryFrom ?? 0} /></div>
        <div className="field"><label htmlFor="salaryTo">Maosh (gacha), so&apos;m</label><input id="salaryTo" className="input" name="salaryTo" type="number" min={0} step={100000} defaultValue={d?.salaryTo ?? 0} /><small>0 — kelishilgan holda</small></div>
        <div className="field"><label htmlFor="experience">Tajriba (yil)</label><input id="experience" className="input" name="experience" type="number" min={0} max={50} defaultValue={d?.experience ?? 0} /></div>
        <div className="field">
          <label htmlFor="status">Holat</label>
          <select id="status" className="select" name="status" defaultValue={d?.status || 'ACTIVE'}>
            {Object.entries(JOB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="expiresAt">Amal qilish muddati</label><input id="expiresAt" className="input" name="expiresAt" type="date" defaultValue={toDateInput(d?.expiresAt)} /></div>
        <div className="field"><label className="check" style={{ marginTop: 28 }}><input type="checkbox" name="postToChannel" defaultChecked={det.postToChannel === true} /> Telegram kanalga joylash</label><small>Belgilansa — vakansiya navbat bilan kanallarga yuboriladi</small></div>
        <div className="field"><label htmlFor="color">Logotip rangi</label><input id="color" className="input" name="color" type="color" defaultValue={d?.color || '#6366F6'} style={{ height: 40, padding: 4 }} /></div>
        <div className="field full"><label style={{ fontSize: 13 }}>Aloqa (saytdagi «Bog&apos;lanish» tugmasi)</label></div>
        <div className="field"><label htmlFor="contactName">Mas&apos;ul shaxs</label><input id="contactName" className="input" name="contactName" defaultValue={contact.name || ''} maxLength={80} placeholder="Ism-familiya" /></div>
        <div className="field"><label htmlFor="contactPhone">Telefon raqami</label><input id="contactPhone" className="input" name="contactPhone" type="tel" inputMode="tel" defaultValue={contact.phone || ''} maxLength={20} placeholder="+998 90 123 45 67" /></div>
        <div className="field"><label htmlFor="contactTelegram">Telegram username</label><input id="contactTelegram" className="input" name="contactTelegram" defaultValue={contact.telegram || ''} maxLength={64} placeholder="@username" /><small>Ixtiyoriy. @username yoki t.me/username</small></div>
        <div className="field full">
          <label>Bandlik shartlari (bir nechtasini tanlash mumkin)</label>
          {EMPLOYMENT_GROUPS.map((g) => (
            <details key={g.name} open={g.items.some((t) => chosen.has(t))} style={{ border: '1px solid var(--line, #e5e7eb)', borderRadius: 10, padding: '8px 12px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{g.name}{countIn(g.items) ? ` · ${countIn(g.items)}` : ''}</summary>
              <div className="check-grid" style={{ marginTop: 10 }}>
                {g.items.map((t) => <label key={t} className="check"><input type="checkbox" name="employment" value={t} defaultChecked={chosen.has(t)} /> {t}</label>)}
              </div>
            </details>
          ))}
        </div>
        <div className="field full"><label htmlFor="description">Tavsif</label><textarea id="description" className="textarea" name="description" defaultValue={d?.description} maxLength={5000} /></div>
        <div className="field"><label htmlFor="requirements">Talablar</label><textarea id="requirements" className="textarea" name="requirements" defaultValue={d?.requirements.join('\n')} /><small>Har qatorda bitta</small></div>
        <div className="field"><label htmlFor="conditions">Sharoitlar</label><textarea id="conditions" className="textarea" name="conditions" defaultValue={d?.conditions.join('\n')} /><small>Har qatorda bitta</small></div>
        <div className="field"><label htmlFor="skills">Ko&apos;nikmalar</label><input id="skills" className="input" name="skills" defaultValue={d?.skills.join(', ')} /><small>Vergul bilan</small></div>
        <div className="field"><label htmlFor="tags">Teglar / qulayliklar</label><input id="tags" className="input" name="tags" defaultValue={d?.tags.join(', ')} /><small>Masalan: Onalar uchun qulay, Moslashuvchan grafik</small></div>
      </div>
    </ActionForm>
  )
}
