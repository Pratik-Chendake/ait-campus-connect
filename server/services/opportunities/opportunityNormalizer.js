import { evaluateAITEligibility } from './opportunityEligibility.js';
import { generateStableDeduplicationKey } from './opportunityDeduplicator.js';

/**
 * Normalizes a raw validated Unstop opportunity into canonical internal format
 * 
 * @param {Object} raw - Raw item from Apify dataset
 * @returns {Object} Normalized opportunity record matching Supabase & local DB
 */
export function normalizeUnstopOpportunity(raw) {
  const sourceId = String(raw.id || '').trim();
  const canonicalUrl = raw.url || raw.shortUrl || '';
  const stableId = generateStableDeduplicationKey('UNSTOP', sourceId, canonicalUrl);

  // Generate URL slug from title and ID
  const cleanTitle = (raw.title || 'unstop-opportunity').trim();
  const titleSlug = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${titleSlug}-${sourceId || stableId.slice(-6)}`;

  // Parse ISO Dates safely with timezone awareness
  const parseSafeDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const registrationDeadline = parseSafeDate(raw.registrationDeadline);
  const registrationStart = parseSafeDate(raw.registrationStart);
  const eventEnd = parseSafeDate(raw.endDate);
  const eventStart = registrationDeadline || registrationStart || new Date().toISOString();

  // Parse Prize Cash
  let prizePool = null;
  if (raw.totalPrizeCash && !isNaN(Number(raw.totalPrizeCash)) && Number(raw.totalPrizeCash) > 0) {
    prizePool = `₹${Number(raw.totalPrizeCash).toLocaleString('en-IN')}`;
  } else if (Array.isArray(raw.prizes) && raw.prizes.length > 0) {
    const firstCash = raw.prizes.find(p => p.cash || p.amount);
    if (firstCash) {
      prizePool = `₹${(firstCash.cash || firstCash.amount).toLocaleString('en-IN')}`;
    } else {
      prizePool = 'Prizes & Certifications';
    }
  } else {
    prizePool = 'Certificates & Goodies';
  }

  // Parse Mode
  let mode = 'Online';
  const rawMode = (raw.mode || '').toLowerCase();
  if (rawMode.includes('offline') || rawMode.includes('in-person') || rawMode.includes('physical')) {
    mode = 'In-Person';
  } else if (rawMode.includes('hybrid')) {
    mode = 'Hybrid';
  } else {
    mode = 'Online';
  }

  // Parse Location
  let location = mode === 'Online' ? 'Online' : 'On-Campus / Designated Venue';
  if (Array.isArray(raw.locations) && raw.locations.length > 0) {
    location = raw.locations.join(', ');
  }

  // Evaluate AIT Pune Eligibility
  const aitEligibility = evaluateAITEligibility(raw);

  // Parse Skills & Domains
  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const functions = Array.isArray(raw.functions) ? raw.functions : [];
  const categories = Array.isArray(raw.categories) ? raw.categories : [];
  const domains = Array.from(new Set([...functions, ...categories]));

  // Banner / Logo
  const bannerUrl = raw.organizationLogo ||
                    raw.bannerImageUrl ||
                    raw.logo ||
                    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80';

  // Fee
  const isPaid = Boolean(raw.isPaidEntry);
  const registrationFee = isPaid ? 'Paid Entry' : 'Free';

  // Team Size constraints
  const teamMinSize = typeof raw.teamSizeMin === 'number' && raw.teamSizeMin > 0 ? raw.teamSizeMin : 1;
  const teamMaxSize = typeof raw.teamSizeMax === 'number' && raw.teamSizeMax >= teamMinSize ? raw.teamSizeMax : 4;

  const now = new Date().toISOString();

  return {
    source: 'UNSTOP',
    source_opportunity_id: sourceId,
    unstop_id: stableId,
    title: cleanTitle,
    slug,
    organizer: (raw.organization || 'Unstop Partner').trim(),
    opportunity_type: raw.type || 'hackathons',
    description: (raw.description || '').trim(),
    problem_statement: raw.problemStatement || null,
    prize_pool: prizePool,
    prize_details: raw.prizes || [],
    eligibility: raw.eligibility || [],
    eligibility_category: aitEligibility.category,
    eligibility_reason: aitEligibility.reason,
    registration_fee: registrationFee,
    team_min_size: teamMinSize,
    team_max_size: teamMaxSize,
    registration_start: registrationStart,
    registration_deadline: registrationDeadline,
    event_start: eventStart,
    event_end: eventEnd,
    mode,
    location,
    banner_url: bannerUrl,
    source_url: canonicalUrl,
    official_url: canonicalUrl,
    skills_required: skills,
    domains,
    rounds: raw.rounds || [],
    rules: raw.rules || [],
    contact_information: {
      organizationUrl: raw.organizationUrl || null,
      shortUrl: raw.shortUrl || null
    },
    raw_data: raw,
    data_quality_status: 'VERIFIED',
    verification_status: 'VERIFIED',
    is_active: 1,
    last_seen_at: now,
    created_at: parseSafeDate(raw.postedAt) || now,
    updated_at: now
  };
}
