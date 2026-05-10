'use client'

import { useEffect, useState, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Send, UserCircle2, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ChatPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [chatType, setChatType] = useState('ROOMMATE')
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  let typingTimer: NodeJS.Timeout

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    // Scroll to bottom on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setCurrentUser(user)

    // Verify match
    const { data: match } = await supabase
      .from('matches')
      .select('*, user_a:profiles!matches_user_a_id_fkey(*), user_b:profiles!matches_user_b_id_fkey(*)')
      .eq('id', matchId)
      .single()

    if (!match || (match.user_a_id !== user.id && match.user_b_id !== user.id)) {
      router.push('/roommates')
      return
    }

    setChatType(match.chat_type)
    setOtherUser(match.user_a_id === user.id ? match.user_b : match.user_a)

    // Load messages
    const { data: initialMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (initialMessages) {
      setMessages(initialMessages.reverse())
      // Mark as read
      const unreadIds = initialMessages.filter(m => !m.is_read && m.sender_id !== user.id).map(m => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds)
      }
    }

    setLoading(false)

    // Subscriptions
    const channel = supabase.channel(`match:${matchId}`)
      
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender_id !== user.id && document.hasFocus()) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id)
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
      (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      }
    )
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.user_id !== user.id) {
        setIsTyping(true)
        clearTimeout(typingTimer)
        typingTimer = setTimeout(() => setIsTyping(false), 2000)
      }
    })
    .subscribe()

    return () => { supabase.removeChannel(channel) }
  }

  const handleTyping = () => {
    supabase.channel(`match:${matchId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUser.id }
    })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !currentUser) return

    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUser.id,
      content
    })
  }

  if (loading) {
    return <div className="h-screen bg-muted-bg flex items-center justify-center"><span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin"/></div>
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-muted-bg max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white border-b border-border-light p-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/roommates')} className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-navy/5 shrink-0">
            {otherUser?.avatar_url ? (
              <Image src={otherUser.avatar_url} alt={otherUser.name} fill className="object-cover" />
            ) : (
              <UserCircle2 className="w-full h-full text-text-muted" />
            )}
          </div>
          <div>
            <h2 className="font-bold text-text-primary leading-tight">{otherUser?.name}</h2>
            <p className="text-xs text-text-muted font-medium">
              {chatType === 'BUDDY' ? 'House Hunting Buddy' : 'Potential Roommate'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-text-muted hover:text-danger">
          <ShieldAlert className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="text-center pb-6">
          <div className="w-20 h-20 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden relative">
            {otherUser?.avatar_url ? (
               <Image src={otherUser.avatar_url} alt={otherUser.name} fill className="object-cover" />
            ) : (
              <UserCircle2 className="w-12 h-12 text-text-muted" />
            )}
          </div>
          <h3 className="font-bold text-text-primary text-lg">You matched with {otherUser?.name}</h3>
          <p className="text-sm text-text-muted mt-1">Start chatting to see if you&apos;re a good fit!</p>
        </div>

        {messages.map((msg, i) => {
          const isMine = msg.sender_id === currentUser?.id
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMine ? 'bg-navy text-white rounded-br-sm' : 'bg-white border border-border-light text-text-primary rounded-bl-sm'}`}>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted font-medium px-1">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMine && (
                  <span className={msg.is_read ? 'text-coral' : 'text-text-muted/50'}>
                    ✓{msg.is_read && '✓'}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex items-start">
            <div className="bg-white border border-border-light rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-text-muted/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-border-light p-3 sm:p-4 shrink-0">
        <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-3xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-muted-bg border border-border-light rounded-2xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-navy resize-none min-h-[44px] max-h-32 custom-scrollbar"
            rows={1}
            style={{ height: input ? 'auto' : '44px' }}
          />
          <Button 
            type="submit" 
            disabled={!input.trim()} 
            className="absolute right-2 bottom-1.5 w-8 h-8 rounded-full bg-coral hover:bg-coral-dark p-0 flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-white ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
