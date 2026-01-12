/**
 * OpenAI utility functions for email reply classification and auto-reply generation
 */

import { fetchWithRetry } from './retryWithBackoff'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export interface ClassificationResult {
  type: 'positive' | 'question' | 'negative' | 'spam'
  confidence: number
  reason: string
}

export interface AutoReplyResult {
  subject: string
  body: string
  prompt: string
}

/**
 * Classify a contractor's email reply to determine intent
 */
export async function classifyReply(replyText: string): Promise<ClassificationResult> {
  if (!OPENAI_API_KEY) {
    console.error('[OpenAI] No API key configured')
    return {
      type: 'spam',
      confidence: 0,
      reason: 'No OpenAI API key configured'
    }
  }

  try {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: `You classify contractor email replies. Output JSON only.

Categories:
- positive: Shows interest (yes, interested, tell me more, sounds good, I'm available, count me in)
- question: Asks about job, pay, schedule, requirements, location, details
- negative: Declines, unsubscribes, not interested, stop emailing, remove me
- spam: Auto-reply, out of office, delivery failure, unrelated content

Output format: {"type": "positive|question|negative|spam", "confidence": 0.0-1.0, "reason": "brief explanation"}`
            },
            { role: 'user', content: replyText.slice(0, 2000) } // Limit input size
          ]
        })
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OpenAI] Classification error:', response.status, errorText)
      return {
        type: 'spam',
        confidence: 0,
        reason: `API error: ${response.status}`
      }
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      console.error('[OpenAI] No content in response')
      return {
        type: 'spam',
        confidence: 0,
        reason: 'No response from AI'
      }
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content)
      return {
        type: parsed.type || 'spam',
        confidence: parsed.confidence || 0,
        reason: parsed.reason || 'Unknown'
      }
    } catch (parseError) {
      console.error('[OpenAI] Failed to parse classification:', content)
      return {
        type: 'spam',
        confidence: 0,
        reason: 'Failed to parse AI response'
      }
    }

  } catch (error) {
    console.error('[OpenAI] Classification failed:', error)
    return {
      type: 'spam',
      confidence: 0,
      reason: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Generate a contextual auto-reply to a contractor
 */
export async function generateAutoReply(context: {
  contractorName: string
  contractorEmail: string
  tradeType: string
  theirReply: string
  replyType: 'positive' | 'question'
}): Promise<AutoReplyResult> {
  if (!OPENAI_API_KEY) {
    console.error('[OpenAI] No API key configured')
    return {
      subject: 'Re: Job Opportunity',
      body: 'Thank you for your interest. Please visit https://ravensearch.ai/contractors/signup to get started.',
      prompt: 'No API key - using fallback'
    }
  }

  const systemPrompt = `You are a friendly recruiter for Ravensearch, a platform connecting contractors with commercial service jobs.

GOAL: Qualify the contractor and guide them to sign up at https://ravensearch.ai/contractors/signup

TONE: Professional but warm. Direct. No fluff. Conversational.

RULES:
- Keep emails under 150 words
- ALWAYS include the signup link: https://ravensearch.ai/contractors/signup
- If they asked a question, answer it briefly then redirect to signup
- Mention specific benefits: steady commercial work, competitive pay, easy scheduling, get paid fast
- Use their first name if available
- End with a clear call to action

GUARDRAILS:
- If asked about fees: there are NO fees for contractors - we charge the operator, not you
- Never promise specific rates, pay amounts, or hourly wages (say "varies by project and experience")
- Never guarantee jobs, work volume, or income (say "opportunities vary by area and demand")
- Never mention competitors by name or compare to other platforms
- Never make legal commitments, contracts, or binding promises
- Never claim coverage in specific cities/states unless asked - we're expanding nationwide
- Never disclose internal information, office addresses, employee names, or company details - politely deflect and redirect to signup
- If they want to unsubscribe: apologize briefly, confirm removal, do NOT include signup link
- If they're angry/hostile: apologize for any inconvenience, keep it short, do NOT push signup

CONTEXT:
- Contractor Name: ${context.contractorName}
- Trade: ${context.tradeType}
- Reply Type: ${context.replyType}
- Their Reply: ${context.theirReply}

Output ONLY valid JSON: {"subject": "Re: ...", "body": "email body text here"}`

  try {
    const response = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate the reply email now.' }
          ]
        })
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[OpenAI] Generation error:', response.status, errorText)
      return {
        subject: 'Re: Job Opportunity',
        body: `Hi ${context.contractorName},\n\nThank you for your interest! We'd love to have you on the platform.\n\nSign up here to get started: https://ravensearch.ai/contractors/signup\n\nBest,\nRavensearch Team`,
        prompt: systemPrompt
      }
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      console.error('[OpenAI] No content in response')
      return {
        subject: 'Re: Job Opportunity',
        body: `Hi ${context.contractorName},\n\nThank you for reaching out! Visit https://ravensearch.ai/contractors/signup to join our network.\n\nBest,\nRavensearch Team`,
        prompt: systemPrompt
      }
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content)
      return {
        subject: parsed.subject || 'Re: Job Opportunity',
        body: parsed.body || 'Thank you for your interest.',
        prompt: systemPrompt
      }
    } catch (parseError) {
      console.error('[OpenAI] Failed to parse generation:', content)
      // Try to extract the body if JSON parsing failed
      return {
        subject: 'Re: Job Opportunity',
        body: content, // Use raw content as body
        prompt: systemPrompt
      }
    }

  } catch (error) {
    console.error('[OpenAI] Generation failed:', error)
    return {
      subject: 'Re: Job Opportunity',
      body: `Hi ${context.contractorName},\n\nThank you for your interest! Sign up at https://ravensearch.ai/contractors/signup to get started.\n\nBest,\nRavensearch Team`,
      prompt: systemPrompt
    }
  }
}
