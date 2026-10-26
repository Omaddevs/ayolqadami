import type { Category } from '@prisma/client'
import { ActionForm } from './action-form'
import { CATEGORY_ICONS } from '@/lib/categories'
import { saveCategory } from '@/app/admin/(panel)/categories/actions'

// Soha yoki bo'lim. «Ota soha» tanlansa — bo'lim (masalan, IT va dizayn → Frontend), bo'sh bo'lsa — soha
export function CategoryForm({ c, roots, parentId, hasChildren }: { c?: Category | null; roots: Category[]; parentId?: string; hasChildren?: boolean }) {
  return (
    <ActionForm action={saveCategory} cancelHref="/admin/categories">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Nomi *</label><input id="name" className="input" name="name" defaultValue={c?.name} required minLength={2} maxLength={60} placeholder="Frontend" /></div>
        <div className="field">
          <label htmlFor="parentId">Ota soha</label>
          <select id="parentId" className="select" name="parentId" defaultValue={c?.parentId ?? parentId ?? ''} disabled={hasChildren}>
            <option value="">— Yo&apos;q (bu — soha) —</option>
            {roots.filter((r) => r.id !== c?.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <small>{hasChildren ? "Bo'limlari bor soha boshqa sohaga bo'lim bo'la olmaydi" : "Tanlansa — shu sohaning bo'limi bo'ladi (masalan, IT va dizayn → Frontend)"}</small>
        </div>
        <div className="field"><label htmlFor="short">Qisqa nom</label><input id="short" className="input" name="short" defaultValue={c?.short} maxLength={30} /><small>Tor joylar (filtr tugmalari) uchun; bo&apos;sh — to&apos;liq nom</small></div>
        <div className="field">
          <label htmlFor="slug">Slug</label>
          <input id="slug" className="input" name="slug" defaultValue={c?.slug} maxLength={40} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="nomdan avtomatik" />
          <small>Manzilda ko&apos;rinadi: /jobs?cat=… · o&apos;zgarsa, vakansiyalar ham yangilanadi</small>
        </div>
        <div className="field">
          <label htmlFor="icon">Ikonka</label>
          <select id="icon" className="select" name="icon" defaultValue={c?.icon || 'briefcase'}>
            {CATEGORY_ICONS.map((i) => <option key={i}>{i}</option>)}
          </select>
          <small>Saytdagi 3D ikonka nomi</small>
        </div>
        <div className="field"><label htmlFor="sort">Tartib raqami</label><input id="sort" className="input" name="sort" type="number" min={0} max={10000} defaultValue={c?.sort ?? 0} /><small>Kichigi oldinda</small></div>
        <label className="check" style={{ alignSelf: 'end', paddingBottom: 10 }}><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Saytda ko&apos;rinadi</label>
      </div>
      {/* disabled select qiymati yuborilmaydi — bo'limlari bor soha soha bo'lib qoladi */}
      {hasChildren && <input type="hidden" name="parentId" value="" />}
    </ActionForm>
  )
}
