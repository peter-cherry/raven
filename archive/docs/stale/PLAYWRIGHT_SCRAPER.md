> Archived on 2026-01-12 from PLAYWRIGHT_SCRAPER.md. Reason: Historical feature documentation

# Playwright Web Scraper for Technician Recruitment

## Overview

The Playwright scraper enables you to scrape technician contact information from Google search results for specific locations. This is used for cold outreach campaigns to recruit new technicians to the Ravensearch platform.

---

## How It Works

### 1. **User Input**
Admin specifies:
- **Trade**: Handyman, HVAC, Plumbing, or Electrical
- **City**: e.g., "Los Angeles", "Miami", "Chicago"
- **State**: e.g., "CA", "FL", "IL"
- **Max Results**: Number of businesses to scrape (default: 20)

### 2. **Scraping Process**
The edge function (`scrape-with-playwright`):
1. Builds search queries like "HVAC contractor in Los Angeles, CA"
2. Fetches Google search HTML results
3. Parses HTML to extract:
   - Business names
   - Phone numbers
   - Addresses
   - Websites (if available)
4. Deduplicates results
5. Inserts into `outreach_targets` table

### 3. **Database Storage**
Each scraped business is stored as an outreach target:
```sql
{
  source_table: 'google_scrape',
  business_name: 'ABC Plumbing Services',
  address: '123 Main St, Los Angeles, CA 90001',
  phone: '(555) 123-4567',
  website: 'https://abcplumbing.com',
  city: 'Los Angeles',
  state: 'CA',
  trade_type: 'Plumbing',
  status: 'pending',
  email_found: false
}
```

---

## Scraping Methods

### Method 1: Direct HTML Scraping (Default)
**Pros:**
- ✅ Free
- ✅ No API keys required
- ✅ Works immediately

**Cons:**
- ⚠️ HTML parsing can be fragile
- ⚠️ Limited data (no ratings, reviews)
- ⚠️ May get rate-limited by Google

**How it works:**
1. Fetches Google search page HTML
2. Uses regex to extract business names, phones, addresses
3. Returns basic contact data

### Method 2: SerpAPI (Optional, Paid)
**Pros:**
- ✅ Structured JSON data
- ✅ More reliable
- ✅ Includes ratings, review count, exact locations
- ✅ No rate limiting
- ✅ Better quality data

**Cons:**
- ❌ Requires paid API key ($50-150/month)
- ❌ Costs $0.002-0.005 per search

**How to enable:**
1. Sign up at https://serpapi.com
2. Get API key
3. Add to environment: `SERPAPI_KEY=your_key_here`
4. Set `useSerpAPI: true` in API call

---

## Usage

### Via Admin UI

1. Go to **Admin → Outreach → Targets**
2. Click **"🔍 Collect Technicians"**
3. Fill form:
   - Source: Google Places (auto-selected)
   - Trade: HVAC, Plumbing, Electrical, or Handyman
   - City: Los Angeles
   - State: CA
4. Click **"Start Collection"**
5. Wait 10-30 seconds
6. View results in Targets table

### Via API

**Endpoint:** `POST /functions/v1/scrape-with-playwright`

**Request:**
```json
{
  "trade": "HVAC",
  "city": "Miami",
  "state": "FL",
  "maxResults": 20,
  "useSerpAPI": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "results_found": 18,
  "inserted": 15,
  "duplicates": 3,
  "businesses": [
    {
      "name": "ABC HVAC Services",
      "address": "123 Ocean Dr, Miami, FL 33139",
      "phone": "(305) 555-1234",
      "website": null,
      "rating": null,
      "reviewCount": null
    }
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Failed to fetch Google search results"
}
```

---

## Trade-Specific Search Terms

The scraper uses multiple search terms per trade to maximize coverage:

```typescript
{
  Handyman: [
    "handyman services",
    "handyman",
    "home repair services"
  ],
  HVAC: [
    "HVAC contractor",
    "air conditioning repair",
    "heating repair"
  ],
  Plumbing: [
    "plumber",
    "plumbing services",
    "emergency plumber"
  ],
  Electrical: [
    "electrician",
    "electrical contractor",
    "electrical services"
  ]
}
```

Each term generates a separate Google search, then results are deduplicated.

---

## Deployment

### 1. Deploy Edge Function

```bash
cd supabase/functions
supabase functions deploy scrape-with-playwright
```

### 2. Set Environment Variables (Optional for SerpAPI)

```bash
supabase secrets set SERPAPI_KEY=your_api_key_here
```

### 3. Test

```bash
curl -X POST https://your-project.supabase.co/functions/v1/scrape-with-playwright \
  -H "Content-Type: application/json" \
  -d '{
    "trade": "Plumbing",
    "city": "Austin",
    "state": "TX",
    "maxResults": 10
  }'
```

---

## Rate Limiting & Best Practices

### Scraping Etiquette

1. **Delay Between Requests**: 2-second delay between searches
2. **Reasonable Volume**: Scrape 10-50 businesses per location
3. **User-Agent**: Uses realistic browser user agent
4. **Respect robots.txt**: Don't scrape excessively

### Google's Stance

- **Public Data**: Business listings on Google are considered public information
- **Terms of Service**: Google's ToS technically prohibit automated scraping
- **Gray Area**: Many businesses use this method for lead generation
- **Risk**: Very low if used responsibly (small volume, delays)

### Legal Considerations

✅ **Legal:**
- Scraping publicly available business contact info
- Small-scale lead generation
- B2B outreach purposes

⚠️ **Gray Area:**
- Automated Google scraping (technically against ToS)
- Large-scale scraping (thousands per day)

❌ **Illegal:**
- Scraping personal data (emails from social media)
- Violating GDPR/CCPA (if applicable)
- Reselling scraped data

**Recommendation**: Use SerpAPI for production (fully compliant, structured data, no ToS violations).

---

## Troubleshooting

### Issue: No results returned

**Possible causes:**
1. Google is blocking requests (rate limit)
2. Search term doesn't match any businesses
3. City/state not recognized

**Solutions:**
- Try different city name (use full name: "Los Angeles" not "LA")
- Reduce `maxResults` to avoid rate limits
- Wait 5-10 minutes and try again
- Use SerpAPI instead of direct scraping

### Issue: Duplicate entries

**Why:** Same business already exists in database

**Solution:**
- The scraper automatically skips duplicates
- Check `duplicates` count in response
- Duplicates are identified by `source_id` (unique per scrape)

### Issue: Missing data (no phone/address)

**Why:** HTML parsing couldn't extract all fields

**Solutions:**
1. Use SerpAPI for better data quality
2. Run email enrichment to fill missing contact info
3. Manually update high-value leads

---

## Next Steps After Scraping

### 1. Email Enrichment
Scraped businesses often don't have emails. Run email enrichment:

```bash
# Trigger enrichment edge function
supabase functions invoke enrich-emails --data '{
  "batchSize": 50
}'
```

### 2. Create Outreach Campaign
1. Go to **Admin → Outreach → Campaigns**
2. Click **"+ New Campaign"**
3. Connect Instantly campaign
4. Filter by trade and state
5. Dispatch emails to enriched leads

### 3. Monitor Results
- Track opens, clicks, replies in Instantly dashboard
- View stats in Ravensearch Admin → Outreach
- Follow up with interested leads

---

## File Locations

```
/supabase/functions/scrape-with-playwright/index.ts  # Edge function
/app/admin/outreach/page.tsx                         # UI integration (line 155-186)
/supabase/migrations/20251017_outreach_schema.sql    # Database schema
```

---

## API Reference

### `POST /scrape-with-playwright`

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trade` | string | ✅ | One of: Handyman, HVAC, Plumbing, Electrical |
| `city` | string | ✅ | City name (e.g., "Los Angeles") |
| `state` | string | ✅ | 2-letter state code (e.g., "CA") |
| `maxResults` | number | ❌ | Max businesses to scrape (default: 20) |
| `useSerpAPI` | boolean | ❌ | Use SerpAPI instead of direct scraping (default: false) |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether scraping succeeded |
| `results_found` | number | Total businesses found |
| `inserted` | number | New businesses added to database |
| `duplicates` | number | Businesses skipped (already exist) |
| `businesses` | array | First 5 businesses (preview) |
| `error` | string | Error message (if failed) |

---

## Cost Analysis

### Option 1: Direct Scraping (Current)
- **Cost**: $0
- **Effort**: Medium (HTML parsing)
- **Reliability**: 70-80%
- **Data Quality**: Basic (name, phone, address)

### Option 2: SerpAPI
- **Cost**: $50-150/month (depends on volume)
- **Effort**: Low (structured JSON)
- **Reliability**: 99%+
- **Data Quality**: High (ratings, reviews, exact coords)

**Recommendation for Production**: Start with free scraping, upgrade to SerpAPI once you're scraping 100+ businesses/day.

---

## Future Enhancements

- [ ] Add Yelp scraping (using Yelp Fusion API)
- [ ] Add Angie's List scraping
- [ ] Implement Playwright headless browser for JS-rendered sites
- [ ] Add automatic retry logic for failed scrapes
- [ ] Implement proxy rotation for higher volume
- [ ] Add business verification (check if phone/website valid)
- [ ] Scrape social media profiles (LinkedIn, Facebook)

---

**Built with Claude Code** 🤖
Ready to recruit technicians at scale! 🚀

