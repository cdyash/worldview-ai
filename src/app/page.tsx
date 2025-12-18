"use client"

import { db } from "../lib/firebaseClient"
import { collection, addDoc } from "firebase/firestore"

export default function Home() {
  const testWrite = async () => {
    try {
      await addDoc(collection(db, "test"), {
        message: "Firestore connected successfully",
        createdAt: new Date(),
      })
      alert("Write successful")
    } catch (err) {
      console.error(err)
      alert("Write failed, check console")
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>WorldView AI</h1>
      <button
        onClick={testWrite}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "black",
          color: "white",
          borderRadius: 6,
        }}
      >
        Test Firestore Write
      </button>
    </main>
  )
}
