import { db } from "../lib/firebaseClient"
import { doc, getDoc } from "firebase/firestore"

export async function getUserVote(userId: string, pollId: string) {
  const voteDocId = `${userId}_${pollId}`
  const ref = doc(db, "user_votes", voteDocId)
  const snap = await getDoc(ref)

  if (!snap.exists()) return null
  return snap.data().selectedOptionIndex as number
}
