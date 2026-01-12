# Complete MCP Universal Integration Usage Guide

## 🎯 **Complete Vendor Import Flow**

### **Overview**

This guide covers the complete end-to-end flow for importing vendors from MaintainX with automatic address detection, geocoding, and warm dispatch setup.

---

## 📋 **Prerequisites**

1. **MaintainX Account**
   - API key generated (Settings → API)
   - Your key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Google Maps API Key** (for geocoding)
   - Create at: https://console.cloud.google.com/google/maps-apis
   - Enable Geocoding API
   - Add to `.env`: `GOOGLE_MAPS_API_KEY=your_key_here`

3. **Supabase Database**
   - Run `add-vendors-endpoint.sql` to add vendors endpoint config
   - Verify: `SELECT * FROM integration_platforms WHERE name = 'maintainx'`

---

## 🚀 **Step-by-Step Usage**

### **Step 1: Connect to MaintainX**

```typescript
// From Next.js API route or MCP client
const result = await callMCPTool('integration_connect', {
  user_id: 'your-supabase-user-id',
  platform_name: 'maintainx',
  credentials: {
    api_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})

// Response:
{
  "success": true,
  "platform_name": "maintainx",
  "connection_status": "active",
  "message": "✅ Successfully connected to MaintainX"
}
```

**What happens:**
- Stores encrypted API key in `integration_credentials` table
- Tests connection by calling MaintainX API
- Logs connection in `integration_sync_logs`

---

### **Step 2: Analyze Vendor Data (RECOMMENDED FIRST)**

```typescript
const analysis = await callMCPTool('integration_analyze', {
  user_id: 'your-supabase-user-id',
  platform_name: 'maintainx'
})

// Example Response:
{
  "platform_name": "maintainx",
  "analysis": {
    "total_vendors": 50,
    "vendors_with_addresses": 45,
    "vendors_without_addresses": 5,
    "detected_address_fields": ["address", "city", "state", "zip"],
    "detected_trade_fields": ["specialty", "service_type"],
    "ready_to_import": true,
    "recommendations": [
      "✅ 90% of vendors (45/50) have address data.",
      "⚠️ 5 vendors are missing addresses. You can:",
      "   1. Add address custom fields in MaintainX for missing vendors",
      "   2. Import vendors with addresses now, add others later"
    ]
  },
  "next_steps": "Ready to import vendors with addresses"
}
```

**What this tells you:**
- ✅ **90% ready** - Most vendors have addresses, proceed with import
- ⚠️ **< 50% ready** - Need to add address custom fields in MaintainX first
- ❌ **0% ready** - No vendors have addresses, see "No Address Fields" section below

---

### **Step 3: Import Vendors with Automatic Geocoding**

```typescript
const importResult = await callMCPTool('integration_import_vendors', {
  user_id: 'your-supabase-user-id',
  platform_name: 'maintainx',
  geocode_addresses: true,  // Auto-geocode (default)
  mark_as_warm: true  // Mark for warm dispatch (default)
})

// Example Response:
{
  "success": true,
  "imported_count": 45,
  "skipped_count": 2,
  "total_processed": 50,
  "vendors_with_addresses": 45,
  "vendors_without_addresses": 5,
  "duration_ms": 12450,
  "vendors": [
    {
      "id": "uuid-1",
      "name": "ABC HVAC Services",
      "external_id": "123456",
      "has_address": true,
      "trade": "HVAC"
    },
    // ... more vendors
  ],
  "needs_address": [
    {
      "id": "uuid-2",
      "name": "XYZ Plumbing",
      "external_id": "789012"
    }
  ],
  "message": "✅ Imported 45 vendors from MaintainX\n⚠️ 5 vendors need address completion"
}
```

**What happens:**
1. Fetches all vendors from MaintainX `/vendors` endpoint
2. **Smart field detection** - Detects address regardless of field name:
   - Tries: `address`, `street`, `location`, `vendor_address`, etc.
   - Also tries: `city` + `state` + `zip` combination
3. **Geocodes each address** using Google Maps API
4. **Extracts trade** from custom fields (if available)
5. **Marks as warm** (`signed_up = true`) for dispatch
6. Stores in `technicians` table with:
   - `lat`, `lng` (geocoded coordinates)
   - `address_text` (full formatted address)
   - `trade_needed` (detected trade)
   - `signed_up = true` (warm dispatch eligible)
   - `external_systems.maintainx` (vendor ID for sync)

---

### **Step 4: Verify Import in Database**

```sql
-- Check imported vendors
SELECT
  name,
  email,
  phone,
  address_text,
  lat,
  lng,
  trade_needed,
  signed_up,
  imported_from,
  external_systems->>'maintainx' as maintainx_id
FROM technicians
WHERE user_id = 'your-user-id'
  AND imported_from = 'maintainx';

-- Result:
┌───────────────────────┬──────────────────┬────────────┬─────────────────────────────────┬──────────┬────────────┬──────────┬───────────┬──────────────┬──────────────┐
│ name                  │ email            │ phone      │ address_text                    │ lat      │ lng        │ trade    │ signed_up │ imported_from│ maintainx_id │
├───────────────────────┼──────────────────┼────────────┼─────────────────────────────────┼──────────┼────────────┼──────────┼───────────┼──────────────┼──────────────┤
│ ABC HVAC Services     │ abc@hvac.com     │ 555-1234   │ 1234 Main St, Los Angeles, CA   │ 34.0522  │ -118.2437  │ HVAC     │ true      │ maintainx    │ 123456       │
│ XYZ Plumbing Co       │ xyz@plumb.com    │ 555-5678   │ 5678 Oak Ave, Los Angeles, CA   │ 34.0695  │ -118.4455  │ Plumbing │ true      │ maintainx    │ 789012       │
│ Best Electrical       │ best@elec.com    │ 555-9012   │ 9012 Pine Rd, Glendale, CA      │ 34.1425  │ -118.2551  │ Electric │ true      │ maintainx    │ 345678       │
└───────────────────────┴──────────────────┴────────────┴─────────────────────────────────┴──────────┴────────────┴──────────┴───────────┴──────────────┴──────────────┘
```

---

### **Step 5: Create Work Order and Auto-Dispatch**

Now when a work order is created, your existing matching and dispatch system automatically works:

```typescript
// User creates work order in your Next.js app
const { data: job } = await supabase.from('jobs').insert({
  trade_needed: 'HVAC',
  lat: 34.0522,
  lng: -118.2437,
  address_text: '100 Universal City Plaza, Los Angeles, CA'
}).select().single()

// Call existing matching function
await supabase.rpc('find_matching_technicians', {
  p_job_id: job.id,
  p_max_distance_m: 50000  // 50km radius
})

// This populates job_candidates with:
// - ABC HVAC Services (2.3 mi away, match_score: 0.95)
// - Other HVAC vendors within 50km

// Trigger existing dispatch function
const dispatchResponse = await fetch(`${SUPABASE_URL}/functions/v1/dispatch-work-order`, {
  method: 'POST',
  body: JSON.stringify({ job_id: job.id })
})

// Dispatch automatically sends:
// - Warm emails via SendGrid to imported vendors (signed_up = true)
// - Personal, professional emails
// - Real-time tracking in DispatchLoader UI
```

---

## ⚠️ **Handling Vendors Without Addresses**

### **Option A: Add Custom Fields in MaintainX (Recommended)**

If vendors don't have address custom fields:

1. Go to MaintainX → Settings → Vendor Settings → Custom Fields
2. Click "Add Custom Field"
3. Create field:
   - Field Name: `address`
   - Field Type: Text
4. Fill in vendor addresses
5. Re-run `integration_import_vendors`

### **Option B: Add Addresses in Your System**

```typescript
// After import, update vendors without addresses
const vendorsNeedingAddress = importResult.needs_address

// Show UI to user, collect addresses, then:
for (const vendor of vendorsNeedingAddress) {
  const userProvidedAddress = "1234 Main St, Los Angeles, CA"

  // Geocode
  const geocoded = await geocodeAddress(userProvidedAddress)

  // Update
  await supabase.from('technicians').update({
    address_text: geocoded.formatted_address,
    lat: geocoded.lat,
    lng: geocoded.lng,
    needs_address_completion: false
  }).eq('id', vendor.id)
}
```

### **Option C: Use Organization Default Location**

```typescript
// Import vendors without addresses to org headquarters
const { data: org } = await supabase
  .from('organizations')
  .select('headquarters_lat, headquarters_lng')
  .eq('id', org_id)
  .single()

// Set default location for vendors without addresses
await supabase.from('technicians').update({
  lat: org.headquarters_lat,
  lng: org.headquarters_lng,
  location_type: 'organization_default'
}).eq('user_id', user_id).eq('needs_address_completion', true)
```

---

## 🔄 **Re-Importing / Syncing**

To keep vendor data in sync:

```typescript
// Re-run import (updates existing, adds new)
await callMCPTool('integration_import_vendors', {
  user_id: 'your-user-id',
  platform_name: 'maintainx'
})

// The tool automatically:
// - Updates existing vendors (matched by external_systems.maintainx ID)
// - Adds new vendors
// - Preserves manually-added data
```

---

## 📊 **Complete Data Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. USER CONNECTS MAINTAINX                    │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│          2. ANALYZE (Optional but Recommended)                   │
│  ➜ Scans all vendors                                             │
│  ➜ Detects: 45/50 have addresses (90%)                           │
│  ➜ Returns: "Ready to import"                                    │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. IMPORT VENDORS                             │
│  ➜ Fetch vendors from MaintainX API                             │
│  ➜ Extract address from extraFields (smart detection)            │
│  ➜ Geocode: "1234 Main St, LA, CA" → (34.0522, -118.2437)       │
│  ➜ Extract trade: "HVAC"                                         │
│  ➜ Mark as warm: signed_up = true                                │
│  ➜ Insert into technicians table                                 │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│              4. WORK ORDER CREATED (Your App)                    │
│  ➜ Job: HVAC needed at (34.0522, -118.2437)                     │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│         5. MATCHING (find_matching_technicians RPC)              │
│  ➜ Filter: trade_needed = 'HVAC'                                 │
│  ➜ Filter: is_available = true                                   │
│  ➜ Filter: has lat/lng                                           │
│  ➜ Calculate: Haversine distance                                 │
│  ➜ Score: distance-based (0-1)                                   │
│  ➜ Result: 5 HVAC vendors within 50km                            │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│          6. DISPATCH (dispatch-work-order function)              │
│  ➜ Split: 5 warm (signed_up = true from import)                 │
│  ➜ SendGrid: Send personalized emails                            │
│  ➜ Track: work_order_recipients table                            │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────────────────────────────┐
│            7. REAL-TIME UI (DispatchLoader)                      │
│  ➜ Shows: "5 sent, 2 opened, 1 replied"                         │
│  ➜ Updates: Real-time via Supabase subscriptions                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Success Criteria**

Your integration is 100% successful when:

✅ **Analysis shows ready to import**
- `vendors_with_addresses > 70%` of total

✅ **Import completes with addresses**
- Imported vendors have `lat`, `lng` populated
- `signed_up = true` (marked as warm)

✅ **Matching finds vendors**
- `find_matching_technicians` populates `job_candidates`
- Vendors sorted by distance

✅ **Dispatch sends warm emails**
- Vendors receive personalized SendGrid emails
- Tracking shows "warm_sent" count

✅ **Real-time UI updates**
- DispatchLoader shows live stats
- Technician replies trigger AI qualification

---

## 🔧 **Troubleshooting**

### **Analysis shows 0% vendors with addresses**

**Problem:** MaintainX vendors don't have address custom fields configured.

**Solution:**
1. Add "address" custom field in MaintainX
2. Fill in vendor addresses
3. Re-run analysis

### **Geocoding fails**

**Problem:** Google Maps API key not set or invalid.

**Solution:**
```bash
# Check .env file
cat .env | grep GOOGLE_MAPS_API_KEY

# Should show: GOOGLE_MAPS_API_KEY=AIzaSy...

# If missing, add it:
echo "GOOGLE_MAPS_API_KEY=your_key_here" >> .env

# Rebuild MCP server
npm run build
```

### **Vendors imported but not matched to jobs**

**Problem:** Vendors missing `trade_needed` or coordinates.

**Solution:**
```sql
-- Check imported vendors
SELECT name, trade_needed, lat, lng
FROM technicians
WHERE imported_from = 'maintainx';

-- Fix missing trade
UPDATE technicians
SET trade_needed = 'HVAC'
WHERE imported_from = 'maintainx' AND trade_needed IS NULL;

-- Fix missing coordinates (re-import or manually geocode)
```

### **Dispatch sends cold emails instead of warm**

**Problem:** Vendors not marked as `signed_up = true`.

**Solution:**
```sql
-- Mark imported vendors as warm
UPDATE technicians
SET signed_up = true,
    signup_source = 'maintainx_import'
WHERE imported_from = 'maintainx' AND signed_up IS NULL;
```

---

## 📚 **API Reference**

### **Tools Available**

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `integration_discover` | Find platform config | First time setup |
| `integration_connect` | Store API credentials | Before any import |
| `integration_analyze` | Scan vendor data | Before importing (recommended) |
| `integration_import_vendors` | Import with geocoding | Main import tool |
| `integration_import_technicians` | Import internal users | For employees (not vendors) |
| `integration_map_schema` | Test field mapping | Debugging custom fields |

---

## 🎉 **You're Done!**

Your MCP universal integration is now complete with:

✅ Smart address field detection (handles any field naming)
✅ Automatic geocoding (Google Maps API)
✅ Warm dispatch marking (vendors ready for SendGrid)
✅ Trade extraction (auto-categorization)
✅ Real-time sync tracking (logs every operation)
✅ Duplicate handling (updates existing vendors)

**Next Steps:**
1. Build Next.js UI for import workflow
2. Add "Complete Vendor Profiles" page for vendors without addresses
3. Set up automatic re-sync (daily cron job)
4. Add webhook listeners for real-time MaintainX updates
