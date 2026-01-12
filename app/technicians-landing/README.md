# 👷 Technicians Landing Page

**Owner:** Claude #1
**Status:** In Development
**Goal:** High-converting landing page for technicians to sign up

---

## 🎯 Objective

Create a landing page that converts skilled trade technicians (HVAC, plumbing, electrical, etc.) to register on the Raven platform.

---

## 📁 Directory Structure

```
technicians/
├── landing.tsx              # Main landing page
├── components/
│   ├── HeroSection.tsx      # Above-the-fold hero
│   ├── BenefitsSection.tsx  # Why join Raven
│   ├── HowItWorks.tsx       # 3-step process
│   ├── TestimonialsSection.tsx # Social proof
│   ├── FeaturesSection.tsx  # Platform features
│   ├── FAQSection.tsx       # Common questions
│   └── CTASection.tsx       # Final conversion
├── assets/
│   ├── images/              # Hero images, testimonials
│   └── icons/               # Feature icons
└── styles/
    └── technicians.module.css # Page-specific styles
```

---

## 🎨 Design Guidelines

**Must Use:**
- Design system tokens from `/frameworks/design-system/`
- Landing page framework from `/frameworks/landing-page/`
- SEO-GEO module from `/frameworks/seo-geo/`

**Do NOT:**
- Modify any files in `/pages/operators/`
- Create duplicate components (use frameworks)
- Hardcode any values (use CSS variables)

---

## 📝 Copywriting Strategy

**Target Audience:** Skilled trade technicians looking for more work

**Pain Points to Address:**
1. Finding consistent work
2. Dealing with unreliable job platforms
3. Low pay from middlemen
4. Lack of control over schedule

**Value Propositions:**
1. Get matched to local jobs instantly
2. Set your own rates
3. Build your reputation
4. Get paid faster

**Tone:** Professional, trustworthy, empowering

---

## ✅ Deliverables Checklist

- [ ] landing.tsx (main page component)
- [ ] HeroSection.tsx with PAS formula
- [ ] BenefitsSection.tsx with 3 core benefits
- [ ] HowItWorks.tsx (3-step process)
- [ ] TestimonialsSection.tsx with 5 testimonials
- [ ] FeaturesSection.tsx (platform features)
- [ ] FAQSection.tsx with 7 questions
- [ ] CTASection.tsx with urgency element
- [ ] Mobile-responsive (< 768px breakpoint)
- [ ] SEO metadata configured
- [ ] Schema markup added
- [ ] Conversion tracking events

---

## 🚀 Launch Criteria

- [ ] PageSpeed score ≥ 90
- [ ] All images optimized (WebP)
- [ ] Forms work on all devices
- [ ] CTA buttons track conversions
- [ ] A/B test variants prepared

---

**Last Updated:** November 11, 2025
**Version:** 1.0
