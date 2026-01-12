> Archived on 2026-01-12 from IFM_Legal_Product_Requirements_UPDATED.md. Reason: Review needed - may contain active requirements

# Raven Search: IFM Legal & Product Requirements - UPDATED
## Compliance Marketplace Platform - Implementation Guide for Claude Code

**Document Purpose:** Complete legal framework, product requirements, and UI components for building a legally defensible, IFM-focused contractor marketplace platform.

**Last Updated:** November 19, 2025

**CRITICAL:** All components should reference existing design system in `global.css` and follow patterns documented in `claude.md`. Code should be added on "add if doesn't exist" basis.

---

## EXECUTIVE SUMMARY

### Strategic Approach (CORRECTED)

**Business Model:** Contractor marketplace platform providing IFM companies instant access to contractor networks in new markets

**Value Proposition Hierarchy:**
1. **PRIMARY:** Instant market access (revenue enablement - enables IFM to bid on contracts in new markets)
2. **SECONDARY:** Compliance automation (operational efficiency - saves time, reduces liability)
3. **TERTIARY:** AI features (future - competitive differentiation)

**Core Innovation:** Client-configurable compliance policies that shift legal liability to client while providing powerful compliance tracking tools

**Bootstrap Strategy:** Import first customer's existing contractor network (zero acquisition cost) to validate product before paid acquisition

**Legal Protection Strategy:** Multi-layer liability protection through:
1. Strong Terms of Service (marketplace model)
2. Client-configured compliance policies (active decision-making)
3. Streamlined liability acknowledgments (documented responsibility)
4. Point-of-transaction disclaimers (decision-point reminders)

**Target Market:** Mid-size IFM companies ($5M-50M revenue, 20-200 locations) who need geographic expansion capability and cost-effective contractor management

---

## I. LEGAL FRAMEWORK

### A. Core Legal Principles

**1. Platform Classification**
- Raven Search is a **technology platform/marketplace**, NOT a service provider
- We facilitate connections, we do NOT provide services
- We are NOT an employer, staffing agency, or general contractor
- Contractors are independent businesses, NOT our employees

**2. Liability Model**
- Client is solely responsible for compliance decisions
- Client configures their own compliance requirements
- Client must verify all credentials independently
- We provide TOOLS, not GUARANTEES

**3. Document Handling**
- We STORE documents uploaded by contractors
- We PARSE expiration dates from documents (OCR)
- We TRACK compliance status based on documents
- We DO NOT VERIFY authenticity or validity
- We DO NOT determine what's required for specific work

---

### B. Terms of Service (Complete Sections)

**DESIGN NOTE:** These terms should be accessible via links throughout the platform. The full text should be available at `/legal/terms` but never force-read. Users acknowledge they've read them, but reading is their responsibility.

#### SECTION 1: Platform Definition & Services

```
1.1 SERVICE DESCRIPTION

Raven Search operates a technology platform ("Platform") that connects 
facility management companies ("Clients") with independent contractors 
("Contractors") for trade and maintenance services.

The Platform provides:
• Contractor network access and search functionality
• Document storage and tracking tools
• Compliance policy configuration tools
• Work order posting and matching tools
• Communication facilitation between Clients and Contractors

The Platform DOES NOT provide:
• Trade services or labor
• Employment relationships
• Credential verification or validation
• Compliance monitoring or enforcement
• Legal or regulatory advice
• Guarantees of contractor qualifications

1.2 RAVEN'S ROLE

Raven Search is a technology service provider that facilitates connections 
between Clients and Contractors. Raven does not:
• Employ, supervise, or control Contractors
• Perform trade services or facility maintenance
• Make compliance determinations
• Verify credentials, licenses, or insurance policies
• Guarantee work quality or contractor performance
• Act as employer, staffing agency, or general contractor

1.3 INDEPENDENT CONTRACTOR STATUS

All Contractors on the Platform are independent contractors who:
• Maintain their own separate businesses
• Set their own rates and terms
• Control their own work methods
• Are responsible for their own taxes
• Maintain their own insurance and licenses
• Are NOT employees of Raven Search or Clients
```

#### SECTION 2: Client Responsibilities & Compliance

```
2.1 CLIENT COMPLIANCE OBLIGATIONS

Client is SOLELY RESPONSIBLE for:

A. Regulatory Compliance
   • Determining what credentials are legally required for work 
     performed per federal, state, and local regulations
   • Understanding and complying with licensing requirements in 
     their operating jurisdictions
   • Ensuring work is performed by appropriately credentialed 
     individuals
   • Obtaining necessary permits and approvals
   • Complying with OSHA, EPA, and other regulatory requirements

B. Credential Verification
   • Independently verifying all contractor credentials before 
     engagement
   • Confirming license validity with state licensing boards
   • Verifying insurance coverage with insurance carriers
   • Reviewing background check results
   • Confirming certifications with issuing authorities
   • Ensuring credentials are appropriate for specific work

C. Risk Assessment
   • Evaluating contractor qualifications for specific work
   • Assessing risk levels of work to be performed
   • Determining appropriate credential requirements
   • Making final contractor selection decisions
   • Supervising and managing contractor work

D. Documentation
   • Maintaining records of credential verification
   • Documenting contractor selection rationale
   • Keeping compliance audit trails
   • Retaining contracts and agreements

2.2 PLATFORM TOOLS (NOT GUARANTEES)

The Platform provides compliance TOOLS only:

Document Storage:
• Contractors upload credential documents (licenses, insurance, 
  certifications, background checks)
• Platform stores documents securely
• NO VERIFICATION of document authenticity, validity, or 
  appropriateness
• Documents are "as provided" by Contractors

Document Tracking:
• Platform parses expiration dates using OCR technology
• Automated reminders sent to Contractors before expiration
• Compliance dashboard shows document status
• Status reflects DOCUMENT PRESENCE only, not regulatory compliance

Compliance Scoring:
• System generates scores based on document presence and expiration
• Scores are TOOLS for Client's internal use
• Scores do NOT represent regulatory compliance
• Scores do NOT guarantee contractor qualifications
• Client must independently verify compliance

Policy Configuration:
• Client configures their own compliance requirements
• Client sets enforcement levels (required/recommended/optional)
• Client determines what credentials are necessary
• Platform filters Contractors based on CLIENT'S configured policy
• Raven does NOT determine appropriate requirements

2.3 EXPLICIT DISCLAIMERS

RAVEN SEARCH DOES NOT AND CANNOT:
• Verify that uploaded documents are authentic
• Confirm licenses are valid or in good standing
• Guarantee insurance policies provide adequate coverage
• Determine if credentials are appropriate for specific work
• Monitor ongoing regulatory compliance
• Act as licensing authority or compliance auditor
• Guarantee contractor qualifications or fitness for work
• Ensure work meets code requirements or industry standards

Client acknowledges that:
• Platform tools are aids only, not substitutes for due diligence
• Client must perform independent verification
• Raven is not responsible for credential accuracy
• Client assumes all risk in contractor selection
```

#### SECTION 3: Contractor Responsibilities

```
3.1 CONTRACTOR OBLIGATIONS

Contractors are responsible for:

A. Business Operations
   • Maintaining valid business licenses and registrations
   • Obtaining appropriate trade licenses and certifications
   • Maintaining adequate insurance coverage
   • Complying with tax obligations
   • Setting their own rates and terms
   • Managing their own business operations

B. Credential Maintenance
   • Uploading accurate and current credential documents
   • Updating documents before expiration
   • Maintaining required credentials for work performed
   • Ensuring credentials are appropriate for work accepted
   • Notifying Platform of any license suspensions or revocations

C. Accurate Representation
   • Providing truthful information about qualifications
   • Not misrepresenting credentials or experience
   • Clearly communicating capabilities and limitations
   • Disclosing any restrictions on licenses or certifications

D. Work Performance
   • Performing work in professional manner
   • Complying with applicable codes and regulations
   • Maintaining appropriate insurance coverage
   • Obtaining necessary permits
   • Ensuring work quality and safety

3.2 CONTRACTOR REPRESENTATIONS

By joining the Platform, Contractor represents and warrants:
• All uploaded documents are authentic and current
• All credentials are valid and in good standing
• Information provided is accurate and complete
• They are authorized to perform services offered
• They maintain required insurance coverage
• They comply with all applicable laws and regulations

3.3 INDEPENDENT CONTRACTOR RELATIONSHIP

Contractor acknowledges and agrees:
• They are independent contractors, NOT employees
• Raven does not control how they perform work
• They are responsible for their own taxes
• They set their own rates and terms
• They maintain their own insurance and licenses
• No employment relationship exists with Raven or Clients
```

#### SECTION 4-9: [Complete ToS sections from previous document]

**IMPLEMENTATION NOTE:** Store complete ToS text in database with version number. Link to `/legal/terms` throughout platform. Never block user flow with full text - always provide expandable/modal access.

---

## II. UI COMPONENTS & USER FLOWS

**DESIGN SYSTEM REFERENCE:**
- All components must use styles from `global.css`
- Follow patterns and conventions in `claude.md`
- Use existing components where possible
- Match dark theme: `#2A2931` background, `#6C72C9` purple accents

---

### A. Compliance Policy Configuration (Client Side)

#### Component 1: Initial Setup Flow

**Location:** `/onboarding/compliance/configure`

**Design Philosophy:** Fast, streamlined, not overwhelming. User can configure quickly and move on.

**UI Structure:**

```tsx
// IMPLEMENTATION NOTE: Add this component if it doesn't exist
// Reference: global.css for styling, claude.md for patterns

interface ComplianceRequirement {
  id: string
  category: 'license' | 'certification' | 'insurance' | 'background'
  name: string
  description: string
  enforcement: 'required' | 'recommended' | 'optional'
  enabled: boolean
  metadata?: {
    minimumCoverage?: number
    states?: string[]
    expirationMonths?: number
  }
}

// Component renders simple toggle grid with enforcement dropdown
// User checks boxes, selects enforcement level, clicks Continue
// No overwhelming text, clean interface
```

**Visual Design:**

```
┌────────────────────────────────────────────┐
│  Set Your Compliance Requirements          │
├────────────────────────────────────────────┤
│                                             │
│  Choose which credentials your contractors │
│  must have. You can change these anytime.  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Trade Licenses                        │  │
│  ├──────────────────────────────────────┤  │
│  │ ☑ HVAC License    [Required ▼]       │  │
│  │ ☑ Plumbing Lic.   [Required ▼]       │  │
│  │ ☑ Electrical Lic. [Required ▼]       │  │
│  │ ☐ Gen. Contractor [Optional ▼]       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Certifications                        │  │
│  ├──────────────────────────────────────┤  │
│  │ ☑ EPA 608         [Required ▼]       │  │
│  │ ☐ OSHA 10         [Recommended ▼]    │  │
│  │ ☐ OSHA 30         [Optional ▼]       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Insurance & Background                │  │
│  ├──────────────────────────────────────┤  │
│  │ ☑ General Liability [$2M ▼]          │  │
│  │ ☑ Workers Comp    [Required ▼]       │  │
│  │ ☑ Background Check [Required ▼]      │  │
│  │ ☐ Drug Testing    [Optional ▼]       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ℹ️ Enforcement Levels                     │
│  • Required: Must have to appear in search │
│  • Recommended: Preferred, shown as badge  │
│  • Optional: Nice to have                  │
│                                             │
│  [Continue →]                               │
│                                             │
└────────────────────────────────────────────┘
```

**Code Structure:**

```typescript
// File: /app/onboarding/compliance/configure/page.tsx
// Add if doesn't exist, integrate with existing onboarding flow

const CompliancePolicySetup = () => {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>(
    DEFAULT_REQUIREMENTS // Load from config
  )
  
  const handleContinue = async () => {
    // Save to database
    await saveCompliancePolicy(organizationId, requirements)
    
    // Navigate to acknowledgment
    router.push('/onboarding/compliance/acknowledge')
  }
  
  // Simple, clean interface - no overwhelming text
  // User configures and moves on
}
```

---

#### Component 2: Liability Acknowledgment (STREAMLINED)

**Location:** `/onboarding/compliance/acknowledge`

**Design Philosophy:** SMALL modal, scrollable content, FAST to complete. Don't shove legal text in their face. Make it easy to tick boxes and proceed.

**UI Structure:**

```
┌─────────────────────────────────────────┐
│  ⚠️ Compliance Agreement                 │
├─────────────────────────────────────────┤
│                                          │
│  Before using the platform, please       │
│  acknowledge your responsibilities:      │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ [Scrollable container - 200px max] │ │
│  │                                    │ │
│  │ COMPLIANCE RESPONSIBILITY          │ │
│  │                                    │ │
│  │ You are responsible for:           │ │
│  │ • Determining credential reqts     │ │
│  │ • Verifying all credentials        │ │
│  │ • Regulatory compliance            │ │
│  │ • Contractor selection             │ │
│  │                                    │ │
│  │ Raven provides tools only:         │ │
│  │ • Document storage                 │ │
│  │ • Expiration tracking              │ │
│  │ • Compliance scoring               │ │
│  │                                    │ │
│  │ We do NOT verify credentials.      │ │
│  │ You must verify independently.     │ │
│  │                                    │ │
│  │ [Read full terms]                  │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ☐ I understand my responsibilities      │
│  ☐ I will verify credentials             │
│  ☐ I accept liability for selections     │
│                                          │
│  Name: [________________]                │
│  Date: [Auto-filled]                     │
│                                          │
│  [Cancel] [I Agree & Continue]           │
│                                          │
└─────────────────────────────────────────┘
```

**Key Changes from Original:**
- ✅ SMALL modal (not full-screen)
- ✅ Scrollable container for legal text (200px max height)
- ✅ Summary bullets instead of full paragraphs
- ✅ "Read full terms" link expands if user wants details
- ✅ Fast to tick boxes and proceed
- ✅ Reading is THEIR responsibility

**Code Structure:**

```typescript
// File: /app/onboarding/compliance/acknowledge/page.tsx
// Add if doesn't exist

interface AcknowledgmentRecord {
  id: string
  organizationId: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string
  userAgent: string
  acknowledgedAt: Date
  policyVersion: string
  agreementVersion: string
  fullAgreementText: string // Store full text for audit trail
}

const ComplianceAcknowledgment = () => {
  const [showFullTerms, setShowFullTerms] = useState(false)
  const [checkboxes, setCheckboxes] = useState({
    understand: false,
    willVerify: false,
    acceptLiability: false
  })
  const [name, setName] = useState('')
  
  const canSubmit = 
    checkboxes.understand &&
    checkboxes.willVerify &&
    checkboxes.acceptLiability &&
    name.trim().length > 0
  
  const handleSubmit = async () => {
    // Store acknowledgment with full details
    const acknowledgment: AcknowledgmentRecord = {
      // ... full record with timestamp, IP, etc.
    }
    
    await db.complianceAcknowledgments.create(acknowledgment)
    
    // Mark organization as ready
    await db.organizations.update(orgId, {
      compliancePolicyAcknowledged: true,
      onboardingComplete: true
    })
    
    router.push('/dashboard')
  }
  
  return (
    <Modal size="medium"> {/* Small modal, not overwhelming */}
      <div className="max-h-[200px] overflow-y-auto">
        {/* Summary text */}
        {showFullTerms && <FullLegalText />}
      </div>
      
      {/* Simple checkboxes */}
      {/* Name field */}
      {/* Submit button */}
    </Modal>
  )
}
```

---

### B. Work Order Flow with Contractor Selection

#### Component 6: Contractor Card & Profile View (UPDATED FOR EXISTING STRUCTURE)

**CURRENT STATE:** You already have contractor cards with an "Assign" button

**CHANGES NEEDED:**

**1. Update Contractor Card Display**

```typescript
// File: /components/ContractorCard.tsx (or wherever cards are)
// MODIFY existing component - don't rebuild from scratch

// CURRENT (what you have):
<Card>
  <ContractorInfo />
  <SkillsTags /> {/* Already showing trades */}
  <Button>Assign</Button>
</Card>

// UPDATED (what to add):
<Card>
  <ContractorInfo />
  
  {/* UPDATE: Add more skill tags */}
  <div className="flex gap-2 flex-wrap">
    {/* Trade tags (already exist) */}
    <SkillTag>HVAC</SkillTag>
    
    {/* ADD: Training/certification tags */}
    {contractor.certifications.map(cert => (
      <SkillTag key={cert.id} variant="certification">
        {cert.name} {/* e.g., "EPA 608" */}
      </SkillTag>
    ))}
    
    {/* ADD: COI status tag with color coding */}
    <COIStatusTag status={getCoiStatus(contractor, jobDate)}>
      COI
    </COIStatusTag>
  </div>
  
  {/* CHANGE: Button text from "Assign" to "Visit Profile" */}
  <Button onClick={() => router.push(`/contractors/${contractor.id}`)}>
    Visit Profile
  </Button>
</Card>

// ADD: COI Status Component
const COIStatusTag = ({ status, children }) => {
  const colors = {
    expired: 'bg-red-500',
    expiring_soon: 'bg-orange-500', // Few days before job date
    valid: 'bg-green-500'
  }
  
  return (
    <span className={`${colors[status]} text-white px-2 py-1 rounded text-xs`}>
      {children}
    </span>
  )
}

// ADD: COI Status Logic
function getCoiStatus(contractor: Contractor, jobDate: Date): 'expired' | 'expiring_soon' | 'valid' {
  const coi = contractor.credentials.find(c => c.type === 'general_liability')
  
  if (!coi || !coi.expirationDate) return 'expired'
  
  const daysUntilExpiration = differenceInDays(coi.expirationDate, new Date())
  const daysUntilJob = differenceInDays(jobDate, new Date())
  
  // Expired
  if (daysUntilExpiration < 0) return 'expired'
  
  // Will expire before job date
  if (daysUntilExpiration < daysUntilJob) return 'expiring_soon'
  
  // Valid for job
  return 'valid'
}
```

**2. Create/Update Contractor Profile Page**

```typescript
// File: /app/contractors/[id]/page.tsx
// ADD if doesn't exist, or UPDATE if it exists

const ContractorProfile = ({ params }) => {
  const contractor = await getContractor(params.id)
  const currentUser = await getCurrentUser()
  
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{contractor.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span>⭐ {contractor.averageRating.toFixed(1)} ({contractor.totalJobs} jobs)</span>
            <span>📍 {contractor.serviceRadius} miles from {contractor.city}</span>
          </div>
        </div>
        
        {/* ASSIGN BUTTON (already exists in your design) */}
        <Button size="lg" variant="primary" onClick={handleAssign}>
          Assign to Job
        </Button>
      </div>
      
      {/* Credentials Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Credentials</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trade Licenses */}
          {contractor.licenses.map(license => (
            <CredentialCard key={license.id} credential={license} type="license" />
          ))}
          
          {/* Certifications */}
          {contractor.certifications.map(cert => (
            <CredentialCard key={cert.id} credential={cert} type="certification" />
          ))}
          
          {/* Insurance */}
          {contractor.insurance.map(ins => (
            <CredentialCard key={ins.id} credential={ins} type="insurance" />
          ))}
          
          {/* Background Check */}
          {contractor.backgroundCheck && (
            <CredentialCard credential={contractor.backgroundCheck} type="background" />
          )}
        </div>
      </section>
      
      {/* Compliance Score */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Compliance Status</h2>
        
        <div className="bg-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold">
              Score: {contractor.complianceScore}% ({contractor.complianceGrade})
            </span>
            <ComplianceGradeBadge grade={contractor.complianceGrade} />
          </div>
          
          <p className="text-sm text-muted">
            ⚠️ Based on uploaded documents only. Verify independently before hiring.
          </p>
          
          {/* Link to verify credentials */}
          <div className="mt-4 space-y-2">
            {contractor.licenses.map(lic => (
              <VerificationLink key={lic.id} credential={lic} />
            ))}
          </div>
        </div>
      </section>
      
      {/* Service Area Map */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Area</h2>
        <ServiceAreaMap 
          center={contractor.coordinates}
          radius={contractor.serviceRadius}
        />
      </section>
      
      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Contact</h2>
        <div className="bg-card p-6 rounded-lg">
          <p><strong>Email:</strong> {contractor.email}</p>
          <p><strong>Phone:</strong> {contractor.phone}</p>
          <p><strong>Address:</strong> {contractor.address}</p>
        </div>
      </section>
      
      {/* Professional Info */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
        <div className="bg-card p-6 rounded-lg grid grid-cols-2 gap-4">
          <div>
            <strong>Trade:</strong> {contractor.tradeTypes.join(', ')}
          </div>
          <div>
            <strong>Experience:</strong> {contractor.yearsExperience} years
          </div>
          <div>
            <strong>Hourly Rate:</strong> ${contractor.hourlyRate}/hr
          </div>
          <div>
            <strong>Service Radius:</strong> {contractor.serviceRadius} miles
          </div>
        </div>
      </section>
      
      {/* Work History (if available) */}
      {contractor.recentJobs?.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Recent Work</h2>
          <div className="space-y-4">
            {contractor.recentJobs.map(job => (
              <JobHistoryCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// Credential Card Component
const CredentialCard = ({ credential, type }) => {
  const isExpired = credential.expirationDate && isPast(credential.expirationDate)
  const isExpiringSoon = credential.expirationDate && 
    differenceInDays(credential.expirationDate, new Date()) < 30
  
  const statusColor = isExpired ? 'red' : isExpiringSoon ? 'orange' : 'green'
  const statusIcon = isExpired ? '❌' : isExpiringSoon ? '⚠️' : '✓'
  
  return (
    <div className={`border-l-4 border-${statusColor}-500 bg-card p-4 rounded`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{credential.name}</h3>
          {credential.number && (
            <p className="text-sm text-muted">#{credential.number}</p>
          )}
          {credential.state && (
            <p className="text-sm text-muted">State: {credential.state}</p>
          )}
        </div>
        <span className="text-2xl">{statusIcon}</span>
      </div>
      
      {credential.expirationDate && (
        <div className="mt-2">
          <p className={`text-sm text-${statusColor}-600`}>
            {isExpired ? 'Expired' : 'Expires'}: {format(credential.expirationDate, 'MM/dd/yyyy')}
          </p>
        </div>
      )}
      
      {credential.documentUrl && (
        <Button size="sm" variant="ghost" className="mt-2">
          View Document
        </Button>
      )}
      
      <p className="text-xs text-muted mt-2">
        ⚠️ Document uploaded by contractor - verify independently
      </p>
    </div>
  )
}

// Verification Link Component
const VerificationLink = ({ credential }) => {
  const verificationUrls = {
    FL: {
      hvac: 'https://www.myfloridalicense.com/verify',
      plumbing: 'https://www.myfloridalicense.com/verify',
      electrical: 'https://www.myfloridalicense.com/verify'
    },
    // Add other states...
  }
  
  const url = verificationUrls[credential.state]?.[credential.type]
  
  if (!url) return null
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-sm text-primary hover:underline flex items-center gap-2"
    >
      Verify {credential.name} with {credential.state} licensing board →
    </a>
  )
}
```

---

### C. Contractor Onboarding (MULTI-STEP WITH ANIMATIONS)

#### Component 7: Multi-Step Onboarding Flow

**Design Philosophy:** 
- Break onboarding into small, digestible steps
- Each step saves to DB before proceeding
- Success animation between steps (based on DispatchProgress component)
- Slide animations between forms
- Upload document to auto-fill information (AI parsing)

**Step Breakdown:**

```
Step 1: Basic Info (Name, email, phone, service area)
  ↓ [Save → Success animation → Slide right]
Step 2: Trade Selection (HVAC, Plumbing, Electrical, etc.)
  ↓ [Save → Success animation → Slide right]
Step 3: Licenses (State-specific based on Step 1)
  ↓ [Save → Success animation → Slide right]
Step 4: Certifications (EPA, OSHA, etc.)
  ↓ [Save → Success animation → Slide right]
Step 5: Insurance (COI, Workers Comp)
  ↓ [Save → Success animation → Slide right]
Step 6: Background Check Authorization
  ↓ [Save → Success animation → Complete]
```

**State-Specific Licensing (COMPREHENSIVE LIST):**

```typescript
// File: /lib/licensing-requirements.ts
// ADD if doesn't exist

interface LicenseRequirement {
  state: string
  trade: string
  licenses: {
    name: string
    required: boolean
    verificationUrl?: string
    description: string
  }[]
}

const LICENSING_REQUIREMENTS: LicenseRequirement[] = [
  // FLORIDA
  {
    state: 'FL',
    trade: 'hvac',
    licenses: [
      {
        name: 'HVAC Contractor License',
        required: true,
        verificationUrl: 'https://www.myfloridalicense.com/verify',
        description: 'State-issued HVAC contractor license'
      },
      {
        name: 'EPA 608 Certification',
        required: true,
        description: 'Universal refrigerant handling certification'
      },
      {
        name: 'Mechanical Contractor License',
        required: false,
        description: 'Optional mechanical systems license'
      }
    ]
  },
  {
    state: 'FL',
    trade: 'plumbing',
    licenses: [
      {
        name: 'Master Plumber License',
        required: true,
        verificationUrl: 'https://www.myfloridalicense.com/verify',
        description: 'State-issued master plumbing license'
      },
      {
        name: 'Journeyman Plumber License',
        required: false,
        description: 'Journeyman-level plumbing license'
      }
    ]
  },
  {
    state: 'FL',
    trade: 'electrical',
    licenses: [
      {
        name: 'Master Electrician License',
        required: true,
        verificationUrl: 'https://www.myfloridalicense.com/verify',
        description: 'State-issued master electrician license'
      },
      {
        name: 'Journeyman Electrician License',
        required: false,
        description: 'Journeyman-level electrician license'
      }
    ]
  },
  
  // CALIFORNIA
  {
    state: 'CA',
    trade: 'hvac',
    licenses: [
      {
        name: 'C-20 HVAC Contractor License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/',
        description: 'California HVAC contractor license'
      },
      {
        name: 'EPA 608 Certification',
        required: true,
        description: 'Universal refrigerant handling certification'
      }
    ]
  },
  {
    state: 'CA',
    trade: 'plumbing',
    licenses: [
      {
        name: 'C-36 Plumbing Contractor License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/',
        description: 'California plumbing contractor license'
      }
    ]
  },
  {
    state: 'CA',
    trade: 'electrical',
    licenses: [
      {
        name: 'C-10 Electrical Contractor License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/',
        description: 'California electrical contractor license'
      }
    ]
  },
  
  // TEXAS
  {
    state: 'TX',
    trade: 'hvac',
    licenses: [
      {
        name: 'TACL License (Air Conditioning)',
        required: true,
        verificationUrl: 'https://www.license.state.tx.us/licensesearch/',
        description: 'Texas Department of Licensing and Regulation HVAC license'
      },
      {
        name: 'EPA 608 Certification',
        required: true,
        description: 'Universal refrigerant handling certification'
      }
    ]
  },
  {
    state: 'TX',
    trade: 'plumbing',
    licenses: [
      {
        name: 'Master Plumber License',
        required: true,
        verificationUrl: 'https://www.tsbpe.texas.gov/licensee-search',
        description: 'Texas State Board of Plumbing Examiners license'
      },
      {
        name: 'Journeyman Plumber License',
        required: false,
        description: 'Journeyman-level plumbing license'
      }
    ]
  },
  {
    state: 'TX',
    trade: 'electrical',
    licenses: [
      {
        name: 'Master Electrician License',
        required: true,
        verificationUrl: 'https://www.tdlr.texas.gov/electricians/',
        description: 'Texas Department of Licensing master electrician license'
      },
      {
        name: 'Journeyman Electrician License',
        required: false,
        description: 'Journeyman-level electrician license'
      }
    ]
  },
  
  // NEW YORK
  {
    state: 'NY',
    trade: 'hvac',
    licenses: [
      {
        name: 'Master HVAC License',
        required: true,
        description: 'New York master HVAC license'
      },
      {
        name: 'EPA 608 Certification',
        required: true,
        description: 'Universal refrigerant handling certification'
      }
    ]
  },
  {
    state: 'NY',
    trade: 'plumbing',
    licenses: [
      {
        name: 'Master Plumber License',
        required: true,
        description: 'New York master plumber license'
      }
    ]
  },
  {
    state: 'NY',
    trade: 'electrical',
    licenses: [
      {
        name: 'Master Electrician License',
        required: true,
        description: 'New York master electrician license'
      }
    ]
  },
  
  // Add more states as needed...
]

// Universal Certifications (all states)
const UNIVERSAL_CERTIFICATIONS = [
  {
    name: 'EPA 608 Type I',
    description: 'Small appliances'
  },
  {
    name: 'EPA 608 Type II',
    description: 'High-pressure appliances'
  },
  {
    name: 'EPA 608 Type III',
    description: 'Low-pressure appliances'
  },
  {
    name: 'EPA 608 Universal',
    description: 'All types of equipment'
  },
  {
    name: 'OSHA 10-Hour',
    description: 'Basic safety training'
  },
  {
    name: 'OSHA 30-Hour',
    description: 'Advanced safety training'
  },
  {
    name: 'NATE Certification',
    description: 'North American Technician Excellence'
  },
  {
    name: 'R-410A Certification',
    description: 'R-410A refrigerant handling'
  }
]

// Helper function to get requirements
export function getLicenseRequirements(state: string, trade: string) {
  return LICENSING_REQUIREMENTS.find(
    req => req.state === state && req.trade === trade
  )?.licenses || []
}

export function getUniversalCertifications() {
  return UNIVERSAL_CERTIFICATIONS
}
```

**Multi-Step Component Implementation:**

```typescript
// File: /app/contractor/onboarding/page.tsx
// ADD if doesn't exist

type OnboardingStep = 
  | 'basic-info'
  | 'trade-selection'
  | 'licenses'
  | 'certifications'
  | 'insurance'
  | 'background-check'

interface OnboardingState {
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  contractorData: Partial<Contractor>
}

const ContractorOnboarding = () => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'basic-info',
    completedSteps: [],
    contractorData: {}
  })
  
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  
  const handleStepComplete = async (stepData: any) => {
    // Save to database
    const updatedData = { ...state.contractorData, ...stepData }
    await saveContractorProgress(updatedData)
    
    // Show success animation (based on DispatchProgress component)
    setShowSuccessAnimation(true)
    
    // Wait for animation
    await delay(1500)
    
    // Move to next step with slide animation
    const nextStep = getNextStep(state.currentStep)
    setSlideDirection('right')
    setState({
      currentStep: nextStep,
      completedSteps: [...state.completedSteps, state.currentStep],
      contractorData: updatedData
    })
    
    setShowSuccessAnimation(false)
  }
  
  const handleStepBack = () => {
    const prevStep = getPreviousStep(state.currentStep)
    setSlideDirection('left')
    setState({
      ...state,
      currentStep: prevStep
    })
  }
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Progress Indicator */}
      <OnboardingProgress 
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
      />
      
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <SuccessAnimation /> // Based on DispatchProgress component
      )}
      
      {/* Step Content with Slide Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.currentStep}
          initial={{ x: slideDirection === 'right' ? 100 : -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: slideDirection === 'right' ? -100 : 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {state.currentStep === 'basic-info' && (
            <BasicInfoStep 
              onComplete={handleStepComplete}
              initialData={state.contractorData}
            />
          )}
          
          {state.currentStep === 'trade-selection' && (
            <TradeSelectionStep 
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              initialData={state.contractorData}
            />
          )}
          
          {state.currentStep === 'licenses' && (
            <LicensesStep 
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              state={state.contractorData.state}
              trades={state.contractorData.trades}
              initialData={state.contractorData}
            />
          )}
          
          {state.currentStep === 'certifications' && (
            <CertificationsStep 
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              initialData={state.contractorData}
            />
          )}
          
          {state.currentStep === 'insurance' && (
            <InsuranceStep 
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              initialData={state.contractorData}
            />
          )}
          
          {state.currentStep === 'background-check' && (
            <BackgroundCheckStep 
              onComplete={handleStepComplete}
              onBack={handleStepBack}
              initialData={state.contractorData}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Success Animation Component (based on DispatchProgress)
const SuccessAnimation = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card p-8 rounded-lg"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        >
          <CheckIcon className="w-12 h-12 text-white" />
        </motion.div>
        
        <p className="text-center text-lg font-semibold">Step Complete!</p>
      </motion.div>
    </motion.div>
  )
}

// Progress Indicator Component
const OnboardingProgress = ({ currentStep, completedSteps }) => {
  const steps = [
    { id: 'basic-info', label: 'Basic Info' },
    { id: 'trade-selection', label: 'Trade' },
    { id: 'licenses', label: 'Licenses' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'background-check', label: 'Background' }
  ]
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-white">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-2">{step.label}</span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2
                    ${completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-muted'}
                  `}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
```

**Individual Step Components:**

```typescript
// STEP 3: Licenses (State-Specific)

const LicensesStep = ({ onComplete, onBack, state, trades, initialData }) => {
  const [licenses, setLicenses] = useState<any[]>(initialData.licenses || [])
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null)
  const [isParsingDocument, setIsParsingDocument] = useState(false)
  
  // Get state-specific requirements
  const requirements = trades.flatMap(trade => 
    getLicenseRequirements(state, trade)
  )
  
  // Handle document upload for auto-fill
  const handleDocumentUpload = async (file: File) => {
    setUploadedDocument(file)
    setIsParsingDocument(true)
    
    try {
      // Upload to storage
      const url = await uploadFile(file)
      
      // Parse with AI (OCR + extraction)
      const parsedData = await parseContractorDocument(url)
      
      // Auto-fill licenses from parsed data
      if (parsedData.licenses) {
        setLicenses(parsedData.licenses)
      }
      
      toast.success('Document parsed! Please review auto-filled information.')
    } catch (error) {
      toast.error('Could not parse document. Please enter manually.')
    } finally {
      setIsParsingDocument(false)
    }
  }
  
  const handleSubmit = async () => {
    await onComplete({ licenses })
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Trade Licenses</h2>
        <p className="text-muted">
          Upload your state-issued licenses for {trades.join(', ')} in {state}
        </p>
      </div>
      
      {/* Document Upload for Auto-Fill */}
      <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center">
        <h3 className="font-semibold mb-2">Upload License Document</h3>
        <p className="text-sm text-muted mb-4">
          Upload your license or professional resume/CV and we'll auto-fill your information
        </p>
        
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0])}
          className="hidden"
          id="doc-upload"
        />
        
        <label
          htmlFor="doc-upload"
          className="btn btn-secondary cursor-pointer inline-block"
        >
          {isParsingDocument ? 'Parsing...' : 'Upload Document'}
        </label>
        
        {uploadedDocument && (
          <p className="text-sm mt-2 text-green-600">
            ✓ {uploadedDocument.name} uploaded
          </p>
        )}
      </div>
      
      {/* License Forms (one per required license) */}
      {requirements.map((req, index) => (
        <LicenseForm
          key={index}
          requirement={req}
          value={licenses[index]}
          onChange={(data) => {
            const updated = [...licenses]
            updated[index] = data
            setLicenses(updated)
          }}
        />
      ))}
      
      <div className="flex gap-4">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!allRequiredLicensesComplete(licenses, requirements)}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}

// License Form Component
const LicenseForm = ({ requirement, value, onChange }) => {
  const [license, setLicense] = useState(value || {
    name: requirement.name,
    number: '',
    expirationDate: '',
    documentUrl: ''
  })
  
  const handleFileUpload = async (file: File) => {
    const url = await uploadFile(file)
    setLicense({ ...license, documentUrl: url })
    onChange({ ...license, documentUrl: url })
  }
  
  return (
    <div className="border border-muted rounded-lg p-6 space-y-4">
      <div>
        <h4 className="font-semibold">{requirement.name}</h4>
        <p className="text-sm text-muted">{requirement.description}</p>
        {requirement.required && (
          <span className="text-xs text-red-500">* Required</span>
        )}
      </div>
      
      <div>
        <label className="block mb-2">License Number</label>
        <input
          type="text"
          value={license.number}
          onChange={(e) => {
            const updated = { ...license, number: e.target.value }
            setLicense(updated)
            onChange(updated)
          }}
          className="input"
          placeholder="Enter license number"
        />
      </div>
      
      <div>
        <label className="block mb-2">Expiration Date</label>
        <input
          type="date"
          value={license.expirationDate}
          onChange={(e) => {
            const updated = { ...license, expirationDate: e.target.value }
            setLicense(updated)
            onChange(updated)
          }}
          className="input"
        />
      </div>
      
      <div>
        <label className="block mb-2">Upload License Document</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="input"
        />
        {license.documentUrl && (
          <p className="text-sm text-green-600 mt-2">✓ Document uploaded</p>
        )}
      </div>
      
      {requirement.verificationUrl && (
        <a
          href={requirement.verificationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Verify your license with state board →
        </a>
      )}
    </div>
  )
}
```

---

### ADDITIONAL QUESTION: Document for Auto-Fill

**Q: What document can contractors upload to facilitate onboarding?**

**ANSWER: Professional Resume/CV for Trades**

**What to accept:**
1. **Trade-specific resume/CV** (PDF or DOC)
2. **Professional profile** (from association memberships)
3. **License compilation document** (some techs keep all licenses in one PDF)
4. **Contractor information sheet** (if they have one prepared)

**What AI should extract:**
```typescript
interface ParsedContractorData {
  // Basic Info
  name?: string
  email?: string
  phone?: string
  address?: string
  
  // Professional
  tradeTypes?: string[] // "HVAC", "Plumbing", "Electrical"
  yearsExperience?: number
  specializations?: string[]
  
  // Licenses
  licenses?: {
    type: string // "HVAC License", "Master Plumber", etc.
    number: string
    state: string
    expirationDate?: string
  }[]
  
  // Certifications
  certifications?: {
    name: string // "EPA 608", "OSHA 30", "NATE"
    number?: string
    expirationDate?: string
  }[]
  
  // Insurance (if mentioned)
  insurance?: {
    type: string // "General Liability", "Workers Comp"
    carrier?: string
    policyNumber?: string
    coverage?: string
    expirationDate?: string
  }[]
  
  // References/Experience
  previousEmployers?: string[]
  skills?: string[]
}

// AI Parsing Function
async function parseContractorDocument(fileUrl: string): Promise<ParsedContractorData> {
  // 1. Extract text from document (PDF/DOC/Image)
  const text = await extractText(fileUrl)
  
  // 2. Use AI to parse structured data
  const prompt = `
    Extract contractor information from this document:
    
    ${text}
    
    Return JSON with:
    - name, email, phone, address
    - trade types (HVAC, Plumbing, Electrical, etc.)
    - years of experience
    - licenses (type, number, state, expiration)
    - certifications (EPA 608, OSHA, NATE, etc.)
    - insurance information
    - skills and specializations
    
    Only include information that is explicitly stated.
  `
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

**User Experience:**
```
1. Tech uploads resume/CV
2. System shows: "Parsing document..."
3. AI extracts info
4. Form auto-fills with parsed data
5. Tech reviews and corrects any errors
6. Tech still uploads actual license documents for verification
```

**Benefits:**
- Reduces data entry time from 20 minutes to 5 minutes
- Fewer errors (OCR from actual documents)
- Better UX (feels modern and helpful)
- Still requires document upload for compliance (AI parsing is convenience, not replacement)

---

## III. TECHNICAL REQUIREMENTS FOR IFM OPERATIONS

### A. Multi-Site Support (ALIGNED WITH EXISTING DB SCHEMA)

**IMPLEMENTATION NOTE:** Review your current database schema in `schema.prisma` or wherever defined. Add these tables/fields only if they don't exist. Adapt naming conventions to match your existing patterns.

**Assumed Existing Schema:**
```typescript
// You likely already have something like:
model Organization {
  id: string @id
  name: string
  // ... existing fields
}

// ADD if missing:
model Site {
  id: string @id
  organizationId: string
  
  name: string // "Target Store #1234"
  type: string // "retail" | "office" | "warehouse"
  
  // Location
  address: string
  city: string
  state: string
  zip: string
  lat: float
  lng: float
  
  // Client (if managing for external client)
  clientName: string?
  clientContact: string?
  
  // Compliance
  useOrgPolicy: boolean @default(true)
  customPolicyId: string?
  
  active: boolean @default(true)
  createdAt: DateTime @default(now())
  
  // Relations
  organization: Organization @relation(fields: [organizationId], references: [id])
  workOrders: WorkOrder[]
}

// MODIFY existing WorkOrder model (add if missing):
model WorkOrder {
  id: string @id
  organizationId: string
  siteId: string // ADD THIS
  
  // ... existing fields
  
  // ADD relations if missing:
  site: Site @relation(fields: [siteId], references: [id])
}
```

**Multi-Site Features to Build:**

1. **Site Management Dashboard** (`/dashboard/sites`)
2. **Site Creation/Edit** (`/sites/new`, `/sites/[id]/edit`)
3. **Bulk Site Import** (`/sites/import`)
4. **Site-Level Work Orders** (filter by site)
5. **Cross-Site Reporting** (aggregate metrics)

---

### B. Contractor Performance Tracking (CLARIFIED)

**After Client Rates Contractor:**

**Database Updates:**
```typescript
// UPDATE Contractor aggregate stats
await db.contractor.update({
  where: { id: contractorId },
  data: {
    totalJobsCompleted: { increment: 1 },
    averageRating: calculateNewAverage(
      currentRating,
      currentJobCount,
      newRating
    ),
    lastJobDate: new Date()
  }
})

// CREATE Rating record
await db.workOrderRating.create({
  data: {
    workOrderId: workOrderId,
    contractorId: contractorId,
    organizationId: organizationId,
    rating: rating,
    review: reviewText,
    categories: {
      quality: qualityRating,
      timeliness: timelinessRating,
      communication: communicationRating,
      professionalism: professionalismRating
    }
  }
})

// UPDATE Compliance Score (small boost/penalty)
if (rating >= 4.5) {
  await adjustComplianceScore(contractorId, +5) // Boost
} else if (rating < 3.0) {
  await adjustComplianceScore(contractorId, -10) // Penalty
}
```

**UI Changes:**

**Contractor Profile:**
```tsx
// Display updated rating
<div>
  <span className="text-2xl">⭐ {contractor.averageRating.toFixed(1)}</span>
  <span className="text-muted">({contractor.totalJobsCompleted} jobs)</span>
</div>

// Show rating trend
{contractor.recentRatings.length > 5 && (
  <RatingTrend ratings={contractor.recentRatings} />
)}
```

**Search Results:**
```typescript
// Sort contractors by composite score
function rankContractors(contractors: Contractor[]) {
  return contractors.sort((a, b) => {
    const scoreA = 
      (a.complianceScore * 0.7) + 
      (a.averageRating * 20 * 0.2) + // Normalize 5-star to 100-point scale
      (a.responseRate * 0.1)
    
    const scoreB = 
      (b.complianceScore * 0.7) + 
      (b.averageRating * 20 * 0.2) +
      (b.responseRate * 0.1)
    
    return scoreB - scoreA
  })
}
```

**Contractor Dashboard:**
```tsx
// Tech sees their performance
<Card>
  <h3>Your Performance</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-muted">Average Rating</p>
      <p className="text-2xl font-bold">⭐ {rating.toFixed(1)}</p>
      {ratingTrend > 0 && <span className="text-green-600">↑ Up from last month</span>}
    </div>
    <div>
      <p className="text-sm text-muted">Jobs Completed</p>
      <p className="text-2xl font-bold">{totalJobs}</p>
    </div>
    <div>
      <p className="text-sm text-muted">Response Rate</p>
      <p className="text-2xl font-bold">{responseRate}%</p>
    </div>
    <div>
      <p className="text-sm text-muted">Compliance Score</p>
      <p className="text-2xl font-bold">{complianceScore}% ({grade})</p>
    </div>
  </div>
</Card>

// Recent reviews
<Card className="mt-4">
  <h4>Recent Reviews</h4>
  {recentReviews.map(review => (
    <div key={review.id} className="border-b py-3">
      <div className="flex justify-between">
        <span>⭐ {review.rating.toFixed(1)}</span>
        <span className="text-sm text-muted">{formatDate(review.date)}</span>
      </div>
      <p className="text-sm mt-1">{review.text}</p>
    </div>
  ))}
</Card>
```

**Automated Actions:**

```typescript
// Cron job: Check for consistently low-rated contractors
async function reviewLowRatedContractors() {
  const lowRated = await db.contractor.findMany({
    where: {
      averageRating: { lt: 3.0 },
      totalJobsCompleted: { gte: 5 } // Enough data to judge
    }
  })
  
  for (const contractor of lowRated) {
    // Flag for admin review
    await db.contractorFlag.create({
      data: {
        contractorId: contractor.id,
        reason: 'low_rating',
        averageRating: contractor.averageRating,
        flaggedAt: new Date()
      }
    })
    
    // Send email to contractor
    await sendEmail({
      to: contractor.email,
      subject: 'Performance Review Needed',
      body: `Your average rating (${contractor.averageRating.toFixed(1)}) is below our standards...`
    })
    
    // Reduce visibility in search (lower compliance score)
    await adjustComplianceScore(contractor.id, -15)
  }
}

// Cron job: Reward top performers
async function rewardTopPerformers() {
  const topRated = await db.contractor.findMany({
    where: {
      averageRating: { gte: 4.8 },
      totalJobsCompleted: { gte: 20 }
    }
  })
  
  for (const contractor of topRated) {
    // Add "Top Rated" badge
    await db.contractor.update({
      where: { id: contractor.id },
      data: { badges: { push: 'top_rated' } }
    })
    
    // Small compliance boost
    await adjustComplianceScore(contractor.id, +5)
    
    // Notify them
    await sendEmail({
      to: contractor.email,
      subject: 'You're a Top Rated Contractor!',
      body: `Congratulations! You've earned the Top Rated badge...`
    })
  }
}
```

---

### C. Work Order Volume Tracking

**What It Means:**
- Number of work orders per site over time
- Used for budget forecasting, staffing, client reporting

**Database Schema:**
```typescript
// You likely have WorkOrder model
// Add these aggregation queries:

// Get work order volume for a site
async function getSiteWorkOrderVolume(
  siteId: string, 
  startDate: Date, 
  endDate: Date
) {
  const workOrders = await db.workOrder.findMany({
    where: {
      siteId: siteId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      contractor: true
    }
  })
  
  return {
    total: workOrders.length,
    byTrade: groupBy(workOrders, 'tradeType'),
    byStatus: groupBy(workOrders, 'status'),
    totalCost: workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0),
    avgCost: workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0) / workOrders.length
  }
}

// Get volume across all sites
async function getOrganizationWorkOrderVolume(
  organizationId: string,
  startDate: Date,
  endDate: Date
) {
  const sites = await db.site.findMany({
    where: { organizationId },
    include: {
      workOrders: {
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }
    }
  })
  
  return sites.map(site => ({
    siteId: site.id,
    siteName: site.name,
    workOrderCount: site.workOrders.length,
    totalCost: site.workOrders.reduce((sum, wo) => sum + (wo.cost || 0), 0)
  }))
}
```

**UI Dashboard:**
```tsx
// /dashboard/analytics

const AnalyticsDashboard = () => {
  const [dateRange, setDateRange] = useState({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) })
  const volumeData = useWorkOrderVolume(organization.id, dateRange)
  
  return (
    <div>
      <h1>Work Order Analytics</h1>
      
      {/* Date Range Selector */}
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      
      {/* Volume by Site */}
      <Card>
        <h3>Volume by Site</h3>
        <Table>
          <thead>
            <tr>
              <th>Site</th>
              <th>Work Orders</th>
              <th>Total Cost</th>
              <th>Avg Cost</th>
            </tr>
          </thead>
          <tbody>
            {volumeData.bySite.map(site => (
              <tr key={site.siteId}>
                <td>{site.siteName}</td>
                <td>{site.workOrderCount}</td>
                <td>${site.totalCost.toLocaleString()}</td>
                <td>${(site.totalCost / site.workOrderCount).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      
      {/* Volume Over Time Chart */}
      <Card className="mt-4">
        <h3>Work Orders Over Time</h3>
        <LineChart data={volumeData.timeSeries} />
      </Card>
      
      {/* Volume by Trade */}
      <Card className="mt-4">
        <h3>Volume by Trade</h3>
        <BarChart data={volumeData.byTrade} />
      </Card>
    </div>
  )
}
```

---

### D. Integration Points (CLARIFIED)

**Current Integration:** MCP (Model Context Protocol) for development
- This is Claude Code reading Figma files
- NOT customer-facing

**Future Customer Integrations:**

**Phase 1 (Don't Build Yet):**
- None - focus on core product

**Phase 2 (After 10+ Customers):**
```typescript
// 1. QuickBooks/Xero Integration
// When work order completed, sync cost to accounting

interface QuickBooksIntegration {
  organizationId: string
  accessToken: string
  realmId: string
  
  // Sync settings
  autoSync: boolean
  syncWorkOrderCosts: boolean
  syncContractorPayments: boolean
}

async function syncWorkOrderToQuickBooks(workOrder: WorkOrder) {
  const qb = await getQuickBooksClient(workOrder.organizationId)
  
  // Create expense in QuickBooks
  await qb.createExpense({
    amount: workOrder.cost,
    vendor: workOrder.contractor.name,
    category: workOrder.tradeType,
    description: workOrder.title,
    date: workOrder.completedAt
  })
}

// 2. Slack Notifications
interface SlackIntegration {
  organizationId: string
  webhookUrl: string
  
  // Notification settings
  notifyOnNewWorkOrder: boolean
  notifyOnContractorAssigned: boolean
  notifyOnWorkOrderComplete: boolean
}

async function sendSlackNotification(event: string, data: any) {
  const slack = await getSlackIntegration(data.organizationId)
  
  if (!slack) return
  
  const message = formatSlackMessage(event, data)
  
  await fetch(slack.webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ text: message })
  })
}
```

**Phase 3 (Enterprise - 50+ Customers):**
- Client portals (white-label)
- Background check automation (Checkr API)
- FM software sync (ServiceChannel, UpKeep)

**For now:** Build core product, add integrations when customers request them.

---

## IV. IMPLEMENTATION PRIORITIES

### Week 1-2: Legal & Onboarding Foundation
- [ ] Implement streamlined ToS (expandable, not in-face)
- [ ] Build compliance policy configuration
- [ ] Build liability acknowledgment (small modal)
- [ ] Store acknowledgments with full audit trail

### Week 3-4: Contractor Onboarding
- [ ] Build multi-step onboarding flow
- [ ] Implement state-specific licensing
- [ ] Add success animations between steps
- [ ] Build document upload + AI parsing
- [ ] Test with sample contractor data

### Week 5-6: Work Order & Matching
- [ ] Update contractor cards (COI status, training tags)
- [ ] Build contractor profile page
- [ ] Change "Assign" to "Visit Profile"
- [ ] Implement work order creation flow
- [ ] Build matching algorithm

### Week 7-8: Multi-Site & Performance
- [ ] Add site management (if not exists)
- [ ] Build work order volume tracking
- [ ] Implement performance ratings
- [ ] Build contractor performance dashboard
- [ ] Create analytics dashboard

### Week 9-10: Testing & Polish
- [ ] Test complete onboarding flow
- [ ] Test work order creation → assignment
- [ ] Test performance rating updates
- [ ] Test compliance tracking
- [ ] Bug fixes and UX polish

### Week 11-12: Launch Prep
- [ ] Import friend's contractor data
- [ ] Set up friend's organization
- [ ] Train friend's team
- [ ] Launch with first customer
- [ ] Gather feedback

---

## V. DESIGN SYSTEM INTEGRATION

**CRITICAL:** All components must reference existing design patterns.

### Reference Files:
- `global.css` - All styling (colors, spacing, typography)
- `claude.md` - Patterns, conventions, project structure

### Design Tokens (from global.css):
```css
/* Use these throughout */
--background: #2A2931; /* Dark theme */
--primary: #6C72C9; /* Purple accent */
--card: /* Card background */
--muted: /* Muted text */
--border: /* Border color */

/* Components should use: */
.btn { /* Existing button styles */ }
.input { /* Existing input styles */ }
.card { /* Existing card styles */ }
.modal { /* Existing modal styles */ }
```

### Code Conventions:
```typescript
// ALWAYS: Add if doesn't exist
// Check if file exists before creating
// If exists, modify/extend, don't replace

// File organization (from claude.md):
// /app/[feature]/[page]/page.tsx
// /components/[ComponentName].tsx
// /lib/[utility].ts

// Naming conventions:
// Components: PascalCase
// Files: kebab-case
// Functions: camelCase
// Types/Interfaces: PascalCase
```

---

## VI. DATABASE SCHEMA ALIGNMENT

**CRITICAL:** Adapt to existing schema, don't blindly implement.

### Before Adding Any Table/Field:

1. **Check existing schema:**
   ```bash
   # Look at schema.prisma or wherever schema is defined
   cat prisma/schema.prisma
   ```

2. **Check for naming conflicts:**
   - Do you already have `Organization` model?
   - Do you have `Contractor` or `User` model?
   - What are existing field names?

3. **Adapt to existing patterns:**
   - Use same ID format (UUID? CUID?)
   - Use same timestamp fields (`createdAt`? `created_at`?)
   - Use same relation patterns

4. **Example adaptation:**
   ```typescript
   // DON'T blindly add:
   model Organization {
     id: string @id
     name: string
   }
   
   // DO check what exists:
   // If you already have:
   model Org {
     id: string @id @default(cuid())
     orgName: string
   }
   
   // Then ADD to existing model:
   model Org {
     id: string @id @default(cuid())
     orgName: string
     // ADD new fields here:
     compliancePolicy: Json?
     compliancePolicyAcknowledgedAt: DateTime?
   }
   ```

### Authentication Integration:

**If using Clerk/Auth0/NextAuth:**
- User model might be managed externally
- Adapt `organizationId` and `userId` to match your auth system
- Use existing auth hooks/middleware

**Example:**
```typescript
// Get current user from your auth system
const { userId } = useAuth() // Clerk
// or
const session = await getServerSession() // NextAuth

// Then use that ID in your queries
const contractor = await db.contractor.findUnique({
  where: { userId: userId }
})
```

---

## VII. QUESTIONS & ANSWERS

### Q: What's work order volume by site?
**A:** Number of work orders per facility over time. Used for:
- Budget forecasting
- Staffing allocation
- Client reporting
- Cost analysis

See Section III.C for implementation details.

---

### Q: Why remove preferred contractors?
**A:** Compliance score already handles quality ranking. If IFM had preferred vendors, they wouldn't need your platform. Your value is ACCESS to compliant contractors, not manual curation.

---

### Q: What happens after performance rating?
**A:** 
1. Database updates (aggregate stats, individual rating record)
2. UI updates (contractor profile, search rankings)
3. Automated actions (compliance score adjustment, badges, alerts)

See Section III.B for full details.

---

### Q: What kind of integrations?
**A:**
- **Now:** None (focus on core product)
- **Later:** QuickBooks/Xero (accounting), Slack/Teams (notifications)
- **Much Later:** Client portals, background checks (Checkr), FM software sync

See Section III.D for phasing.

---

### Q: Document upload for auto-fill?
**A:** Accept professional resume/CV, parse with AI to extract:
- Name, contact info
- Trade types, experience
- Licenses (number, state, expiration)
- Certifications (EPA, OSHA, NATE)
- Insurance info

See Component 7 implementation for parsing logic.

---

## VIII. FINAL REMINDERS FOR CLAUDE CODE

### When Implementing:

✅ **DO:**
- Reference `global.css` for all styling
- Follow patterns in `claude.md`
- Check if component/file exists before creating
- Adapt to existing database schema
- Use existing auth system
- Match existing naming conventions
- Test each component incrementally

❌ **DON'T:**
- Create duplicate components
- Override existing styles
- Blindly add database tables
- Ignore existing auth integration
- Build everything at once
- Deviate from design system

### Priority Order:

1. **Legal framework** (ToS, acknowledgments) - Foundation
2. **Contractor onboarding** (multi-step, state-specific) - Tech acquisition
3. **Work order flow** (cards, profile, assignment) - Core functionality
4. **Performance tracking** (ratings, scoring) - Quality control
5. **Multi-site** (if needed for IFM friend) - Scale features
6. **Analytics** (volume tracking, reporting) - Business intelligence

### Communication:

When Claude Code encounters issues:
- Check existing code first
- Ask Peter for clarification on naming/structure
- Propose solutions rather than just identifying problems
- Show code diffs when modifying existing files

---

## IX. SUCCESS METRICS

### Alpha Testing (First 3 Months):

**Contractor Onboarding:**
- ✅ 70%+ complete onboarding (all steps)
- ✅ <10 min average completion time
- ✅ 80%+ document upload success rate

**Work Order Flow:**
- ✅ <5 min from post to first contractor response
- ✅ 90%+ successful assignments
- ✅ 80%+ work order completion rate

**Compliance Tracking:**
- ✅ 100% of uploaded credentials parsed
- ✅ 90%+ accuracy in expiration date extraction
- ✅ Zero missed expirations (reminders sent)

**IFM Friend Satisfaction:**
- ✅ 5/5 rating on ease of use
- ✅ 20+ hours/month time saved (measured)
- ✅ Willing to pay $3K-5K/month
- ✅ Willing to provide testimonial

### Launch (Month 6):

**Product:**
- ✅ All core features complete and tested
- ✅ Zero critical bugs
- ✅ Legal framework implemented
- ✅ Compliance tracking proven accurate

**Network:**
- ✅ 50+ contractors onboarded
- ✅ 3-5 cities with coverage
- ✅ All trades represented (HVAC, plumbing, electrical)

**Customers:**
- ✅ 1 paying IFM customer (friend)
- ✅ 2-3 additional IFM customers in pipeline
- ✅ Case study completed
- ✅ Testimonial obtained

---

**END OF DOCUMENT**

---

**IMPLEMENTATION NOTE FOR CLAUDE CODE:**

This document is your complete guide for building Raven Search. Reference it throughout development. When in doubt:

1. Check existing codebase first
2. Follow design system (`global.css`, `claude.md`)
3. Adapt to existing schema and patterns
4. Ask Peter for clarification
5. Build incrementally, test continuously

**Good luck! Build something amazing.**

