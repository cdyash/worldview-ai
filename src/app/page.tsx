"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "../lib/AuthContext"
import { useRouter } from "next/navigation"
import { fetchPolls } from "../services/pollService"
import { submitVote } from "../services/voteService"
import { skipPoll } from "../services/skipService"
import { applyPassivePenalty } from "../services/implicitFeedbackService"
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

  // Track evaluated polls (VERY IMPORTANT)
  const evaluatedPolls = useRef<Set<string>>(new Set())

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

  // 🔥 Intersection Observer for implicit feedback
  useEffect(() => {
    if (!user) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pollId = entry.target.getAttribute("data-poll-id")
          if (!pollId) return
          if (evaluatedPolls.current.has(pollId)) return

          // Fast scroll → weak negative
          if (!entry.isIntersecting && entry.intersectionRatio === 0) {
            evaluatedPolls.current.add(pollId)
            applyPassivePenalty(user.uid, pollId, 1)
            return
          }

          // Dwell detection
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (
                entry.isIntersecting &&
                !evaluatedPolls.current.has(pollId) &&
                !userVotes[pollId]
              ) {
                evaluatedPolls.current.add(pollId)
                applyPassivePenalty(user.uid, pollId, 0.5)
              }
            }, 3000)
          }
        })
      },
      { threshold: 0.6 }
    )

    document.querySelectorAll("[data-poll-id]").forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [user, userVotes])

  if (loading || !user) return <p>Checking authentication...</p>
  if (loadingPolls) return <p>Loading feed...</p>

  return (
    <main style={{ padding: 40 }}>
      <h1>WorldView AI</h1>

      {polls.map((poll) => (
        <div
          key={poll.id}
          data-poll-id={poll.id}
          style={{
            border: "1px solid #ccc",
            padding: 20,
            marginTop: 20,
            borderRadius: 8,
          }}
        >
          <h3>{poll.question}</h3>

          <p style={{ fontSize: 13, color: "#666" }}>
            {poll.category}
            {poll.tags && ` | ${poll.tags.join(", ")}`}
            <span style={{ marginLeft: 8, fontSize: 10 }}>
              (Score: {poll._score.toFixed(2)})
            </span>
          </p>

          {poll.options.map((opt) => (
            <button
              key={opt.id}
              onClick={async () => {
                await submitVote(user.uid, poll.id, opt.id)
                setUserVotes((v) => ({ ...v, [poll.id]: opt.id }))
                evaluatedPolls.current.add(poll.id)
              }}
              style={{ display: "block", marginTop: 6 }}
            >
              {opt.text} — {opt.count}
            </button>
          ))}

          {/* Explicit Skip (strong negative) */}
          <button
            onClick={async () => {
              await skipPoll(user.uid, poll.id)
              evaluatedPolls.current.add(poll.id)
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
