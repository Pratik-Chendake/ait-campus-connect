/**
 * AIT Pune Opportunity Eligibility Engine
 * 
 * Assesses external hackathons and competitions specifically for students
 * of Army Institute of Technology (AIT), Pune:
 * - 4-year undergraduate B.E. programs (COMP, IT, ENTC, MECH, ASGE)
 * - Affiliated with Savitribai Phule Pune University (SPPU)
 * - Approved by AICTE, New Delhi
 * - NAAC 'A' Grade Accredited
 */

export const ELIGIBILITY_CATEGORIES = {
  ELIGIBLE: 'ELIGIBLE',
  POTENTIALLY_ELIGIBLE: 'POTENTIALLY_ELIGIBLE',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  INSUFFICIENT_INFORMATION: 'INSUFFICIENT_INFORMATION'
};

/**
 * Evaluates an opportunity record for AIT Pune student eligibility
 * 
 * @param {Object} rawItem - Normalized or raw opportunity record
 * @returns {{ category: string, reason: string, details: Object }}
 */
export function evaluateAITEligibility(rawItem) {
  if (!rawItem) {
    return {
      category: ELIGIBILITY_CATEGORIES.INSUFFICIENT_INFORMATION,
      reason: 'No eligibility criteria provided by organizer.',
      details: {}
    };
  }

  const eligibility = Array.isArray(rawItem.eligibility)
    ? rawItem.eligibility
    : (typeof rawItem.eligibility === 'string' ? [rawItem.eligibility] : []);

  const title = (rawItem.title || '').toLowerCase();
  const desc = (rawItem.description || '').toLowerCase();
  const org = (rawItem.organization || rawItem.organizer || '').toLowerCase();

  const eligibilityText = eligibility.join(' ').toLowerCase();
  const fullText = `${eligibilityText} ${title} ${desc}`;

  // 1. Direct disqualifications (e.g., exclusively for specific other institutions, working professionals only, postgrad only)
  const isPostgradOnly = (fullText.includes('postgraduate only') || fullText.includes('masters only') || fullText.includes('phd only')) &&
                         !fullText.includes('undergraduate') && !fullText.includes('engineering students');
  
  const isSchoolOnly = fullText.includes('school students only') || fullText.includes('k-12 only') || fullText.includes('classes 8 to 12');

  const isWomenOnly = fullText.includes('women only') || fullText.includes('for female candidates only') || fullText.includes('women in tech hackathon');

  if (isPostgradOnly) {
    return {
      category: ELIGIBILITY_CATEGORIES.NOT_ELIGIBLE,
      reason: 'Not eligible: Restricted exclusively to postgraduate/doctoral candidates.',
      details: { undergraduateAllowed: false }
    };
  }

  if (isSchoolOnly) {
    return {
      category: ELIGIBILITY_CATEGORIES.NOT_ELIGIBLE,
      reason: 'Not eligible: Restricted exclusively to school students (K-12).',
      details: { collegeAllowed: false }
    };
  }

  // 2. Clear Positive Matches for AIT Undergraduate Engineers
  const mentionsEngineering = fullText.includes('engineering students') ||
                              fullText.includes('b.tech') ||
                              fullText.includes('b.e.') ||
                              fullText.includes('b.tech/b.e.') ||
                              fullText.includes('engineering');

  const mentionsUndergrad = fullText.includes('undergraduate') ||
                            fullText.includes('college students') ||
                            fullText.includes('university students') ||
                            fullText.includes('all college students') ||
                            fullText.includes('open to all');

  if (mentionsEngineering && mentionsUndergrad) {
    if (isWomenOnly) {
      return {
        category: ELIGIBILITY_CATEGORIES.POTENTIALLY_ELIGIBLE,
        reason: 'Eligible for female AIT undergraduate engineering students (Women in Tech track).',
        details: { undergraduateAllowed: true, engineeringAllowed: true, trackSpecific: true }
      };
    }

    return {
      category: ELIGIBILITY_CATEGORIES.ELIGIBLE,
      reason: 'Verified Eligible: Open to all AIT undergraduate engineering students across Computer, IT, E&TC, and Mechanical branches.',
      details: {
        undergraduateAllowed: true,
        engineeringAllowed: true,
        aitBranches: ['COMP', 'IT', 'ENTC', 'MECH', 'ASGE']
      }
    };
  }

  if (mentionsEngineering || mentionsUndergrad) {
    return {
      category: ELIGIBILITY_CATEGORIES.POTENTIALLY_ELIGIBLE,
      reason: 'Potentially eligible: Open to undergraduate engineering students. Specific graduation-year or team constraints require verification on Unstop.',
      details: {
        undergraduateAllowed: Boolean(mentionsUndergrad),
        engineeringAllowed: Boolean(mentionsEngineering)
      }
    };
  }

  // 3. Fallback when criteria exists but is broad
  if (eligibility.length > 0) {
    return {
      category: ELIGIBILITY_CATEGORIES.POTENTIALLY_ELIGIBLE,
      reason: `Potentially eligible: Listed criteria: "${eligibility.slice(0, 3).join(', ')}". Verify team restrictions on official page.`,
      details: { listedCriteria: eligibility }
    };
  }

  // 4. Incomplete data
  return {
    category: ELIGIBILITY_CATEGORIES.INSUFFICIENT_INFORMATION,
    reason: 'Insufficient information: Eligibility criteria not explicitly specified by organizer. Check official Unstop link.',
    details: {}
  };
}
