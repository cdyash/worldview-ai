import { db } from "../lib/firebaseClient"
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

/**
 * Submit or switch a vote for a poll.
 * Includes:
 * - Vote switching
 * - Interest reinforcement
 * - TRUE time decay
 */
export async function submitVote(
  userId: string,
  pollId: string,
  newOptionIndex: number
) {
  const voteDocId = `${userId}_${pollId}`
  const voteRef = doc(db, "user_votes", voteDocId)
  const pollRef = doc(db, "polls", pollId)
  const userRef = doc(db, "users", userId)

  await runTransaction(db, async (transaction) => {
    const pollSnap = await transaction.get(pollRef)
    const userSnap = await transaction.get(userRef)

    if (!pollSnap.exists()) throw new Error("Poll not found")
    if (!userSnap.exists()) throw new Error("User not found")

    const pollData = pollSnap.data()
    const userData = userSnap.data()

    // -----------------------
    // 1️⃣ Handle vote switching
    // -----------------------
    const options = [...pollData.options]
    const voteSnap = await transaction.get(voteRef)

    if (voteSnap.exists()) {
      const oldIndex = voteSnap.data().selectedOptionIndex
      if (oldIndex === newOptionIndex) return
      options[oldIndex].count -= 1
    }

    options[newOptionIndex].count += 1
    transaction.update(pollRef, { options })

    transaction.set(voteRef, {
      userId,
      pollId,
      selectedOptionIndex: newOptionIndex,
      updatedAt: serverTimestamp(),
    })

    // -----------------------
    // 2️⃣ APPLY TIME DECAY (REAL)
    // -----------------------
    const interests: Record<string, number> = userData.interests || {}
    const lastUpdate = userData.lastInterestUpdate?.toDate?.()

    let decayedInterests = { ...interests }

    if (lastUpdate) {
      const now = new Date()
      const daysPassed =
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

      const decaySteps = Math.floor(daysPassed / 7)
      if (decaySteps > 0) {
        const decayFactor = Math.pow(0.9, decaySteps)
        Object.keys(decayedInterests).forEach((tag) => {
          decayedInterests[tag] *= decayFactor
          if (decayedInterests[tag] < 0.1) {
            delete decayedInterests[tag]
          }
        })
      }
    }

    // -----------------------
    // 3️⃣ Reinforce current poll tags
    // -----------------------
    const tags: string[] = pollData.tags || []
    tags.forEach((tag) => {
      decayedInterests[tag] = (decayedInterests[tag] || 0) + 3
    })

    // -----------------------
    // 4️⃣ Persist interests + timestamp
    // -----------------------
    transaction.update(userRef, {
      interests: decayedInterests,
      lastInterestUpdate: serverTimestamp(),
    })
  })
}
