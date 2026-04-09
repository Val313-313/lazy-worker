/**
 * Lazy Worker - Common Scraping Utilities
 * Shared functions for all job board scrapers
 */

/**
 * Try to extract job data from JSON-LD structured data
 * @returns {Object|null}
 */
export function extractFromJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);

      // Handle array of objects
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item['@type'] === 'JobPosting') {
          return parseJobPostingSchema(item);
        }

        // Check for @graph array
        if (item['@graph']) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type'] === 'JobPosting') {
              return parseJobPostingSchema(graphItem);
            }
          }
        }
      }
    } catch (e) {
      // Invalid JSON, continue to next script
      continue;
    }
  }

  return null;
}

/**
 * Parse JobPosting schema.org structured data
 * @param {Object} data
 * @returns {Object}
 */
function parseJobPostingSchema(data) {
  const result = {
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

  // Company name
  if (data.hiringOrganization) {
    result.company = data.hiringOrganization.name ||
      data.hiringOrganization.legalName ||
      (typeof data.hiringOrganization === 'string' ? data.hiringOrganization : '');
  }

  // Position/Title
  result.position = data.title || data.name || '';

  // Location
  if (data.jobLocation) {
    const location = Array.isArray(data.jobLocation) ? data.jobLocation[0] : data.jobLocation;

    if (location.address) {
      const address = location.address;
      result.location.street = address.streetAddress || '';
      result.location.postalCode = address.postalCode || '';
      result.location.city = address.addressLocality || '';
      result.location.country = address.addressCountry || 'Schweiz';

      // Normalize country
      if (result.location.country === 'CH') result.location.country = 'Schweiz';
      if (result.location.country === 'DE') result.location.country = 'Deutschland';
    }
  }

  // Employment type
  if (data.employmentType) {
    const empType = Array.isArray(data.employmentType)
      ? data.employmentType[0]
      : data.employmentType;

    if (empType && (empType.toLowerCase().includes('part') || empType.toLowerCase().includes('teil'))) {
      result.workload = 'teilzeit';
    }
  }

  return result;
}

/**
 * Extract text content from element, safely
 * @param {string} selector
 * @param {Element} context
 * @returns {string}
 */
export function getText(selector, context = document) {
  const element = context.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

/**
 * Extract text from multiple possible selectors
 * @param {string[]} selectors
 * @param {Element} context
 * @returns {string}
 */
export function getTextFromSelectors(selectors, context = document) {
  for (const selector of selectors) {
    const text = getText(selector, context);
    if (text) return text;
  }
  return '';
}

/**
 * Parse Swiss location string (e.g., "8000 Zürich" or "Zürich, ZH")
 * @param {string} text
 * @returns {Object}
 */
export function parseSwissLocation(text) {
  if (!text) return { postalCode: '', city: '', country: 'Schweiz' };

  // Remove common suffixes
  let cleaned = text
    .replace(/\s*\(.*?\)\s*/g, '')  // Remove parentheses content
    .replace(/,\s*(CH|Schweiz|Switzerland)\s*$/i, '')  // Remove country suffix
    .replace(/,\s*[A-Z]{2}\s*$/i, '')  // Remove canton abbreviation
    .trim();

  // Try to match PLZ + City
  const plzMatch = cleaned.match(/^(\d{4})\s+(.+)$/);
  if (plzMatch) {
    return {
      postalCode: plzMatch[1],
      city: plzMatch[2].trim(),
      country: 'Schweiz'
    };
  }

  // Try to match City, PLZ
  const reversePlzMatch = cleaned.match(/^(.+?),?\s+(\d{4})$/);
  if (reversePlzMatch) {
    return {
      postalCode: reversePlzMatch[2],
      city: reversePlzMatch[1].trim(),
      country: 'Schweiz'
    };
  }

  // Just city
  return {
    postalCode: '',
    city: cleaned,
    country: 'Schweiz'
  };
}

/**
 * Determine workload from text
 * @param {string} text
 * @returns {'vollzeit' | 'teilzeit'}
 */
export function parseWorkload(text) {
  if (!text) return 'vollzeit';

  const lower = text.toLowerCase();

  // Check percentage
  const percentMatch = lower.match(/(\d{1,3})\s*%/);
  if (percentMatch) {
    const percent = parseInt(percentMatch[1]);
    if (percent < 100) return 'teilzeit';
  }

  // Check keywords
  const partTimeKeywords = ['teilzeit', 'part-time', 'part time', 'parttime', 'pensum'];
  if (partTimeKeywords.some(kw => lower.includes(kw))) {
    return 'teilzeit';
  }

  return 'vollzeit';
}

/**
 * Clean company name
 * @param {string} name
 * @returns {string}
 */
export function cleanCompanyName(name) {
  if (!name) return '';

  return name
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s*\|\s*.*/g, '')  // Remove "| Careers" etc.
    .replace(/\s*-\s*Jobs?.*/gi, '')  // Remove "- Jobs" suffix
    .replace(/\s*Karriere.*$/gi, '')  // Remove "Karriere" suffix
    .replace(/^Jobs?\s*(bei|at|@)\s*/gi, '')  // Remove "Jobs bei" prefix
    .trim()
    .substring(0, 100);
}

/**
 * Clean position/job title
 * @param {string} title
 * @returns {string}
 */
export function cleanJobTitle(title) {
  if (!title) return '';

  return title
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s*\([mwfd/]+\)\s*/gi, '')  // Remove gender markers (m/w/d)
    .replace(/\s*\d+%.*$/g, '')  // Remove percentage at end
    .replace(/\s*-\s*\d+%.*$/g, '')  // Remove "- 80-100%"
    .trim()
    .substring(0, 100);
}

/**
 * Save application to storage via background script
 * @param {Object} applicationData
 * @returns {Promise<Object>}
 */
export async function saveApplicationData(applicationData) {
  // Check if extension context is still valid (can be lost after extension reload)
  if (!chrome?.runtime?.sendMessage) {
    throw new Error('Extension wurde aktualisiert. Bitte Seite neu laden (Ctrl+R).');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        { action: 'saveApplication', data: applicationData },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Extension-Verbindung verloren. Bitte Seite neu laden.'));
          } else if (response && response.success) {
            resolve(response.application);
          } else {
            reject(new Error(response?.error || 'Failed to save'));
          }
        }
      );
    } catch (e) {
      reject(new Error('Extension-Verbindung verloren. Bitte Seite neu laden (Ctrl+R).'));
    }
  });
}

/**
 * Show notification toast
 * @param {string} message
 * @param {string} type
 */
export function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.querySelector('.lw-capture-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = `lw-capture-notification lw-capture-notification-${type}`;
  notification.innerHTML = `
    <span class="lw-capture-icon">🦥</span>
    <span class="lw-capture-message">${message}</span>
  `;

  // Add styles if not already present
  if (!document.getElementById('lw-capture-styles')) {
    const style = document.createElement('style');
    style.id = 'lw-capture-styles';
    style.textContent = `
      .lw-capture-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: lw-slideIn 0.3s ease;
      }

      .lw-capture-notification-success {
        background: #16a34a;
      }

      .lw-capture-notification-error {
        background: #dc2626;
      }

      .lw-capture-icon {
        font-size: 20px;
      }

      @keyframes lw-slideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    notification.style.transition = 'all 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Debounce function
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
