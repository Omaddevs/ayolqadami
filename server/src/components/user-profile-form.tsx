import type { User } from '@prisma/client'
import { ActionForm } from './action-form'
import { saveUserProfile } from '@/app/admin/(panel)/actions'

type Profile = { headline?: string; about?: string; salary?: number; skills?: string[]; skillsDetail?: { name: string }[] }

// Admin: foydalanuvchi profili va rezyumesini tahrirlash (noto'g'ri yoki nomaqbul ma'lumotni tuzatish/tozalash)
export function UserProfileForm({ u }: { u: User }) {
  const pr = (u.profile || {}) as Profile
  const skills = pr.skillsDetail?.map((s) => s.name) || pr.skills || []
  return (
    <ActionForm action={saveUserProfile}>
      <input type="hidden" name="id" value={u.id} />
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Ism-familiya *</label><input id="name" className="input" name="name" defaultValue={u.name} required minLength={2} maxLength={80} /></div>
        <div className="field"><label htmlFor="city">Shahar</label><input id="city" className="input" name="city" defaultValue={u.city || ''} maxLength={60} /></div>
        {u.role === 'EMPLOYER' && <div className="field full"><label htmlFor="company">Kompaniya</label><input id="company" className="input" name="company" defaultValue={u.company || ''} maxLength={120} /></div>}
        {u.role !== 'EMPLOYER' && <input type="hidden" name="company" value={u.company || ''} />}
        <div className="field full"><label htmlFor="headline">Rezyume sarlavhasi (lavozim)</label><input id="headline" className="input" name="headline" defaultValue={pr.headline || ''} maxLength={120} /></div>
        <div className="field full"><label htmlFor="about">O&apos;zi haqida</label><textarea id="about" className="textarea" name="about" defaultValue={pr.about || ''} maxLength={3000} /></div>
        <div className="field"><label htmlFor="skills">Ko&apos;nikmalar</label><input id="skills" className="input" name="skills" defaultValue={skills.join(', ')} /><small>Vergul bilan</small></div>
        <div className="field"><label htmlFor="salary">Kutilgan maosh, so&apos;m</label><input id="salary" className="input" name="salary" type="number" min={0} step={100000} defaultValue={pr.salary || 0} /></div>
        <label className="check full"><input type="checkbox" name="clearResume" /> Rezyumeni butunlay tozalash (sarlavha, tavsif, ko&apos;nikmalar, tajriba, ta&apos;lim)</label>
      </div>
    </ActionForm>
  )
}
