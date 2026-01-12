import type { Metadata } from 'next'
import OperatorsLandingClient from './OperatorsLandingClient'

export const metadata: Metadata = {
  title: 'Facility Managers - Find Vetted Technicians | Raven',
  description: 'Used by 350+ facilities. Save 30% on maintenance costs. Find licensed technicians in minutes, not days. No hidden fees, transparent pricing, real-time tracking.',
  keywords: 'facility management, building maintenance, contractor marketplace, facility operations, property maintenance, commercial maintenance, technician network, maintenance platform',
  openGraph: {
    title: 'Facility Managers - Find Vetted Technicians | Raven',
    description: 'Save 30% on maintenance costs. Find licensed technicians in minutes. Used by 350+ facilities.',
    images: ['/og-operators.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Facility Managers - Find Vetted Technicians | Raven',
    description: 'Save 30% on maintenance costs. Find licensed technicians in minutes.',
    images: ['/og-operators.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://ravenwork.com/operators',
  },
}

export default function OperatorsLanding() {
  return <OperatorsLandingClient />
}
