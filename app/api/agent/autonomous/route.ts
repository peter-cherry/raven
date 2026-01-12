import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabase: any = null

const getSupabase = (): any => {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Supabase credentials not configured')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// MCP Tools - File operations, bash commands, and external integrations
const tools: Anthropic.Tool[] = [
  // File System Tools
  {
    name: 'read_file',
    description: 'Read the contents of a file from the codebase',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute path to the file to read'
        }
      },
      required: ['file_path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file (creates new file or overwrites existing)',
    input_schema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Absolute path to the file to write'
        },
        content: {
          type: 'string',
          description: 'Content to write to the file'
        }
      },
      required: ['file_path', 'content']
    }
  },
  {
    name: 'bash_command',
    description: 'Execute a bash command in the project directory. Use for git, npm, testing, etc.',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        directory: {
          type: 'string',
          description: 'Directory path to list files from'
        }
      },
      required: ['directory']
    }
  },

  // Supabase Tools
  {
    name: 'supabase_list_tables',
    description: 'List all tables in the Supabase database',
    input_schema: {
      type: 'object',
      properties: {
        schemas: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of schemas to include (defaults to ["public"])'
        }
      },
      required: []
    }
  },
  {
    name: 'supabase_execute_sql',
    description: 'Execute SQL query on the Supabase database. Use for reading data to understand context.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL query to execute (SELECT statements recommended)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'supabase_apply_migration',
    description: 'Apply a database migration (DDL operations like CREATE TABLE, ALTER TABLE)',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Migration name in snake_case (e.g., "add_user_preferences")'
        },
        query: {
          type: 'string',
          description: 'The DDL SQL to execute'
        }
      },
      required: ['name', 'query']
    }
  },
  {
    name: 'supabase_get_advisors',
    description: 'Get security and performance advisors for the database',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['security', 'performance'],
          description: 'Type of advisors to fetch'
        }
      },
      required: ['type']
    }
  },

  // Vercel Tools
  {
    name: 'vercel_list_deployments',
    description: 'List recent Vercel deployments for this project',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of deployments to fetch (default: 10)'
        }
      },
      required: []
    }
  },
  {
    name: 'vercel_get_deployment_logs',
    description: 'Get build logs for a Vercel deployment to debug issues',
    input_schema: {
      type: 'object',
      properties: {
        deployment_id: {
          type: 'string',
          description: 'The deployment ID or URL'
        },
        limit: {
          type: 'number',
          description: 'Number of log lines (default: 100)'
        }
      },
      required: ['deployment_id']
    }
  }
]

export async function POST(request: Request) {
  try {
    // Try to parse JSON body, fallback to empty object if no body
    let autonomous_key
    try {
      const body = await request.json()
      autonomous_key = body.autonomous_key
    } catch (e) {
      // No JSON body provided, allow if AUTONOMOUS_AGENT_KEY is not set (for local development)
      autonomous_key = undefined
    }

    // Simple security check - only require key if AUTONOMOUS_AGENT_KEY is explicitly set to a non-empty value
    const keyRequired = process.env.AUTONOMOUS_AGENT_KEY
    if (keyRequired && keyRequired.trim() !== '' && autonomous_key !== keyRequired) {
      console.log('[Autonomous Agent] Unauthorized - invalid key')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Log if running without auth (development mode)
    if (!keyRequired || keyRequired.trim() === '') {
      console.log('[Autonomous Agent] Running without auth key (development mode)')
    }

    console.log('[Autonomous Agent] Starting autonomous check...')

    // 1. Get active work items (not completed, not blocked)
    const { data: workItems, error: workError } = await getSupabase()
      .from('work_items')
      .select('*')
      .in('status', ['pending', 'implementing', 'analyzing', 'planning', 'testing'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)

    if (workError) {
      console.error('[Autonomous Agent] Error fetching work items:', workError)
      throw workError
    }

    if (!workItems || workItems.length === 0) {
      console.log('[Autonomous Agent] No active work items found')
      return NextResponse.json({
        message: 'No active work items to process',
        checked: true
      })
    }

    const workItem = workItems[0]
    console.log(`[Autonomous Agent] Working on: ${workItem.title}`)

    // 2. Get conversation history
    const { data: threads } = await getSupabase()
      .from('conversation_threads')
      .select('id')
      .eq('work_item_id', workItem.id)
      .eq('active', true)
      .limit(1)

    let conversationHistory: any[] = []
    if (threads && threads.length > 0) {
      const { data: messages } = await getSupabase()
        .from('conversation_messages')
        .select('*')
        .eq('thread_id', threads[0].id)
        .order('created_at', { ascending: true })
        .limit(20)

      conversationHistory = messages || []
    }

    // 3. Fetch system prompt from database (or use default)
    const { data: promptConfig } = await getSupabase()
      .from('agent_config')
      .select('prompt_template')
      .eq('config_key', 'system_prompt')
      .single()

    // Use configured prompt template or fallback to default
    const promptTemplate = promptConfig?.prompt_template || `You are Raven Agent, working AUTONOMOUSLY on development tasks.

**CURRENT WORK ITEM:**
Title: \${workItem.title}
Description: \${workItem.description}
Status: \${workItem.status}
Progress: \${workItem.progress_percentage}%

**COMPLETION CRITERIA:**
\${JSON.stringify(workItem.completion_criteria, null, 2)}

**IMPLEMENTATION PLAN:**
\${JSON.stringify(workItem.implementation_plan, null, 2)}

**AUTONOMOUS OPERATION RULES:**
1. You are working independently - no human is watching
2. Make actual progress on the task
3. Update completion criteria as you complete them
4. If you complete a criterion, respond with: CRITERION_COMPLETE: [criterion text]
5. If you're blocked, respond with: BLOCKED: [reason]
6. Provide a brief status update of what you accomplished
7. Be concise - focus on ACTION not explanation

**YOUR CAPABILITIES:**

File System:
- read_file: Read any file from the codebase
- write_file: Create or overwrite files
- bash_command: Execute bash commands (git, npm, test, etc.)
- list_files: List files in a directory

Database (Supabase):
- supabase_list_tables: List all database tables
- supabase_execute_sql: Run SQL queries to read data
- supabase_apply_migration: Create/modify database schema
- supabase_get_advisors: Check security and performance issues

Deployment (Vercel):
- vercel_list_deployments: List recent deployments
- vercel_get_deployment_logs: Get build logs to debug failures

**IMPORTANT:**
- Use tools to make ACTUAL progress, not just plan
- When you complete a file change, respond with: CRITERION_COMPLETE: [criterion text]
- When blocked, respond with: BLOCKED: [reason]
- Be autonomous - you can:
  * Read and modify files
  * Run tests and git commands
  * Query the database to understand data
  * Apply database migrations
  * Check deployment status and logs

What specific action will you take right now to move this task forward?`

    // Add codebase context
    const projectRoot = process.cwd()
    const codebaseContext = `

**CODEBASE CONTEXT:**
- Working Directory: ${projectRoot}
- Project: Raven Search - Next.js 14 application
- Key Directories:
  * app/ - Next.js app router (pages, API routes)
  * components/ - React components
  * lib/ - Utility functions and shared code
  * supabase/ - Database migrations
  * public/ - Static assets

**FILE PATH USAGE:**
- For read_file: Use relative paths from project root (e.g., "app/api/agent/chat/route.ts")
- For write_file: Use relative paths from project root
- For list_files: Use relative paths (e.g., "app/api/agent")
- For bash_command: Commands run from project root (${projectRoot})

**IMPORTANT:** Always use relative paths without leading slash. Examples:
- ✅ CORRECT: read_file("app/page.tsx")
- ❌ WRONG: read_file("/app/page.tsx")
- ✅ CORRECT: list_files("components")
- ❌ WRONG: list_files("./components")
`

    // Interpolate template variables using eval (safe since template is from database)
    // Using template literals with eval to replace ${workItem.X} placeholders
    const systemPrompt = eval('`' + promptTemplate + '`') + codebaseContext

    const messages = [
      ...conversationHistory.slice(-10)
        .filter((msg: any) => msg.role !== 'system') // Filter out system messages
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
      {
        role: 'user',
        content: 'This is an autonomous check-in. What progress can you make right now on this work item?'
      }
    ]

    // 4. Call Claude with tool use support
    console.log('[Autonomous Agent] Calling Claude...')

    let currentMessages = messages
    let assistantMessage = ''
    let toolsUsed: string[] = []
    let lastResponse: any = null // Track last response for token usage
    const maxIterations = 5 // Prevent infinite loops

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000, // Increased for tool use
        system: systemPrompt,
        messages: currentMessages,
        tools
      })

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use')
      const textBlocks = response.content.filter((block: any) => block.type === 'text')

      // Collect text responses
      if (textBlocks.length > 0) {
        assistantMessage += textBlocks.map((block: any) => block.text).join('\n')
      }

      // Store response for token tracking
      lastResponse = response

      // If no tool use, we're done
      if (toolUseBlocks.length === 0) {
        break
      }

      // Execute tools
      const toolResults: any[] = []
      for (const toolUse of toolUseBlocks) {
        // Type assertion for tool use blocks
        const toolName = (toolUse as any).name
        const toolInput = (toolUse as any).input
        toolsUsed.push(toolName)

        console.log(`[Autonomous Agent] Using tool: ${toolName}`)

        try {
          let result: any

          switch (toolName) {
            // File System Tools
            case 'read_file': {
              const fullPath = path.join(process.cwd(), toolInput.file_path)
              const fileContent = await fs.readFile(fullPath, 'utf-8')
              result = { content: fileContent, path: toolInput.file_path }
              break
            }

            case 'write_file': {
              const fullPath = path.join(process.cwd(), toolInput.file_path)
              await fs.writeFile(fullPath, toolInput.content, 'utf-8')
              result = { success: true, message: `File written: ${toolInput.file_path}`, path: toolInput.file_path }
              break
            }

            case 'bash_command':
              const { stdout, stderr } = await execAsync(toolInput.command, {
                cwd: process.cwd()
              })
              result = { stdout, stderr, success: !stderr }
              break

            case 'list_files': {
              const fullPath = path.join(process.cwd(), toolInput.directory || '')
              const files = await fs.readdir(fullPath)
              result = { files, directory: toolInput.directory || '.' }
              break
            }

            // Supabase Tools
            case 'supabase_list_tables': {
              const schemas = toolInput.schemas || ['public']
              const { data, error } = await getSupabase()
                .from('information_schema.tables')
                .select('table_name, table_schema')
                .in('table_schema', schemas)

              if (error) throw new Error(`Supabase error: ${error.message}`)
              result = { tables: data }
              break
            }

            case 'supabase_execute_sql': {
              const { data, error } = await getSupabase().rpc('exec_sql', {
                query: toolInput.query
              })

              if (error) {
                // Fallback: Try direct query if RPC doesn't exist
                const { data: directData, error: directError } = await getSupabase()
                  .from('_temp_query')
                  .select('*')
                  .limit(100)

                if (directError) throw new Error(`SQL execution failed: ${error.message}`)
                result = { data: directData, rows: directData?.length || 0 }
              } else {
                result = { data, rows: data?.length || 0 }
              }
              break
            }

            case 'supabase_apply_migration': {
              // Create migration record
              const migrationName = `${Date.now()}_${toolInput.name}`

              // Execute the migration SQL
              const { error } = await getSupabase().rpc('exec_sql', {
                query: toolInput.query
              })

              if (error) throw new Error(`Migration failed: ${error.message}`)

              result = {
                success: true,
                migration: migrationName,
                message: `Migration ${toolInput.name} applied successfully`
              }
              break
            }

            case 'supabase_get_advisors': {
              // This would require a custom RPC function in Supabase
              // For now, return security best practices
              const advisors = toolInput.type === 'security' ? [
                { type: 'RLS', message: 'Ensure Row Level Security is enabled on all tables' },
                { type: 'Auth', message: 'Verify authentication is required for sensitive operations' }
              ] : [
                { type: 'Indexes', message: 'Check that frequently queried columns have indexes' },
                { type: 'Queries', message: 'Review slow queries in Supabase dashboard' }
              ]

              result = { advisors, type: toolInput.type }
              break
            }

            // Vercel Tools
            case 'vercel_list_deployments': {
              // Use Vercel API to list deployments
              const projectId = process.env.VERCEL_PROJECT_ID || 'raven-claude'
              const teamId = process.env.VERCEL_TEAM_ID || 'ravensearch'

              result = {
                message: 'Vercel deployment listing requires API integration',
                hint: 'Use bash_command to run: vercel ls --json',
                project: projectId,
                team: teamId
              }
              break
            }

            case 'vercel_get_deployment_logs': {
              result = {
                message: 'Vercel logs require API integration',
                hint: `Use bash_command to run: vercel logs ${toolInput.deployment_id}`,
                deployment: toolInput.deployment_id
              }
              break
            }

            default:
              result = { error: `Unknown tool: ${toolName}` }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: (toolUse as any).id,
            content: JSON.stringify(result)
          })
        } catch (error: any) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: (toolUse as any).id,
            is_error: true,
            content: error.message
          })
        }
      }

      // Add assistant response and tool results to conversation
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults }
      ]
    }

    console.log('[Autonomous Agent] Response received:', assistantMessage.substring(0, 200))
    if (toolsUsed.length > 0) {
      console.log('[Autonomous Agent] Tools used:', toolsUsed.join(', '))
    }

    // 5. Parse for special commands
    let criteriaUpdated = false
    let statusChanged = false
    let updatedStatus = workItem.status

    if (assistantMessage.includes('CRITERION_COMPLETE:')) {
      const criterionMatch = assistantMessage.match(/CRITERION_COMPLETE: (.+?)(?:\n|$)/)
      if (criterionMatch) {
        const criterionText = criterionMatch[1].trim()

        const updatedCriteria = workItem.completion_criteria.map((c: any) => {
          if (c.criterion.toLowerCase().includes(criterionText.toLowerCase())) {
            return { ...c, completed: true, completed_at: new Date().toISOString() }
          }
          return c
        })

        // Calculate new progress
        const completedCount = updatedCriteria.filter((c: any) => c.completed).length
        const progressPercentage = Math.round((completedCount / updatedCriteria.length) * 100)

        await getSupabase()
          .from('work_items')
          .update({
            completion_criteria: updatedCriteria,
            progress_percentage: progressPercentage,
            status: progressPercentage === 100 ? 'completed' : 'implementing'
          })
          .eq('id', workItem.id)

        criteriaUpdated = true
        updatedStatus = progressPercentage === 100 ? 'completed' : 'implementing'
        console.log(`[Autonomous Agent] Marked criterion complete: ${criterionText}`)
      }
    }

    if (assistantMessage.includes('BLOCKED:')) {
      const blockedMatch = assistantMessage.match(/BLOCKED: (.+?)(?:\n|$)/)
      if (blockedMatch) {
        await getSupabase()
          .from('work_items')
          .update({
            status: 'blocked',
            blocked_reason: blockedMatch[1].trim(),
            blocked_at: new Date().toISOString()
          })
          .eq('id', workItem.id)

        statusChanged = true
        updatedStatus = 'blocked'
        console.log(`[Autonomous Agent] Marked as blocked: ${blockedMatch[1].trim()}`)
      }
    }

    // 6. Save autonomous message to conversation
    let { data: thread } = await getSupabase()
      .from('conversation_threads')
      .select('id')
      .eq('work_item_id', workItem.id)
      .eq('active', true)
      .single()

    if (!thread) {
      const { data: newThread } = await getSupabase()
        .from('conversation_threads')
        .insert({
          work_item_id: workItem.id,
          title: `Autonomous: ${workItem.title}`
        })
        .select('id')
        .single()

      thread = newThread
    }

    if (thread) {
      await getSupabase()
        .from('conversation_messages')
        .insert([
          {
            thread_id: thread.id,
            role: 'user',
            content: '[AUTONOMOUS CHECK-IN] Agent checking in automatically'
          },
          {
            thread_id: thread.id,
            role: 'assistant',
            content: assistantMessage,
            tokens_used: lastResponse?.usage?.output_tokens || 0
          }
        ])
    }

    console.log('[Autonomous Agent] Check complete')

    return NextResponse.json({
      success: true,
      work_item_id: workItem.id,
      work_item_title: workItem.title,
      status: updatedStatus,
      criteria_updated: criteriaUpdated,
      status_changed: statusChanged,
      message_preview: assistantMessage.substring(0, 200),
      tokens_used: lastResponse?.usage?.output_tokens || 0
    })

  } catch (error) {
    console.error('[Autonomous Agent] Error:', error)
    return NextResponse.json(
      { error: 'Failed to run autonomous check' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Autonomous agent endpoint is active'
  })
}
