'use client'

import { motion } from 'framer-motion'

export default function TestimonialsSection() {
  const testimonials = [
    {
      id: '1',
      name: 'Marcus Johnson',
      trade: 'HVAC Technician',
      city: 'Phoenix, AZ',
      rating: 5,
      quote: 'I went from 2 jobs per week with my old agency to 8 jobs per week with Raven. Best decision I ever made.',
      image: 'https://i.pravatar.cc/150?img=12',
      result: 'Went from 2 jobs/week to 8 jobs/week'
    },
    {
      id: '2',
      name: 'Sarah Mitchell',
      trade: 'Master Plumber',
      city: 'Denver, CO',
      rating: 5,
      quote: 'No more 30% commission cuts. I set my own rates and keep everything I earn. My income doubled in 3 months.',
      image: 'https://i.pravatar.cc/150?img=45',
      result: 'Doubled income in 3 months'
    },
    {
      id: '3',
      name: 'David Chen',
      trade: 'Licensed Electrician',
      city: 'Austin, TX',
      rating: 5,
      quote: 'The AI matching is incredible. I only get jobs that match my skills and are close to me. No more wasting time on bad leads.',
      image: 'https://i.pravatar.cc/150?img=33',
      result: 'Saved 10+ hours per week'
    },
    {
      id: '4',
      name: 'James Rodriguez',
      trade: 'General Contractor',
      city: 'Miami, FL',
      rating: 5,
      quote: 'Building my reputation through verified reviews has been game-changing. Clients see my 5-star rating and book me immediately.',
      image: 'https://i.pravatar.cc/150?img=68',
      result: '4.9-star rating, 120+ reviews'
    },
    {
      id: '5',
      name: 'Emily Thompson',
      trade: 'Carpenter',
      city: 'Portland, OR',
      rating: 5,
      quote: 'I work when I want, where I want. Raven gives me the flexibility I need while keeping my schedule full.',
      image: 'https://i.pravatar.cc/150?img=47',
      result: 'Complete schedule flexibility'
    }
  ]

  return (
    <section
      style={{
        position: 'relative',
        padding: 'var(--spacing-5xl) var(--spacing-3xl)',
        overflow: 'hidden'
      }}
    >
      {/* Unsplash Landscape Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2942&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'brightness(0.7)',
          zIndex: 0
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1400px',
          margin: '0 auto'
        }}
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            textAlign: 'center',
            marginBottom: 'var(--spacing-4xl)'
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-section-title)',
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)',
              letterSpacing: '-0.5px'
            }}
          >
            Real Technicians, Real Results
          </h2>
          <p
            style={{
              fontSize: 'var(--font-xl)',
              color: 'var(--text-secondary)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            See how Raven is changing lives for technicians across the country
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--spacing-2xl)'
          }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.7 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              style={{
                padding: 'var(--spacing-2xl)',
                background: 'transparent',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                filter: 'brightness(1.3)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: 'var(--container-border-radius)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {/* Star Rating */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-xs)',
                  marginBottom: 'var(--spacing-lg)',
                  color: '#F59E0B'
                }}
              >
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: 'var(--font-lg)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.6',
                  fontWeight: 'var(--font-weight-regular)',
                  marginBottom: 'var(--spacing-xl)',
                  flex: 1,
                  fontStyle: 'italic'
                }}
              >
                "{testimonial.quote}"
              </p>

              {/* Result Badge */}
              <div
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--btn-corner-radius)',
                  marginBottom: 'var(--spacing-lg)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--success)',
                  textAlign: 'center'
                }}
              >
                {testimonial.result}
              </div>

              {/* Author Info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  paddingTop: 'var(--spacing-lg)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Avatar */}
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}
                />

                {/* Name & Details */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}
                  >
                    {testimonial.name}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {testimonial.trade}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)',
                      fontWeight: 'var(--font-weight-regular)'
                    }}
                  >
                    {testimonial.city}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge Below Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.7 }}
          style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-4xl)',
            padding: 'var(--spacing-2xl)',
            background: 'rgba(108, 114, 201, 0.1)',
            border: '1px solid rgba(108, 114, 201, 0.3)',
            borderRadius: 'var(--container-border-radius)'
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--accent-primary)',
              marginBottom: 'var(--spacing-sm)'
            }}
          >
            Join 2,500+ Satisfied Technicians
          </p>
          <p
            style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-regular)'
            }}
          >
            Average rating: 4.9/5 stars across all technicians
          </p>
        </motion.div>
      </div>
    </section>
  )
}
