import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const login = async (email, password) => {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error('Login failed')
    }

    const data = await res.json()
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const logout = async () => {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
    localStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

