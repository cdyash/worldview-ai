"use client"

import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../../lib/firebaseClient"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async () => {
    setError("")
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      // 🔥 Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        interests: {},
        engagementLevel: 0,
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 400 }}>
      <h1>Signup</h1>

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
        onClick={handleSignup}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "black",
          color: "white",
        }}
      >
        {loading ? "Signing up..." : "Signup"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  )
}
