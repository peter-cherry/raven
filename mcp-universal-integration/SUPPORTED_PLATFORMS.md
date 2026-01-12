# Supported CMMS Platforms

## 🎯 Universal Integration Status

Your MCP integration now supports **5 platforms** with automatic vendor import, geocoding, and warm dispatch setup.

---

## ✅ Fully Configured Platforms

### 1. MaintainX
- **API Type:** REST API
- **Authentication:** Bearer token (API key)
- **How to Get API Key:** MaintainX Dashboard → Settings → API → Generate API Key
- **Endpoints Available:**
  - ✅ List Vendors (`GET /vendors`)
  - ✅ Get Single Vendor (`GET /vendors/{id}`)
  - ✅ List Users (`GET /users`)
- **Vendor Fields:**
  - Standard: name, emails[], phoneNumbers[]
  - Custom: extraFields (address, city, state, zip, trade, etc.)
- **Smart Features:**
  - ✅ Auto-detects address from custom fields (any naming convention)
  - ✅ Auto-detects trade/specialty from custom fields
  - ✅ Google Maps geocoding
  - ✅ Marks as warm for dispatch
- **Status:** 🟢 **READY TO USE**

---

### 2. UpKeep
- **API Type:** REST API
- **Authentication:** Session token (login with email/password)
- **How to Get Credentials:** Login to UpKeep, use email/password to get session token via API
- **Endpoints Available:**
  - ✅ List Vendors (`GET /vendors`)
  - ✅ Get Single Vendor (`GET /vendors/{id}`)
  - ✅ List Users (`GET /users`)
- **Vendor Fields:**
  - Standard: businessName, email, phoneNumber, businessAddress, website, description
  - Custom: customFieldsVendor[]
- **Smart Features:**
  - ✅ Built-in address field (businessAddress)
  - ✅ Custom fields support
  - ✅ Google Maps geocoding
  - ✅ Marks as warm for dispatch
- **Status:** 🟡 **CONFIGURED** (needs testing with real account)

---

### 3. Monday.com
- **API Type:** GraphQL
- **Authentication:** Bearer token (API token)
- **How to Get API Key:** Monday.com → Account → Admin → API
- **Endpoints Available:**
  - ✅ Query Boards (GraphQL)
  - ✅ Query Items (vendors/contacts stored as board items)
- **Vendor Structure:**
  - Items in boards with custom column_values
  - Each column can store different field types
- **Smart Features:**
  - ✅ GraphQL query support
  - ⚠️ Requires board ID configuration
  - ✅ Custom column mapping
- **Status:** 🟡 **CONFIGURED** (needs custom GraphQL query template)
- **Note:** Monday.com is more flexible but requires knowing which board contains vendors

---

### 4. Limble CMMS
- **API Type:** REST API
- **Authentication:** Basic Auth (username + password)
- **How to Get Credentials:** Use your Limble account username and password
- **Endpoints Available:**
  - ✅ List Vendors (`GET /vendors`)
  - ✅ List Users (`GET /users`)
- **Regional API URLs:**
  - US: `https://api.limblecmms.com`
  - Canada: `https://ca-api.limblecmms.com`
  - Europe: `https://eu-api.limblecmms.com`
  - Australia: `https://au-api.limblecmms.com`
- **Smart Features:**
  - ✅ RESTful API with standard vendor fields
  - ✅ Multi-region support
- **Status:** 🟡 **CONFIGURED** (needs testing with real account)

---

### 5. Jobber
- **API Type:** GraphQL
- **Authentication:** OAuth 2.0
- **How to Get Credentials:** Register app in Jobber Developer Center → Get OAuth credentials
- **Endpoints Available:**
  - ✅ Query Clients (GraphQL - customers/vendors)
- **Vendor Structure:**
  - Clients are the main entity (includes customers and vendors)
  - Custom fields available
- **Smart Features:**
  - ✅ GraphQL support
  - ✅ OAuth 2.0 (most secure)
  - ⚠️ Requires Developer Center account
- **Status:** 🟡 **CONFIGURED** (needs OAuth app registration)
- **Note:** Jobber requires developer account registration at developer.getjobber.com

---

## 🔧 How the Universal Integration Works

### For Any Platform:

1. **User connects their account**
   ```typescript
   integration_connect({
     user_id: "your-user-id",
     platform_name: "upkeep", // or "monday", "limble", "jobber"
     credentials: {
       api_key: "..." // or session_token, oauth_token, etc.
     }
   })
   ```

2. **Analyze vendor data quality**
   ```typescript
   integration_analyze({
     user_id: "your-user-id",
     platform_name: "upkeep"
   })
   ```
   Returns: % of vendors with addresses, field detection, recommendations

3. **Import vendors with geocoding**
   ```typescript
   integration_import_vendors({
     user_id: "your-user-id",
     platform_name: "upkeep",
     geocode_addresses: true,
     mark_as_warm: true
   })
   ```

4. **Vendors are ready for dispatch**
   - Stored in `technicians` table
   - Geocoded with lat/lng
   - Marked as warm (signed_up = true)
   - Tagged with `imported_from` = platform name
   - External ID tracked in `external_systems` JSONB

---

## 📊 Platform Comparison

| Platform | API Type | Auth Type | Vendor Endpoint | Address Field | Custom Fields | Status |
|----------|----------|-----------|-----------------|---------------|---------------|--------|
| **MaintainX** | REST | Bearer | ✅ `/vendors` | Custom (extraFields) | ✅ Flexible | 🟢 Ready |
| **UpKeep** | REST | Session Token | ✅ `/vendors` | ✅ businessAddress | ✅ customFieldsVendor | 🟡 Configured |
| **Monday.com** | GraphQL | Bearer | ✅ boards/items | Custom (column_values) | ✅ Flexible | 🟡 Configured |
| **Limble CMMS** | REST | Basic Auth | ✅ `/vendors` | Standard fields | ✅ Available | 🟡 Configured |
| **Jobber** | GraphQL | OAuth 2.0 | ✅ clients query | Custom fields | ✅ Available | 🟡 Configured |

---

## 🚀 Adding More Platforms

### Easy to Add (No Developer Account Required):

- **Hippo CMMS** - REST API with API key
- **FMX** - REST API with API key
- **Fiix** - REST API with API key
- **MPulse** - REST API with API key
- **Housecall Pro** - REST API with API key

### Requires Developer Account:

- **ServiceTitan** - Need developer partnership
- **Corrigo** - Need API access approval
- **ServiceMax** - Need Salesforce developer account

### Process to Add New Platform:

1. **Discover API** (manual or automated):
   ```typescript
   integration_discover({
     platform_hint: "Hippo CMMS",
     api_docs_url: "https://api.hippocmms.com/docs"
   })
   ```

2. **Insert Platform Config**:
   ```sql
   INSERT INTO integration_platforms (name, display_name, api_base_url, auth_config, endpoints, schema_mapping)
   VALUES (...);
   ```

3. **Test Connection**:
   - User provides credentials
   - Call API to verify
   - Test vendor import

4. **Deploy**: Platform is now available to all users

**Time to Add:** ~15-30 minutes per platform

---

## 🎯 Next Steps

1. ✅ **MaintainX** - Import your CSV, test the full flow
2. **UpKeep** - Get test account, validate vendor import
3. **Monday.com** - Create test board with vendor items
4. **Limble** - Test with trial account
5. **Jobber** - Register developer app, test OAuth flow

---

## 💡 Universal Integration Advantage

**Before:** Each CMMS required custom integration code
**After:** 5 platforms configured, new platforms add in 15-30 min

**User Experience:**
1. Select platform from dropdown
2. Enter API key (or OAuth login)
3. Click "Import Vendors"
4. Vendors geocoded and ready for dispatch

**Developer Experience:**
1. Fetch API docs
2. Configure endpoints + field mappings
3. Insert into database
4. Platform available to all users

**Your integration is now TRULY UNIVERSAL! 🎉**
