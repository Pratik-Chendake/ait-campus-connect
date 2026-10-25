/**
 * Search Verification Service (Google Search & DuckDuckGo Only)
 * 
 * Generates pre-formulated, safe manual search links for Google and DuckDuckGo.
 * 
 * Strict safety & policy guarantees:
 * 1. Zero HTML scraping of Google or DuckDuckGo result pages.
 * 2. Zero paid search APIs or third-party metasearch daemons.
 * 3. Never automatically approves or rejects achievements.
 * 4. Strictly validates all URLs to prevent XSS / malicious protocol schemes.
 * 5. Reviewers examine authentic external web evidence manually in a new tab.
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate that a string is a legitimate HTTP/HTTPS URL.
 * Rejects javascript:, data:, file:, and malformed URIs.
 */
export function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * Sanitize strings for inclusion in search queries (strips control characters and quotes)
 */
export function cleanQueryTerm(term) {
  if (!term || typeof term !== 'string') return '';
  return term.replace(/[\r\n\t"]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Generate structured Google and DuckDuckGo manual search URLs for reviewer verification.
 * 
 * Formulates targeted queries so faculty/admin verifiers can check authentic
 * web evidence with one click in a new browser tab.
 * 
 * @param {Object} achievement - Achievement record with event_name, title, organization, position
 * @param {Object} student - Student record with full_name / student_name
 * @returns {Object} Structured queries and safe external links for Google and DuckDuckGo
 */
export function generateSearchUrls(achievement, student = {}) {
  const studentName = cleanQueryTerm(student.full_name || student.student_name || '');
  const eventName = cleanQueryTerm(achievement.event_name || achievement.title || '');
  const organization = cleanQueryTerm(achievement.organization || '');
  const position = cleanQueryTerm(achievement.position || '');

  // 1. Primary Query: Exact event title + Exact student name + Position (Winner / Runner-up / Finalist)
  let primaryQuery = `"${eventName}" "${studentName}"`;
  if (position && !position.toLowerCase().includes('participant')) {
    // Extract key rank terms: "Winner", "Runner-up", "Finalist"
    const simplePosition = position.split('(')[0].trim();
    if (simplePosition) {
      primaryQuery += ` "${simplePosition}"`;
    }
  }

  // 2. Institutional Query: Student Name + Event + AIT Pune / Army Institute of Technology
  const institutionalQuery = `"${eventName}" "${studentName}" ("Army Institute of Technology" OR "AIT Pune")`;

  // 3. Platform Verification Query: Unstop, Devfolio, HackerEarth, IEEE
  const platformQuery = `site:unstop.com OR site:devfolio.co OR site:hackerearth.com "${eventName}" "${studentName}"`;

  const buildGoogleUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  const buildDuckDuckGoUrl = (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;

  return {
    student_name: studentName,
    event_name: eventName,
    organization,
    position,
    queries: {
      primary: primaryQuery,
      institutional: institutionalQuery,
      platform: platformQuery
    },
    google_links: {
      primary: {
        label: 'Google Exact Search',
        url: buildGoogleUrl(primaryQuery),
        description: 'Searches for the student name and hackathon title with rank.'
      },
      institutional: {
        label: 'Google Campus Verification',
        url: buildGoogleUrl(institutionalQuery),
        description: 'Searches student name, event, and AIT Pune institutional mentions.'
      },
      platform: {
        label: 'Google Hackathon Portals',
        url: buildGoogleUrl(platformQuery),
        description: 'Searches across Unstop, Devfolio, and hackathon leaderboards.'
      }
    },
    duckduckgo_links: {
      primary: {
        label: 'DuckDuckGo Exact Search',
        url: buildDuckDuckGoUrl(primaryQuery),
        description: 'Privacy-respecting search for the student name and event.'
      },
      institutional: {
        label: 'DuckDuckGo Campus Verification',
        url: buildDuckDuckGoUrl(institutionalQuery),
        description: 'Searches student name, event, and AIT Pune.'
      },
      platform: {
        label: 'DuckDuckGo Hackathon Portals',
        url: buildDuckDuckGoUrl(platformQuery),
        description: 'Searches across Unstop, Devfolio, and hackathon leaderboards.'
      }
    }
  };
}
