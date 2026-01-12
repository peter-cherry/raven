// State-Specific Licensing Requirements for Contractors
// Used in contractor onboarding to show required licenses based on state + trade

export interface License {
  name: string;
  required: boolean;
  verificationUrl?: string;
  description: string;
}

export interface LicenseRequirement {
  state: string;
  trade: string;
  licenses: License[];
}

// Comprehensive licensing requirements for all states and trades
export const LICENSING_REQUIREMENTS: LicenseRequirement[] = [
  // ===== FLORIDA =====
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
  {
    state: 'FL',
    trade: 'general',
    licenses: [
      {
        name: 'General Contractor License',
        required: true,
        verificationUrl: 'https://www.myfloridalicense.com/verify',
        description: 'State-issued general contractor license'
      }
    ]
  },

  // ===== CALIFORNIA =====
  {
    state: 'CA',
    trade: 'hvac',
    licenses: [
      {
        name: 'C-20 HVAC License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
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
        name: 'C-36 Plumbing License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
        description: 'California plumbing contractor license'
      }
    ]
  },
  {
    state: 'CA',
    trade: 'electrical',
    licenses: [
      {
        name: 'C-10 Electrical License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
        description: 'California electrical contractor license'
      }
    ]
  },
  {
    state: 'CA',
    trade: 'general',
    licenses: [
      {
        name: 'B General Contractor License',
        required: true,
        verificationUrl: 'https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx',
        description: 'California general contractor license'
      }
    ]
  },

  // ===== TEXAS =====
  {
    state: 'TX',
    trade: 'hvac',
    licenses: [
      {
        name: 'HVAC Technician License',
        required: true,
        verificationUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
        description: 'Texas HVAC technician license'
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
        verificationUrl: 'https://www.tsbpe.texas.gov/license-verification',
        description: 'Texas master plumber license'
      },
      {
        name: 'Journeyman Plumber License',
        required: false,
        description: 'Texas journeyman plumber license'
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
        verificationUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
        description: 'Texas master electrician license'
      },
      {
        name: 'Journeyman Electrician License',
        required: false,
        description: 'Texas journeyman electrician license'
      }
    ]
  },

  // ===== NEW YORK =====
  {
    state: 'NY',
    trade: 'hvac',
    licenses: [
      {
        name: 'HVAC Technician License',
        required: true,
        verificationUrl: 'https://www.dos.ny.gov/licensing/',
        description: 'New York HVAC technician license'
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
        verificationUrl: 'https://www.dos.ny.gov/licensing/',
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
        verificationUrl: 'https://www.dos.ny.gov/licensing/',
        description: 'New York master electrician license'
      }
    ]
  },

  // ===== ILLINOIS =====
  {
    state: 'IL',
    trade: 'hvac',
    licenses: [
      {
        name: 'HVAC Contractor License',
        required: true,
        verificationUrl: 'https://www.idfpr.com/LicenseLookup/',
        description: 'Illinois HVAC contractor license'
      },
      {
        name: 'EPA 608 Certification',
        required: true,
        description: 'Universal refrigerant handling certification'
      }
    ]
  },
  {
    state: 'IL',
    trade: 'plumbing',
    licenses: [
      {
        name: 'Plumbing Contractor License',
        required: true,
        verificationUrl: 'https://www.idfpr.com/LicenseLookup/',
        description: 'Illinois plumbing contractor license'
      }
    ]
  },
  {
    state: 'IL',
    trade: 'electrical',
    licenses: [
      {
        name: 'Electrical Contractor License',
        required: true,
        verificationUrl: 'https://www.idfpr.com/LicenseLookup/',
        description: 'Illinois electrical contractor license'
      }
    ]
  }
];

// Helper function to get licenses for a specific state and trade
export function getLicensesForStateTrade(state: string, trade: string): License[] {
  const requirement = LICENSING_REQUIREMENTS.find(
    req => req.state === state && req.trade === trade.toLowerCase()
  );
  return requirement?.licenses || [];
}

// Get all required licenses for a state and trade
export function getRequiredLicenses(state: string, trade: string): License[] {
  return getLicensesForStateTrade(state, trade).filter(license => license.required);
}

// Get all optional licenses for a state and trade
export function getOptionalLicenses(state: string, trade: string): License[] {
  return getLicensesForStateTrade(state, trade).filter(license => !license.required);
}

// List of all supported states
export const SUPPORTED_STATES = [
  { code: 'FL', name: 'Florida' },
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'NY', name: 'New York' },
  { code: 'IL', name: 'Illinois' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'GA', name: 'Georgia' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'VA', name: 'Virginia' },
  { code: 'TN', name: 'Tennessee' }
];

// List of all supported trades
export const SUPPORTED_TRADES = [
  { id: 'hvac', name: 'HVAC', description: 'Heating, ventilation, and air conditioning' },
  { id: 'plumbing', name: 'Plumbing', description: 'Plumbing and water systems' },
  { id: 'electrical', name: 'Electrical', description: 'Electrical systems and wiring' },
  { id: 'general', name: 'General Contractor', description: 'General construction and contracting' },
  { id: 'handyman', name: 'Handyman', description: 'General maintenance and repairs' }
];
