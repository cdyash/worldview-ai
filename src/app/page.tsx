"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../lib/AuthContext"
import { useRouter } from "next/navigation"
import { fetchPolls } from "../services/pollService"
import { submitVote } from "../services/voteService"
import { skipPoll } from "../services/skipService"
import { getUserInterests } from "../services/userService"
import { scorePollV2 } from "../services/feedScoring"
import { Poll } from "../types/poll"

type ScoredPoll = Poll & { _score: number }

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [polls, setPolls] = useState<ScoredPoll[]>([])
  const [loadingPolls, setLoadingPolls] = useState(true)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadFeed = async () => {
      if (!user) return

      const [pollsData, interests] = await Promise.all([
        fetchPolls(),
        getUserInterests(user.uid),
      ])

      const ranked = pollsData
        .map((p) => ({
          ...p,
          _score: scorePollV2(p, interests),
        }))
        .sort((a, b) => b._score - a._score)

      setPolls(ranked)
      setLoadingPolls(false)
    }

    if (!loading) loadFeed()
  }, [user, loading])

  if (loading || !user) return <p>Checking authentication...</p>
  if (loadingPolls) return <p>Loading feed...</p>

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
            {poll.tags && ` | Tags: ${poll.tags.join(", ")}`}
            <span style={{ marginLeft: 10, fontSize: 10 }}>
              (Score: {poll._score.toFixed(2)})
            </span>
          </p>

          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={async () => {
                await submitVote(user.uid, poll.id, opt.id)
                setUserVotes((v) => ({ ...v, [poll.id]: opt.id }))
              }}
              style={{
                display: "block",
                marginTop: 6,
              }}
            >
              {opt.text} — {opt.count}
            </button>
          ))}

          {/* 🚫 Skip button */}
          <button
            onClick={async () => {
              await skipPoll(user.uid, poll.id)
              setPolls((prev) => prev.filter((p) => p.id !== poll.id))
            }}
            style={{
              marginTop: 10,
              background: "#eee",
              border: "1px solid #999",
            }}
          >
            Skip
          </button>
        </div>
      ))}
    </main>
  )
}
