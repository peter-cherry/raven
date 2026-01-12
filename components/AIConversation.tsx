'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Message {
  id: string
  sender: 'system' | 'technician'
  content: string
  created_at: string
  qualified: boolean | null
}

interface AIConversationProps {
  technicianId: string
  jobId: string
}

export function AIConversation({ technicianId, jobId }: AIConversationProps) {
  const supabase = createClientComponentClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [conversationStatus, setConversationStatus] = useState<string>('active')

  useEffect(() => {
    fetchConversation()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`conversation-${technicianId}-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_conversations',
          filter: `technician_id=eq.${technicianId}`
        },
        () => {
          fetchConversation()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [technicianId, jobId])

  async function fetchConversation() {
    try {
      // Get conversation thread
      const { data: thread } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('technician_id', technicianId)
        .eq('job_id', jobId)
        .single()

      if (thread) {
        setConversationStatus(thread.status)
        setMessages(thread.messages || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching conversation:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        Loading conversation...
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
        <div>No conversation yet</div>
        <div style={{ fontSize: '14px', marginTop: '8px' }}>
          Messages will appear here when the technician replies
        </div>
      </div>
    )
  }

  return (
    <div className="ai-conversation-container">
      {/* Status Badge */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#888' }}>
          Conversation Status
        </div>
        <div style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 500,
          background: conversationStatus === 'qualified' ? '#10B981' :
                     conversationStatus === 'disqualified' ? '#EF4444' :
                     conversationStatus === 'pending' ? '#F59E0B' : '#6C72C9',
          color: 'white'
        }}>
          {conversationStatus === 'qualified' ? '✅ Qualified' :
           conversationStatus === 'disqualified' ? '❌ Disqualified' :
           conversationStatus === 'pending' ? '⏳ Pending Review' : '🔄 Active'}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: '20px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            style={{
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'technician' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: '#888',
              marginBottom: '4px',
              fontWeight: 500
            }}>
              {msg.sender === 'technician' ? 'Technician' : 'AI Assistant'}
            </div>
            <div style={{
              background: msg.sender === 'technician' ? '#6C72C9' : '#2A2931',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              maxWidth: '80%',
              wordWrap: 'break-word'
            }}>
              {msg.content}
            </div>
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '4px'
            }}>
              {new Date(msg.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            {msg.qualified !== null && (
              <div style={{
                marginTop: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                background: msg.qualified ? '#10B981' : '#EF4444',
                color: 'white'
              }}>
                {msg.qualified ? '✅ Qualified by AI' : '❌ Disqualified by AI'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
