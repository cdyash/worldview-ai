import { db } from "../lib/firebaseClient"
import { collection, getDocs } from "firebase/firestore"
import { Poll } from "../types/poll"

export async function fetchPolls(): Promise<Poll[]> {
  const snapshot = await getDocs(collection(db, "polls"))

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      question: data.question,
      category: data.category,
      tags: data.tags,
      options: data.options,
      popularity: data.popularity,
      creatorReputation: data.creatorReputation,
    }
  })
}
