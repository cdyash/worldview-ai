import { db } from "../lib/firebaseClient"
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

/**
 * Apply passive negative signal for a poll
 * Used for:
 * - Dwell without interaction (-0.5)
 * - Fast scroll (-1)
 */
export async function applyPassivePenalty(
  userId: string,
  pollId: string,
  penalty: number
) {
  const pollRef = doc(db, "polls", pollId)
  const userRef = doc(db, "users", userId)

  await runTransaction(db, async (transaction) => {
    const pollSnap = await transaction.get(pollRef)
    const userSnap = await transaction.get(userRef)

    if (!pollSnap.exists() || !userSnap.exists()) return

    const pollData = pollSnap.data()
    const userData = userSnap.data()

    const interests: Record<string, number> = userData.interests || {}
    const tags: string[] = pollData.tags || []

    const updatedInterests = { ...interests }

    tags.forEach((tag) => {
      updatedInterests[tag] = (updatedInterests[tag] || 0) - penalty
      if (updatedInterests[tag] <= 0) {
        delete updatedInterests[tag]
      }
    })

    transaction.update(userRef, {
      interests: updatedInterests,
      lastInterestUpdate: serverTimestamp(),
    })
  })
}
