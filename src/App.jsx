import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './context/AppContext'
import { Layout } from './components/UI'
import Auth from './pages/Auth'
import Home from './pages/Home'
import { Jobs, JobDetail } from './pages/Jobs'
import { Courses, CourseDetail } from './pages/Courses'
import QadamAI from './pages/QadamAI'
import { Profile, ProfileEdit } from './pages/Profile'
import { Candidates, CandidateDetail, PostJob } from './pages/Employer'
import { Applications, Events, Notifications } from './pages/Misc'

function Private({ children, role }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/welcome" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user } = useApp()
  return (
    <Routes>
      <Route path="/welcome" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route element={<Private><Layout /></Private>}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="qadam-ai" element={<QadamAI />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/edit" element={<ProfileEdit />} />
        <Route path="applications" element={<Applications />} />
        <Route path="events" element={<Events />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="post-job" element={<Private role="employer"><PostJob /></Private>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
