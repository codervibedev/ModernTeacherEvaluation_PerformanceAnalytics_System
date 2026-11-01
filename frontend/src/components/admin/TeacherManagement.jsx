import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Users, Search, Plus, Pencil, Trash2, Power, X, AlertTriangle } from 'lucide-react'

const PAGE_SIZE = 10
const EMPTY_FORM = { first_name: '', middle_name: '', last_name: '' }

const fullName = (t) =>
  [t.first_name, t.middle_name, t.last_name].filter(Boolean).join(' ')

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0c2a5e]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ id, label, required, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#0c2a5e] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  )
}

export default function TeacherManagement() {
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // { type: 'add' | 'edit' | 'delete', teacher }
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')

  // Kapag nag-expire ang session, ibalik sa login
  const onAuthError = useCallback(
    (err) => {
      if (err.response?.status === 401) {
        navigate('/admin/login', { replace: true })
        return true
      }
      return false
    },
    [navigate]
  )

  const load = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/teachers')
      setTeachers(res.data)
      setLoadError('')
    } catch (err) {
      if (!onAuthError(err)) setLoadError('Unable to load teachers.')
    } finally {
      setLoading(false)
    }
  }, [onAuthError])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(id)
  }, [notice])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      if (status === 'active' && !t.is_active) return false
      if (status === 'inactive' && t.is_active) return false
      return !q || fullName(t).toLowerCase().includes(q)
    })
  }, [teachers, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const visible = filtered.slice(start, start + PAGE_SIZE)

  const closeModal = useCallback(() => setModal(null), [])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setModalError('')
    setModal({ type: 'add' })
  }

  const openEdit = (t) => {
    setForm({
      first_name: t.first_name,
      middle_name: t.middle_name || '',
      last_name: t.last_name,
    })
    setModalError('')
    setModal({ type: 'edit', teacher: t })
  }

  const openDelete = (t) => {
    setModalError('')
    setModal({ type: 'delete', teacher: t })
  }

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setModalError('')

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setModalError('First name and last name are required.')
      return
    }

    setSaving(true)
    try {
      if (modal.type === 'add') {
        await axios.post('/api/admin/teachers', form)
        setNotice('Teacher added.')
      } else {
        await axios.put(`/api/admin/teachers/${modal.teacher.teacher_id}`, form)
        setNotice('Teacher updated.')
      }
      setModal(null)
      await load()
    } catch (err) {
      if (!onAuthError(err)) {
        setModalError(err.response?.data?.error || 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setModalError('')
    setSaving(true)
    try {
      await axios.delete(`/api/admin/teachers/${modal.teacher.teacher_id}`)
      setModal(null)
      setNotice('Teacher deleted.')
      await load()
    } catch (err) {
      if (!onAuthError(err)) {
        setModalError(err.response?.data?.error || 'Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (t) => {
    try {
      await axios.patch(`/api/admin/teachers/${t.teacher_id}/status`, {
        is_active: !t.is_active,
      })
      setNotice(t.is_active ? 'Teacher deactivated.' : 'Teacher activated.')
      await load()
    } catch (err) {
      if (!onAuthError(err)) setNotice('Unable to update the status.')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white border border-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#0c2a5e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0c2a5e] leading-tight">Teacher Management</h1>
            <p className="text-sm text-gray-600">
              Manage faculty members, update their information, and control their access to the system.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#0c2a5e] hover:bg-[#0a2249] text-white text-sm font-medium rounded-lg px-4 py-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {notice && (
        <p role="status" className="mb-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
          {notice}
        </p>
      )}

      <div className="bg-white border border-blue-100 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by name..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by status"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="all">All Teachers</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">First Name</th>
                <th className="py-2 pr-3 font-medium">Middle Name</th>
                <th className="py-2 pr-3 font-medium">Last Name</th>
                <th className="py-2 pr-3 font-medium">Evaluations</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">Loading teachers...</td>
                </tr>
              )}
              {loadError && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-red-600" role="alert">{loadError}</td>
                </tr>
              )}
              {!loading && !loadError && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">No teachers found.</td>
                </tr>
              )}
              {visible.map((t, i) => (
                <tr
                  key={t.teacher_id}
                  className={`border-b border-gray-100 ${t.is_active ? '' : 'text-gray-400'}`}
                >
                  <td className="py-3 pr-3">{start + i + 1}</td>
                  <td className="py-3 pr-3">{t.first_name}</td>
                  <td className="py-3 pr-3">{t.middle_name || '—'}</td>
                  <td className="py-3 pr-3">{t.last_name}</td>
                  <td className="py-3 pr-3">{t.evaluation_count}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        t.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        aria-label={`Edit ${fullName(t)}`}
                        className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(t)}
                        aria-label={`${t.is_active ? 'Deactivate' : 'Activate'} ${fullName(t)}`}
                        title={t.is_active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(t)}
                        disabled={t.evaluation_count > 0}
                        aria-label={`Delete ${fullName(t)}`}
                        title={
                          t.evaluation_count > 0
                            ? 'Has evaluations. Deactivate instead.'
                            : 'Delete'
                        }
                        className="p-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>
            Showing {filtered.length === 0 ? 0 : start + 1}-{start + visible.length} of{' '}
            {filtered.length} teachers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded-md border border-gray-300 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded-md border border-gray-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal && modal.type !== 'delete' && (
        <Modal
          title={modal.type === 'add' ? 'Add Teacher' : 'Edit Teacher'}
          onClose={closeModal}
        >
          <form onSubmit={handleSave} className="space-y-3">
            <Field id="first_name" label="First Name" required value={form.first_name} onChange={setField('first_name')} placeholder="Enter first name" />
            <Field id="middle_name" label="Middle Name" value={form.middle_name} onChange={setField('middle_name')} placeholder="Enter middle name (optional)" />
            <Field id="last_name" label="Last Name" required value={form.last_name} onChange={setField('last_name')} placeholder="Enter last name" />

            {modalError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {modalError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0c2a5e] hover:bg-[#0a2249] text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
              >
                {saving ? 'Saving...' : modal.type === 'add' ? 'Save' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete modal */}
      {modal && modal.type === 'delete' && (
        <Modal title="Delete Teacher" onClose={closeModal}>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete{' '}
              <strong className="text-[#0c2a5e]">{fullName(modal.teacher)}</strong>?
            </p>
            <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
          </div>

          {modalError && (
            <p role="alert" className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {modalError}
            </p>
          )}

          <div className="flex justify-center gap-2 mt-5">
            <button
              type="button"
              onClick={closeModal}
              className="border border-gray-300 text-gray-700 text-sm rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 disabled:opacity-60"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}