import crypto from 'crypto';

/**
 * Generates a stable, deterministic deduplication key for an opportunity.
 * 
 * Rules:
 * 1. If Unstop ID exists (e.g. "1774353"), key is "UNSTOP_1774353".
 * 2. If ID is missing, compute SHA-256 hash of canonical lowercase URL.
 * 3. Never use random IDs.
 */
export function generateStableDeduplicationKey(source, sourceOpportunityId, canonicalUrl) {
  if (sourceOpportunityId && String(sourceOpportunityId).trim()) {
    const cleanId = String(sourceOpportunityId).trim().replace(/[^a-zA-Z0-9_-]/g, '');
    return `${source.toUpperCase()}_${cleanId}`;
  }

  if (canonicalUrl && String(canonicalUrl).trim()) {
    const cleanUrl = String(canonicalUrl).toLowerCase().trim().replace(/[\?#].*$/, '').replace(/\/+$/, '');
    const hash = crypto.createHash('sha256').update(cleanUrl).digest('hex').slice(0, 16);
    return `${source.toUpperCase()}_URL_${hash}`;
  }

  throw new Error('Cannot generate stable deduplication key: Missing both sourceOpportunityId and canonicalUrl.');
}

/**
 * Deduplicates an array of opportunity records in-memory, keeping the freshest record
 */
export function deduplicateOpportunityBatch(records) {
  const map = new Map();

  for (const record of records) {
    const key = record.unstop_id || record.source_opportunity_id;
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, record);
    } else {
      // If already present, keep the one with newer updatedAt or more complete description
      const existing = map.get(key);
      const isNewer = new Date(record.updated_at || 0) > new Date(existing.updated_at || 0);
      const hasLongerDesc = (record.description || '').length > (existing.description || '').length;

      if (isNewer || hasLongerDesc) {
        map.set(key, record);
      }
    }
  }

  return Array.from(map.values());
}
