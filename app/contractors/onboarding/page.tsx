'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { supabaseAnon } from '@/lib/supabaseClient';
import { SUPPORTED_STATES, SUPPORTED_TRADES, getLicensesForStateTrade } from '@/lib/licensing-requirements';

// Step components
import BasicInfoStep from '@/components/onboarding/BasicInfoStep';
import TradeSelectionStep from '@/components/onboarding/TradeSelectionStep';
import LicensesStep from '@/components/onboarding/LicensesStep';
import CertificationsStep from '@/components/onboarding/CertificationsStep';
import InsuranceStep from '@/components/onboarding/InsuranceStep';
import BackgroundCheckStep from '@/components/onboarding/BackgroundCheckStep';

// Success animation component (based on DispatchLoader)
function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 60px rgba(16, 185, 129, 0.5)'
        }}
      >
        {/* Checkmark SVG */}
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <motion.path
            d="M5 13l4 4L19 7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}

export default function ContractorOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [contractorId, setContractorId] = useState<string | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',

    // Step 2: Trade Selection
    trades: [] as string[],
    yearsExperience: '',

    // Step 3: Licenses
    licenses: [] as { name: string; number: string; state: string; expirationDate: string }[],

    // Step 4: Certifications
    certifications: [] as { name: string; number: string; expirationDate: string }[],

    // Step 5: Insurance
    skipInsurance: false,
    generalLiability: {
      carrier: '',
      policyNumber: '',
      coverage: '',
      expirationDate: ''
    },
    workersComp: {
      carrier: '',
      policyNumber: '',
      expirationDate: ''
    },

    // Step 6: Background Check
    backgroundCheckAuthorized: false,
    signature: ''
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('contractorOnboardingData');
    const savedStep = localStorage.getItem('contractorOnboardingStep');
    const savedContractorId = localStorage.getItem('contractorOnboardingId');

    if (savedData) {
      try {
        setFormData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to parse saved data:', e);
      }
    }

    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }

    if (savedContractorId) {
      setContractorId(savedContractorId);
    }
  }, []);

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  // Update form data and save to localStorage
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // Save to localStorage
      localStorage.setItem('contractorOnboardingData', JSON.stringify(newData));
      return newData;
    });
  };

  // Save step data to database
  const saveStepData = async (step: number) => {
    console.log('saveStepData called - step:', step);

    try {
      switch (step) {
        case 1: // Basic Info - save to DB for follow-up sequences
          console.log('Saving basic info to database for follow-up sequences...');

          // Note: We DON'T set user_id here because:
          // 1. Email confirmation may be pending, so user might not exist in auth.users yet
          // 2. The FK constraint would fail if we pass an invalid user_id
          // 3. user_id will be set on step 6 (final completion) when user is confirmed

          const { data: partialContractor, error: partialError } = await supabaseAnon
            .from('technicians')
            .insert({
              full_name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              street: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zipCode,
              trade_needed: 'pending',
              is_available: false,
              signed_up: false,
              onboarding_complete: false
            })
            .select()
            .single();

          if (partialError) {
            console.error('Error creating partial contractor record:', partialError);
            throw partialError;
          }

          if (partialContractor) {
            console.log('Partial contractor created with ID:', partialContractor.id);
            setContractorId(partialContractor.id);
            localStorage.setItem('contractorOnboardingId', partialContractor.id);
          }
          break;

        case 2: // Trade Selection - just store in state
          break;

        case 3: // Licenses - just store in state
          break;

        case 4: // Certifications - just store in state
          break;

        case 5: // Insurance - just store in state
          break;

        case 6: // Background Check - FINAL STEP: Save everything to database
          console.log('Saving all contractor data to database...');

          let newContractorId: string;

          // Try to get the current authenticated user (if email was confirmed)
          const { data: { user: currentUser } } = await supabaseAnon.auth.getUser();
          const confirmedUserId = currentUser?.id || null;
          console.log('Current authenticated user:', confirmedUserId ? 'Found' : 'Not found');

          // 1. Create or update technician record
          if (contractorId) {
            // Update existing record
            console.log('Updating existing contractor record:', contractorId);

            // Build update data - only include user_id if user is confirmed
            const updateData: Record<string, any> = {
              trades: formData.trades,
              trade_needed: formData.trades[0] || 'general',
              years_experience: parseInt(formData.yearsExperience) || 0,
              background_check_authorized: formData.backgroundCheckAuthorized,
              electronic_signature: formData.signature,
              onboarding_complete: true,
              onboarding_completed_at: new Date().toISOString(),
              is_available: true,
              signed_up: true
            };

            // Link user_id if we have a confirmed user
            if (confirmedUserId) {
              updateData.user_id = confirmedUserId;
            }

            const { data: contractor, error: contractorError } = await supabaseAnon
              .from('technicians')
              .update(updateData)
              .eq('id', contractorId)
              .select()
              .single();

            if (contractorError) {
              console.error('Error updating contractor:', contractorError);
              throw contractorError;
            }

            newContractorId = contractor.id;
            console.log('Contractor updated with ID:', newContractorId);
          } else {
            // Create new record (fallback if Step 1 failed)
            console.log('Creating new contractor record...');

            // Build insert data - only include user_id if user is confirmed
            const insertDataFinal: Record<string, any> = {
              full_name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              street: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zipCode,
              trades: formData.trades,
              trade_needed: formData.trades[0] || 'general',
              years_experience: parseInt(formData.yearsExperience) || 0,
              background_check_authorized: formData.backgroundCheckAuthorized,
              electronic_signature: formData.signature,
              onboarding_complete: true,
              onboarding_completed_at: new Date().toISOString(),
              is_available: true,
              signed_up: true
            };

            // Link user_id if we have a confirmed user
            if (confirmedUserId) {
              insertDataFinal.user_id = confirmedUserId;
            }

            const { data: contractor, error: contractorError } = await supabaseAnon
              .from('technicians')
              .insert(insertDataFinal)
              .select()
              .single();

            if (contractorError) {
              console.error('Error creating contractor:', contractorError);
              throw contractorError;
            }

            newContractorId = contractor.id;
            console.log('Contractor created with ID:', newContractorId);
          }

          // 2. Insert licenses
          if (formData.licenses.length > 0) {
            const licensesToInsert = formData.licenses.map(lic => ({
              contractor_id: newContractorId,
              license_name: lic.name,
              license_number: lic.number,
              state: lic.state,
              expiration_date: lic.expirationDate
            }));

            const { error: licensesError } = await supabaseAnon
              .from('contractor_licenses')
              .insert(licensesToInsert);

            if (licensesError) {
              console.error('Error inserting licenses:', licensesError);
              throw licensesError;
            }
            console.log('Licenses inserted:', licensesToInsert.length);
          }

          // 3. Insert certifications
          if (formData.certifications.length > 0) {
            const certsToInsert = formData.certifications.map(cert => ({
              contractor_id: newContractorId,
              certification_name: cert.name,
              certification_number: cert.number || null,
              expiration_date: cert.expirationDate || null
            }));

            const { error: certsError } = await supabaseAnon
              .from('contractor_certifications')
              .insert(certsToInsert);

            if (certsError) {
              console.error('Error inserting certifications:', certsError);
              throw certsError;
            }
            console.log('Certifications inserted:', certsToInsert.length);
          }

          // 4. Insert insurance
          const insuranceToInsert = [
            {
              contractor_id: newContractorId,
              insurance_type: 'general_liability',
              carrier: formData.generalLiability.carrier,
              policy_number: formData.generalLiability.policyNumber,
              coverage_amount: parseInt(formData.generalLiability.coverage),
              expiration_date: formData.generalLiability.expirationDate
            },
            {
              contractor_id: newContractorId,
              insurance_type: 'workers_comp',
              carrier: formData.workersComp.carrier,
              policy_number: formData.workersComp.policyNumber,
              coverage_amount: null,
              expiration_date: formData.workersComp.expirationDate
            }
          ];

          const { error: insuranceError } = await supabaseAnon
            .from('contractor_insurance')
            .insert(insuranceToInsert);

          if (insuranceError) {
            console.error('Error inserting insurance:', insuranceError);
            throw insuranceError;
          }
          console.log('Insurance inserted');

          setContractorId(newContractorId);

          // Clear onboarding data from localStorage but KEEP the contractor ID
          // The dashboard needs this ID to fetch contractor details
          console.log('Clearing onboarding data from localStorage...');
          localStorage.removeItem('contractorOnboardingData');
          localStorage.removeItem('contractorOnboardingStep');
          // DON'T remove contractorOnboardingId - dashboard needs it
          break;
      }

      return true;
    } catch (error) {
      console.error('Failed to save step data:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error: ${errorMessage}`);
      return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    // Save current step data
    const saved = await saveStepData(currentStep);

    if (!saved) {
      alert('Failed to save data. Please try again.');
      return;
    }

    if (currentStep === totalSteps) {
      // Final step (Step 6) - redirect to dashboard immediately
      console.log('Onboarding complete, redirecting to dashboard...');
      router.push('/contractors/dashboard');
    } else {
      // Not final step - show success animation and move to next step
      setShowSuccess(true);
    }
  };

  // Handle success animation complete
  const handleSuccessComplete = () => {
    setShowSuccess(false);
    const newStep = currentStep + 1;
    setCurrentStep(newStep);
    localStorage.setItem('contractorOnboardingStep', newStep.toString());
  };

  // Handle back
  const handleBack = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      localStorage.setItem('contractorOnboardingStep', newStep.toString());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: 'var(--spacing-2xl)',
      paddingTop: 'var(--spacing-5xl)'
    }}>
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>

      <div style={{
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--spacing-5xl)' }}>
          <h1 style={{
            fontSize: 'var(--font-4xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-section-title)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Contractor Onboarding
          </h1>
          <p style={{
            fontSize: 'var(--font-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: 'var(--progress-bar-height)',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--progress-bar-radius)',
          overflow: 'hidden',
          marginBottom: 'var(--spacing-5xl)'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #6C72C9 0%, #9896D5 100%)',
              borderRadius: 'var(--progress-bar-radius)'
            }}
          />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {currentStep === 1 && (
              <BasicInfoStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 2 && (
              <TradeSelectionStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 3 && (
              <LicensesStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <CertificationsStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 5 && (
              <InsuranceStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 6 && (
              <BackgroundCheckStep
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
