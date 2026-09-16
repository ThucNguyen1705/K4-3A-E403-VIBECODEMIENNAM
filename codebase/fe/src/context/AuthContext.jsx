import { createContext, useContext, useEffect, useState } from 'react'
import * as api from '../services/api'

const AuthContext = createContext(null)
const USER_KEY = 'vlearn_user'

// Tên ngắn để chào: "Nguyễn Văn Tài" -> "TÀI"
const withShortName = (user) => user && { ...user, shortName: user.name.trim().split(/\s+/).pop().toUpperCase() }

function readStoredUser() {
  try {
    return localStorage.getItem(api.TOKEN_KEY) ? JSON.parse(localStorage.getItem(USER_KEY)) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const saveSession = ({ token, user }) => {
    localStorage.setItem(api.TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem(api.TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // Kiểm tra token còn hợp lệ khi mở app
  useEffect(() => {
    if (!localStorage.getItem(api.TOKEN_KEY)) return
    api
      .getMe()
      .then(({ user }) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        setUser(user)
      })
      .catch((err) => err.status === 401 && logout())
  }, [])

  const login = async (email, password) => saveSession(await api.login(email, password))
  const register = async (name, email, password) => saveSession(await api.register(name, email, password))

  return (
    <AuthContext.Provider value={{ user: withShortName(user), login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
