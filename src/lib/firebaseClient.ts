import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyB4S9xWBONxVKXZa-Epd4Tkbxktr0qfGdk",
  authDomain: "worldview-ai.firebaseapp.com",
  projectId: "worldview-ai",
}
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
