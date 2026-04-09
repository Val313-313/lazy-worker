/**
 * Lazy Worker - Indeed Content Script
 * Captures job application data from Indeed.ch
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
  console.log('[Lazy Worker] Indeed scraper initialized');

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
    console.log('[Lazy Worker] Indeed Apply button clicked');
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
  const id = (element.id || '').toLowerCase();

  // Indeed specific apply buttons
  const applyTexts = [
    'apply',
    'jetzt bewerben',
    'bewerben',
    'apply now',
    'apply on company site',
    'auf unternehmenswebsite bewerben'
  ];

  // Check text
  if (applyTexts.some(t => text.includes(t))) {
    return true;
  }

  // Check class names
  if (className.includes('apply') || className.includes('bewerbung')) {
    return true;
  }

  // Check ID
  if (id.includes('apply')) {
    return true;
  }

  // Check data attributes
  const dataAction = element.dataset?.tnElement || '';
  if (dataAction.toLowerCase().includes('apply')) {
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
      // Re-check when DOM changes
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
  const jobKey = extractJobKey(currentUrl);

  // Prevent duplicate captures
  if (jobKey && capturedUrls.has(jobKey)) {
    console.log('[Lazy Worker] Already captured this job');
    return;
  }

  isCapturing = true;

  try {
    // First try JSON-LD structured data (Indeed often has this)
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
      sourceSite: 'indeed'
    };

    // Save to storage
    await saveApplicationData(application);

    // Mark as captured
    if (jobKey) capturedUrls.add(jobKey);

    // Show success notification
    showNotification(`Bewerbung erfasst: ${application.company}`, 'success');

    console.log('[Lazy Worker] Indeed application captured:', application);

  } catch (error) {
    console.error('[Lazy Worker] Error capturing application:', error);
    showNotification('Fehler beim Erfassen der Bewerbung', 'error');
  } finally {
    isCapturing = false;
  }
}

/**
 * Extract job key from URL
 * @param {string} url
 * @returns {string|null}
 */
function extractJobKey(url) {
  // Indeed job URLs have jk parameter: ?jk=abc123
  const match = url.match(/[?&]jk=([^&]+)/);
  if (match) return match[1];

  // Or /viewjob?jk= pattern
  const viewMatch = url.match(/\/viewjob.*[?&]jk=([^&]+)/);
  if (viewMatch) return viewMatch[1];

  return null;
}

/**
 * Scrape job data from Indeed DOM
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

  // Company name selectors for Indeed
  const companySelectors = [
    '[data-testid="inlineHeader-companyName"] a',
    '[data-testid="inlineHeader-companyName"]',
    '[data-company-name="true"]',
    '.jobsearch-InlineCompanyRating-companyHeader a',
    '.jobsearch-InlineCompanyRating-companyHeader',
    '.icl-u-lg-mr--sm a',
    '.jobsearch-CompanyInfoContainer a',
    '.jobsearch-JobInfoHeader-companyNameLink',
    'div[data-testid="job-header"] a',
    '.css-1h46us2',
    '[class*="CompanyName"]'
  ];

  data.company = cleanCompanyName(getTextFromSelectors(companySelectors));

  // Position/Title selectors
  const titleSelectors = [
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title',
    '.icl-u-xs-mb--xs h1',
    'h1[class*="JobTitle"]',
    '.jobsearch-JobComponent-title',
    'h1'
  ];

  data.position = cleanJobTitle(getTextFromSelectors(titleSelectors));

  // Location selectors
  const locationSelectors = [
    '[data-testid="inlineHeader-companyLocation"]',
    '[data-testid="job-location"]',
    '.jobsearch-JobInfoHeader-subtitle > div:last-child',
    '.icl-u-lg-mr--sm + div',
    '.jobsearch-CompanyInfoContainer [class*="Location"]',
    '[class*="location"]'
  ];

  const locationText = getTextFromSelectors(locationSelectors);
  if (locationText) {
    const parsedLocation = parseSwissLocation(locationText);
    data.location = { ...data.location, ...parsedLocation };
  }

  // Workload - check job details section
  const detailsSection = document.querySelector('#jobDetailsSection, .jobsearch-JobDescriptionSection');
  if (detailsSection) {
    const detailsText = detailsSection.textContent || '';

    // Check for job type indicators
    if (detailsText.match(/teilzeit|part[\s-]?time/i)) {
      data.workload = 'teilzeit';
    }

    // Check for percentage
    const percentMatch = detailsText.match(/(\d{2,3})\s*%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      if (percent < 100 && percent >= 10) {
        data.workload = 'teilzeit';
      }
    }
  }

  // Also check metadata/tags
  const jobTypes = document.querySelectorAll('[class*="JobType"], [class*="job-type"], .metadata');
  for (const el of jobTypes) {
    const text = el.textContent.toLowerCase();
    if (text.includes('teilzeit') || text.includes('part-time') || text.includes('part time')) {
      data.workload = 'teilzeit';
      break;
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
