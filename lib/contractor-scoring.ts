/**
 * Contractor Scoring & Ranking System
 *
 * Calculates compliance score and composite ranking score for contractors
 * based on credentials, performance ratings, and responsiveness.
 */

interface Insurance {
  id: string;
  type: 'general_liability' | 'workers_comp';
  expirationDate: string;
}

interface Certification {
  id: string;
  name: string;
  expirationDate?: string;
}

interface License {
  id: string;
  license_type: string;
  license_number: string;
  license_state: string;
  expirationDate?: string;
}

interface Contractor {
  id: string;
  insurance?: Insurance[];
  certifications?: Certification[];
  technician_licenses?: License[];
  average_rating?: number;
  response_rate?: number;
  [key: string]: any;
}

/**
 * Calculate compliance score (0-100) based on credentials
 *
 * Weights:
 * - COI Status: 50 points
 * - Licenses: 30 points
 * - Certifications: 20 points
 */
export function calculateComplianceScore(contractor: Contractor, jobDate?: Date): number {
  let score = 0;
  const now = new Date();
  const targetDate = jobDate || now;

  // 1. COI Status (50 points max)
  const coiScore = calculateCOIScore(contractor.insurance, targetDate, now);
  score += coiScore;

  // 2. License Status (30 points max)
  const licenseScore = calculateLicenseScore(contractor.technician_licenses, now);
  score += licenseScore;

  // 3. Certification Status (20 points max)
  const certificationScore = calculateCertificationScore(contractor.certifications, now);
  score += certificationScore;

  return Math.round(score);
}

/**
 * Calculate COI score (0-50 points)
 */
function calculateCOIScore(insurance: Insurance[] | undefined, targetDate: Date, now: Date): number {
  if (!insurance || insurance.length === 0) return 0; // No insurance = 0 points

  const generalLiability = insurance.find(ins => ins.type === 'general_liability');
  const workersComp = insurance.find(ins => ins.type === 'workers_comp');

  let score = 0;

  // General Liability (35 points max)
  if (generalLiability?.expirationDate) {
    const expirationDate = new Date(generalLiability.expirationDate);
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilJob = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      // Expired = 0 points
      score += 0;
    } else if (daysUntilExpiration < daysUntilJob) {
      // Will expire before job = 15 points
      score += 15;
    } else if (daysUntilExpiration < 30) {
      // Expiring within 30 days = 20 points
      score += 20;
    } else {
      // Valid = full 35 points
      score += 35;
    }
  }

  // Workers Comp (15 points max)
  if (workersComp?.expirationDate) {
    const expirationDate = new Date(workersComp.expirationDate);
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      score += 0; // Expired
    } else if (daysUntilExpiration < 30) {
      score += 8; // Expiring soon
    } else {
      score += 15; // Valid
    }
  }

  return score;
}

/**
 * Calculate License score (0-30 points)
 */
function calculateLicenseScore(licenses: License[] | undefined, now: Date): number {
  if (!licenses || licenses.length === 0) return 0; // No licenses = 0 points

  let score = 0;

  // Each valid license adds points
  licenses.forEach(license => {
    if (!license.expirationDate) {
      // No expiration (e.g., lifetime license) = 10 points
      score += 10;
      return;
    }

    const expirationDate = new Date(license.expirationDate);
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      score += 0; // Expired = 0 points
    } else if (daysUntilExpiration < 30) {
      score += 5; // Expiring soon = 5 points
    } else {
      score += 10; // Valid = 10 points
    }
  });

  // Cap at 30 points
  return Math.min(score, 30);
}

/**
 * Calculate Certification score (0-20 points)
 */
function calculateCertificationScore(certifications: Certification[] | undefined, now: Date): number {
  if (!certifications || certifications.length === 0) return 0; // No certifications = 0 points

  let score = 0;

  // Each valid certification adds points
  certifications.forEach(cert => {
    if (!cert.expirationDate) {
      // No expiration = 5 points
      score += 5;
      return;
    }

    const expirationDate = new Date(cert.expirationDate);
    const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      score += 0; // Expired = 0 points
    } else if (daysUntilExpiration < 30) {
      score += 3; // Expiring soon = 3 points
    } else {
      score += 5; // Valid = 5 points
    }
  });

  // Cap at 20 points
  return Math.min(score, 20);
}

/**
 * Calculate composite score for ranking contractors
 *
 * Formula:
 * - Compliance Score: 70% weight
 * - Average Rating: 20% weight (normalized from 5-star to 100-point scale)
 * - Response Rate: 10% weight
 *
 * @returns Score from 0-100
 */
export function calculateCompositeScore(contractor: Contractor, jobDate?: Date): number {
  // Calculate compliance score (0-100)
  const complianceScore = calculateComplianceScore(contractor, jobDate);

  // Normalize average rating from 5-star to 100-point scale
  const ratingScore = (contractor.average_rating || 0) * 20;

  // Response rate (0-100)
  const responseScore = contractor.response_rate || 0;

  // Calculate weighted composite score
  const compositeScore =
    (complianceScore * 0.7) +      // 70% weight
    (ratingScore * 0.2) +           // 20% weight
    (responseScore * 0.1);          // 10% weight

  return Math.round(compositeScore);
}

/**
 * Rank contractors by composite score (highest first)
 */
export function rankContractors(contractors: Contractor[], jobDate?: Date): Contractor[] {
  return contractors
    .map(contractor => ({
      ...contractor,
      compositeScore: calculateCompositeScore(contractor, jobDate),
      complianceScore: calculateComplianceScore(contractor, jobDate)
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Get compliance grade (A+ to F) based on score
 */
export function getComplianceGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Get COI status based on expiration
 */
export function getCoiStatus(insurance: Insurance[] | undefined, jobDate?: Date): 'expired' | 'expiring_soon' | 'valid' | 'missing' {
  if (!insurance || insurance.length === 0) return 'missing';

  const generalLiability = insurance.find(ins => ins.type === 'general_liability');
  if (!generalLiability || !generalLiability.expirationDate) return 'missing';

  const expirationDate = new Date(generalLiability.expirationDate);
  const now = new Date();
  const targetDate = jobDate || now;

  // Calculate days until expiration
  const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Expired
  if (daysUntilExpiration < 0) return 'expired';

  // If job date provided, check if will expire before job
  if (jobDate) {
    const daysUntilJob = Math.floor((jobDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiration < daysUntilJob) return 'expiring_soon';
  } else {
    // No job date - check if expiring within 30 days
    if (daysUntilExpiration < 30) return 'expiring_soon';
  }

  return 'valid';
}
