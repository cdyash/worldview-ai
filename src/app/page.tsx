"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../lib/AuthContext"
import { useRouter } from "next/navigation"
import { fetchPolls } from "../services/pollService"
import { Poll } from "../types/poll"
import { submitVote } from "../services/voteService"
import { getUserInterests } from "../services/userService"

// ✅ FIX 1: Define a new type that includes the score
type ScoredPoll = Poll & { _score: number }

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // ✅ FIX 2: Update state to use ScoredPoll instead of just Poll
  const [polls, setPolls] = useState<ScoredPoll[]>([])
  const [loadingPolls, setLoadingPolls] = useState(true)
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const [pollsData, userInterests] = await Promise.all([
          fetchPolls(),
          getUserInterests(user.uid),
        ])

        // ✅ FIX 3: Type assertion is now valid because we add the _score property
        const rankedPolls: ScoredPoll[] = pollsData
          .map((poll) => ({
            ...poll,
            _score: scorePoll(poll, userInterests as Record<string, number>),
          }))
          .sort((a, b) => b._score - a._score)

        setPolls(rankedPolls)
      } catch (error) {
        console.error("Error loading feed:", error)
      } finally {
        setLoadingPolls(false)
      }
    }

    if (!loading) {
      loadData()
    }
  }, [user, loading])

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
            // Now poll._score is valid because 'polls' is type ScoredPoll[]
            borderColor: poll._score > 0 ? "#2196f3" : "#ccc",
          }}
        >
          <h3>{poll.question}</h3>
          <p style={{ fontSize: 14, color: "#666" }}>
            Category: {poll.category}
            {poll.tags && ` | Tags: ${poll.tags.join(", ")}`}
            <span style={{ marginLeft: 10, fontSize: 10, opacity: 0.5 }}>
              (Score: {poll._score})
            </span>
          </p>

          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={async () => {
                const previousVote = userVotes[poll.id]
                if (previousVote === opt.id) return

                setPolls((prevPolls) =>
                  prevPolls.map((p) => {
                    if (p.id !== poll.id) return p
                    
                    // Logic to update counts optimistically
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

                setUserVotes((prev) => ({ ...prev, [poll.id]: opt.id }))
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

// ------------------------------------------------------------------
// Helper: Value-Based Scoring
// ------------------------------------------------------------------
function scorePoll(poll: Poll, userInterests: Record<string, number>) {
  if (!userInterests) return 0

  let score = 0

  // 1. Category Score
  if (userInterests[poll.category]) {
    score += (userInterests[poll.category] || 0) * 0.5

  }

  // 2. Tag Scores (Deduplicated)
  if (poll.tags && Array.isArray(poll.tags)) {
    const uniqueTags = new Set(poll.tags)
    
    uniqueTags.forEach((tag) => {
      const interestValue = userInterests[tag] || 0
      score += interestValue
    })
  }

  return score
}