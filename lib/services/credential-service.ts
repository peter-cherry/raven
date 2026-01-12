import { SupabaseClient } from '@supabase/supabase-js';
import { AuditService, createAuditService } from './audit-service';

export class CredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialError';
  }
}

export class CredentialNotFoundError extends Error {
  constructor(message: string = 'Credential not found') {
    super(message);
    this.name = 'CredentialNotFoundError';
  }
}

export type CredentialType = 'license' | 'insurance' | 'certification';

// License types
export interface LicenseInput {
  contractor_id: string;
  license_type: string;
  license_number: string;
  state: string;
  expiration_date?: string;
  verified?: boolean;
}

export interface License extends LicenseInput {
  id: string;
  created_at: string;
  updated_at: string;
}

// Insurance types
export interface InsuranceInput {
  contractor_id: string;
  insurance_type: string;
  provider: string;
  policy_number: string;
  coverage_amount?: number;
  expiration_date?: string;
  verified?: boolean;
}

export interface Insurance extends InsuranceInput {
  id: string;
  created_at: string;
  updated_at: string;
}

// Certification types
export interface CertificationInput {
  contractor_id: string;
  certification_name: string;
  issuing_organization: string;
  certification_number?: string;
  issue_date?: string;
  expiration_date?: string;
  verified?: boolean;
}

export interface Certification extends CertificationInput {
  id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing contractor credentials (licenses, insurance, certifications).
 */
export class CredentialService {
  private auditService: AuditService;

  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {
    this.auditService = createAuditService(supabase);
  }

  // ============================================
  // LICENSE OPERATIONS
  // ============================================

  async createLicense(input: LicenseInput): Promise<License> {
    const { data, error } = await this.supabase
      .from('contractor_licenses')
      .insert({
        contractor_id: input.contractor_id,
        license_type: input.license_type,
        license_number: input.license_number,
        state: input.state,
        expiration_date: input.expiration_date,
        verified: input.verified || false,
      })
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to create license: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'license',
      data.id,
      'created',
      this.userId,
      input.contractor_id
    );

    return data;
  }

  async getLicense(id: string): Promise<License> {
    const { data, error } = await this.supabase
      .from('contractor_licenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new CredentialNotFoundError('License not found');
    }

    return data;
  }

  async updateLicense(id: string, updates: Partial<LicenseInput>): Promise<License> {
    // Get existing for audit
    const existing = await this.getLicense(id);

    const { data, error } = await this.supabase
      .from('contractor_licenses')
      .update({
        license_type: updates.license_type,
        license_number: updates.license_number,
        state: updates.state,
        expiration_date: updates.expiration_date,
        verified: updates.verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to update license: ${error.message}`);
    }

    // Build changes object
    const changes: Record<string, [unknown, unknown]> = {};
    if (updates.license_type !== undefined && updates.license_type !== existing.license_type) {
      changes.license_type = [existing.license_type, updates.license_type];
    }
    if (updates.license_number !== undefined && updates.license_number !== existing.license_number) {
      changes.license_number = [existing.license_number, updates.license_number];
    }

    await this.auditService.logCredentialChange(
      'license',
      id,
      'updated',
      this.userId,
      existing.contractor_id,
      Object.keys(changes).length > 0 ? changes : undefined
    );

    return data;
  }

  async deleteLicense(id: string): Promise<void> {
    const existing = await this.getLicense(id);

    const { error } = await this.supabase
      .from('contractor_licenses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new CredentialError(`Failed to delete license: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'license',
      id,
      'deleted',
      this.userId,
      existing.contractor_id
    );
  }

  async getContractorLicenses(contractorId: string): Promise<License[]> {
    const { data, error } = await this.supabase
      .from('contractor_licenses')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CredentialError(`Failed to fetch licenses: ${error.message}`);
    }

    return data || [];
  }

  // ============================================
  // INSURANCE OPERATIONS
  // ============================================

  async createInsurance(input: InsuranceInput): Promise<Insurance> {
    const { data, error } = await this.supabase
      .from('contractor_insurance')
      .insert({
        contractor_id: input.contractor_id,
        insurance_type: input.insurance_type,
        provider: input.provider,
        policy_number: input.policy_number,
        coverage_amount: input.coverage_amount,
        expiration_date: input.expiration_date,
        verified: input.verified || false,
      })
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to create insurance: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'insurance',
      data.id,
      'created',
      this.userId,
      input.contractor_id
    );

    return data;
  }

  async getInsurance(id: string): Promise<Insurance> {
    const { data, error } = await this.supabase
      .from('contractor_insurance')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new CredentialNotFoundError('Insurance not found');
    }

    return data;
  }

  async updateInsurance(id: string, updates: Partial<InsuranceInput>): Promise<Insurance> {
    const existing = await this.getInsurance(id);

    const { data, error } = await this.supabase
      .from('contractor_insurance')
      .update({
        insurance_type: updates.insurance_type,
        provider: updates.provider,
        policy_number: updates.policy_number,
        coverage_amount: updates.coverage_amount,
        expiration_date: updates.expiration_date,
        verified: updates.verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to update insurance: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'insurance',
      id,
      'updated',
      this.userId,
      existing.contractor_id
    );

    return data;
  }

  async deleteInsurance(id: string): Promise<void> {
    const existing = await this.getInsurance(id);

    const { error } = await this.supabase
      .from('contractor_insurance')
      .delete()
      .eq('id', id);

    if (error) {
      throw new CredentialError(`Failed to delete insurance: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'insurance',
      id,
      'deleted',
      this.userId,
      existing.contractor_id
    );
  }

  async getContractorInsurance(contractorId: string): Promise<Insurance[]> {
    const { data, error } = await this.supabase
      .from('contractor_insurance')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CredentialError(`Failed to fetch insurance: ${error.message}`);
    }

    return data || [];
  }

  // ============================================
  // CERTIFICATION OPERATIONS
  // ============================================

  async createCertification(input: CertificationInput): Promise<Certification> {
    const { data, error } = await this.supabase
      .from('contractor_certifications')
      .insert({
        contractor_id: input.contractor_id,
        certification_name: input.certification_name,
        issuing_organization: input.issuing_organization,
        certification_number: input.certification_number,
        issue_date: input.issue_date,
        expiration_date: input.expiration_date,
        verified: input.verified || false,
      })
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to create certification: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'certification',
      data.id,
      'created',
      this.userId,
      input.contractor_id
    );

    return data;
  }

  async getCertification(id: string): Promise<Certification> {
    const { data, error } = await this.supabase
      .from('contractor_certifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new CredentialNotFoundError('Certification not found');
    }

    return data;
  }

  async updateCertification(id: string, updates: Partial<CertificationInput>): Promise<Certification> {
    const existing = await this.getCertification(id);

    const { data, error } = await this.supabase
      .from('contractor_certifications')
      .update({
        certification_name: updates.certification_name,
        issuing_organization: updates.issuing_organization,
        certification_number: updates.certification_number,
        issue_date: updates.issue_date,
        expiration_date: updates.expiration_date,
        verified: updates.verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new CredentialError(`Failed to update certification: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'certification',
      id,
      'updated',
      this.userId,
      existing.contractor_id
    );

    return data;
  }

  async deleteCertification(id: string): Promise<void> {
    const existing = await this.getCertification(id);

    const { error } = await this.supabase
      .from('contractor_certifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw new CredentialError(`Failed to delete certification: ${error.message}`);
    }

    await this.auditService.logCredentialChange(
      'certification',
      id,
      'deleted',
      this.userId,
      existing.contractor_id
    );
  }

  async getContractorCertifications(contractorId: string): Promise<Certification[]> {
    const { data, error } = await this.supabase
      .from('contractor_certifications')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CredentialError(`Failed to fetch certifications: ${error.message}`);
    }

    return data || [];
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async getAllContractorCredentials(contractorId: string): Promise<{
    licenses: License[];
    insurance: Insurance[];
    certifications: Certification[];
  }> {
    const [licenses, insurance, certifications] = await Promise.all([
      this.getContractorLicenses(contractorId),
      this.getContractorInsurance(contractorId),
      this.getContractorCertifications(contractorId),
    ]);

    return { licenses, insurance, certifications };
  }
}

/**
 * Create a CredentialService instance.
 */
export function createCredentialService(
  supabase: SupabaseClient,
  userId: string
): CredentialService {
  return new CredentialService(supabase, userId);
}
