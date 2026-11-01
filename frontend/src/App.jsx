import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { EvaluationProvider } from './components/EvaluationContext'

import LandingPage from './components/LandingPage'
import StudentInfo from './components/StudentInfo'
import SelectTeacher from './components/SelectTeacher'
import ChooseCategory from './components/ChooseCategory'
import RateAspects from './components/RateAspects'
import ReviewSubmit from './components/ReviewSubmit'

import { AdminAuthLayout, ProtectedRoute } from './components/admin/AdminAuth'
import AdminLogin from './components/admin/AdminLogin'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import PerformanceRanking from './components/admin/PerformanceRanking'
import TeacherProfile from './components/admin/TeacherProfile'
import CategoryBreakdown from './components/admin/CategoryBreakdown'
import TrimesterComparison from './components/admin/TrimesterComparison'
import PerformanceInsights from './components/admin/PerformanceInsights'
import TeacherManagement from './components/admin/TeacherManagement'
import Settings from './components/admin/Settings'

// Ang state ng evaluation (teacher, ratings) ay para sa /evaluation/* lang
function StudentFlow() {
  return (
    <EvaluationProvider>
      <Outlet />
    </EvaluationProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Student side */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/evaluation" element={<StudentFlow />}>
          <Route path="student-info" element={<StudentInfo />} />
          <Route path="select-teacher" element={<SelectTeacher />} />
          <Route path="choose-category" element={<ChooseCategory />} />
          <Route path="rate/:categoryId" element={<RateAspects />} />
          <Route path="review" element={<ReviewSubmit />} />
        </Route>

        {/* Admin side (walang link sa landing page) */}
        <Route path="/admin" element={<AdminAuthLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="ranking" element={<PerformanceRanking />} />
              <Route path="teacher-profile" element={<TeacherProfile />} />
              <Route path="category-breakdown" element={<CategoryBreakdown />} />
              <Route path="trimester-comparison" element={<TrimesterComparison />} />
              <Route path="insights" element={<PerformanceInsights />} />
              <Route path="teachers" element={<TeacherManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}