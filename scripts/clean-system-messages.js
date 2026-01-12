require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function cleanSystemMessages() {
  console.log('Cleaning up old system messages...')
  
  // Delete all messages with role='system'
  const { data, error } = await supabase
    .from('conversation_messages')
    .delete()
    .eq('role', 'system')
  
  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  
  console.log('✅ Successfully deleted all system role messages')
  console.log('The agent will now run without errors!')
  process.exit(0)
}

cleanSystemMessages()
