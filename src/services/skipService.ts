import { db } from "../lib/firebaseClient"
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

/**
 * Apply negative interest signal when user skips a poll
 * - Applies time decay first
 * - Penalizes poll tags (-1 per tag)
 * - Persists updated interests
 */
export async function skipPoll(userId: string, pollId: string) {
  const pollRef = doc(db, "polls", pollId)
  const userRef = doc(db, "users", userId)

  await runTransaction(db, async (transaction) => {
    const pollSnap = await transaction.get(pollRef)
    const userSnap = await transaction.get(userRef)

    if (!pollSnap.exists()) throw new Error("Poll not found")
    if (!userSnap.exists()) throw new Error("User not found")

    const pollData = pollSnap.data()
    const userData = userSnap.data()

    const interests: Record<string, number> = userData.interests || {}
    const lastUpdate = userData.lastInterestUpdate?.toDate?.()

    let updatedInterests = { ...interests }

    // -----------------------
    // 1️⃣ Apply time decay (same logic as voting)
    // -----------------------
    if (lastUpdate) {
      const now = new Date()
      const daysPassed =
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

      const decaySteps = Math.floor(daysPassed / 7)
      if (decaySteps > 0) {
        const decayFactor = Math.pow(0.9, decaySteps)
        Object.keys(updatedInterests).forEach((tag) => {
          updatedInterests[tag] *= decayFactor
          if (updatedInterests[tag] < 0.1) {
            delete updatedInterests[tag]
          }
        })
      }
    }

    // -----------------------
    // 2️⃣ Apply negative signal
    // -----------------------
    const tags: string[] = pollData.tags || []
    tags.forEach((tag) => {
      updatedInterests[tag] = (updatedInterests[tag] || 0) - 1
      if (updatedInterests[tag] <= 0) {
        delete updatedInterests[tag]
      }
    })

    // -----------------------
    // 3️⃣ Persist
    // -----------------------
    transaction.update(userRef, {
      interests: updatedInterests,
      lastInterestUpdate: serverTimestamp(),
    })
  })
}
