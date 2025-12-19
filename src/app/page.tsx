"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../lib/AuthContext"
import { useRouter } from "next/navigation"
import { fetchPolls } from "../services/pollService"
import { Poll } from "../types/poll"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loadingPolls, setLoadingPolls] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadPolls = async () => {
      const data = await fetchPolls()
      setPolls(data)
      setLoadingPolls(false)
    }
    loadPolls()
  }, [])

  if (loading || !user) return <p>Checking authentication...</p>
  if (loadingPolls) return <p>Loading polls...</p>

  return (
    <main style={{ padding: 40 }}>
      <h1>WorldView AI</h1>

      {polls.map((poll) => (
        <div
          key={poll.id}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginTop: 20,
            borderRadius: 8,
          }}
        >
          <h3>{poll.question}</h3>
          <p style={{ fontSize: 14, color: "#666" }}>
            Category: {poll.category}
          </p>

          {poll.options.map((opt) => (
            <div key={opt.id}>
              {opt.text} — {opt.count} votes
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}
