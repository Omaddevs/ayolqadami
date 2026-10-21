import type { Job } from '@prisma/client'
import { ActionForm } from './action-form'
import { CATEGORIES, CITIES, JOB_STATUS, JOB_TYPES } from '@/lib/catalog'
import { saveJob } from '@/app/admin/(panel)/actions'
import { toDateInput } from '@/lib/dates'

export function JobForm({ job, companies }: { job?: Job | null; companies: string[] }) {
  const d = job
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
          <select id="category" className="select" name="category" defaultValue={d?.category || ''} required>
            <option value="" disabled>Tanlang</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="city">Shahar *</label>
          <select id="city" className="select" name="city" defaultValue={d?.city || 'Toshkent'}>
            {[...new Set([...(d?.city ? [d.city] : []), ...CITIES])].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="type">Bandlik turi</label>
          <select id="type" className="select" name="type" defaultValue={d?.type || JOB_TYPES[0]}>
            {[...new Set([...(d?.type ? [d.type] : []), ...JOB_TYPES])].map((t) => <option key={t}>{t}</option>)}
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
        <div className="field"><label htmlFor="color">Logotip rangi</label><input id="color" className="input" name="color" type="color" defaultValue={d?.color || '#6366F6'} style={{ height: 40, padding: 4 }} /></div>
        <div className="field full"><label htmlFor="description">Tavsif</label><textarea id="description" className="textarea" name="description" defaultValue={d?.description} maxLength={5000} /></div>
        <div className="field"><label htmlFor="requirements">Talablar</label><textarea id="requirements" className="textarea" name="requirements" defaultValue={d?.requirements.join('\n')} /><small>Har qatorda bitta</small></div>
        <div className="field"><label htmlFor="conditions">Sharoitlar</label><textarea id="conditions" className="textarea" name="conditions" defaultValue={d?.conditions.join('\n')} /><small>Har qatorda bitta</small></div>
        <div className="field"><label htmlFor="skills">Ko&apos;nikmalar</label><input id="skills" className="input" name="skills" defaultValue={d?.skills.join(', ')} /><small>Vergul bilan</small></div>
        <div className="field"><label htmlFor="tags">Teglar / qulayliklar</label><input id="tags" className="input" name="tags" defaultValue={d?.tags.join(', ')} /><small>Masalan: Onalar uchun qulay, Moslashuvchan grafik</small></div>
      </div>
    </ActionForm>
  )
}
