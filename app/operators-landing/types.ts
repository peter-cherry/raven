// TypeScript interfaces for Operators Landing Page

export interface CaseStudy {
  id: string
  companyName: string
  industry: string
  facilitySize: string
  problem: string
  solution: string
  results: {
    costSavings: string
    timeSaved: string
    satisfactionScore: number
  }
  testimonial: string
  contactName: string
  contactTitle: string
}

export interface Feature {
  id: string
  title: string
  description: string
  benefit: string
  screenshotUrl?: string
}

export interface ValueProposition {
  id: string
  title: string
  description: string
  metric: string
  icon: React.ReactNode
}

export interface HowItWorksStep {
  id: string
  stepNumber: number
  title: string
  description: string
  timeEstimate: string
  icon: React.ReactNode
}

export interface FAQItem {
  id: string
  question: string
  answer: string
}

export interface PricingTier {
  id: string
  name: string
  description: string
  price: string
  features: string[]
  isPopular?: boolean
}

export interface ROICalculatorProps {
  averageMonthlyJobs: number
  averageJobCost: number
}

export interface TrustIndicator {
  label: string
  value: string
}
