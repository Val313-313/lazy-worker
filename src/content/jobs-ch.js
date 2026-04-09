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
    captureApplication(applyButton);
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
 * @param {Element} applyButton - The clicked apply button element
 */
async function captureApplication(applyButton) {
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

    // If JSON-LD returned a platform name instead of the real employer, discard it
    if (jobData && isPlatformName(jobData.company)) {
      console.log('[Lazy Worker] JSON-LD returned platform name:', jobData.company);
      jobData = null;
    }

    if (!jobData) {
      // Fall back to DOM scraping
      jobData = scrapeFromDom(applyButton);
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
 * Check if a company name is actually the platform name (not a real employer)
 * @param {string} name
 * @returns {boolean}
 */
function isPlatformName(name) {
  if (!name) return true;
  const lower = name.toLowerCase().replace(/\s+/g, '');
  const platformNames = [
    'jobcloud', 'job cloud', 'jobs.ch', 'jobsch', 'jobup',
    'jobup.ch', 'jobupch', 'jobcloud ag', 'jobcloudag'
  ];
  return platformNames.some(p => lower === p.replace(/\s+/g, ''));
}

/**
 * Find the right-side job detail panel on jobs.ch/jobup.ch split-view.
 * Uses the clicked apply button to reliably locate the detail panel.
 * @param {Element|null} applyButton - The button the user clicked
 * @returns {Element}
 */
function findDetailPanel(applyButton) {
  // Strategy 1: Walk up from the actual clicked apply button
  if (applyButton) {
    let parent = applyButton.parentElement;
    for (let i = 0; i < 15 && parent && parent !== document.body; i++) {
      const rect = parent.getBoundingClientRect();
      if (rect.width > 400 && rect.height > 300) {
        console.log('[Lazy Worker] jobs.ch: Found detail panel via clicked button ancestor');
        return parent;
      }
      parent = parent.parentElement;
    }
  }

  // Strategy 2: Known jobs.ch detail panel selectors
  const panelSelectors = [
    '[data-cy="job-detail"]',
    '[data-testid="job-detail"]',
    '[class*="JobDetail"]',
    '[class*="job-detail"]',
    '[class*="jobDetail"]',
    'article[class*="detail"]',
    'main [class*="detail"]',
    'section[class*="detail"]',
  ];

  for (const sel of panelSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log('[Lazy Worker] jobs.ch: Found detail panel via selector:', sel);
      return el;
    }
  }

  // Strategy 3: Geometric — find large right-side container
  const containers = document.querySelectorAll('div, section, article, main');
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
    console.log('[Lazy Worker] jobs.ch: Found detail panel via geometry');
    return best;
  }

  console.log('[Lazy Worker] jobs.ch: No detail panel found, using full document');
  return document;
}

/**
 * Search for text in element using multiple selectors
 */
function getTextInContainer(container, selectors) {
  for (const selector of selectors) {
    const el = container.querySelector(selector);
    if (el) {
      const text = el.textContent.trim();
      if (text) return text;
    }
  }
  return '';
}

/**
 * Scrape job data from DOM
 * @param {Element|null} applyButton - The clicked apply button
 * @returns {Object|null}
 */
function scrapeFromDom(applyButton) {
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

  // Find the detail panel (right side in split-view)
  const panel = findDetailPanel(applyButton);

  // Company name selectors for jobs.ch
  const companySelectors = [
    '[data-cy="company-name"]',
    '[data-testid="company-name"]',
    '.company-name',
    '.employer-name',
    'a[href*="/firma/"]',
    'a[href*="/company/"]',
    '.job-company',
    'h2.company',
    '[class*="CompanyName"]',
    '[class*="company-name"]',
    '.job-header .subtitle',
    'span[itemprop="hiringOrganization"]'
  ];

  data.company = cleanCompanyName(getTextInContainer(panel, companySelectors));

  // Reject platform names from selector results
  if (isPlatformName(data.company)) {
    console.log('[Lazy Worker] jobs.ch: Selector returned platform name, discarding:', data.company);
    data.company = '';
  }

  // Fallback: find links to company pages in the detail panel
  if (!data.company && panel !== document) {
    const companyLinks = panel.querySelectorAll('a[href*="/firma/"], a[href*="/company/"], a[href*="/unternehmen/"]');
    for (const link of companyLinks) {
      const text = link.textContent.trim();
      if (text && text.length > 1 && text.length < 100 && !isPlatformName(text)) {
        data.company = cleanCompanyName(text);
        console.log('[Lazy Worker] jobs.ch: Found company via link:', data.company);
        break;
      }
    }
  }

  // Fallback: logo alt-text often contains the real company name
  if (!data.company && panel !== document) {
    const logos = panel.querySelectorAll('img[alt], img[title]');
    for (const img of logos) {
      const alt = (img.alt || img.title || '').trim();
      if (alt && alt.length > 2 && alt.length < 100 &&
          !isPlatformName(alt) &&
          !alt.toLowerCase().includes('logo') &&
          !alt.toLowerCase().includes('icon') &&
          !alt.toLowerCase().includes('avatar')) {
        data.company = cleanCompanyName(alt);
        console.log('[Lazy Worker] jobs.ch: Found company via logo alt-text:', data.company);
        break;
      }
    }
  }

  // Fallback: company name is often the bold/strong text near the logo at the top
  if (!data.company && panel !== document) {
    const topTexts = panel.querySelectorAll('strong, b, [class*="ompany"], [class*="employer"], [class*="organization"]');
    for (const el of topTexts) {
      const text = el.textContent.trim();
      if (text && text.length > 2 && text.length < 100 &&
          !isPlatformName(text) &&
          !text.toLowerCase().includes('apply') &&
          !text.toLowerCase().includes('bewerben') &&
          !text.toLowerCase().includes('save')) {
        data.company = cleanCompanyName(text);
        console.log('[Lazy Worker] jobs.ch: Found company via bold text:', data.company);
        break;
      }
    }
  }

  // Position/Title selectors — search in detail panel
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

  data.position = cleanJobTitle(getTextInContainer(panel, titleSelectors));

  // Location selectors — search in detail panel
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

  const locationText = getTextInContainer(panel, locationSelectors);
  if (locationText) {
    const parsedLocation = parseSwissLocation(locationText);
    data.location = { ...data.location, ...parsedLocation };
  }

  // Workload — search in detail panel text
  const panelText = panel.textContent || '';
  const percentMatch = panelText.match(/(\d{2,3})\s*[–-]\s*(\d{2,3})\s*%/);
  if (percentMatch) {
    const maxPercent = parseInt(percentMatch[2]);
    if (maxPercent < 100) {
      data.workload = 'teilzeit';
    }
  } else {
    const singlePercent = panelText.match(/(\d{2,3})\s*%/);
    if (singlePercent) {
      const percent = parseInt(singlePercent[1]);
      if (percent < 100) {
        data.workload = 'teilzeit';
      }
    }
  }
  if (panelText.match(/part[\s-]?time|teilzeit/i)) {
    data.workload = 'teilzeit';
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
