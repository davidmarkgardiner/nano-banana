'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

interface Message {
  id: string
  text: string
  timestamp?: Timestamp | Date
  userId: string
  userEmail: string
}

const formatTimestamp = (timestamp?: Message['timestamp']): string => {
  if (!timestamp) {
    return 'Just now'
  }

  if (timestamp instanceof Date) {
    return timestamp.toLocaleString()
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleString()
  }

  return 'Just now'
}

export default function FirestoreDemo() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'))
      const querySnapshot = await getDocs(q)
      const messageList: Message[] = []

      querySnapshot.forEach((messageDoc) => {
        const data = messageDoc.data() as Omit<Message, 'id'>

        messageList.push({
          id: messageDoc.id,
          ...data,
        })
      })

      setMessages(messageList)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const addMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) return

    try {
      setLoading(true)
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        timestamp: new Date(),
        userId: user.uid,
        userEmail: user.email
      })

      setNewMessage('')
      await fetchMessages()
    } catch (error) {
      console.error('Error adding message:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId))
      await fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  if (!user) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative">
          <h3 className="text-xl font-semibold text-white">Firestore Demo</h3>
          <p className="mt-3 text-sm text-slate-300">Please login to use the messaging feature.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-100 shadow-xl backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-24 right-8 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative">
        <h3 className="text-xl font-semibold text-white">Firestore Demo - Messages</h3>

        <form onSubmit={addMessage} className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter a message..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {messages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-6 text-center text-sm text-slate-300">
              No messages yet. Add the first one!
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-300">
                      {message.userEmail} • {formatTimestamp(message.timestamp)}
                    </p>
                    <p className="mt-2 text-sm text-slate-100">{message.text}</p>
                  </div>
                  {user.uid === message.userId && (
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="self-start rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-rose-100 transition hover:border-rose-300/50 hover:bg-rose-500/20"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={fetchMessages}
          className="mt-6 w-full rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/20"
        >
          Refresh Messages
        </button>
      </div>
    </div>
  )
}