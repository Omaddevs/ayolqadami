import type { Article, Company, Course, Event } from '@prisma/client'
import { ActionForm } from './action-form'
import { CATEGORIES, CONTENT_STATUS } from '@/lib/catalog'
import { articleBodyToText } from '@/lib/article'
import { toDateInput } from '@/lib/dates'
import { saveArticle, saveCompany, saveCourse, saveEvent } from '@/app/admin/(panel)/actions'

const StatusSelect = ({ value }: { value?: string }) => (
  <div className="field">
    <label htmlFor="status">Holat</label>
    <select id="status" className="select" name="status" defaultValue={value || 'PUBLISHED'}>
      {Object.entries(CONTENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
    </select>
  </div>
)

const Cover = ({ cover }: { cover?: string[] }) => (
  <>
    <div className="field"><label htmlFor="coverFrom">Muqova rangi 1</label><input id="coverFrom" className="input" type="color" name="coverFrom" defaultValue={cover?.[0] || '#8286F6'} style={{ height: 40, padding: 4 }} /></div>
    <div className="field"><label htmlFor="coverTo">Muqova rangi 2</label><input id="coverTo" className="input" type="color" name="coverTo" defaultValue={cover?.[1] || '#4C42EA'} style={{ height: 40, padding: 4 }} /></div>
  </>
)

export function CourseForm({ c }: { c?: Course | null }) {
  return (
    <ActionForm action={saveCourse} cancelHref="/admin/courses">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid">
        <div className="field full"><label htmlFor="title">Nomi *</label><input id="title" className="input" name="title" defaultValue={c?.title} required minLength={3} maxLength={160} /></div>
        <div className="field"><label htmlFor="provider">Tashkilotchi *</label><input id="provider" className="input" name="provider" defaultValue={c?.provider} required /></div>
        <div className="field">
          <label htmlFor="category">Soha</label>
          <select id="category" className="select" name="category" defaultValue={c?.category || 'it'}>{CATEGORIES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="price">Narx, so&apos;m</label><input id="price" className="input" name="price" type="number" min={0} step={10000} defaultValue={c?.price ?? 0} /><small>0 — bepul</small></div>
        <div className="field"><label htmlFor="format">Format</label><select id="format" className="select" name="format" defaultValue={c?.format || 'Onlayn'}>{['Onlayn', 'Oflayn', 'Gibrid'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label htmlFor="duration">Davomiylik</label><input id="duration" className="input" name="duration" defaultValue={c?.duration} placeholder="8 hafta" /></div>
        <div className="field"><label htmlFor="lessons">Darslar soni</label><input id="lessons" className="input" name="lessons" type="number" min={0} defaultValue={c?.lessons ?? 0} /></div>
        <div className="field"><label htmlFor="level">Daraja</label><select id="level" className="select" name="level" defaultValue={c?.level || "Boshlang'ich"}>{["Boshlang'ich", "O'rta", 'Yuqori'].map((x) => <option key={x}>{x}</option>)}</select></div>
        <div className="field"><label htmlFor="icon">3D ikonka nomi</label><input id="icon" className="input" name="icon" defaultValue={c?.icon || 'cap'} /><small>Web ilovadagi Icon3D nomi: laptop, palette, coins, books, spool…</small></div>
        <div className="field"><label htmlFor="rating">Reyting (0–5)</label><input id="rating" className="input" name="rating" type="number" min={0} max={5} step={0.1} defaultValue={c?.rating ?? 0} /></div>
        <div className="field"><label htmlFor="students">O&apos;quvchilar (ko&apos;rsatiladigan)</label><input id="students" className="input" name="students" type="number" min={0} defaultValue={c?.students ?? 0} /></div>
        <div className="field"><label htmlFor="sort">Tartib raqami</label><input id="sort" className="input" name="sort" type="number" min={0} defaultValue={c?.sort ?? 0} /></div>
        <StatusSelect value={c?.status} />
        <label className="check full"><input type="checkbox" name="certificate" defaultChecked={c?.certificate ?? true} /> Sertifikat beriladi</label>
        <div className="field full"><label htmlFor="description">Tavsif</label><textarea id="description" className="textarea" name="description" defaultValue={c?.description} /></div>
        <div className="field full"><label htmlFor="modules">Modullar</label><textarea id="modules" className="textarea" name="modules" defaultValue={c?.modules.join('\n')} /><small>Har qatorda bitta modul</small></div>
      </div>
    </ActionForm>
  )
}

export function ArticleForm({ a }: { a?: Article | null }) {
  return (
    <ActionForm action={saveArticle} cancelHref="/admin/articles">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="form-grid">
        <div className="field full"><label htmlFor="title">Sarlavha *</label><input id="title" className="input" name="title" defaultValue={a?.title} required minLength={5} maxLength={200} /></div>
        <div className="field"><label htmlFor="tag">Teg *</label><input id="tag" className="input" name="tag" defaultValue={a?.tag} required placeholder="Rezyume" /></div>
        <div className="field"><label htmlFor="icon">3D ikonka nomi</label><input id="icon" className="input" name="icon" defaultValue={a?.icon || 'resume'} /></div>
        <div className="field"><label htmlFor="readMinutes">O&apos;qish vaqti (daqiqa)</label><input id="readMinutes" className="input" name="readMinutes" type="number" min={1} max={120} defaultValue={a?.readMinutes ?? 5} /></div>
        <div className="field"><label htmlFor="dateLabel">Sana yorlig&apos;i</label><input id="dateLabel" className="input" name="dateLabel" defaultValue={a?.dateLabel} placeholder="18 oktyabr" /></div>
        <Cover cover={a?.cover} />
        <div className="field"><label htmlFor="img">Muqova rasmi (ixtiyoriy)</label><input id="img" className="input" name="img" defaultValue={a?.img || ''} placeholder="/articles/a1.jpg yoki https://…" /></div>
        <StatusSelect value={a?.status} />
        <div className="field full"><label htmlFor="excerpt">Qisqacha</label><textarea id="excerpt" className="textarea" name="excerpt" style={{ minHeight: 70 }} defaultValue={a?.excerpt} maxLength={600} /></div>
        <div className="field full">
          <label htmlFor="body">Matn *</label>
          <textarea id="body" className="textarea" name="body" style={{ minHeight: 320, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} defaultValue={articleBodyToText(a?.body)} required />
          <small>«## Sarlavha» — bo&apos;lim sarlavhasi, «- matn» — ro&apos;yxat elementi, bo&apos;sh qator — yangi paragraf</small>
        </div>
      </div>
    </ActionForm>
  )
}

export function EventForm({ e }: { e?: Event | null }) {
  return (
    <ActionForm action={saveEvent} cancelHref="/admin/events">
      {e && <input type="hidden" name="id" value={e.id} />}
      <div className="form-grid">
        <div className="field full"><label htmlFor="title">Nomi *</label><input id="title" className="input" name="title" defaultValue={e?.title} required minLength={3} /></div>
        <div className="field"><label htmlFor="dateLabel">Sana yorlig&apos;i *</label><input id="dateLabel" className="input" name="dateLabel" defaultValue={e?.dateLabel} required placeholder="14 noyabr" /></div>
        <div className="field"><label htmlFor="startsAt">Aniq sana (saralash uchun)</label><input id="startsAt" className="input" name="startsAt" type="date" defaultValue={toDateInput(e?.startsAt)} /></div>
        <div className="field"><label htmlFor="place">Joy</label><input id="place" className="input" name="place" defaultValue={e?.place} placeholder="Toshkent / Onlayn" /></div>
        <div className="field"><label htmlFor="tag">Teg</label><input id="tag" className="input" name="tag" defaultValue={e?.tag} placeholder="Forum" /></div>
        <Cover cover={e?.cover} />
        <div className="field"><label htmlFor="img">Rasm (ixtiyoriy)</label><input id="img" className="input" name="img" defaultValue={e?.img || ''} placeholder="/events/forum.jpg" /></div>
        <StatusSelect value={e?.status} />
        <div className="field full"><label htmlFor="description">Tavsif</label><textarea id="description" className="textarea" name="description" defaultValue={e?.description} /></div>
      </div>
    </ActionForm>
  )
}

export function CompanyForm({ c }: { c?: Company | null }) {
  return (
    <ActionForm action={saveCompany} cancelHref="/admin/companies">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid">
        <div className="field full"><label htmlFor="name">Nomi *</label><input id="name" className="input" name="name" defaultValue={c?.name} required minLength={2} /><small>Nom o&apos;zgarsa, kompaniyaning barcha vakansiyalarida ham yangilanadi</small></div>
        <div className="field"><label htmlFor="size">Xodimlar soni</label><input id="size" className="input" name="size" defaultValue={c?.size || ''} placeholder="50–100" /></div>
        <div className="field"><label htmlFor="since">Tashkil topgan yil</label><input id="since" className="input" name="since" inputMode="numeric" defaultValue={c?.since ?? ''} placeholder="2016" /></div>
        <div className="field"><label htmlFor="color">Logotip rangi</label><input id="color" className="input" type="color" name="color" defaultValue={c?.color || '#6366F6'} style={{ height: 40, padding: 4 }} /></div>
        <label className="check" style={{ alignSelf: 'end', paddingBottom: 10 }}><input type="checkbox" name="verified" defaultChecked={c?.verified ?? true} /> Tasdiqlangan kompaniya</label>
        <div className="field full"><label htmlFor="about">Kompaniya haqida</label><textarea id="about" className="textarea" name="about" defaultValue={c?.about} /></div>
      </div>
    </ActionForm>
  )
}
