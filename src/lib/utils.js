/**
 * Utility functions for the extension
 */

/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date for display (DD.MM.YYYY - Swiss format)
 * @param {string} isoDate
 * @returns {string}
 */
export function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string}
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * Truncate text to a maximum length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Clean and normalize company name
 * @param {string} name
 * @returns {string}
 */
export function cleanCompanyName(name) {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/[\n\r\t]/g, ' ')  // Remove newlines/tabs
    .substring(0, 100);
}

/**
 * Extract location from text (Swiss format: PLZ Ort)
 * @param {string} locationText
 * @returns {{ postalCode: string, city: string } | null}
 */
export function parseSwissLocation(locationText) {
  if (!locationText) return null;

  // Match Swiss postal codes (4 digits) followed by city name
  const match = locationText.match(/(\d{4})\s+([A-Za-zäöüÄÖÜéèêàâ\s-]+)/);
  if (match) {
    return {
      postalCode: match[1],
      city: match[2].trim()
    };
  }

  // Try to find just the city
  const cityOnly = locationText.trim().replace(/,.*$/, '').trim();
  if (cityOnly) {
    return {
      postalCode: '',
      city: cityOnly
    };
  }

  return null;
}

/**
 * Determine workload type from text
 * @param {string} text
 * @returns {'vollzeit' | 'teilzeit'}
 */
export function parseWorkload(text) {
  if (!text) return 'vollzeit';
  const lower = text.toLowerCase();

  // Check for part-time indicators
  if (
    lower.includes('teilzeit') ||
    lower.includes('part-time') ||
    lower.includes('part time') ||
    lower.includes('50%') ||
    lower.includes('60%') ||
    lower.includes('70%') ||
    lower.includes('80%')
  ) {
    return 'teilzeit';
  }

  return 'vollzeit';
}

/**
 * Get the source site name from URL
 * @param {string} url
 * @returns {string}
 */
export function getSourceSite(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('jobs.ch')) return 'jobs.ch';
    if (hostname.includes('jobup.ch')) return 'jobup.ch';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed')) return 'indeed';
    if (hostname.includes('jobscout24')) return 'jobscout24';
    if (hostname.includes('xing.com')) return 'xing';

    return hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

/**
 * Create a default application object
 * @returns {Omit<import('./types.js').JobApplication, 'id' | 'capturedAt'>}
 */
export function createDefaultApplication() {
  return {
    appliedAt: getToday(),
    company: '',
    position: '',
    location: {
      street: '',
      number: '',
      postalCode: '',
      city: '',
      country: 'Schweiz'
    },
    method: 'elektronisch',
    workload: 'vollzeit',
    ravAssignment: false,
    result: 'offen',
    sourceUrl: '',
    sourceSite: '',
    submittedToRav: false,
    notes: ''
  };
}

/**
 * Debounce function for event handlers
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep for a specified number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector
 * @param {number} timeout
 * @returns {Promise<Element | null>}
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Set input value and dispatch proper events (for React/Angular forms)
 * @param {HTMLInputElement} element
 * @param {string} value
 */
export function setInputValue(element, value) {
  // For React controlled inputs
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }

  // Dispatch events to trigger framework updates
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Set checkbox value and dispatch events
 * @param {HTMLInputElement} checkbox
 * @param {boolean} checked
 */
export function setCheckboxValue(checkbox, checked) {
  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  checkbox.dispatchEvent(new Event('click', { bubbles: true }));
}

/**
 * Select dropdown option by value
 * @param {HTMLSelectElement} select
 * @param {string} value
 */
export function setSelectValue(select, value) {
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}
