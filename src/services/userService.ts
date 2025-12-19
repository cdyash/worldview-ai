import { db } from "../lib/firebaseClient"
import { doc, getDoc } from "firebase/firestore"

export async function getUserInterests(userId: string) {
  const ref = doc(db, "users", userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return {}
  return snap.data().interests || {}
}
