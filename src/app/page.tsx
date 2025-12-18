"use client"

import { useAuth } from "../lib/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "../lib/firebaseClient"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading auth state...</p>

  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>WorldView AI</h1>

      {user ? (
        <>
          <p>✅ Logged in as: {user.email}</p>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              background: "black",
              color: "white",
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <p>❌ Not logged in</p>
      )}
    </main>
  )
}
