/**
 * AIT Scholarship Connect — Deterministic Smart Eligibility Engine
 * Evaluates student profiles against verified scholarship criteria.
 * 
 * Results:
 * - LIKELY_ELIGIBLE: All mandatory conditions verified and satisfied.
 * - NOT_ELIGIBLE: One or more confirmed mandatory conditions fail.
 * - NEEDS_MORE_INFO: Missing optional fields or conditions needing provider verification.
 */

// Helper to normalize state names and codes
function normalizeStateCode(stateStr) {
  if (!stateStr) return '';
  const s = String(stateStr).toUpperCase().trim();
  const map = {
    'MAHARASHTRA': 'MH', 'MH': 'MH',
    'BIHAR': 'BR', 'BR': 'BR',
    'UTTAR PRADESH': 'UP', 'UP': 'UP',
    'RAJASTHAN': 'RJ', 'RJ': 'RJ',
    'MADHYA PRADESH': 'MP', 'MP': 'MP',
    'PUNJAB': 'PB', 'PB': 'PB',
    'HARYANA': 'HR', 'HR': 'HR',
    'DELHI': 'DL', 'DL': 'DL',
    'TAMIL NADU': 'TN', 'TN': 'TN',
    'KARNATAKA': 'KA', 'KA': 'KA',
    'KERALA': 'KL', 'KL': 'KL',
    'ANDHRA PRADESH': 'AP', 'AP': 'AP',
    'TELANGANA': 'TS', 'TS': 'TS',
    'WEST BENGAL': 'WB', 'WB': 'WB',
    'ODISHA': 'OD', 'OD': 'OD',
    'ASSAM': 'AS', 'AS': 'AS',
    'GUJARAT': 'GJ', 'GJ': 'GJ',
    'JHARKHAND': 'JH', 'JH': 'JH',
    'CHHATTISGARH': 'CG', 'CG': 'CG',
    'UTTARAKHAND': 'UK', 'UK': 'UK',
    'HIMACHAL PRADESH': 'HP', 'HP': 'HP',
    'JAMMU AND KASHMIR': 'JK', 'JK': 'JK',
    'LADAKH': 'LA', 'LA': 'LA',
    'GOA': 'GA', 'GA': 'GA'
  };
  return map[s] || s;
}

// Helper to normalize defence / service category
function normalizeServiceCategory(cat) {
  if (!cat) return 'NONE';
  const c = String(cat).toUpperCase().trim();
  if (c === 'ESM_PRIORITY_1_TO_8' || c === 'RETIRED_ARMY_ESM' || c === 'EX_SERVICEMEN') return 'RETIRED_ARMY_ESM';
  if (c === 'SERVING_ARMY' || c === 'SERVING') return 'SERVING_ARMY';
  if (c === 'BATTLE_CASUALTY' || c === 'BATTLE_CASUALTY_MARTYR') return 'BATTLE_CASUALTY_MARTYR';
  if (c === 'CAPF_AR' || c === 'CAPF_ASSAM_RIFLES' || c === 'WARB') return 'CAPF_ASSAM_RIFLES';
  if (c === 'STATE_POLICE_MARTYR' || c === 'POLICE_MARTYR') return 'STATE_POLICE_MARTYR';
  return c;
}

export function evaluateScholarshipEligibility(scholarship, studentData = {}, rules = []) {
  const requirementsMet = [];
  const needsVerification = [];
  const notSatisfied = [];

  const slug = scholarship.slug || '';
  const title = (scholarship.title || scholarship.name || '').toLowerCase();

  // Student attributes with fallback
  const branch = studentData.branch || null;
  const year = studentData.year ? parseInt(studentData.year, 10) : null;
  const rawDomicile = studentData.domicile_state || '';
  const domicileCode = normalizeStateCode(rawDomicile);
  
  const income = studentData.annual_family_income != null 
    ? parseInt(studentData.annual_family_income, 10) 
    : studentData.family_annual_income != null
    ? parseInt(studentData.family_annual_income, 10)
    : null;

  const category = (studentData.category || 'GENERAL').toUpperCase().trim();
  const gender = (studentData.gender || '').toUpperCase().trim();
  const isDifferentlyAbled = Boolean(studentData.is_differently_abled || studentData.is_pwd);
  const disabilityPct = studentData.disability_percentage ? parseInt(studentData.disability_percentage, 10) : 0;
  
  const rawMarks = studentData.cgpa != null
    ? studentData.cgpa * 9.5
    : studentData.twelfth_percentage != null
    ? parseFloat(studentData.twelfth_percentage)
    : studentData.class_12_percentage != null
    ? parseFloat(studentData.class_12_percentage)
    : null;

  const serviceCategory = normalizeServiceCategory(studentData.service_category || studentData.defence_category);
  const isOrphan = Boolean(studentData.is_orphan);
  const singleGirlChild = Boolean(studentData.single_girl_child || studentData.is_single_girl_child);

  // 1. Degree & Course Evaluation (AIT Pune is Undergraduate Engineering B.E. / B.Tech)
  requirementsMet.push({
    title: 'Degree & Institution Approval',
    description: 'Enrolled in undergraduate B.Tech at Army Institute of Technology (AICTE approved, autonomous SPPU).'
  });

  // 2. Branch Restriction Check
  if (scholarship.eligible_branches && scholarship.eligible_branches !== 'All') {
    const branches = scholarship.eligible_branches.split(',').map(b => b.trim().toLowerCase());
    if (!branch) {
      needsVerification.push({
        title: 'Branch Requirement',
        description: `Scheme specifies branches (${scholarship.eligible_branches}). Please confirm your engineering branch in profile.`
      });
    } else if (branches.some(b => branch.toLowerCase().includes(b) || b.includes(branch.toLowerCase()))) {
      requirementsMet.push({
        title: 'Branch Eligibility',
        description: `Your branch (${branch}) is eligible for this scholarship.`
      });
    } else {
      notSatisfied.push({
        title: 'Branch Ineligible',
        description: `Scheme is restricted to ${scholarship.eligible_branches}, but your profile branch is ${branch}.`
      });
    }
  }

  // 3. Academic Year & Entry Restrictions (Crucial: 1st Year Fresh vs Later Years)
  if (scholarship.eligible_years && scholarship.eligible_years !== 'All') {
    const allowedYears = scholarship.eligible_years.split(',').map(y => parseInt(y.trim(), 10)).filter(Boolean);
    if (!year) {
      needsVerification.push({
        title: 'Academic Year',
        description: `Scheme restricted to Year(s) ${scholarship.eligible_years}. Please set your current academic year.`
      });
    } else if (allowedYears.includes(year)) {
      requirementsMet.push({
        title: 'Academic Year Eligibility',
        description: `Currently enrolled in Year ${year}, satisfying eligibility window (${scholarship.eligible_years}).`
      });
    } else {
      notSatisfied.push({
        title: 'Academic Year Restriction',
        description: `Scheme accepts applications from Year(s) ${scholarship.eligible_years}, but you are currently in Year ${year}.`
      });
    }
  }

  // 4. Gender Restriction Check
  if (scholarship.gender_restriction && scholarship.gender_restriction !== 'ANY') {
    if (!gender) {
      needsVerification.push({
        title: 'Gender Criteria',
        description: `Scheme is specifically designed for ${scholarship.gender_restriction.toLowerCase()} students. Please confirm gender in profile.`
      });
    } else if (gender === scholarship.gender_restriction.toUpperCase()) {
      requirementsMet.push({
        title: 'Gender Eligibility',
        description: `Gender requirement satisfied (${gender.toLowerCase()}).`
      });
    } else {
      notSatisfied.push({
        title: 'Gender Ineligible',
        description: `This scheme is restricted exclusively to ${scholarship.gender_restriction.toLowerCase()} applicants.`
      });
    }
  }

  // 5. Family Income Threshold Check
  if (scholarship.max_income && scholarship.max_income > 0) {
    if (income === null || income === undefined) {
      needsVerification.push({
        title: 'Family Income Verification',
        description: `Scheme requires annual family income <= ₹${scholarship.max_income.toLocaleString('en-IN')}. Please provide income in profile.`
      });
    } else if (income <= scholarship.max_income) {
      requirementsMet.push({
        title: 'Family Income Threshold',
        description: `Declared family income (₹${income.toLocaleString('en-IN')}) is within the permissible limit (₹${scholarship.max_income.toLocaleString('en-IN')}).`
      });
    } else {
      notSatisfied.push({
        title: 'Income Ceiling Exceeded',
        description: `Declared family income of ₹${income.toLocaleString('en-IN')} exceeds the scheme ceiling of ₹${scholarship.max_income.toLocaleString('en-IN')}.`
      });
    }
  }

  // 6. Social Category Restriction Check
  if (scholarship.category_restriction && scholarship.category_restriction !== 'ALL') {
    const allowedCategories = scholarship.category_restriction.split(',').map(c => c.trim().toUpperCase());
    const matchesCategory = allowedCategories.includes(category) || 
      (allowedCategories.includes('EWS') && (category === 'EBC' || category === 'EWS')) ||
      (allowedCategories.includes('GEN') && category === 'GENERAL');

    if (matchesCategory) {
      requirementsMet.push({
        title: 'Social Category Criteria',
        description: `Category (${category}) matches scheme requirements (${scholarship.category_restriction}).`
      });
    } else {
      notSatisfied.push({
        title: 'Category Ineligible',
        description: `Scheme is reserved for ${scholarship.category_restriction} students, but your profile category is ${category}.`
      });
    }
  }

  // 7. Domicile & Out-of-State Study Check (Crucial for AIT Pune!)
  if (scholarship.applicable_states && scholarship.applicable_states !== 'ALL_INDIA') {
    const allowedStateCodes = scholarship.applicable_states.split(',').map(s => normalizeStateCode(s));
    
    if (!domicileCode) {
      needsVerification.push({
        title: 'State of Domicile',
        description: `Scheme requires permanent domicile in ${scholarship.applicable_states}. Please select your home state in profile.`
      });
    } else if (allowedStateCodes.includes(domicileCode)) {
      requirementsMet.push({
        title: 'State Domicile Match',
        description: `Your declared domicile (${rawDomicile || domicileCode}) matches scheme jurisdiction.`
      });
      // Check if out-of-state study is permitted (AIT Pune is in Maharashtra)
      if (domicileCode !== 'MH' && scholarship.outside_state_study_allowed === 0) {
        notSatisfied.push({
          title: 'Study Location Restriction',
          description: 'This scheme does not permit study in colleges located outside the home state.'
        });
      }
    } else {
      notSatisfied.push({
        title: 'Domicile Ineligible',
        description: `This scheme is exclusively for residents of ${scholarship.applicable_states} (Maharashtra State Domicile). Your declared domicile is ${rawDomicile || domicileCode}.`
      });
    }
  }

  // 8. Defence / Service Family Status Check
  if (scholarship.defence_category && scholarship.defence_category !== 'NONE') {
    const requiredDefs = scholarship.defence_category.split(',').map(d => normalizeServiceCategory(d));
    
    if (serviceCategory === 'NONE') {
      if (scholarship.category === 'DEFENCE') {
        needsVerification.push({
          title: 'Defence Service Status',
          description: `Scheme requires parent to have served in Armed Forces (${scholarship.defence_category.replace(/_/g, ' ')}). Please verify service details in profile.`
        });
      } else if (scholarship.category === 'POLICE_CAPF') {
        needsVerification.push({
          title: 'CAPF / Police Service Status',
          description: 'Scheme requires parent service in Central Armed Police Forces (CAPF) or State Police martyr category.'
        });
      } else {
        notSatisfied.push({
          title: 'Defence Service Required',
          description: `Scheme requires parent service in ${scholarship.defence_category.replace(/_/g, ' ')}.`
        });
      }
    } else if (requiredDefs.includes(serviceCategory) || (requiredDefs.includes('RETIRED_ARMY_ESM') && serviceCategory === 'BATTLE_CASUALTY_MARTYR')) {
      requirementsMet.push({
        title: 'Service Family Eligibility',
        description: `Service category (${serviceCategory.replace(/_/g, ' ')}) matches scheme requirements.`
      });
    } else {
      // Clear distinction between Armed Forces (Army) vs CAPF vs State Police
      if ((scholarship.defence_category.includes('CAPF') || scholarship.category === 'POLICE_CAPF') && (serviceCategory === 'RETIRED_ARMY_ESM' || serviceCategory === 'SERVING_ARMY')) {
        notSatisfied.push({
          title: 'CAPF Requirement Mismatch',
          description: `Scheme is exclusively for Central Armed Police Forces (CAPF) (WARB PMSS - BSF, CRPF, CISF, ITBP, SSB, Assam Rifles). It does not apply to Armed Forces (Army/Navy/Air Force) personnel.`
        });
      } else if (scholarship.defence_category.includes('STATE_POLICE_MARTYR') && (serviceCategory === 'RETIRED_ARMY_ESM' || serviceCategory === 'SERVING_ARMY')) {
        notSatisfied.push({
          title: 'Police Martyr Requirement',
          description: 'Scheme is exclusively for wards of State Police personnel martyred during terror or naxal attacks.'
        });
      } else if (scholarship.defence_category.includes('RETIRED_ARMY_ESM') && serviceCategory === 'SERVING_ARMY') {
        notSatisfied.push({
          title: 'Ex-Servicemen (ESM) Only',
          description: 'KSB PMSS is reserved exclusively for wards of retired Ex-Servicemen pensioners. Wards of serving Army personnel are eligible for ESSA instead.'
        });
      } else {
        notSatisfied.push({
          title: 'Service Category Mismatch',
          description: `Scheme requires ${scholarship.defence_category.replace(/_/g, ' ')}, but your profile indicates ${serviceCategory.replace(/_/g, ' ')}.`
        });
      }
    }
  }

  // 9. Disability Check (if scheme requires it)
  const isDisabilityScheme = scholarship.subcategory === 'DISABILITY_AFFAIRS' || 
    (slug && (slug.includes('saksham') || slug.includes('disabilit'))) ||
    title.includes('saksham') || title.includes('disabilit');

  if (isDisabilityScheme) {
    if (!isDifferentlyAbled) {
      notSatisfied.push({
        title: 'Disability Criteria',
        description: 'Scheme is exclusively for differently-abled students with >= 40% certified disability.'
      });
    } else if (disabilityPct >= 40) {
      requirementsMet.push({
        title: 'Certified Disability Threshold',
        description: `Certified disability (${disabilityPct}%) satisfies minimum requirement (>= 40%).`
      });
    } else {
      notSatisfied.push({
        title: 'Disability Percentage Insufficient',
        description: `Disability percentage (${disabilityPct}%) is below mandatory threshold of 40%.`
      });
    }
  }

  // 10. Academic Percentage Cutoff Check
  if (scholarship.min_percentage && scholarship.min_percentage > 0) {
    if (rawMarks === null || rawMarks === undefined) {
      needsVerification.push({
        title: 'Academic Performance',
        description: `Requires minimum ${scholarship.min_percentage}% marks in previous exam. Please update marks in profile.`
      });
    } else if (rawMarks >= scholarship.min_percentage) {
      requirementsMet.push({
        title: 'Academic Score Threshold',
        description: `Score (${rawMarks.toFixed(1)}%) satisfies the minimum requirement of ${scholarship.min_percentage}%.`
      });
    } else {
      notSatisfied.push({
        title: 'Academic Score Below Cutoff',
        description: `Score of ${rawMarks.toFixed(1)}% does not meet the minimum requirement of ${scholarship.min_percentage}%.`
      });
    }
  }

  // 11. Application Window Status Check
  const today = '2026-10-24'; // Fixed reference anchor
  const isExpired = scholarship.application_close_at && scholarship.application_close_at < today;
  if (isExpired) {
    notSatisfied.push({
      title: 'Application Window Closed',
      description: `The application deadline (${scholarship.application_close_at}) has passed for this academic cycle.`
    });
  }

  // Determine Overall Assessment
  let eligibilityResult = 'LIKELY_ELIGIBLE';
  if (notSatisfied.length > 0) {
    eligibilityResult = 'NOT_ELIGIBLE';
  } else if (needsVerification.length > 0) {
    eligibilityResult = 'NEEDS_MORE_INFO';
  }

  return {
    result: eligibilityResult,
    is_eligible: eligibilityResult === 'LIKELY_ELIGIBLE',
    score: eligibilityResult === 'LIKELY_ELIGIBLE' ? 100 : eligibilityResult === 'NEEDS_MORE_INFO' ? 65 : 15,
    requirements_met: requirementsMet,
    needs_verification: needsVerification,
    not_satisfied: notSatisfied,
    location_notice: 'Your domicile and college location have been considered separately.',
    disclaimer: 'Eligibility assessment is indicative and based on verified guidelines. Final award decision rests with the official scholarship provider.'
  };
}
