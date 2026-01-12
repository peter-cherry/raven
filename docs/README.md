# Hybrid Dispatch System Documentation

Complete documentation for the SendGrid (warm) + Instantly (cold) dispatch system.

---

## 📚 Documentation Index

### 🚀 Getting Started

**[Quick Start Guide](./HYBRID_DISPATCH_QUICKSTART.md)** - Start here!
- 5-minute setup guide
- Minimum viable configuration
- Basic testing steps
- Perfect for local development

### 📖 Complete Guides

**[Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md)**
- Full system overview
- Architecture diagram
- All files created/modified
- Deployment steps
- Maintenance guidelines

**[SendGrid Template Setup](./SENDGRID_TEMPLATE_SETUP.md)**
- Step-by-step template creation
- Domain verification
- DNS configuration (SPF, DKIM, DMARC)
- Template variables reference
- Troubleshooting

**[Environment Variables](./ENVIRONMENT_VARIABLES.md)**
- Complete `.env.local` example
- SendGrid configuration
- Instantly configuration
- Security best practices
- Verification checklist

**[Testing Guide](./HYBRID_DISPATCH_TESTING.md)**
- Test data setup SQL scripts
- 5 comprehensive testing scenarios
- Performance testing
- Monitoring queries
- Troubleshooting guide

---

## 🗺️ Quick Navigation

### I want to...

**...set up the system quickly**
→ [Quick Start Guide](./HYBRID_DISPATCH_QUICKSTART.md)

**...understand how it works**
→ [Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md) → Architecture section

**...configure SendGrid**
→ [SendGrid Template Setup](./SENDGRID_TEMPLATE_SETUP.md)

**...configure Instantly**
→ [Environment Variables](./ENVIRONMENT_VARIABLES.md) → Instantly section

**...test the system**
→ [Testing Guide](./HYBRID_DISPATCH_TESTING.md)

**...troubleshoot an issue**
→ [Testing Guide](./HYBRID_DISPATCH_TESTING.md) → Troubleshooting section

**...deploy to production**
→ [Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md) → Deployment Steps

---

## 📋 Implementation Checklist

Use this to track your progress:

### Database
- [ ] Apply migration `20251024_add_warm_cold_tracking.sql`
- [ ] Verify new columns exist (`technicians.signed_up`, etc.)
- [ ] Test helper functions work

### SendGrid
- [ ] Create account
- [ ] Verify sender domain
- [ ] Create email template
- [ ] Get API key
- [ ] Add environment variables
- [ ] Test send email

### Instantly (Optional)
- [ ] Create account
- [ ] Warm up sending email (14-21 days)
- [ ] Create campaigns
- [ ] Get API key and campaign IDs
- [ ] Add environment variables
- [ ] Test add lead to campaign

### Edge Functions
- [ ] Deploy `dispatch-work-order` function
- [ ] Deploy `track-email-open` function
- [ ] Set environment secrets in Supabase
- [ ] Test functions via Supabase dashboard

### Frontend
- [ ] Verify DispatchLoader component renders
- [ ] Test warm/cold split display
- [ ] Verify real-time updates work
- [ ] Check progress bars animate

### Testing
- [ ] Create test warm technician
- [ ] Create test cold technician
- [ ] Test warm dispatch (SendGrid)
- [ ] Test cold dispatch (Instantly)
- [ ] Test mixed dispatch
- [ ] Test email open tracking
- [ ] Test UI real-time updates

### Production
- [ ] Configure production environment variables
- [ ] Set up monitoring dashboards
- [ ] Configure error alerting
- [ ] Train team on new system
- [ ] Document rollback plan
- [ ] Go live!

---

## 🎯 System Overview

### What It Does

Automatically routes work order dispatch emails to technicians via two channels:

- **🔥 Warm (SendGrid)**: Immediate transactional emails for opted-in technicians
- **❄️ Cold (Instantly)**: Scheduled cold outreach for first-time contacts

### How It Routes

```
Technician.signed_up = true  → SendGrid   (warm)
Technician.signed_up = false → Instantly  (cold)
```

### What You Get

- Separate tracking for warm vs cold performance
- Real-time UI showing split stats
- Higher deliverability for warm emails
- Compliant cold outreach via Instantly
- Detailed analytics for both channels

---

## 📊 Key Metrics

### Target Performance

| Metric | Warm (SendGrid) | Cold (Instantly) |
|--------|-----------------|------------------|
| Delivery Rate | > 99% | > 85% |
| Open Rate | > 80% | > 30% |
| Reply Rate | > 15% | > 5% |
| Dispatch Speed | < 5 sec | Scheduled |

---

## 🔧 Tech Stack

- **Database**: Supabase (PostgreSQL)
- **Warm Dispatch**: SendGrid API with Dynamic Templates
- **Cold Dispatch**: Instantly.ai API
- **Frontend**: Next.js 15 + React
- **Real-time**: Supabase Realtime
- **Edge Functions**: Deno (Supabase Functions)

---

## 📁 Project Structure

```
/supabase/migrations/
  └─ 20251024_add_warm_cold_tracking.sql    # Database schema

/supabase/functions/
  ├─ dispatch-work-order/
  │  └─ index.ts                            # Main dispatch logic
  └─ track-email-open/
     └─ index.ts                            # Email open tracking

/components/
  └─ DispatchLoader.tsx                     # UI component

/docs/
  ├─ HYBRID_DISPATCH_QUICKSTART.md          # Quick setup guide
  ├─ HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md  # Full docs
  ├─ SENDGRID_TEMPLATE_SETUP.md             # SendGrid guide
  ├─ ENVIRONMENT_VARIABLES.md               # Env var reference
  └─ HYBRID_DISPATCH_TESTING.md             # Testing guide
```

---

## 🆘 Support

### Documentation

All questions should be answered in these docs:

1. **Setup questions** → [Quick Start](./HYBRID_DISPATCH_QUICKSTART.md)
2. **Configuration questions** → [Environment Variables](./ENVIRONMENT_VARIABLES.md)
3. **SendGrid questions** → [SendGrid Setup](./SENDGRID_TEMPLATE_SETUP.md)
4. **Testing questions** → [Testing Guide](./HYBRID_DISPATCH_TESTING.md)
5. **Technical questions** → [Implementation Summary](./HYBRID_DISPATCH_IMPLEMENTATION_SUMMARY.md)

### External Resources

- SendGrid Docs: https://docs.sendgrid.com
- Instantly Docs: https://help.instantly.ai
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

## 🚀 Quick Commands

### Database Migration

```sql
-- Run in Supabase SQL Editor
-- Copy from: supabase/migrations/20251024_add_warm_cold_tracking.sql
```

### Deploy Edge Functions

```bash
supabase functions deploy dispatch-work-order
supabase functions deploy track-email-open
```

### Test Dispatch

```sql
-- Create test warm technician
INSERT INTO technicians (full_name, email, trade, signed_up)
VALUES ('Test Tech', 'your@email.com', 'HVAC', true);

-- Dispatch to all matching techs
SELECT * FROM dispatch_work_order(
  json_build_object('job_id', 'YOUR_JOB_ID')
);
```

---

## ✅ Status

- **Implementation**: ✅ Complete
- **Documentation**: ✅ Complete
- **Testing**: ⏳ Ready for you
- **Production**: ⏳ Awaiting your configuration

---

**Last Updated**: October 24, 2025

**Version**: 1.0.0

**Maintained By**: Raven Search Team
