#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const server = new Server(
  {
    name: 'raven-agent-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_work_queue',
        description: 'Get the current work queue with all active items prioritized',
        inputSchema: {
          type: 'object',
          properties: {
            include_completed: {
              type: 'boolean',
              description: 'Include completed items (default: false)',
              default: false
            }
          }
        }
      },
      {
        name: 'get_work_item',
        description: 'Get full details of a specific work item including context, sessions, and conversation',
        inputSchema: {
          type: 'object',
          properties: {
            work_item_id: {
              type: 'string',
              description: 'UUID of the work item'
            }
          },
          required: ['work_item_id']
        }
      },
      {
        name: 'update_work_item',
        description: 'Update a work item (status, completion criteria, context, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            work_item_id: {
              type: 'string',
              description: 'UUID of the work item'
            },
            updates: {
              type: 'object',
              description: 'Fields to update (status, completion_criteria, context, etc.)'
            }
          },
          required: ['work_item_id', 'updates']
        }
      },
      {
        name: 'create_work_item',
        description: 'Create a new work item',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the work item'
            },
            description: {
              type: 'string',
              description: 'Detailed description'
            },
            type: {
              type: 'string',
              enum: ['bug', 'feature', 'refactor', 'tech_debt', 'documentation'],
              description: 'Type of work'
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Priority level'
            },
            completion_criteria: {
              type: 'array',
              description: 'List of criteria that must be met'
            }
          },
          required: ['title', 'description', 'type', 'priority']
        }
      },
      {
        name: 'start_work_session',
        description: 'Start a work session for a specific item',
        inputSchema: {
          type: 'object',
          properties: {
            work_item_id: {
              type: 'string',
              description: 'UUID of the work item'
            }
          },
          required: ['work_item_id']
        }
      },
      {
        name: 'end_work_session',
        description: 'End a work session and log what was accomplished',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'UUID of the session to end'
            },
            summary: {
              type: 'string',
              description: 'Summary of what was accomplished'
            },
            actions_taken: {
              type: 'array',
              description: 'List of actions performed'
            },
            criteria_completed: {
              type: 'array',
              description: 'Which completion criteria were finished'
            }
          },
          required: ['session_id', 'summary']
        }
      },
      {
        name: 'get_stats',
        description: 'Get overall statistics about work items',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'generate_standup',
        description: 'Generate a daily standup report',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (default: today)'
            }
          }
        }
      },
      {
        name: 'search_work_items',
        description: 'Search work items by text in title or description',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query'
            }
          },
          required: ['query']
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const typedArgs = (args || {}) as any

  try {
    switch (name) {
      case 'get_work_queue': {
        const { data, error } = await supabase.rpc('get_work_queue')

        if (error) throw error

        let items = data

        if (!typedArgs.include_completed) {
          items = items.filter((item: any) => item.status !== 'completed')
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(items, null, 2)
          }]
        }
      }

      case 'get_work_item': {
        const { data, error} = await supabase
          .rpc('get_work_item_full', { item_id: typedArgs.work_item_id })

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        }
      }

      case 'update_work_item': {
        const { error } = await supabase
          .from('work_items')
          .update(typedArgs.updates)
          .eq('id', typedArgs.work_item_id)

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: `✓ Work item ${typedArgs.work_item_id} updated successfully`
          }]
        }
      }

      case 'create_work_item': {
        const { data, error } = await supabase
          .from('work_items')
          .insert({
            title: typedArgs.title,
            description: typedArgs.description,
            type: typedArgs.type,
            priority: typedArgs.priority,
            completion_criteria: typedArgs.completion_criteria || []
          })
          .select()
          .single()

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: `✓ Created work item: ${data.id}\n${JSON.stringify(data, null, 2)}`
          }]
        }
      }

      case 'start_work_session': {
        const { data, error } = await supabase
          .from('work_sessions')
          .insert({
            work_item_id: typedArgs.work_item_id,
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error

        // Update work item status
        await supabase
          .from('work_items')
          .update({ status: 'implementing' })
          .eq('id', typedArgs.work_item_id)

        return {
          content: [{
            type: 'text',
            text: `✓ Work session started: ${data.id}`
          }]
        }
      }

      case 'end_work_session': {
        const endTime = new Date()

        // Get session start time
        const { data: session } = await supabase
          .from('work_sessions')
          .select('started_at')
          .eq('id', typedArgs.session_id)
          .single()

        if (!session) throw new Error('Session not found')

        const startTime = new Date(session.started_at)
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)

        const { error } = await supabase
          .from('work_sessions')
          .update({
            ended_at: endTime.toISOString(),
            duration_minutes: durationMinutes,
            summary: typedArgs.summary,
            actions_taken: typedArgs.actions_taken || [],
            criteria_completed: typedArgs.criteria_completed || []
          })
          .eq('id', typedArgs.session_id)

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: `✓ Work session ended. Duration: ${durationMinutes} minutes`
          }]
        }
      }

      case 'get_stats': {
        const { data, error } = await supabase.rpc('get_agent_stats')

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        }
      }

      case 'generate_standup': {
        const date = typedArgs.date || new Date().toISOString().split('T')[0]

        const { data, error } = await supabase
          .rpc('generate_daily_standup', { target_date: date })

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        }
      }

      case 'search_work_items': {
        const { data, error } = await supabase
          .from('work_items')
          .select('*')
          .or(`title.ilike.%${typedArgs.query}%,description.ilike.%${typedArgs.query}%`)
          .order('created_at', { ascending: false })

        if (error) throw error

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }]
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }],
      isError: true
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Raven Agent MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
