"use client"

import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../lib/firebaseClient"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const handleLogin = async () => {
  setError("")
  setLoading(true)

  try {
    await signInWithEmailAndPassword(auth, email, password)
    router.push("/") // ✅ REDIRECT AFTER LOGIN
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}


  return (
    <main style={{ padding: 40, maxWidth: 400 }}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginTop: 10, width: "100%" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginTop: 10, width: "100%" }}
      />

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "black",
          color: "white",
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  )
}
