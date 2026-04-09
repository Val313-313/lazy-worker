/**
 * Lazy Worker - jobs.ch Content Script
 * Captures job application data from jobs.ch and jobup.ch
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

// Track if we've already captured this job
let capturedUrls = new Set();
let isCapturing = false;

/**
 * Initialize the content script
 */
function init() {
  console.log('[Lazy Worker] jobs.ch scraper initialized');

  // Listen for Apply button clicks
  observeApplyButtons();

  // Also check for URL changes (SPA navigation)
  observeUrlChanges();
}

/**
 * Observe for Apply button clicks
 */
function observeApplyButtons() {
  // Use event delegation on document
  document.addEventListener('click', handleClick, true);
}

/**
 * Handle click events
 * @param {Event} event
 */
function handleClick(event) {
  const target = event.target;

  // Check if clicked element or its parent is an apply button
  const applyButton = findApplyButton(target);

  if (applyButton && !isCapturing) {
    console.log('[Lazy Worker] Apply button clicked');
    captureApplication();
  }
}

/**
 * Find apply button in click path
 * @param {Element} element
 * @returns {Element|null}
 */
function findApplyButton(element) {
  let current = element;

  // Walk up the DOM tree (max 5 levels)
  for (let i = 0; i < 5 && current; i++) {
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
  if (tagName !== 'button' && tagName !== 'a' && !element.getAttribute('role')?.includes('button')) {
    return false;
  }

  const text = (element.textContent || '').toLowerCase();
  const applyKeywords = [
    'bewerben',
    'jetzt bewerben',
    'apply',
    'apply now',
    'quick apply',
    'bewerbung',
    'zur bewerbung'
  ];

  // Check text content
  if (applyKeywords.some(kw => text.includes(kw))) {
    return true;
  }

  // Check class names
  const className = (element.className || '').toLowerCase();
  if (className.includes('apply') || className.includes('bewerbung')) {
    return true;
  }

  // Check data attributes
  const dataAction = element.dataset?.action || '';
  if (dataAction.toLowerCase().includes('apply')) {
    return true;
  }

  return false;
}

/**
 * Observe URL changes for SPA navigation
 */
function observeUrlChanges() {
  let lastUrl = window.location.href;

  const checkUrl = () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Reset capture state for new page
      isCapturing = false;
    }
  };

  // Check periodically
  setInterval(checkUrl, 1000);

  // Also listen for popstate
  window.addEventListener('popstate', checkUrl);
}

/**
 * Capture application data from current page
 */
async function captureApplication() {
  const currentUrl = window.location.href;

  // Prevent duplicate captures
  if (capturedUrls.has(currentUrl)) {
    console.log('[Lazy Worker] Already captured this URL');
    return;
  }

  isCapturing = true;

  try {
    // First try JSON-LD structured data
    let jobData = extractFromJsonLd();

    if (!jobData) {
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
      sourceSite: getSourceSite()
    };

    // Save to storage
    await saveApplicationData(application);

    // Mark as captured
    capturedUrls.add(currentUrl);

    // Show success notification
    showNotification(`Bewerbung erfasst: ${application.company}`, 'success');

    console.log('[Lazy Worker] Application captured:', application);

  } catch (error) {
    console.error('[Lazy Worker] Error capturing application:', error);
    showNotification('Fehler beim Erfassen der Bewerbung', 'error');
  } finally {
    isCapturing = false;
  }
}

/**
 * Scrape job data from DOM
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

  // Company name selectors for jobs.ch
  const companySelectors = [
    '[data-cy="company-name"]',
    '[data-testid="company-name"]',
    '.company-name',
    '.employer-name',
    'a[href*="/firma/"]',
    '.job-company',
    'h2.company',
    '[class*="CompanyName"]',
    '[class*="company-name"]',
    '.job-header .subtitle',
    'span[itemprop="hiringOrganization"]'
  ];

  data.company = cleanCompanyName(getTextFromSelectors(companySelectors));

  // Position/Title selectors
  const titleSelectors = [
    '[data-cy="job-title"]',
    '[data-testid="job-title"]',
    'h1.job-title',
    'h1[class*="JobTitle"]',
    'h1[class*="title"]',
    '.job-title',
    'h1',
    '[itemprop="title"]',
    '[class*="job-title"]'
  ];

  data.position = cleanJobTitle(getTextFromSelectors(titleSelectors));

  // Location selectors
  const locationSelectors = [
    '[data-cy="job-location"]',
    '[data-testid="location"]',
    '.job-location',
    '.location',
    '[itemprop="jobLocation"]',
    '[class*="Location"]',
    '[class*="location"]',
    '.job-header [class*="location"]'
  ];

  const locationText = getTextFromSelectors(locationSelectors);
  if (locationText) {
    const parsedLocation = parseSwissLocation(locationText);
    data.location = { ...data.location, ...parsedLocation };
  }

  // Workload/Employment type
  const workloadSelectors = [
    '[data-cy="job-workload"]',
    '[data-testid="workload"]',
    '.workload',
    '.pensum',
    '[class*="workload"]',
    '[class*="Workload"]',
    '[class*="employment"]'
  ];

  const workloadText = getTextFromSelectors(workloadSelectors);
  data.workload = parseWorkload(workloadText);

  // Also check page text for workload percentage
  const pageText = document.body.innerText || '';
  const percentMatch = pageText.match(/(\d{2,3})\s*%\s*(Pensum|Arbeitszeit)?/i);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);
    if (percent < 100) {
      data.workload = 'teilzeit';
    }
  }

  return data;
}

/**
 * Get source site name
 * @returns {string}
 */
function getSourceSite() {
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('jobup')) return 'jobup.ch';
  if (hostname.includes('jobs.ch')) return 'jobs.ch';
  return hostname;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
