"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../lib/AuthContext"
import { useRouter } from "next/navigation"
import { fetchPolls } from "../services/pollService"
import { submitVote } from "../services/voteService"
import { getUserInterests } from "../services/userService"
import { scorePollV2 } from "../services/feedScoring"
import { Poll } from "../types/poll"

// Poll with computed score
type ScoredPoll = Poll & { _score: number }

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [polls, setPolls] = useState<ScoredPoll[]>([])
  const [loadingPolls, setLoadingPolls] = useState(true)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})

  // 🔐 Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // 📥 Load polls + interests + rank feed
  useEffect(() => {
    const loadFeed = async () => {
      if (!user) return

      try {
        const [pollsData, userInterests] = await Promise.all([
          fetchPolls(),
          getUserInterests(user.uid),
        ])

        const rankedPolls: ScoredPoll[] = pollsData
          .map((poll) => ({
            ...poll,
            _score: scorePollV2(poll, userInterests),
          }))
          .sort((a, b) => b._score - a._score)

        setPolls(rankedPolls)
      } catch (err) {
        console.error("Error loading adaptive feed:", err)
      } finally {
        setLoadingPolls(false)
      }
    }

    if (!loading) {
      loadFeed()
    }
  }, [user, loading])

  if (loading || !user) return <p>Checking authentication...</p>
  if (loadingPolls) return <p>Loading personalized feed...</p>

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
            borderColor: poll._score > 0 ? "#2196f3" : "#ccc",
          }}
        >
          <h3>{poll.question}</h3>

          <p style={{ fontSize: 14, color: "#666" }}>
            Category: {poll.category}
            {poll.tags && ` | Tags: ${poll.tags.join(", ")}`}
            <span style={{ marginLeft: 10, fontSize: 10, opacity: 0.5 }}>
              (Score: {poll._score.toFixed(2)})
            </span>
          </p>

          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={async () => {
                const previousVote = userVotes[poll.id]
                if (previousVote === opt.id) return

                // 🔥 Optimistic UI update
                setPolls((prev) =>
                  prev.map((p) => {
                    if (p.id !== poll.id) return p
                    return {
                      ...p,
                      options: p.options.map((o) => {
                        if (o.id === previousVote) {
                          return { ...o, count: Math.max(0, o.count - 1) }
                        }
                        if (o.id === opt.id) {
                          return { ...o, count: o.count + 1 }
                        }
                        return o
                      }),
                    }
                  })
                )

                setUserVotes((prev) => ({
                  ...prev,
                  [poll.id]: opt.id,
                }))

                await submitVote(user.uid, poll.id, opt.id)
              }}
              style={{
                display: "block",
                marginTop: 8,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                cursor: "pointer",
                backgroundColor:
                  userVotes[poll.id] === opt.id ? "#e0f7fa" : "white",
              }}
            >
              {opt.text} — {opt.count} votes
            </button>
          ))}
        </div>
      ))}
    </main>
  )
}
