import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const EvaluationContext = createContext(null)

export function EvaluationProvider({ children }) {
  const [student, setStudent] = useState(null)   // { student_id, section }
  const [teacher, setTeacher] = useState(null)   // { teacher_id, name, subject }
  const [ratings, setRatings] = useState({})     // { [aspect_id]: 1-5 }
  const [categories, setCategories] = useState([])

  useEffect(() => {
    axios
      .get('/api/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {})
  }, [])

  const resetEvaluation = useCallback(() => {
    setTeacher(null)
    setRatings({})
  }, [])

  const setRating = useCallback((aspectId, value) => {
    setRatings((prev) => ({ ...prev, [aspectId]: value }))
  }, [])

  const isCategoryDone = useCallback(
    (category) =>
      category.aspects.length > 0 &&
      category.aspects.every((a) => ratings[a.aspect_id]),
    [ratings]
  )

  const value = {
    student, setStudent,
    teacher, setTeacher,
    ratings, setRating,
    categories,
    resetEvaluation,
    isCategoryDone,
  }

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>
}

export function useEvaluation() {
  return useContext(EvaluationContext)
}