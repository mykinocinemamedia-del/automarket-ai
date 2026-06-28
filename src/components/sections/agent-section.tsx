'use client'

import { useState, useRef, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { useBrand } from '@/hooks/use-brand'
import { useAppStore } from '@/lib/store'
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Bot,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface GenProgress {
  step: string
  detail: string
  percent: number
}

export function AgentSection() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<GenProgress | null>(null)
  const [readyToGenerate, setReadyToGenerate] = useState(false)
  const [generationResult, setGenerationResult] = useState<any>(null)
  const [conversationContext, setConversationContext] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const setSection = useAppStore((s) => s.setSection)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your AI Campaign Agent. I'll help you plan a full month of social media content — just by chatting with me.\n\nTell me about your company or brand, and I'll ask you a few questions to understand your goals. Then I'll generate 30 days of content automatically.\n\nWhat's your company name?",
          timestamp: new Date().toISOString(),
        },
      ])
    }
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setReadyToGenerate(false)

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          projectId: activeProjectId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Check if AI is ready to generate
      if (data.ready) {
        setReadyToGenerate(true)
        setConversationContext(data.response)
      }
    } catch (e: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${e.message}\n\nPlease try again. If the issue persists, the AI service might be rate-limited.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast({
        title: 'Chat error',
        description: e.message,
        variant: 'destructive',
      })
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

  const generateCampaign = async () => {
    setGenerating(true)
    setGenProgress({ step: 'Starting', detail: 'Preparing to generate campaign...', percent: 5 })
    setGenerationResult(null)

    try {
      // Extract strategy from conversation (last assistant message before ready signal)
      const strategyMessages = messages
        .filter((m) => m.role === 'assistant')
        .map((m) => m.content)
        .join('\n\n')

      setGenProgress({ step: 'Generating content', detail: 'Creating 30 days of posts...', percent: 10 })

      const res = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: { /* extracted from conversation */ },
          strategy: strategyMessages,
          projectId: activeProjectId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setGenProgress({ step: 'Complete!', detail: `${data.totalSaved} posts saved to calendar`, percent: 100 })
      setGenerationResult(data)

      toast({
        title: 'Campaign generated!',
        description: `${data.totalSaved} posts created and saved to your calendar.`,
      })

      // Add success message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `🎉 Done! I've generated **${data.totalSaved} posts** and saved them all to your Content Calendar.\n\nHere's what I created:\n- Posts spread across the next 30 days\n- Multiple platforms\n- Mix of content pillars\n- All scheduled with optimal posting times\n\nYou can review and edit them in the Calendar, or ask me to make changes.`,
          timestamp: new Date().toISOString(),
        },
      ])

      setReadyToGenerate(false)
    } catch (e: any) {
      setGenProgress(null)
      toast({
        title: 'Generation failed',
        description: e.message,
        variant: 'destructive',
      })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I ran into an issue generating the campaign: ${e.message}\n\nYou can try again, or use the AI Content Studio to generate posts manually.`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setGenerating(false)
    }
  }

  const resetConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Let's start fresh! Tell me about your company or brand, and what you want to achieve this month.",
        timestamp: new Date().toISOString(),
      },
    ])
    setReadyToGenerate(false)
    setGenerationResult(null)
    setConversationContext('')
    setGenProgress(null)
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
      <SectionHeader
        title="AI Campaign Agent"
        description="Chat with AI to plan your entire month. It asks questions, proposes a strategy, then auto-generates 30 days of content."
        icon={MessageSquare}
        actions={
          <Button variant="outline" size="sm" onClick={resetConversation} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            New Chat
          </Button>
        }
      />

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}

          {/* Generation progress */}
          {generating && genProgress && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="font-medium text-sm">{genProgress.step}</span>
              </div>
              <p className="text-xs text-muted-foreground">{genProgress.detail}</p>
              <Progress value={genProgress.percent} className="h-2" />
            </div>
          )}

          {/* Generation result */}
          {generationResult && !generating && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-sm">Campaign Generated Successfully!</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-2xl font-bold text-emerald-600">{generationResult.totalGenerated}</div>
                  <div className="text-[10px] text-muted-foreground">Posts Generated</div>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-2xl font-bold text-emerald-600">{generationResult.totalSaved}</div>
                  <div className="text-[10px] text-muted-foreground">Saved to Calendar</div>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-2xl font-bold text-emerald-600">30</div>
                  <div className="text-[10px] text-muted-foreground">Days Covered</div>
                </div>
              </div>
              <Button
                onClick={() => setSection('calendar')}
                className="w-full gap-2"
                size="sm"
              >
                <CalendarDays className="h-4 w-4" />
                View in Calendar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Ready to generate button */}
          {readyToGenerate && !generating && !generationResult && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Ready to generate your campaign!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Click below and I'll create 30 days of content across your platforms, automatically saved to your calendar.
              </p>
              <Button
                onClick={generateCampaign}
                className="w-full gap-2"
                disabled={generating}
              >
                <Sparkles className="h-4 w-4" />
                Generate Full Month Campaign
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="min-h-[44px] max-h-[150px] resize-none"
              disabled={loading || generating}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading || generating}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>Powered by Google Gemini AI</span>
            <span>{messages.filter((m) => m.role === 'user').length} messages sent</span>
          </div>
        </div>
      </Card>

      {/* Quick start suggestions */}
      {messages.length <= 1 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <QuickStart
            text="I run a specialty coffee shop in KL. Want to promote our new single-origin beans launch next week."
            onClick={() => setInput('I run a specialty coffee shop in KL. Want to promote our new single-origin beans launch next week.')}
          />
          <QuickStart
            text="I have an online fitness coaching business targeting busy professionals. Need more leads this month."
            onClick={() => setInput('I have an online fitness coaching business targeting busy professionals. Need more leads this month.')}
          />
          <QuickStart
            text="We're a B2B SaaS startup launching our product next month. Need to build awareness on LinkedIn."
            onClick={() => setInput("We're a B2B SaaS startup launching our product next month. Need to build awareness on LinkedIn.")}
          />
          <QuickStart
            text="I sell handmade jewelry on Instagram and want to grow my audience and sales."
            onClick={() => setInput('I sell handmade jewelry on Instagram and want to grow my audience and sales.')}
          />
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  )
}

function QuickStart({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-xs text-muted-foreground"
    >
      <Sparkles className="h-3 w-3 inline-block mr-1 text-primary" />
      {text}
    </button>
  )
}
