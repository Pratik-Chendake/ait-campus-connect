# AIT Campus Connect — Research integration rules

Snapshot: **24 October 2026 (IST)**. Use this as a *dated research snapshot*, not as permanent live status.

## Source files and roles

- `document (6)(1).pdf` — **583-page AY 2025–26 institutional club activity report**: extract **historical** event dates, narratives, club names and records. Do not use previous-year secretaries/faculty as current.
- `AIT Student Club Instagram Directory(1).pdf` — **earlier generated secondary research**: useful index of leads, but may contain hallucinated or contradicted facts. NEVER mass-publish every row from it.
- `Pasted text(3).txt` — **user's research specification**, including strict 2026–27 appointment evidence rules.
- `ait_clubs_opportunities_seed.json` — normalized machine-readable list of 23 *user-supplied* Instagram handles plus carefully status-gated candidate events.
- `ANTIGRAVITY_MASTER_INTEGRATION_PROMPT.txt` — implementation brief.

## Publication policy

1. Exact, user-provided 23 Instagram handles may populate directory metadata. Do not claim all profiles were authenticated by AIT; do not misattribute current secretaries.
2. Current AY 2026–27 secretaries/faculty/staff require a reliable **primary document or explicit AY 2026–27 official announcement**. A purported circular is mentioned in the secondary PDF but that is not its authentication.
3. `publish:false` means admin-review queue ONLY — not exposed in site search, APIs, public profile pages or homepage counters.
4. `publish:true` historical records must go **only** to Archive if older than current event year and appropriately source-labelled.
5. Event time, registration time and application deadline are separate dimensions. Do not show “Register now” unless a genuine open registration page is confirmed.
6. Scrape no private Instagram data and do not attempt platform bypass. Use official APIs or authorized admin-import with source post URLs and moderation.
7. Every mutable fact must retain source URL/document page, verified-on date, academic year, verification state, and admin reviewer.
8. Existing student profiles, portfolios, achievements, user registrations, group formation, scholarship/internship modules and authentication must be preserved.

## High-priority corrections to the secondary PDF

- Innerve 11.0: **29–30 January 2027** is shown by official `https://www.innerve.tech/`. Treat older PDF’s 30–31 January as erroneous. Prize pool, registration windows, problem statements and team size need re-verification.
- GitHub project Anubhav: public issues are **open-source contributions**, not proof of paid internships, active placements or sponsorship rewards.
- Black Hat India 2026 CTF: question mark on timing relative to conference; verify organizer confirmation before publishing. Do not assign it to AIT ISDF without a primary source.
- Stellar IQ final 24–25 Oct 2026 is NOT a new open registration; earlier registration closure reported 16 Oct. Club co-organization uncertain.
- AY 2025–26 **Cultural Aakriti**: 17–24 Sep 2025. Archive, never future opportunities.
- Amethyst 2026 reported end date conflicts (11 versus 12 Apr). Hold until reconciled.
- AIT admissions and opportunities from unrelated institutions do not belong in AIT club events.
- GDG on Campus AIT official listing: `https://gdg.community.dev/gdg-on-campus-army-institute-of-technology-pune-india/`; listing at research time said no upcoming events. Never infer new events from older posts.

## Research source references

- AIT official institution: `https://www.aitpune.com/` (verify exact policies/academic information here)
- Innerve: `https://www.innerve.tech/`
- Anubhav GitHub issues: `https://github.com/aitoss/Anubhav-frontend-neo/issues`
- AIT GDG community: `https://gdg.community.dev/gdg-on-campus-army-institute-of-technology-pune-india/`
- Stellar IQ public listing: `https://unstop.com/quiz/stellar-iq-space-quiz-army-institute-of-technology-pune-1763317`
- Black Hat India CTF listing: `https://ctf.blackhat-india.com/` (investigate date discrepancy)
- AIT E-Cell: `https://www.ecellait.in/` (verify official club ownership and active dates)

## Quality gate

Expected directory club rows = **23**. Duplicate canonical handles = **0**. Current official verified secretary rows from this seed = **0**, by design. Publish accurate facts, not fill-in-the-blanks. Treat absence of verified data as unknown. Complete a manual QA pass before production publication.
