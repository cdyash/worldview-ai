import { db } from "../lib/firebaseClient"
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

/**
 * Submit or switch a vote for a poll.
 * - Uses Firestore transaction (safe)
 * - Updates poll option counts
 * - Stores user vote in `user_votes`
 * - Updates user interests based on poll tags (+3 per tag)
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
    // 1️⃣ Read poll
    const pollSnap = await transaction.get(pollRef)
    if (!pollSnap.exists()) {
      throw new Error("Poll does not exist")
    }

    const pollData = pollSnap.data()
    const options = [...pollData.options] // clone for safety
    const tags: string[] = pollData.tags || []

    // 2️⃣ Read existing vote (if any)
    const voteSnap = await transaction.get(voteRef)

    let oldOptionIndex: number | null = null

    if (voteSnap.exists()) {
      oldOptionIndex = voteSnap.data().selectedOptionIndex

      // If user clicks same option again → do nothing
      if (oldOptionIndex === newOptionIndex) {
        return
      }

      // Undo old vote
      if (oldOptionIndex !== null) {
    options[oldOptionIndex].count -= 1
  }
}

    // 3️⃣ Apply new vote
    options[newOptionIndex].count += 1

    // 4️⃣ Update poll counts
    transaction.update(pollRef, { options })

    // 5️⃣ Save / update user vote
    transaction.set(voteRef, {
      userId,
      pollId,
      selectedOptionIndex: newOptionIndex,
      updatedAt: serverTimestamp(),
    })

    // 6️⃣ Update user interests (+3 per tag)
    const interestUpdates: Record<string, number> = {}

    tags.forEach((tag) => {
      interestUpdates[`interests.${tag}`] = 3
    })

    if (Object.keys(interestUpdates).length > 0) {
      transaction.update(userRef, interestUpdates)
    }
  })
}
