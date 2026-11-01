
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import axios from 'axios'

const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    axios
      .get('/api/admin/me')
      .then((res) => {
        if (active) setAdmin(res.data)
      })
      .catch((err) => {
        if (active) {
          setAdmin(null)

          if (err.response?.status !== 401) {
            console.error(
              'Failed to check admin session:',
              err.message
            )
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await axios.post('/api/admin/login', {
      username,
      password,
    })

    setAdmin(res.data)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/admin/logout')
    } finally {
      setAdmin(null)
    }
  }, [])

  return (
    <AdminAuthContext.Provider
      value={{ admin, setAdmin, loading, login, logout }}
    >
      <Outlet />
    </AdminAuthContext.Provider>
  )
}

export function AdminAuthLayout() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}

export function ProtectedRoute() {
  const { admin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Checking session...
      </div>
    )
  }

  if (!admin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}
