/**
 * Lazy Worker - LinkedIn Content Script
 * Captures job application data from LinkedIn Jobs
 */

import {
  extractFromJsonLd,
  getText,
  getTextFromSelectors,
  parseSwissLocation,
  parseWorkload,
  cleanCompanyName,
  cleanJobTitle,
  saveApplicationData,
  showNotification,
  debounce
} from './common.js';

// Track captured URLs
let capturedUrls = new Set();
let isCapturing = false;

/**
 * Initialize the content script
 */
function init() {
  console.log('[Lazy Worker] LinkedIn scraper initialized');

  // Listen for Apply button clicks
  observeApplyButtons();

  // Observe for dynamically loaded content
  observeDomChanges();
}

/**
 * Observe for Apply button clicks
 */
function observeApplyButtons() {
  document.addEventListener('click', handleClick, true);
}

/**
 * Handle click events
 * @param {Event} event
 */
function handleClick(event) {
  if (!chrome?.runtime?.id) return;
  const target = event.target;

  // Check if clicked element is apply button
  const applyButton = findApplyButton(target);

  if (applyButton && !isCapturing) {
    console.log('[Lazy Worker] LinkedIn Apply button clicked');

    // Small delay to let LinkedIn open any modal
    setTimeout(() => {
      captureApplication();
    }, 500);
  }
}

/**
 * Find apply button in click path
 * @param {Element} element
 * @returns {Element|null}
 */
function findApplyButton(element) {
  let current = element;

  for (let i = 0; i < 6 && current; i++) {
    if (isApplyButton(current)) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Check if element is an apply button
 * @param {Element} element
 * @returns {boolean}
 */
function isApplyButton(element) {
  if (!element) return false;

  const tagName = element.tagName?.toLowerCase();
  if (tagName !== 'button' && tagName !== 'a' && tagName !== 'span') {
    return false;
  }

  const text = (element.textContent || '').toLowerCase().trim();
  const className = (element.className || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();

  // LinkedIn specific apply buttons
  const applyTexts = [
    'easy apply',
    'einfach bewerben',
    'apply',
    'bewerben',
    'jetzt bewerben',
    'apply now'
  ];

  // Check text
  if (applyTexts.some(t => text.includes(t))) {
    return true;
  }

  // Check aria-label
  if (applyTexts.some(t => ariaLabel.includes(t))) {
    return true;
  }

  // Check class names
  if (className.includes('jobs-apply-button') ||
      className.includes('jobs-s-apply') ||
      className.includes('apply-button')) {
    return true;
  }

  return false;
}

/**
 * Observe DOM changes for dynamically loaded content
 */
function observeDomChanges() {
  const observer = new MutationObserver(
    debounce(() => {
      // Re-check for apply buttons when DOM changes
    }, 500)
  );

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Capture application data from current page
 */
async function captureApplication() {
  const currentUrl = window.location.href;
  const jobId = extractJobId(currentUrl);

  // Prevent duplicate captures for same job
  if (jobId && capturedUrls.has(jobId)) {
    console.log('[Lazy Worker] Already captured this job');
    return;
  }

  isCapturing = true;

  try {
    // First try JSON-LD structured data
    let jobData = extractFromJsonLd();

    if (!jobData || !jobData.company) {
      // Fall back to DOM scraping
      jobData = scrapeFromDom();
    }

    if (!jobData || !jobData.company) {
      console.log('[Lazy Worker] Could not extract job data');
      isCapturing = false;
      return;
    }

    // Build application object
    const application = {
      appliedAt: new Date().toISOString().split('T')[0],
      company: jobData.company,
      position: jobData.position || 'Position nicht angegeben',
      location: jobData.location || {
        street: '',
        number: '',
        postalCode: '',
        city: '',
        country: 'Schweiz'
      },
      method: 'elektronisch',
      workload: jobData.workload || 'vollzeit',
      ravAssignment: false,
      result: 'offen',
      sourceUrl: currentUrl,
      sourceSite: 'linkedin'
    };

    // Save to storage
    await saveApplicationData(application);

    // Mark as captured
    if (jobId) capturedUrls.add(jobId);

    // Show success notification
    showNotification(`Bewerbung erfasst: ${application.company}`, 'success');

    console.log('[Lazy Worker] LinkedIn application captured:', application);

  } catch (error) {
    console.error('[Lazy Worker] Error capturing application:', error);
    showNotification('Fehler beim Erfassen der Bewerbung', 'error');
  } finally {
    isCapturing = false;
  }
}

/**
 * Extract job ID from URL
 * @param {string} url
 * @returns {string|null}
 */
function extractJobId(url) {
  // LinkedIn job URLs: /jobs/view/123456789/
  const match = url.match(/\/jobs\/view\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Find the right-side job detail panel container.
 * LinkedIn uses different class names but always has a detail container
 * separate from the job list sidebar.
 */
function findDetailPanel() {
  // Known LinkedIn detail panel selectors (ordered by specificity)
  const panelSelectors = [
    '.scaffold-layout__detail',
    '.jobs-search__job-details',
    '.jobs-details',
    '.job-details-module',
    '#job-details',
    '.job-view-layout',
    '.jobs-unified-top-card',
    '.job-details-jobs-unified-top-card__container',
  ];

  for (const sel of panelSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log('[Lazy Worker] LinkedIn: Found detail panel via:', sel);
      return el;
    }
  }

  // Geometric fallback: find the widest container on the right half
  const containers = document.querySelectorAll('div, section, main');
  let best = null;
  let bestScore = 0;
  for (const el of containers) {
    const rect = el.getBoundingClientRect();
    if (rect.left > 300 && rect.width > 400 && rect.height > 300) {
      const score = rect.width * rect.height;
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
  }
  if (best) {
    console.log('[Lazy Worker] LinkedIn: Found detail panel via geometry');
  }
  return best;
}

/**
 * Scrape job data from LinkedIn DOM
 * @returns {Object|null}
 */
function scrapeFromDom() {
  const data = {
    company: '',
    position: '',
    location: {
      street: '',
      number: '',
      postalCode: '',
      city: '',
      country: 'Schweiz'
    },
    workload: 'vollzeit'
  };

  // Find the detail panel (right side in split-view, or main content in single view)
  const detailPanel = findDetailPanel() || document;
  console.log('[Lazy Worker] LinkedIn scrapeFromDom, searching in:', detailPanel === document ? 'full page' : 'detail panel');

  // Helper: validate LinkedIn company text
  function isValidCompanyText(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    const lower = text.toLowerCase();
    return lower !== 'linkedin' &&
           !lower.includes('follower') &&
           !lower.includes('mitarbeiter') &&
           !lower.includes('employee') &&
           !lower.includes('sign in') &&
           !lower.includes('join now') &&
           !lower.includes('top-jobs') &&
           !lower.includes('treffer');
  }

  // ---- COMPANY ----
  // Strategy A: /company/ links inside the detail panel (most reliable)
  const companyLinks = detailPanel.querySelectorAll('a[href*="/company/"]');
  for (const link of companyLinks) {
    const text = link.textContent.trim();
    if (isValidCompanyText(text)) {
      data.company = cleanCompanyName(text);
      console.log('[Lazy Worker] LinkedIn: Found company via /company/ link:', data.company);
      break;
    }
  }

  // Strategy B: LinkedIn-specific class selectors within detail panel
  if (!data.company) {
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
      '.topcard__org-name-link',
      '.jobs-details-top-card__company-url',
      'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
      '.job-details-jobs-unified-top-card__primary-description-container a',
      '[class*="topcard"] a[href*="/company/"]'
    ];

    for (const sel of companySelectors) {
      const el = detailPanel.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        if (isValidCompanyText(text)) {
          data.company = cleanCompanyName(text);
          console.log('[Lazy Worker] LinkedIn: Found company via class selector:', data.company);
          break;
        }
      }
    }
  }

  // Strategy C: Text pattern matching (AG/GmbH etc.) in detail panel
  if (!data.company) {
    const candidates = detailPanel.querySelectorAll('a, span, div');
    for (const el of candidates) {
      const text = el.textContent.trim();
      if (text.length > 3 && text.length < 80 &&
          text.match(/\s+(AG|GmbH|SA|Sàrl|Ltd|Inc|Corp)\.?\s*$/i) &&
          isValidCompanyText(text)) {
        data.company = cleanCompanyName(text);
        console.log('[Lazy Worker] LinkedIn: Found company via pattern:', data.company);
        break;
      }
    }
  }

  // ---- POSITION ----
  // Strategy A: h1/h2 inside detail panel (job title is always the main heading)
  const titleSelectors = [
    'h1.job-details-jobs-unified-top-card__job-title',
    'h1.jobs-unified-top-card__job-title',
    'h1[class*="job-title"]',
    '.job-details-jobs-unified-top-card__job-title',
    '.jobs-unified-top-card__job-title',
    '.topcard__title',
    'h1',
    'h2'
  ];

  for (const sel of titleSelectors) {
    const els = detailPanel.querySelectorAll(sel);
    for (const el of els) {
      const text = el.textContent.trim();
      if (text.length > 3 && text.length < 150 &&
          !text.toLowerCase().includes('linkedin') &&
          !text.toLowerCase().includes('jobs für sie') &&
          !text.toLowerCase().includes('top-jobs') &&
          !text.toLowerCase().includes('details zum jobangebot') &&
          !text.match(/^\(\d+\)/) &&
          !text.match(/^\d+\s*treffer/i)) {
        data.position = cleanJobTitle(text);
        console.log('[Lazy Worker] LinkedIn: Found position:', data.position);
        break;
      }
    }
    if (data.position) break;
  }

  // ---- LOCATION ----
  const swissCities = ['Zürich', 'Basel', 'Bern', 'Genf', 'Geneva', 'Lausanne', 'Winterthur',
                       'Zug', 'Luzern', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun',
                       'Köniz', 'Chur', 'Schaffhausen', 'Fribourg', 'Neuchâtel', 'Uster',
                       'Sion', 'Emmen', 'Kriens', 'Rapperswil', 'Dietikon', 'Baar', 'Wil',
                       'Dübendorf', 'Horgen', 'Wädenswil', 'Adliswil', 'Opfikon', 'Kloten',
                       'Wetzikon', 'Baden', 'Aarau', 'Hünenberg', 'Meilen', 'Küsnacht',
                       'Zollikon', 'Kilchberg', 'Thalwil', 'Rüschlikon', 'Fully'];

  // Strategy A: Short text elements in detail panel matching location patterns
  const locationCandidates = detailPanel.querySelectorAll('span, div, li');
  for (const el of locationCandidates) {
    const text = el.textContent.trim();
    if (text.length > 3 && text.length < 80) {
      if (text.match(/schweiz|switzerland|suisse/i) || text.match(/\d{4}/)) {
        const parsedLocation = parseSwissLocation(text);
        if (parsedLocation.city) {
          data.location = { ...data.location, ...parsedLocation };
          console.log('[Lazy Worker] LinkedIn: Found location:', parsedLocation);
          break;
        }
      }
      for (const city of swissCities) {
        if (text.includes(city)) {
          data.location.city = city;
          const plzMatch = text.match(/(\d{4})/);
          if (plzMatch) data.location.postalCode = plzMatch[1];
          console.log('[Lazy Worker] LinkedIn: Found city:', city);
          break;
        }
      }
      if (data.location.city) break;
    }
  }

  // Strategy B: LinkedIn-specific location selectors
  if (!data.location.city) {
    const locationSelectors = [
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__bullet',
      '.topcard__flavor--bullet',
      '.jobs-details-top-card__bullet',
      '.jobs-unified-top-card__subtitle-primary-grouping span',
      '.job-details-jobs-unified-top-card__primary-description span',
      '[class*="job-location"]'
    ];

    for (const sel of locationSelectors) {
      const els = detailPanel.querySelectorAll(sel);
      for (const el of els) {
        const text = el.textContent.trim();
        if (text.match(/zürich|genf|basel|bern|lausanne|luzern|winterthur|fully/i) ||
            text.match(/\d{4}/) ||
            text.match(/schweiz|switzerland|suisse/i)) {
          const parsedLocation = parseSwissLocation(text);
          data.location = { ...data.location, ...parsedLocation };
          console.log('[Lazy Worker] LinkedIn: Found location via selector:', parsedLocation);
          break;
        }
      }
      if (data.location.city) break;
    }
  }

  // ---- WORKLOAD ----
  const detailText = detailPanel.textContent || '';
  if (detailText.match(/part[\s-]?time|teilzeit/i)) {
    data.workload = 'teilzeit';
  }
  const percentMatch = detailText.match(/(\d{2,3})\s*%/);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);
    if (percent < 100 && percent >= 10) {
      data.workload = 'teilzeit';
    }
  }

  return data;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
