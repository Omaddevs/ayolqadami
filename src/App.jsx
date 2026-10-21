import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { Layout } from './components/UI'
import { useTelegramBackButton } from './lib/telegram'
import Auth from './pages/Auth'
import Home from './pages/Home'
import { applySeo, routeSeo } from './lib/seo'
import { trackPage } from './lib/analytics'
import NotFound, { Unauthorized } from './pages/NotFound'

// Bosh sahifadan boshqa bo'limlar alohida yuklanadi — birinchi ochilish tezlashadi (xarita, rezyume ustasi va h.k.)
const page = (load, name = 'default') => lazy(() => load().then((m) => ({ default: m[name] })))
const Jobs = page(() => import('./pages/Jobs'), 'Jobs')
const JobDetail = page(() => import('./pages/Jobs'), 'JobDetail')
const Courses = page(() => import('./pages/Courses'), 'Courses')
const CourseDetail = page(() => import('./pages/Courses'), 'CourseDetail')
const QadamAI = page(() => import('./pages/QadamAI'))
const JobsMap = page(() => import('./pages/JobsMap'))
const Profile = page(() => import('./pages/Profile'), 'Profile')
const ProfileEdit = page(() => import('./pages/Profile'), 'ProfileEdit')
const Candidates = page(() => import('./pages/Employer'), 'Candidates')
const CandidateDetail = page(() => import('./pages/Employer'), 'CandidateDetail')
const PostJob = page(() => import('./pages/PostJob'))
const Applications = page(() => import('./pages/Misc'), 'Applications')
const Events = page(() => import('./pages/Misc'), 'Events')
const More = page(() => import('./pages/Misc'), 'More')
const Notifications = page(() => import('./pages/Misc'), 'Notifications')
const Settings = page(() => import('./pages/Settings'), 'Settings')
const AccountSettings = page(() => import('./pages/Settings'), 'AccountSettings')
const HiddenItems = page(() => import('./pages/Settings'), 'HiddenItems')
const NotificationSettings = page(() => import('./pages/Settings'), 'NotificationSettings')
const Articles = page(() => import('./pages/Articles'), 'Articles')
const ArticleDetail = page(() => import('./pages/Articles'), 'ArticleDetail')
const Support = page(() => import('./pages/Support'))
const Privacy = page(() => import('./pages/Legal'), 'Privacy')
const Terms = page(() => import('./pages/Legal'), 'Terms')
const Companies = page(() => import('./pages/Companies'), 'Companies')
const CompanyDetail = page(() => import('./pages/Companies'), 'CompanyDetail')
const Categories = page(() => import('./pages/Categories'))

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

// Bo'lim sahifalari uchun SEO (sarlavha, tavsif, canonical) va Google Analytics page_view.
// Tafsilot sahifalari (vakansiya, kurs, maqola, kompaniya) o'zlari useSeo chaqiradi.
function useRouteSeo() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    const r = routeSeo(pathname)
    if (r) applySeo({ ...r, path: pathname })
    trackPage(pathname + search)
  }, [pathname, search])
}

export default function App() {
  const { user, authOpen } = useApp()
  useTelegramBackButton()
  useRouteSeo()

  return (
    <>
      <Suspense fallback={<div className="page" aria-busy="true" />}>
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
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="categories" element={<Categories />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:name" element={<CompanyDetail />} />
          {/* E'lonlar bo'limi olib tashlandi: ish izlovchi rezyume joylaydi, eski havolalar kompaniyalarga yo'naltiriladi */}
          <Route path="ads/*" element={<Navigate to="/companies" replace />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetail />} />
          <Route path="post-job" element={<Gate role="employer"><PostJob /></Gate>} />
        </Route>
        <Route path="401" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      {authOpen && !user && <Auth />}
    </>
  )
}
