import { createContext, useContext, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)
const STORAGE_KEY = 'vlearn_auth'

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored)

  const login = async (email, password) => {
    const result = await api.login(email, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setAuth(result)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
