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
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const { user } = useAuth()

  const fetchMessages = async () => {
    try {
      setRefreshing(true)
      setError('')  // Clear any existing errors
      console.log('Fetching messages...')
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

      console.log('Fetched messages:', messageList.length)
      setMessages(messageList)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to fetch messages. Please check your connection and try again.')
      if ((error as any).code === 'permission-denied') {
        alert('Permission denied. Please ensure you are logged in and Firestore rules are configured correctly.')
      }
    } finally {
      setRefreshing(false)
    }
  }

  const addMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !user) {
      console.log('Missing message or user:', { message: newMessage.trim(), user: user?.uid })
      return
    }

    try {
      setLoading(true)
      setError('')
      setSaveSuccess(false)
      console.log('Adding message with user:', user.uid)

      const docData = {
        text: newMessage,
        timestamp: new Date(),
        userId: user.uid,
        userEmail: user.email || 'unknown@example.com'
      }

      console.log('Document data:', docData)
      await addDoc(collection(db, 'messages'), docData)

      setNewMessage('')
      setSaveSuccess(true)
      await fetchMessages()

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error adding message:', error)
      setError('Failed to save message. Please try again.')
      alert('Failed to add message: ' + (error as any).message)
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

  const clearMessages = async () => {
    try {
      setClearing(true)
      const snapshot = await getDocs(collection(db, 'messages'))
      const deletePromises = snapshot.docs.map((messageDoc) => deleteDoc(messageDoc.ref))

      await Promise.all(deletePromises)
      await fetchMessages()
    } catch (error) {
      console.error('Error clearing messages:', error)
    } finally {
      setClearing(false)
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
        <h3 className="text-xl font-semibold text-white">💾 Text Data Storage</h3>
        <p className="mt-2 text-sm text-slate-300">
          Test the database connection by saving and retrieving text data. Your messages persist across sessions.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-400/50 bg-red-500/20 p-3 text-red-200">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mt-4 rounded-2xl border border-green-400/50 bg-green-500/20 p-3 text-green-200">
            Message saved successfully!
          </div>
        )}

        <form onSubmit={addMessage} className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter your text data to save..."
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
              data-testid="text-input"
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40 disabled:opacity-50"
              data-testid="save-button"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {messages.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-6 text-center text-sm text-slate-300" data-testid="no-messages">
              No saved data yet. Add your first message!
            </p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-white/10 bg-white/10 p-4" data-testid="saved-message">
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={fetchMessages}
            disabled={refreshing}
            className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="refresh-button"
          >
            {refreshing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Refreshing...
              </span>
            ) : (
              'Refresh Messages'
            )}
          </button>

          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              disabled={clearing}
              className="flex-1 rounded-full border border-red-400/50 bg-red-500/20 px-4 py-3 text-sm font-semibold text-red-200 transition hover:border-red-400/70 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="clear-button"
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}