import { db } from "../lib/firebaseClient"
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

export async function submitVote(
  userId: string,
  pollId: string,
  newOptionIndex: number
) {
  const voteDocId = `${userId}_${pollId}`
  const voteRef = doc(db, "user_votes", voteDocId)
  const pollRef = doc(db, "polls", pollId)

  await runTransaction(db, async (transaction) => {
    const pollSnap = await transaction.get(pollRef)
    if (!pollSnap.exists()) {
      throw new Error("Poll does not exist")
    }

    const pollData = pollSnap.data()
    const options = pollData.options

    const voteSnap = await transaction.get(voteRef)

    // 🟢 If user already voted → undo old vote
    if (voteSnap.exists()) {
      const oldIndex = voteSnap.data().selectedOptionIndex
      if (oldIndex === newOptionIndex) return

      options[oldIndex].count -= 1
    }

    // 🟢 Apply new vote
    options[newOptionIndex].count += 1

    // 🟢 Update poll counts
    transaction.update(pollRef, { options })

    // 🟢 Save vote record
    transaction.set(voteRef, {
      userId,
      pollId,
      selectedOptionIndex: newOptionIndex,
      updatedAt: serverTimestamp(),
    })
  })
}
