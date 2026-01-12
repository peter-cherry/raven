> Archived on 2026-01-12 from SEO_GEO_OPTIMIZATION_TASKS.md. Reason: Review needed - may contain pending tasks

# 🧭 SEO & GEO Optimization Tasks
**Project:** Web App Landing Page
**Role:** Claude Code – Senior SEO Automation Engineer
**Goal:** Implement full SEO + GEO compliance for a 100% search-friendly web app.

---

## 1️⃣ TECHNICAL SEO SETUP

### ✅ Core Markup
- [ ] Add `<meta charset="UTF-8">`, `<meta name="viewport">`
- [ ] Set `lang="en-US"` in `<html>`
- [ ] Add `<link rel="canonical">` for each page
- [ ] Enforce HTTPS redirects
- [ ] Ensure URLs use lowercase-hyphen format

### ✅ Crawlability
- [ ] Create `/robots.txt`
  ```
  User-agent: *
  Allow: /
  Sitemap: https://yourdomain.com/sitemap.xml
  ```
- [ ] Generate dynamic `/sitemap.xml` (daily or on deploy)
- [ ] Add `noindex` for staging environments

### ✅ Performance
- [ ] Enable asset compression (Gzip/Brotli)
- [ ] Serve images as WebP/AVIF
- [ ] Use lazy loading for offscreen images
- [ ] Add cache headers: `Cache-Control: public, max-age=31536000`
- [ ] Audit Core Web Vitals (LCP < 2.5 s, FID < 100 ms, CLS < 0.1)

---

## 2️⃣ ON-PAGE OPTIMIZATION

### ✅ Metadata
- [ ] Add `<title>` (≤ 60 chars) and `<meta description>` (≤ 160 chars)
- [ ] Primary keyword in title, description, first 100 words

### ✅ Header Hierarchy
- [ ] One `<h1>` per page
- [ ] Use logical `<h2>–<h3>` nesting

### ✅ Accessibility
- [ ] All images have descriptive `alt` text
- [ ] Buttons/links have ARIA labels
- [ ] Color contrast passes WCAG AA

### ✅ Internal Linking
- [ ] Link core pages (Home → Signup → About → Contact)
- [ ] Use descriptive anchor text

---

## 3️⃣ STRUCTURED DATA / SCHEMA

### ✅ Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Raven",
  "url": "https://raven-search.com",
  "logo": "https://raven-search.com/logo.png",
  "sameAs": ["https://linkedin.com/company/raven-search"]
}
```
- [ ] Validate in Google Rich Results Test

### ✅ Local Business Schema
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Raven Florida Office",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Miami",
    "addressRegion": "FL",
    "postalCode": "33101",
    "addressCountry": "US"
  },
  "telephone": "+1-305-123-4567"
}
```
- [ ] Add to all regional pages
- [ ] Test via [Search Console → Enhancements]

---

## 4️⃣ GEO OPTIMIZATION

- [ ] Add geo meta tags
  ```html
  <meta name="geo.region" content="US-FL">
  <meta name="geo.placename" content="Miami">
  <meta name="geo.position" content="25.7617;-80.1918">
  <meta name="ICBM" content="25.7617,-80.1918">
  ```
- [ ] Create region pages: `/florida-technicians`, `/new-york-facility-management`
- [ ] Maintain NAP (Name Address Phone) consistency across footer + GBP
- [ ] Embed Google Map for each region
- [ ] Optimize Google Business Profile (photos, categories, updates)

---

## 5️⃣ ANALYTICS & TAGGING

- [ ] Add Google Search Console & submit sitemap
- [ ] Install GA4 + event tracking (form submits, CTA clicks)
- [ ] Integrate Google Tag Manager with data-layer variables: `location`, `language`, `referrer`
- [ ] Configure cookie-consent / privacy banner

---

## 6️⃣ CONTENT STRATEGY

- [ ] Research 10 primary keywords (use GKP/Ahrefs)
- [ ] Create blog template with `meta`, `schema`, and social OG tags
- [ ] Publish 2 posts per week:
  - 1 informational ("How Facility Managers Find Techs")
  - 1 transactional ("Hire HVAC Technicians in Florida")
- [ ] Add author bios + headshots for E-E-A-T
- [ ] Build backlink list (industry directories, guest posts)

---

## 7️⃣ FUTURE-PROOF ENHANCEMENTS

- [ ] Generate programmatic city + trade pages
- [ ] Automate meta titles/descriptions using GPT/Claude
- [ ] Add multilingual support (`hreflang`)
- [ ] Implement voice-search-friendly FAQs (`FAQPage` schema)
- [ ] Add user reviews (`Review` schema)

---

## 8️⃣ LAUNCH VALIDATION CHECKLIST

| Task | Status |
|------|---------|
| Schema passes validation | ☐ |
| Mobile usability test passed | ☐ |
| PageSpeed > 90 | ☐ |
| 404 + 301 redirects configured | ☐ |
| SSL valid on all pages | ☐ |
| Canonicals correct | ☐ |
| Sitemap indexed | ☐ |

---

## 🧩 FILE SUMMARY
| File | Purpose |
|------|----------|
| `/robots.txt` | Crawler rules |
| `/sitemap.xml` | Page discovery |
| `/manifest.json` | PWA metadata |
| `/schema.json` | Structured data |
| `/humans.txt` | Team credibility |
| `/netlify.toml` | Redirects + headers |

---

### 🎯 Completion Definition
> **SEO Score ≥ 90** on PageSpeed Insights
> **All schema validated**
> **Crawlability confirmed** in Google Search Console
> **Regional pages indexed** and ranking by state keywords

---

**Owner:** Claude Code (SEO Engineer)
**Reviewer:** Peter Abdo
**Deadline:** Upon initial landing-page launch
**Version:** v1.0 – November 2025

