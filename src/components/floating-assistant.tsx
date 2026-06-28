'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useProject } from '@/hooks/use-project'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { getPagePrompts } from '@/lib/assistant'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ChevronUp,
  Lightbulb,
  ArrowRight,
  Wand2,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: {
    type: string
    target?: string
    data?: any
    label: string
  }
}

export function FloatingAssistant() {
  const activeSection = useAppStore((s) => s.activeSection)
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const { activeProject } = useProject()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const pagePrompts = getPagePrompts(activeSection)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Reset conversation when page changes
  useEffect(() => {
    setMessages([])
    setShowPrompts(true)
  }, [activeSection])

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setShowPrompts(false)
    setLoading(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          section: activeSection,
          projectId: activeProjectId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        action: data.action,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I hit an error: ${e.message}. Try again in a moment.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleAction = (action: any) => {
    if (action.type === 'navigate' && action.target) {
      useAppStore.getState().setSection(action.target as any)
      toast({ title: `Navigated to ${action.target}` })
    } else if (action.type === 'fill_form' && action.data) {
      // Dispatch a custom event that sections can listen for
      window.dispatchEvent(
        new CustomEvent('assistant-fill', {
          detail: { target: action.target, data: action.data },
        })
      )
      toast({ title: 'Content filled', description: action.label })
    } else if (action.type === 'generate_content') {
      // Trigger content generation
      window.dispatchEvent(
        new CustomEvent('assistant-generate', {
          detail: { target: action.target, data: action.data },
        })
      )
      toast({ title: 'Generating content...', description: action.label })
    } else {
      toast({ title: action.label })
    }
  }

  const sectionLabel = activeSection.charAt(0).toUpperCase() + activeSection.slice(1)

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 bg-black text-[var(--brutal-yellow)] flex items-center justify-center border-[3px] border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-x-1 hover:-translate-y-1 transition-all"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-[var(--brutal-green)] border-[2px] border-black animate-soft-pulse" />
        </button>
      )}

      {/* Assistant Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 max-h-[600px] flex flex-col bg-[var(--brutal-cream)] border-[3px] border-black shadow-brutal-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b-[3px] border-black bg-black text-[var(--brutal-yellow)]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[var(--brutal-yellow)] flex items-center justify-center border-[2px] border-[var(--brutal-yellow)]">
                <Bot className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="font-display text-lg leading-none">AI ASSISTANT</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--brutal-yellow)]/70 mt-0.5">
                  {sectionLabel} · {activeProject?.name || 'No project'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center hover:bg-[var(--brutal-yellow)] hover:text-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 min-h-[200px] max-h-[400px]">
            {messages.length === 0 && !loading && showPrompts && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="h-7 w-7 bg-[var(--brutal-yellow)] flex items-center justify-center border-[2px] border-black shrink-0">
                    <Bot className="h-4 w-4 text-black" />
                  </div>
                  <div className="bg-white border-[2px] border-black p-2.5 text-xs">
                    <p className="font-semibold mb-1">
                      I'm your AI assistant for the <span className="font-display text-sm">{sectionLabel}</span> page.
                    </p>
                    <p className="text-black/60">
                      I understand this page and can help you with specific tasks. Try one of these:
                    </p>
                  </div>
                </div>

                {/* Page-specific prompts */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-black/50 px-1 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Suggested for this page
                  </div>
                  {pagePrompts.slice(0, 4).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left p-2 text-xs font-medium border-[2px] border-black bg-white hover:bg-[var(--brutal-yellow)] hover:shadow-brutal-sm transition-all flex items-center gap-2 group"
                    >
                      <Wand2 className="h-3 w-3 shrink-0 text-[var(--brutal-red)]" />
                      <span className="flex-1">{prompt}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                <div className={cn('flex items-start gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                  <div
                    className={cn(
                      'h-7 w-7 flex items-center justify-center border-[2px] border-black shrink-0',
                      msg.role === 'user'
                        ? 'bg-black text-[var(--brutal-yellow)]'
                        : 'bg-[var(--brutal-yellow)] text-black'
                    )}
                  >
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      'border-[2px] border-black p-2.5 text-xs max-w-[80%]',
                      msg.role === 'user' ? 'bg-black text-[var(--brutal-yellow)]' : 'bg-white'
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>

                {/* Action button */}
                {msg.action && (
                  <div className="ml-9 mt-1.5">
                    <button
                      onClick={() => handleAction(msg.action)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--brutal-green)] text-black border-[2px] border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex items-center gap-1"
                    >
                      {msg.action.label}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 bg-[var(--brutal-yellow)] flex items-center justify-center border-[2px] border-black shrink-0">
                  <Loader2 className="h-4 w-4 text-black animate-spin" />
                </div>
                <div className="bg-white border-[2px] border-black p-2.5 text-xs">
                  <span className="text-black/60">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t-[3px] border-black p-2 space-y-1.5 bg-white">
            <div className="flex items-end gap-1.5">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${sectionLabel}...`}
                rows={1}
                className="min-h-[36px] max-h-[120px] resize-none text-xs border-[2px] border-black"
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-9 w-9 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-black/40 px-1">
              <span>Powered by Groq + Z.AI + Gemini</span>
              <button
                onClick={() => {
                  setMessages([])
                  setShowPrompts(true)
                }}
                className="hover:text-black"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
