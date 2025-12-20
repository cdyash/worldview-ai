import { db } from "../lib/firebaseClient"
import { doc, getDoc } from "firebase/firestore"

/**
 * Fetch user interests and apply time decay.
 * Decay rule:
 * - Every 7 days → interests decay by 10%
 */
export async function getUserInterests(userId: string) {
  const ref = doc(db, "users", userId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return {}

  const data = snap.data()
  const interests: Record<string, number> = data.interests || {}
  const lastUpdate = data.lastInterestUpdate?.toDate?.()

  if (!lastUpdate) return interests

  const now = new Date()
  const daysPassed =
    (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

  // decay factor: 10% per 7 days
  const decaySteps = Math.floor(daysPassed / 7)
  if (decaySteps <= 0) return interests

  const decayFactor = Math.pow(0.9, decaySteps)

  const decayedInterests: Record<string, number> = {}

  Object.entries(interests).forEach(([tag, value]) => {
    const decayedValue = value * decayFactor
    if (decayedValue > 0.1) {
      decayedInterests[tag] = decayedValue
    }
  })

  return decayedInterests
}