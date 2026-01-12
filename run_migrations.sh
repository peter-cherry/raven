#!/bin/bash

source .env.local

echo "Running Migration 3: Dispatch System..."

curl -X POST "https://utpmtlzqpyewpwzgsbdu.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat supabase/migrations/20251023_dispatch_system.sql | sed 's/"/\\"/g' | tr '\n' ' ')\"}"

echo -e "\n\nDone!"
