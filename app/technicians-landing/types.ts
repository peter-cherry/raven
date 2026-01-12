export interface Testimonial {
  id: string
  name: string
  trade: string
  city: string
  rating: number
  quote: string
  image: string
  result: string
}

export interface Benefit {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export interface Feature {
  id: string
  title: string
  description: string
  benefit: string
  icon: React.ReactNode
}

export interface Step {
  id: string
  number: number
  title: string
  description: string
  icon: React.ReactNode
}

export interface FAQ {
  id: string
  question: string
  answer: string
}
