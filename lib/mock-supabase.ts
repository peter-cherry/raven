/**
 * Mock Supabase client for local development without credentials.
 * This allows UI testing without a real database connection.
 * 
 * Set NEXT_PUBLIC_MOCK_MODE=true to enable mock mode.
 */

// Mock user for development
export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@example.com',
  user_metadata: {
    full_name: 'Demo User',
  },
};

// Mock organization
export const MOCK_ORG = {
  id: '00000000-0000-0000-0000-000000000010',
  name: 'Demo Organization',
  onboarding_complete: true,
  compliance_policy_acknowledged: true,
};

// Mock org membership
export const MOCK_ORG_MEMBERSHIP = {
  user_id: MOCK_USER.id,
  org_id: MOCK_ORG.id,
  role: 'owner',
};

// Mock jobs - comprehensive data for dashboard testing
export const MOCK_JOBS = [
  {
    id: '00000000-0000-0000-0000-000000000100',
    org_id: MOCK_ORG.id,
    job_title: 'Emergency HVAC Repair - AC Unit Down',
    job_status: 'pending',
    trade_needed: 'HVAC',
    address_text: '123 Main St, Miami, FL 33101',
    city: 'Miami',
    state: 'FL',
    lat: 25.7617,
    lng: -80.1918,
    contact_name: 'John Smith',
    contact_phone: '(555) 123-4567',
    contact_email: 'john@example.com',
    urgency: 'emergency',
    scheduled_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    description: 'Commercial AC unit not cooling. Temperature rising in server room.',
  },
  {
    id: '00000000-0000-0000-0000-000000000101',
    org_id: MOCK_ORG.id,
    job_title: 'Kitchen Plumbing Installation',
    job_status: 'assigned',
    trade_needed: 'Plumbing',
    address_text: '456 Oak Ave, Miami, FL 33102',
    city: 'Miami',
    state: 'FL',
    lat: 25.7700,
    lng: -80.2000,
    contact_name: 'Jane Doe',
    contact_phone: '(555) 987-6543',
    contact_email: 'jane@example.com',
    urgency: 'same_day',
    assigned_tech_id: '00000000-0000-0000-0000-000000000202',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    description: 'New garbage disposal and faucet installation in commercial kitchen.',
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    org_id: MOCK_ORG.id,
    job_title: 'Electrical Panel Upgrade - 200A',
    job_status: 'completed',
    trade_needed: 'Electrical',
    address_text: '789 Pine Rd, Miami, FL 33103',
    city: 'Miami',
    state: 'FL',
    lat: 25.7500,
    lng: -80.2100,
    contact_name: 'Bob Johnson',
    contact_phone: '(555) 456-7890',
    contact_email: 'bob@example.com',
    urgency: 'within_week',
    assigned_tech_id: '00000000-0000-0000-0000-000000000201',
    scheduled_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 604800000).toISOString(),
    completed_at: new Date(Date.now() - 86400000).toISOString(),
    description: 'Upgrade main electrical panel from 100A to 200A service.',
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    org_id: MOCK_ORG.id,
    job_title: 'Roof Leak Assessment',
    job_status: 'active',
    trade_needed: 'Roofing',
    address_text: '321 Birch Lane, Miami, FL 33104',
    city: 'Miami',
    state: 'FL',
    lat: 25.7450,
    lng: -80.1850,
    contact_name: 'Maria Garcia',
    contact_phone: '(555) 222-3333',
    contact_email: 'maria@example.com',
    urgency: 'same_day',
    assigned_tech_id: '00000000-0000-0000-0000-000000000203',
    scheduled_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 43200000).toISOString(),
    description: 'Water damage detected in ceiling. Need assessment and temporary repair.',
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    org_id: MOCK_ORG.id,
    job_title: 'Commercial Refrigeration Service',
    job_status: 'pending',
    trade_needed: 'HVAC',
    address_text: '567 Commerce Blvd, Miami, FL 33105',
    city: 'Miami',
    state: 'FL',
    lat: 25.7750,
    lng: -80.2200,
    contact_name: 'David Lee',
    contact_phone: '(555) 444-5555',
    contact_email: 'david@restaurant.com',
    urgency: 'emergency',
    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    description: 'Walk-in cooler not maintaining temperature. Restaurant at risk.',
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    org_id: MOCK_ORG.id,
    job_title: 'Fire Alarm System Inspection',
    job_status: 'completed',
    trade_needed: 'Fire Safety',
    address_text: '890 Corporate Dr, Miami, FL 33106',
    city: 'Miami',
    state: 'FL',
    lat: 25.7580,
    lng: -80.1750,
    contact_name: 'Susan Brown',
    contact_phone: '(555) 666-7777',
    contact_email: 'susan@property.com',
    urgency: 'within_week',
    assigned_tech_id: '00000000-0000-0000-0000-000000000204',
    scheduled_at: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 432000000).toISOString(),
    completed_at: new Date(Date.now() - 172800000).toISOString(),
    description: 'Annual fire alarm system inspection and certification.',
  },
  {
    id: '00000000-0000-0000-0000-000000000106',
    org_id: MOCK_ORG.id,
    job_title: 'HVAC Preventive Maintenance',
    job_status: 'completed',
    trade_needed: 'HVAC',
    address_text: '234 Office Park, Miami, FL 33107',
    city: 'Miami',
    state: 'FL',
    lat: 25.7680,
    lng: -80.1920,
    contact_name: 'Kevin White',
    contact_phone: '(555) 888-9999',
    contact_email: 'kevin@office.com',
    urgency: 'within_week',
    assigned_tech_id: '00000000-0000-0000-0000-000000000200',
    scheduled_at: new Date(Date.now() - 518400000).toISOString(),
    created_at: new Date(Date.now() - 691200000).toISOString(),
    completed_at: new Date(Date.now() - 432000000).toISOString(),
    description: 'Quarterly HVAC maintenance - filter change, coil cleaning, refrigerant check.',
  },
];

// Mock technicians - comprehensive data for testing
export const MOCK_TECHNICIANS = [
  {
    id: '00000000-0000-0000-0000-000000000200',
    full_name: 'Mike Wilson',
    email: 'mike@hvacpro.com',
    phone: '(555) 111-2222',
    company_name: 'Wilson HVAC Solutions',
    trade_needed: 'HVAC',
    city: 'Miami',
    state: 'FL',
    lat: 25.7800,
    lng: -80.1800,
    is_available: true,
    signed_up: true,
    rating: 4.8,
    jobs_completed: 127,
    service_radius: 25,
    hourly_rate: 85,
    certifications: ['EPA 608', 'NATE Certified'],
  },
  {
    id: '00000000-0000-0000-0000-000000000201',
    full_name: 'Sarah Chen',
    email: 'sarah@electricalservices.com',
    phone: '(555) 333-4444',
    company_name: 'Chen Electrical Services',
    trade_needed: 'Electrical',
    city: 'Miami',
    state: 'FL',
    lat: 25.7550,
    lng: -80.2050,
    is_available: true,
    signed_up: true,
    rating: 4.9,
    jobs_completed: 89,
    service_radius: 30,
    hourly_rate: 95,
    certifications: ['Master Electrician', 'OSHA 30'],
  },
  {
    id: '00000000-0000-0000-0000-000000000202',
    full_name: 'Carlos Rodriguez',
    email: 'carlos@plumbingexperts.com',
    phone: '(555) 555-6666',
    company_name: 'Rodriguez Plumbing',
    trade_needed: 'Plumbing',
    city: 'Miami',
    state: 'FL',
    lat: 25.7650,
    lng: -80.1950,
    is_available: true,
    signed_up: true,
    rating: 4.7,
    jobs_completed: 156,
    service_radius: 20,
    hourly_rate: 75,
    certifications: ['Master Plumber', 'Backflow Certified'],
  },
  {
    id: '00000000-0000-0000-0000-000000000203',
    full_name: 'James Thompson',
    email: 'james@roofingpros.com',
    phone: '(555) 777-8888',
    company_name: 'Thompson Roofing Pros',
    trade_needed: 'Roofing',
    city: 'Miami',
    state: 'FL',
    lat: 25.7420,
    lng: -80.1880,
    is_available: true,
    signed_up: true,
    rating: 4.6,
    jobs_completed: 78,
    service_radius: 35,
    hourly_rate: 90,
    certifications: ['GAF Certified', 'OSHA 10'],
  },
  {
    id: '00000000-0000-0000-0000-000000000204',
    full_name: 'Emily Davis',
    email: 'emily@firesafety.com',
    phone: '(555) 999-0000',
    company_name: 'Davis Fire & Safety',
    trade_needed: 'Fire Safety',
    city: 'Miami',
    state: 'FL',
    lat: 25.7580,
    lng: -80.1720,
    is_available: false,
    signed_up: true,
    rating: 4.9,
    jobs_completed: 234,
    service_radius: 40,
    hourly_rate: 110,
    certifications: ['NICET Level III', 'Fire Alarm Inspector'],
  },
  {
    id: '00000000-0000-0000-0000-000000000205',
    full_name: 'Alex Martinez',
    email: 'alex@generalcontractor.com',
    phone: '(555) 121-3434',
    company_name: 'Martinez General Contracting',
    trade_needed: 'General',
    city: 'Miami',
    state: 'FL',
    lat: 25.7720,
    lng: -80.2100,
    is_available: true,
    signed_up: true,
    rating: 4.5,
    jobs_completed: 312,
    service_radius: 50,
    hourly_rate: 70,
    certifications: ['General Contractor License', 'OSHA 30'],
  },
  {
    id: '00000000-0000-0000-0000-000000000206',
    full_name: 'Lisa Park',
    email: 'lisa@cleaningservices.com',
    phone: '(555) 565-7878',
    company_name: 'Park Cleaning Solutions',
    trade_needed: 'Cleaning',
    city: 'Miami',
    state: 'FL',
    lat: 25.7490,
    lng: -80.1990,
    is_available: true,
    signed_up: true,
    rating: 4.8,
    jobs_completed: 445,
    service_radius: 15,
    hourly_rate: 45,
    certifications: ['IICRC Certified'],
  },
  {
    id: '00000000-0000-0000-0000-000000000207',
    full_name: 'Robert Kim',
    email: 'robert@locksmith.com',
    phone: '(555) 232-4545',
    company_name: 'Kim Lock & Key',
    trade_needed: 'Locksmith',
    city: 'Miami',
    state: 'FL',
    lat: 25.7610,
    lng: -80.1860,
    is_available: true,
    signed_up: true,
    rating: 4.7,
    jobs_completed: 567,
    service_radius: 30,
    hourly_rate: 65,
    certifications: ['ALOA Certified', 'State Licensed'],
  },
];

// Mock scraping activities for admin dashboard
export const MOCK_SCRAPING_ACTIVITIES = [
  {
    id: 'scrape-001',
    source: 'cslb',
    trade: 'HVAC',
    state: 'FL',
    query: 'HVAC contractors Miami FL',
    results_found: 45,
    new_targets: 32,
    duplicate_targets: 13,
    status: 'completed',
    started_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86300000).toISOString(),
  },
  {
    id: 'scrape-002',
    source: 'dbpr',
    trade: 'Plumbing',
    state: 'FL',
    query: 'Plumbing contractors Tampa FL',
    results_found: 78,
    new_targets: 65,
    duplicate_targets: 13,
    status: 'completed',
    started_at: new Date(Date.now() - 172800000).toISOString(),
    completed_at: new Date(Date.now() - 172700000).toISOString(),
  },
  {
    id: 'scrape-003',
    source: 'apify',
    trade: 'Electrical',
    state: 'TX',
    query: 'Electrical contractors Houston TX',
    results_found: 120,
    new_targets: 98,
    duplicate_targets: 22,
    status: 'completed',
    started_at: new Date(Date.now() - 259200000).toISOString(),
    completed_at: new Date(Date.now() - 259100000).toISOString(),
  },
];

// Mock outreach campaigns for admin dashboard
export const MOCK_OUTREACH_CAMPAIGNS = [
  {
    id: 'campaign-001',
    name: 'Florida HVAC Contractors Q1',
    instantly_campaign_id: 'inst-12345',
    trade_filter: 'HVAC',
    total_targets: 150,
    emails_sent: 120,
    emails_opened: 45,
    replies_received: 12,
    status: 'active',
    created_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: 'campaign-002',
    name: 'Texas Plumbing Outreach',
    instantly_campaign_id: 'inst-67890',
    trade_filter: 'Plumbing',
    total_targets: 200,
    emails_sent: 180,
    emails_opened: 72,
    replies_received: 18,
    status: 'active',
    created_at: new Date(Date.now() - 1209600000).toISOString(),
  },
];

// Mock outreach targets
export const MOCK_OUTREACH_TARGETS = [
  {
    id: 'target-001',
    business_name: 'ABC HVAC Services',
    contact_name: 'John Smith',
    email: 'john@abchvac.com',
    phone: '(555) 111-2222',
    trade_type: 'HVAC',
    city: 'Miami',
    state: 'FL',
    data_source: 'cslb',
    email_found: true,
    email_verified: true,
    hunter_confidence: 95,
    status: 'verified',
  },
  {
    id: 'target-002',
    business_name: 'Quick Plumbing Co',
    contact_name: 'Maria Garcia',
    email: 'maria@quickplumbing.com',
    phone: '(555) 333-4444',
    trade_type: 'Plumbing',
    city: 'Tampa',
    state: 'FL',
    data_source: 'dbpr',
    email_found: true,
    email_verified: false,
    hunter_confidence: 78,
    status: 'pending',
  },
  {
    id: 'target-003',
    business_name: 'Elite Electrical',
    contact_name: null,
    email: null,
    phone: '(555) 555-6666',
    trade_type: 'Electrical',
    city: 'Houston',
    state: 'TX',
    data_source: 'apify',
    email_found: false,
    email_verified: false,
    hunter_confidence: 0,
    status: 'pending',
  },
];

// Mock cold leads
export const MOCK_COLD_LEADS = [
  {
    id: 'lead-001',
    full_name: 'Robert Johnson',
    email: 'robert@hvacpro.com',
    company_name: 'HVAC Pro Services',
    trade_type: 'HVAC',
    city: 'Orlando',
    state: 'FL',
    status: 'contacted',
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
];

// Mock job dispatches for warm/cold stats
export const MOCK_JOB_DISPATCHES = [
  { id: 'd1', channel: 'sendgrid', email_opened: true, email_replied: true },
  { id: 'd2', channel: 'sendgrid', email_opened: true, email_replied: false },
  { id: 'd3', channel: 'sendgrid', email_opened: false, email_replied: false },
  { id: 'd4', channel: 'instantly', email_opened: true, email_replied: true },
  { id: 'd5', channel: 'instantly', email_opened: true, email_replied: false },
  { id: 'd6', channel: 'instantly', email_opened: false, email_replied: false },
];

// Mock license records for staging
export const MOCK_LICENSE_RECORDS = [
  { id: 'lic-001', email_verified: true },
  { id: 'lic-002', email_verified: true },
  { id: 'lic-003', email_verified: false },
  { id: 'lic-004', email_verified: false },
  { id: 'lic-005', email_verified: false },
];

// Mock drafts for localStorage seeding
export const MOCK_DRAFTS = [
  {
    id: 'draft-001',
    title: 'Warehouse HVAC Maintenance',
    description: 'Quarterly maintenance for warehouse HVAC system',
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    data: {
      trade_needed: 'HVAC',
      address_text: '1500 Industrial Way, Miami, FL 33150',
      contact_name: 'Warehouse Manager',
      contact_phone: '(555) 100-2000',
      urgency: 'within_week',
    },
  },
  {
    id: 'draft-002',
    title: 'Office Building Electrical',
    description: 'New outlet installation in conference rooms',
    lastModified: new Date(Date.now() - 86400000).toISOString(),
    data: {
      trade_needed: 'Electrical',
      address_text: '200 Corporate Plaza, Miami, FL 33130',
      contact_name: 'Facilities Director',
      contact_phone: '(555) 300-4000',
      urgency: 'within_week',
    },
  },
  {
    id: 'draft-003',
    title: 'Restaurant Plumbing Emergency',
    description: 'Grease trap backup in kitchen',
    lastModified: new Date(Date.now() - 172800000).toISOString(),
    data: {
      trade_needed: 'Plumbing',
      address_text: '88 Restaurant Row, Miami, FL 33139',
      contact_name: 'Restaurant Owner',
      contact_phone: '(555) 500-6000',
      urgency: 'emergency',
    },
  },
];

// Check if mock mode is enabled
// Can be set via NEXT_PUBLIC_MOCK_MODE env var or window.__MOCK_MODE__ for testing
export function isMockMode(): boolean {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
    return true;
  }
  
  // For client-side, also check if Supabase env vars are missing (auto-enable mock mode)
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.log('[Mock Mode] Auto-enabled: Supabase credentials not found');
      return true;
    }
  }
  
  return false;
}

// Mock session
export const MOCK_SESSION = {
  user: MOCK_USER,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
};

/**
 * Create a mock Supabase-like client for development
 */
export function createMockSupabaseClient() {
  let jobs = [...MOCK_JOBS];
  let technicians = [...MOCK_TECHNICIANS];
  let scrapingActivities = [...MOCK_SCRAPING_ACTIVITIES];
  let outreachCampaigns = [...MOCK_OUTREACH_CAMPAIGNS];
  let outreachTargets = [...MOCK_OUTREACH_TARGETS];
  let coldLeads = [...MOCK_COLD_LEADS];
  let jobDispatches = [...MOCK_JOB_DISPATCHES];
  let licenseRecords = [...MOCK_LICENSE_RECORDS];

  const mockData = {
    jobs,
    technicians,
    scraping_activity: scrapingActivities,
    outreach_campaigns: outreachCampaigns,
    outreach_targets: outreachTargets,
    cold_leads: coldLeads,
    job_dispatches: jobDispatches,
    license_records: licenseRecords,
  };

  const mockClient = {
    auth: {
      getSession: async () => ({ data: { session: MOCK_SESSION }, error: null }),
      getUser: async () => ({ data: { user: MOCK_USER }, error: null }),
      signInWithPassword: async () => ({ data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (callback: any) => {
        callback('SIGNED_IN', MOCK_SESSION);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    from: (table: string) => createMockQueryBuilder(table, mockData),
    // Mock channel for real-time subscriptions
    channel: (name: string) => createMockChannel(),
    removeChannel: (channel: any) => Promise.resolve(),
    rpc: async (fn: string, params?: any) => {
      console.log(`[Mock] RPC called: ${fn}`, params);
      return { data: null, error: null };
    },
  };

  return mockClient;
}

/**
 * Create a mock channel for real-time subscriptions
 */
function createMockChannel() {
  const channel = {
    on: (event: string, config: any, callback?: any) => {
      // Just return the channel for chaining, don't actually subscribe
      return channel;
    },
    subscribe: (callback?: any) => {
      if (callback) callback('SUBSCRIBED');
      return channel;
    },
    unsubscribe: () => Promise.resolve(),
  };
  return channel;
}

function createMockQueryBuilder(table: string, data: Record<string, any[]>) {
  let result: any[] = [];
  let filters: any = {};
  let isSingle = false;
  let isCount = false;
  let countOnly = false;

  const getTableData = () => {
    switch (table) {
      case 'jobs': return data.jobs || [];
      case 'technicians': return data.technicians || [];
      case 'scraping_activity': return data.scraping_activity || [];
      case 'outreach_campaigns': return data.outreach_campaigns || [];
      case 'outreach_targets': return data.outreach_targets || [];
      case 'cold_leads': return data.cold_leads || [];
      case 'job_dispatches': return data.job_dispatches || [];
      case 'license_records': return data.license_records || [];
      case 'org_memberships': return [MOCK_ORG_MEMBERSHIP];
      case 'organizations': return [MOCK_ORG];
      case 'admins': return [{ id: '1', user_id: MOCK_USER.id }];
      case 'pending_ai_replies': return [];
      case 'ai_replies': return [];
      default: return [];
    }
  };

  const builder: any = {
    select: (columns?: string, options?: { count?: string; head?: boolean }) => {
      result = [...getTableData()];
      if (options?.count === 'exact') {
        isCount = true;
      }
      if (options?.head) {
        countOnly = true;
      }
      return builder;
    },
    insert: (rows: any) => {
      const newRows = Array.isArray(rows) ? rows : [rows];
      newRows.forEach((row: any) => {
        const newRow = { ...row, id: `mock-${Date.now()}`, created_at: new Date().toISOString() };
        if (data[table]) {
          data[table].push(newRow);
        }
        result = [newRow];
      });
      return builder;
    },
    update: (updates: any) => {
      return builder;
    },
    delete: () => {
      return builder;
    },
    eq: (column: string, value: any) => {
      filters[column] = value;
      result = result.filter((row: any) => row[column] === value);
      return builder;
    },
    neq: (column: string, value: any) => {
      result = result.filter((row: any) => row[column] !== value);
      return builder;
    },
    in: (column: string, values: any[]) => {
      result = result.filter((row: any) => values.includes(row[column]));
      return builder;
    },
    is: (column: string, value: any) => {
      result = result.filter((row: any) => row[column] === value);
      return builder;
    },
    ilike: (column: string, pattern: string) => {
      const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
      result = result.filter((row: any) => regex.test(row[column] || ''));
      return builder;
    },
    gte: (column: string, value: any) => {
      result = result.filter((row: any) => row[column] >= value);
      return builder;
    },
    lte: (column: string, value: any) => {
      result = result.filter((row: any) => row[column] <= value);
      return builder;
    },
    order: (column: string, options?: any) => {
      const ascending = options?.ascending !== false;
      result.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
      return builder;
    },
    limit: (count: number) => {
      result = result.slice(0, count);
      return builder;
    },
    range: (from: number, to: number) => {
      result = result.slice(from, to + 1);
      return builder;
    },
    single: () => {
      isSingle = true;
      return builder;
    },
    maybeSingle: () => {
      isSingle = true;
      return builder;
    },
    then: (resolve: any) => {
      if (countOnly && isCount) {
        resolve({ count: result.length, error: null });
      } else if (isSingle) {
        resolve({ data: result[0] || null, error: null, count: isCount ? result.length : undefined });
      } else {
        resolve({ data: result, error: null, count: isCount ? result.length : undefined });
      }
    },
  };

  return builder;
}
