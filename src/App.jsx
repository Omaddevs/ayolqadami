import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { Layout } from './components/UI'
import { useTelegramBackButton } from './lib/telegram'
import Auth from './pages/Auth'
import Splash from './pages/Splash'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import { Jobs, JobDetail } from './pages/Jobs'
import { Courses, CourseDetail } from './pages/Courses'
import QadamAI from './pages/QadamAI'
import JobsMap from './pages/JobsMap'
import { Profile, ProfileEdit } from './pages/Profile'
import { Candidates, CandidateDetail } from './pages/Employer'
import PostJob from './pages/PostJob'
import { Applications, Events, More, Notifications } from './pages/Misc'
import { AccountSettings, HiddenItems, NotificationSettings, Settings } from './pages/Settings'
import { ArticleDetail, Articles } from './pages/Articles'
import Support from './pages/Support'
import { Companies, CompanyDetail } from './pages/Companies'

// Kirish ekranlari (Splash + 3 slayd) faqat birinchi ochilishda ko'rsatiladi. localStorage'da saqlanadi:
// sessionStorage Telegram mini app har ochilganda tozalanib, ekranlar qayta-qayta chiqardi.
const OB_KEY = 'aq_onboarded_v2'
const seenIntro = () => {
  try { return localStorage.getItem(OB_KEY) === '1' || sessionStorage.getItem(OB_KEY) === '1' } catch { return false }
}

// Shaxsiy sahifalar: mehmon asosiy sahifaga qaytariladi va ro'yxatdan o'tish oynasi ochiladi,
// muvaffaqiyatli o'tgach so'ralgan sahifaga o'tkaziladi
function Gate({ children, role }) {
  const { user, requireAuth } = useApp()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => { if (!user) requireAuth(() => navigate(pathname)) }, [user, requireAuth, navigate, pathname])
  if (!user) return <Navigate to="/" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, authOpen } = useApp()
  useTelegramBackButton()
  const [intro, setIntro] = useState(() => (user || seenIntro() ? 'done' : 'splash'))
  const finishIntro = () => {
    try { localStorage.setItem(OB_KEY, '1') } catch { /* private mode */ }
    setIntro('done')
  }

  if (intro === 'splash') return <div className="ob-wrap"><Splash onStart={() => setIntro('onboarding')} /></div>
  if (intro === 'onboarding') return <div className="ob-wrap"><Onboarding onDone={finishIntro} /></div>

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="qadam-ai" element={<QadamAI />} />
          <Route path="map" element={<JobsMap />} />
          <Route path="profile" element={<Gate><Profile /></Gate>} />
          <Route path="profile/edit" element={<Gate><ProfileEdit /></Gate>} />
          <Route path="applications" element={<Gate><Applications /></Gate>} />
          <Route path="events" element={<Events />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="more" element={<More />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/account" element={<Gate><AccountSettings /></Gate>} />
          <Route path="settings/notifications" element={<NotificationSettings />} />
          <Route path="settings/hidden" element={<HiddenItems />} />
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:id" element={<ArticleDetail />} />
          <Route path="support" element={<Support />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:name" element={<CompanyDetail />} />
          {/* E'lonlar bo'limi olib tashlandi: ish izlovchi rezyume joylaydi, eski havolalar kompaniyalarga yo'naltiriladi */}
          <Route path="ads/*" element={<Navigate to="/companies" replace />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="post-job" element={<Gate role="employer"><PostJob /></Gate>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {authOpen && !user && <Auth />}
    </>
  )
}
