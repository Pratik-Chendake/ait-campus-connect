import { supabaseAdmin, isSupabaseConfigured } from './supabaseClient.js';
import { query } from '../../db/database.js';

/**
 * Repository layer managing Supabase PostgreSQL and local SQLite persistence
 */

export async function upsertOpportunitiesToSupabase(records) {
  if (!isSupabaseConfigured() || !records || records.length === 0) {
    return { success: false, count: 0, reason: 'Supabase not configured or no records' };
  }

  try {
    const supabasePayload = records.map(r => ({
      source: r.source,
      source_opportunity_id: r.source_opportunity_id,
      unstop_id: r.unstop_id,
      title: r.title,
      slug: r.slug,
      organizer: r.organizer,
      opportunity_type: r.opportunity_type,
      description: r.description,
      problem_statement: r.problem_statement,
      prize_pool: r.prize_pool,
      prize_details: r.prize_details,
      eligibility: r.eligibility,
      eligibility_category: r.eligibility_category,
      eligibility_reason: r.eligibility_reason,
      registration_fee: r.registration_fee,
      team_min_size: r.team_min_size,
      team_max_size: r.team_max_size,
      registration_start: r.registration_start,
      registration_deadline: r.registration_deadline,
      event_start: r.event_start,
      event_end: r.event_end,
      mode: r.mode,
      location: r.location,
      banner_url: r.banner_url,
      source_url: r.source_url,
      official_url: r.official_url,
      skills_required: r.skills_required,
      domains: r.domains,
      rounds: r.rounds,
      rules: r.rules,
      contact_information: r.contact_information,
      raw_data: r.raw_data,
      data_quality_status: r.data_quality_status,
      verification_status: r.verification_status,
      is_active: r.is_active,
      last_seen_at: r.last_seen_at,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    // Batch upsert into Supabase with chunks of 50
    const chunkSize = 50;
    let totalUpserted = 0;

    for (let i = 0; i < supabasePayload.length; i += chunkSize) {
      const chunk = supabasePayload.slice(i, i + chunkSize);
      const { data, error } = await supabaseAdmin
        .from('opportunities')
        .upsert(chunk, { onConflict: 'unstop_id' });

      if (error) {
        throw error;
      }
      totalUpserted += chunk.length;
    }

    return { success: true, count: totalUpserted };
  } catch (err) {
    console.warn('[Repository] Supabase upsert note:', err.message);
    return { success: false, count: 0, error: err.message };
  }
}

export async function recordSyncRunToSupabase(run) {
  if (!isSupabaseConfigured()) return;

  try {
    const payload = {
      sync_id: run.sync_id,
      source: run.source || 'UNSTOP',
      actor_id: run.actor_id || 'hipersoft/unstop-scraper',
      run_id: run.run_id,
      started_at: run.started_at,
      finished_at: run.finished_at,
      total_fetched: run.total_fetched || 0,
      inserted_records: run.inserted_records || 0,
      updated_records: run.updated_records || 0,
      failed_records: run.failed_records || 0,
      status: run.status || 'COMPLETED',
      error_summary: run.error_summary || null,
      execution_metadata: run.execution_metadata || {}
    };

    await supabaseAdmin
      .from('opportunity_sync_runs')
      .upsert([payload], { onConflict: 'sync_id' });
  } catch (err) {
    // Non-fatal logging
    console.warn('[Repository] Could not record sync run in Supabase:', err.message);
  }
}

/**
 * Upserts opportunities to local SQLite database for instant caching and offline resiliency
 */
export function upsertOpportunitiesToLocalDB(records) {
  if (!records || records.length === 0) return { inserted: 0, updated: 0 };

  let inserted = 0;
  let updated = 0;

  const stmtCheck = "SELECT id, unstop_id FROM opportunities WHERE unstop_id = ? OR source_key = ?";
  
  const stmtInsert = `
    INSERT INTO opportunities (
      source_key, title, opportunity_type, organizer, official_url, application_url,
      location_or_mode, stipend, paid_status, eligibility, required_skills,
      apply_deadline, verification_status, last_checked_date, is_live, is_active, notes,
      source, source_opportunity_id, unstop_id, banner_url, description, prize_pool,
      prize_details, eligibility_category, eligibility_reason, registration_fee,
      team_min_size, team_max_size, mode, location, domains, rounds, raw_data, last_seen_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, 'LIVE', 1, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `;

  const stmtUpdate = `
    UPDATE opportunities SET
      title = ?,
      organizer = ?,
      official_url = ?,
      application_url = ?,
      location_or_mode = ?,
      eligibility = ?,
      required_skills = ?,
      apply_deadline = ?,
      banner_url = ?,
      description = ?,
      prize_pool = ?,
      prize_details = ?,
      eligibility_category = ?,
      eligibility_reason = ?,
      registration_fee = ?,
      team_min_size = ?,
      team_max_size = ?,
      mode = ?,
      location = ?,
      domains = ?,
      rounds = ?,
      raw_data = ?,
      last_seen_at = ?,
      updated_at = ?
    WHERE id = ?
  `;

  for (const r of records) {
    try {
      const existing = query.get(stmtCheck, [r.unstop_id, r.unstop_id]);

      const skillsStr = Array.isArray(r.skills_required) ? r.skills_required.join(', ') : '';
      const domainsStr = Array.isArray(r.domains) ? r.domains.join(', ') : '';
      const eligibilityStr = Array.isArray(r.eligibility) ? r.eligibility.join(', ') : '';
      const prizeDetailsJson = JSON.stringify(r.prize_details || []);
      const roundsJson = JSON.stringify(r.rounds || []);
      const rawDataJson = JSON.stringify(r.raw_data || {});

      if (existing) {
        query.run(stmtUpdate, [
          r.title, r.organizer, r.official_url, r.source_url, r.mode,
          eligibilityStr, skillsStr, r.registration_deadline, r.banner_url,
          r.description, r.prize_pool, prizeDetailsJson, r.eligibility_category,
          r.eligibility_reason, r.registration_fee, r.team_min_size, r.team_max_size,
          r.mode, r.location, domainsStr, roundsJson, rawDataJson, r.last_seen_at,
          r.updated_at, existing.id
        ]);
        updated++;
      } else {
        query.run(stmtInsert, [
          r.unstop_id, r.title, r.opportunity_type || 'hackathons', r.organizer,
          r.official_url, r.source_url, r.mode, r.prize_pool, 'UNSPECIFIED',
          eligibilityStr, skillsStr, r.registration_deadline, 'VERIFIED',
          r.last_seen_at, r.eligibility_reason, r.source, r.source_opportunity_id,
          r.unstop_id, r.banner_url, r.description, r.prize_pool, prizeDetailsJson,
          r.eligibility_category, r.eligibility_reason, r.registration_fee,
          r.team_min_size, r.team_max_size, r.mode, r.location, domainsStr,
          roundsJson, rawDataJson, r.last_seen_at, r.updated_at
        ]);
        inserted++;
      }
    } catch (err) {
      console.warn(`[Repository] Error saving record ${r.unstop_id}:`, err.message);
    }
  }

  return { inserted, updated };
}

/**
 * Records a sync run in local SQLite database
 */
export function recordSyncRunToLocalDB(run) {
  try {
    const existing = query.get("SELECT id FROM opportunity_sync_runs WHERE sync_id = ?", [run.sync_id]);
    const metadataStr = typeof run.execution_metadata === 'object' ? JSON.stringify(run.execution_metadata) : (run.execution_metadata || '{}');

    if (existing) {
      query.run(`
        UPDATE opportunity_sync_runs SET
          finished_at = ?,
          total_fetched = ?,
          inserted_records = ?,
          updated_records = ?,
          failed_records = ?,
          status = ?,
          error_summary = ?,
          execution_metadata = ?
        WHERE id = ?
      `, [
        run.finished_at, run.total_fetched || 0, run.inserted_records || 0,
        run.updated_records || 0, run.failed_records || 0, run.status || 'COMPLETED',
        run.error_summary || null, metadataStr, existing.id
      ]);
    } else {
      query.run(`
        INSERT INTO opportunity_sync_runs (
          sync_id, source, actor_id, run_id, started_at, finished_at,
          total_fetched, inserted_records, updated_records, failed_records,
          status, error_summary, execution_metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        run.sync_id, run.source || 'UNSTOP', run.actor_id || 'hipersoft/unstop-scraper',
        run.run_id, run.started_at, run.finished_at, run.total_fetched || 0,
        run.inserted_records || 0, run.updated_records || 0, run.failed_records || 0,
        run.status || 'RUNNING', run.error_summary || null, metadataStr
      ]);
    }
  } catch (err) {
    console.warn('[Repository] Could not record sync run locally:', err.message);
  }
}

/**
 * Retrieves the latest sync run telemetry
 */
export function getLatestSyncRun() {
  try {
    return query.get("SELECT * FROM opportunity_sync_runs ORDER BY started_at DESC LIMIT 1");
  } catch (e) {
    return null;
  }
}
