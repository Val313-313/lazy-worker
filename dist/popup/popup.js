/**
 * Lazy Worker - Popup Script (Simplified)
 */

// DOM Elements
const elements = {
  monthlyCount: document.getElementById('monthlyCount'),
  pendingCount: document.getElementById('pendingCount'),
  submittedCount: document.getElementById('submittedCount'),
  captureBtn: document.getElementById('captureBtn'),
  exportBtn: document.getElementById('exportBtn'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  applicationsList: document.getElementById('applicationsList'),
  editModal: document.getElementById('editModal'),
  modalTitle: document.getElementById('modalTitle'),
  closeModal: document.getElementById('closeModal'),
  applicationForm: document.getElementById('applicationForm'),
  deleteBtn: document.getElementById('deleteBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  helpBtn: document.getElementById('helpBtn'),
  helpView: document.getElementById('helpView'),
  closeHelp: document.getElementById('closeHelp')
};

// Form fields
const formFields = {
  appId: document.getElementById('appId'),
  appliedAt: document.getElementById('appliedAt'),
  company: document.getElementById('company'),
  position: document.getElementById('position'),
  plz: document.getElementById('plz'),
  city: document.getElementById('city'),
  sourceUrl: document.getElementById('sourceUrl')
};

// State
let applications = [];

/**
 * Initialize
 */
async function init() {
  await loadData();
  setupEventListeners();
}

/**
 * Load data
 */
async function loadData() {
  const result = await chrome.storage.local.get(['applications']);
  applications = result.applications || [];

  // Derive all stats from actual application data
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthlyApps = applications.filter(app => app.appliedAt && app.appliedAt.startsWith(currentMonth));
  const pending = applications.filter(app => !app.submittedToRav);
  const submitted = applications.filter(app => app.submittedToRav);

  elements.monthlyCount.textContent = monthlyApps.length;
  elements.pendingCount.textContent = pending.length;
  elements.submittedCount.textContent = submitted.length;

  renderApplications();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  elements.captureBtn.addEventListener('click', captureCurrentPage);
  elements.exportBtn.addEventListener('click', handleExport);
  elements.deleteAllBtn.addEventListener('click', handleDeleteAll);
  elements.closeModal.addEventListener('click', closeModal);
  elements.cancelBtn.addEventListener('click', closeModal);
  elements.applicationForm.addEventListener('submit', handleFormSubmit);
  elements.deleteBtn.addEventListener('click', handleDelete);
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) closeModal();
  });
  elements.helpBtn.addEventListener('click', () => {
    elements.helpView.classList.add('active');
  });
  elements.closeHelp.addEventListener('click', () => {
    elements.helpView.classList.remove('active');
  });
}

/**
 * Delete all applications
 */
async function handleDeleteAll() {
  if (applications.length === 0) {
    showToast('Keine Bewerbungen vorhanden', 'error');
    return;
  }

  if (!confirm(`Alle ${applications.length} Bewerbungen löschen?`)) return;

  applications = [];
  await chrome.storage.local.set({ applications: [] });

  showToast('Alle Bewerbungen gelöscht', 'success');
  await loadData();
}

/**
 * Capture current page
 */
async function captureCurrentPage() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url) {
      showToast('Kein aktiver Tab gefunden', 'error');
      return;
    }

    // Check if we can access this URL
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showToast('Kann auf dieser Seite nicht erfassen', 'error');
      return;
    }

    let scrapedData = { company: '', position: '', plz: '', city: '' };

    try {
      // Inject content script to scrape the page
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeJobPage
      });
      scrapedData = results[0]?.result || scrapedData;
    } catch (scriptError) {
      console.error('Script error:', scriptError);
    }

    // Fallback: Get data from tab info if scraping failed
    const host = new URL(tab.url).hostname;

    // Company from URL (careers.abb.com -> ABB, jobs.microsoft.com -> Microsoft)
    // BUT: Skip this for job portals like jobs.ch, indeed.com, linkedin.com
    const isJobPortal = host.includes('jobs.ch') || host.includes('jobup.ch') ||
                        host.includes('indeed.') || host.includes('linkedin.') ||
                        host.includes('monster.') || host.includes('stepstone.');

    if (!scrapedData.company && !isJobPortal) {
      // Try: careers.COMPANY.com or COMPANY.jobs.ch
      let match = host.match(/careers\.([a-z0-9]+)\./i);
      if (match) {
        scrapedData.company = match[1].toUpperCase();
      } else {
        // Try: jobs.COMPANY.com or COMPANY.careers.com
        match = host.match(/([a-z0-9]+)\.jobs\.|([a-z0-9]+)\.careers\./i);
        if (match) {
          scrapedData.company = (match[1] || match[2]).toUpperCase();
        } else {
          // Try first part of domain (subdomain or main domain)
          const parts = host.replace('www.', '').split('.');
          // Skip generic parts and very short parts
          if (parts.length >= 2 && parts[0] !== 'jobs' && parts[0] !== 'careers' &&
              parts[0] !== 'www' && parts[0].length > 3) {
            scrapedData.company = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          }
        }
      }
    }

    // Position from tab title (first part before dash/pipe)
    if (!scrapedData.position && tab.title) {
      const titleParts = tab.title.split(/\s*[-|–—|]\s*/);
      if (titleParts.length > 0) {
        scrapedData.position = titleParts[0].trim().substring(0, 100);
      }
    }

    // Company from tab title (often last part: "Position - Company")
    if (!scrapedData.company && tab.title) {
      const titleParts = tab.title.split(/\s*[-|–—|]\s*/);
      if (titleParts.length >= 2) {
        // Last part is often the company
        const lastPart = titleParts[titleParts.length - 1].trim();
        // Filter out generic words
        if (!lastPart.match(/jobs|careers|hiring|stellenangebot/i)) {
          scrapedData.company = lastPart.substring(0, 100);
        }
      }
    }

    // Save application (even with partial data)
    const application = {
      id: generateId(),
      capturedAt: new Date().toISOString(),
      appliedAt: new Date().toISOString().split('T')[0],
      company: scrapedData.company || '',
      position: scrapedData.position || '',
      location: {
        plz: scrapedData.plz || '',
        city: scrapedData.city || ''
      },
      method: 'elektronisch',  // Immer elektronisch
      ravZuweisung: false,     // Immer Nein
      pensum: 'vollzeit',      // Immer Vollzeit
      ergebnis: 'offen',       // Default: Noch offen
      sourceUrl: tab.url,
      sourceSite: new URL(tab.url).hostname,
      submittedToRav: false
    };

    applications.push(application);
    await chrome.storage.local.set({ applications });

    // Show result
    if (application.company) {
      showToast(`✓ ${application.company} erfasst!`, 'success');
    } else {
      showToast('✓ Erfasst! Klicke zum Bearbeiten.', 'success');
    }
    await loadData();

  } catch (error) {
    console.error('Capture error:', error);
    showToast('Fehler: ' + error.message, 'error');
  }
}

/**
 * Scrape job page (injected into page)
 */
function scrapeJobPage() {
  const data = { company: '', position: '', plz: '', city: '' };

  // Detect which site we're on
  const hostname = window.location.hostname.toLowerCase();
  const isJobsCh = hostname.includes('jobs.ch') || hostname.includes('jobup.ch');

  // Try JSON-LD first (structured data)
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item['@type'] === 'JobPosting') {
          data.company = item.hiringOrganization?.name || '';
          data.position = item.title || '';
          if (item.jobLocation?.address) {
            data.plz = item.jobLocation.address.postalCode || '';
            data.city = item.jobLocation.address.addressLocality || '';
          }
          if (data.company && data.position) return data;
        }
      }
    } catch (e) {}
  }

  // LINKEDIN SPECIFIC SCRAPER
  const isLinkedIn = hostname.includes('linkedin.com');
  if (isLinkedIn) {
    console.log('[Lazy Worker] Detected LinkedIn - using specific scraper');

    // Detect split-view (job list on left, detail on right)
    const isSplitView = window.location.pathname.includes('/jobs/search/') ||
                        window.location.pathname.includes('/jobs/collections/');
    console.log('[Lazy Worker] LinkedIn split-view:', isSplitView);

    // Helper: check if element is in the right detail panel (not the left sidebar)
    // LinkedIn's left sidebar is ~350-400px wide in split-view
    function isInDetailPanel(el) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (!isSplitView) return true; // On /jobs/view/, all elements are valid
      return rect.left >= 350 && rect.width > 80;
    }

    // Helper: validate LinkedIn company text
    function isValidCompanyText(text) {
      if (!text || text.length < 2 || text.length > 100) return false;
      const lower = text.toLowerCase();
      return lower !== 'linkedin' &&
             !lower.includes('follower') &&
             !lower.includes('mitarbeiter') &&
             !lower.includes('employee') &&
             !lower.includes('sign in') &&
             !lower.includes('join now');
    }

    // 1. COMPANY
    // Strategy A: LinkedIn-specific selectors + position filter
    const companySelectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '[class*="topcard"] a[href*="/company/"]'
    ];

    for (const sel of companySelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        if (!isInDetailPanel(el)) continue;
        const text = el.textContent.trim();
        if (isValidCompanyText(text)) {
          data.company = text;
          console.log('[Lazy Worker] LinkedIn: Found company via selector:', text);
          break;
        }
      }
      if (data.company) break;
    }

    // Strategy B: /company/ links in detail panel
    if (!data.company) {
      const companyLinks = document.querySelectorAll('a[href*="/company/"]');
      for (const link of companyLinks) {
        if (!isInDetailPanel(link)) continue;
        const text = link.textContent.trim();
        if (isValidCompanyText(text)) {
          data.company = text;
          console.log('[Lazy Worker] LinkedIn: Found company via /company/ link:', text);
          break;
        }
      }
    }

    // Strategy C: Text pattern matching (AG/GmbH etc.) in detail panel
    if (!data.company) {
      const candidates = document.querySelectorAll('a, span, div');
      for (const el of candidates) {
        if (!isInDetailPanel(el)) continue;
        const text = el.textContent.trim();
        if (text.length > 3 && text.length < 80 &&
            text.match(/\s+(AG|GmbH|SA|Sàrl|Ltd|Inc|Corp)\.?\s*$/i)) {
          data.company = text;
          console.log('[Lazy Worker] LinkedIn: Found company via pattern:', text);
          break;
        }
      }
    }

    // Strategy D: Fallback — existing selectors without position filter (for non-split pages)
    if (!data.company) {
      const fallbackSels = [
        'a[href*="/company/"]',
        '[class*="company-name"]'
      ];
      for (const sel of fallbackSels) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent.trim();
          if (isValidCompanyText(text)) {
            data.company = text;
            console.log('[Lazy Worker] LinkedIn: Found company via fallback:', text);
            break;
          }
        }
      }
    }

    // 2. POSITION
    // Strategy A: h1 in detail panel
    const h1Elements = document.querySelectorAll('h1');
    for (const el of h1Elements) {
      if (!isInDetailPanel(el)) continue;
      const text = el.textContent.trim();
      if (text.length > 3 && text.length < 150 &&
          !text.toLowerCase().includes('linkedin') &&
          !text.toLowerCase().includes('jobs für sie') &&
          !text.toLowerCase().includes('top-jobs') &&
          !text.match(/^\(\d+\)/) &&
          !text.match(/^\d+\s*treffer/i)) {
        data.position = text;
        console.log('[Lazy Worker] LinkedIn: Found position via h1:', text);
        break;
      }
    }

    // Strategy B: LinkedIn-specific title selectors + position filter
    if (!data.position) {
      const titleSelectors = [
        'h1.jobs-unified-top-card__job-title',
        'h1.job-details-jobs-unified-top-card__job-title',
        'h1[class*="job-title"]',
        '.jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title'
      ];
      for (const sel of titleSelectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (!isInDetailPanel(el)) continue;
          const text = el.textContent.trim();
          if (text.length > 3 && text.length < 150) {
            data.position = text;
            console.log('[Lazy Worker] LinkedIn: Found position via selector:', text);
            break;
          }
        }
        if (data.position) break;
      }
    }

    // Strategy C: Fallback — first h1 on page
    if (!data.position) {
      const h1 = document.querySelector('h1');
      if (h1) {
        const text = h1.textContent.trim();
        if (text.length > 3 && text.length < 150 &&
            !text.toLowerCase().includes('linkedin')) {
          data.position = text;
          console.log('[Lazy Worker] LinkedIn: Found position via fallback h1:', text);
        }
      }
    }

    // 3. LOCATION
    const swissCities = ['Zürich', 'Basel', 'Bern', 'Genf', 'Geneva', 'Lausanne', 'Winterthur',
                         'Zug', 'Luzern', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel', 'Thun',
                         'Köniz', 'Chur', 'Schaffhausen', 'Fribourg', 'Neuchâtel', 'Uster',
                         'Sion', 'Emmen', 'Kriens', 'Rapperswil', 'Dietikon', 'Baar', 'Wil',
                         'Dübendorf', 'Horgen', 'Wädenswil', 'Adliswil', 'Opfikon', 'Kloten',
                         'Wetzikon', 'Baden', 'Aarau', 'Hünenberg', 'Meilen', 'Küsnacht',
                         'Zollikon', 'Kilchberg', 'Thalwil', 'Rüschlikon'];

    // Strategy A: Spans/divs in detail panel matching Swiss cities
    const locationCandidates = document.querySelectorAll('span, div, li');
    for (const el of locationCandidates) {
      if (!isInDetailPanel(el)) continue;
      const text = el.textContent.trim();
      if (text.length < 80) {
        for (const city of swissCities) {
          if (text.includes(city)) {
            data.city = city;
            console.log('[Lazy Worker] LinkedIn: Found city in detail panel:', city);
            break;
          }
        }
        if (data.city) break;
      }
    }

    // Strategy B: LinkedIn-specific location selectors
    if (!data.city) {
      const locationSelectors = [
        '.jobs-unified-top-card__bullet',
        '.job-details-jobs-unified-top-card__bullet',
        '.jobs-unified-top-card__subtitle-primary-grouping span',
        '[class*="topcard"] [class*="bullet"]',
        '[class*="location"]'
      ];
      for (const sel of locationSelectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          if (!isInDetailPanel(el)) continue;
          const text = el.textContent.trim();
          for (const city of swissCities) {
            if (text.includes(city)) {
              data.city = city;
              console.log('[Lazy Worker] LinkedIn: Found city via selector:', city);
              break;
            }
          }
          if (data.city) break;
        }
        if (data.city) break;
      }
    }

    // Strategy C: Full-text search for "City, Schweiz" pattern
    if (!data.city) {
      const allText = document.body.innerText;
      for (const city of swissCities) {
        const pattern = new RegExp(city + '[,\\s]+(Schweiz|Switzerland|CH)', 'i');
        if (pattern.test(allText)) {
          data.city = city;
          console.log('[Lazy Worker] LinkedIn: Found city via text search:', city);
          break;
        }
      }
    }

    if (data.company || data.position) {
      console.log('[Lazy Worker] LinkedIn scraped:', data);
      return data;
    }
  }

  // JOBS.CH SPECIFIC: Look in the detail panel (right side)
  if (isJobsCh) {
    console.log('[Lazy Worker] Detected jobs.ch - using specific scraper');

    // On jobs.ch, the layout is: left sidebar (job list) | right detail panel
    // We need to find the DETAIL PANEL only, not the sidebar

    // BLACKLIST: These are NOT company names (common false positives)
    const blacklistedCompanyNames = [
      'www', 'http', 'https', 'jobs', 'job', 'stelle', 'stellen',
      'arbeit', 'karriere', 'career', 'careers', 'apply', 'bewerben',
      'search', 'suche', 'filter', 'sort', 'alle', 'mehr', 'view',
      'details', 'description', 'beschreibung', 'info', 'information',
      'jobcloud', '2025', '2024', '2023', 'copyright', 'impressum', 'datenschutz'
    ];

    // Helper function to check if element is in the MAIN/LARGER section (right panel)
    function isInMainSection(el) {
      const rect = el.getBoundingClientRect();

      // Must be visible
      if (rect.width === 0 || rect.height === 0) return false;

      // On jobs.ch the left sidebar is ~370px wide
      // Element should start at least 300px from left edge to be in detail panel
      // This is more permissive to catch elements near the panel edge
      const isRightSide = rect.left >= 300;

      // Must be reasonably sized (not tiny UI elements)
      const isNotTiny = rect.width > 100 && rect.height > 10;

      return isRightSide && isNotTiny;
    }

    // Helper to validate company name
    function isValidCompanyName(text) {
      if (!text || text.length < 2 || text.length > 120) return false;

      const lower = text.toLowerCase().trim();

      // Check blacklist
      for (const bad of blacklistedCompanyNames) {
        if (lower === bad || lower === bad + '.ch' || lower === 'www.' + bad) return false;
      }

      // STRICT: Reject anything with "WWW" in it (case insensitive)
      if (lower.includes('www')) return false;

      // Reject URLs
      if (lower.includes('http://') || lower.includes('https://') || lower.includes('.ch/') || lower.includes('.com/')) return false;

      // Reject if too short or looks like abbreviation only (unless it's a known suffix)
      if (text.length <= 3 && !text.match(/^(AG|SA|SE)$/i)) return false;

      // Reject UI text
      if (lower.includes('arbeitgeber') || lower.includes('inserieren') ||
          lower.includes('kostenlos') || lower.includes('für ') ||
          lower.includes('alle jobs') || lower.includes('mehr jobs') ||
          lower.includes('job alert') || lower.includes('merken') ||
          lower.includes('teilen') || lower.includes('drucken') ||
          lower.includes('weitere') || lower.includes('jobsuchen') ||
          lower.includes('relevante')) return false;

      return true;
    }

    console.log('[Lazy Worker] Using main section detection for jobs.ch');

    // 1. COMPANY - Multiple strategies for jobs.ch

    // Strategy A: Find the detail container first, then search within it
    // jobs.ch typically has a container for the job detail on the right
    const detailContainers = document.querySelectorAll('[class*="detail"], [class*="Detail"], [class*="job-content"], [class*="JobContent"], article, main');
    let detailContainer = null;

    for (const container of detailContainers) {
      if (isInMainSection(container)) {
        detailContainer = container;
        console.log('[Lazy Worker] Found detail container:', container.className || container.tagName);
        break;
      }
    }

    // Strategy B: Look for company name patterns (AG, GmbH, SA, etc.) in detail area
    const searchScope = detailContainer || document;

    // Company suffix regex - matches "Name AG", "Name GmbH", etc.
    const companySuffixRegex = /^(.{2,})\s+(AG|GmbH|SA|Sàrl|Ltd\.?|Inc\.?|Corp\.?|School|Bank|Group|Gruppe|International|Schweiz|Swiss|Holding|Foundation|Stiftung)\.?\s*$/i;

    // First: Search ALL elements on the page for company patterns (very thorough)
    const allPageElements = document.querySelectorAll('a, span, div, p, h1, h2, h3, h4, strong, b');
    console.log('[Lazy Worker] Searching', allPageElements.length, 'elements for company');

    for (const el of allPageElements) {
      // Check position - must be in right panel (x >= 300)
      const rect = el.getBoundingClientRect();
      if (rect.left < 300 || rect.width === 0) continue;

      // Get the direct text content (without deeply nested children)
      let text = el.textContent.trim();

      // For elements with lots of text, skip (probably a container)
      if (text.length > 100 || text.length < 4) continue;

      // Check if this exact text matches company pattern
      const match = text.match(companySuffixRegex);
      if (match && isValidCompanyName(text)) {
        data.company = text;
        console.log('[Lazy Worker] Found company:', text, 'at x:', rect.left);
        break;
      }
    }

    // Second: If still no company, look for links with /firma/ in href
    if (!data.company) {
      const firmaLinks = document.querySelectorAll('a[href*="/firma/"], a[href*="/company/"], a[href*="/arbeitgeber/"]');
      for (const link of firmaLinks) {
        const rect = link.getBoundingClientRect();
        if (rect.left < 300) continue;

        const text = link.textContent.trim();
        if (text.length >= 3 && text.length <= 100 && isValidCompanyName(text)) {
          data.company = text;
          console.log('[Lazy Worker] Found company via firma link:', text);
          break;
        }
      }
    }

    // Strategy C: Look for company name at TOP of detail panel (near logo)
    // On jobs.ch, company name is often displayed prominently at top, even without AG/GmbH
    if (!data.company) {
      // Look for links/text in the header area of the job detail (top 300px of viewport, right panel)
      const headerElements = document.querySelectorAll('a, span, div, p');
      for (const el of headerElements) {
        const rect = el.getBoundingClientRect();
        // Must be in right panel (x >= 300) AND in top area (y < 250)
        if (rect.left < 300 || rect.top > 250 || rect.width === 0) continue;

        const text = el.textContent.trim();

        // Skip if too long or too short
        if (text.length < 2 || text.length > 60) continue;

        // Skip blacklisted words
        const lower = text.toLowerCase();
        let isBlacklisted = false;
        for (const bad of blacklistedCompanyNames) {
          if (lower === bad || lower.includes('©') || lower.includes('jobcloud')) {
            isBlacklisted = true;
            break;
          }
        }
        if (isBlacklisted) continue;

        // Skip obvious non-company text
        if (lower.includes('veröffentlicht') || lower.includes('publié') ||
            lower.includes('vor ') || lower.includes('ago') ||
            lower.includes('bewerben') || lower.includes('merken') ||
            lower.includes('teilen') || lower.match(/^\d/) ||
            lower.includes('hybrid') || lower.includes('remote') ||
            lower.includes('vollzeit') || lower.includes('teilzeit')) continue;

        // Check if this looks like a company name (not a job title or location)
        // Company names often have: Capital letter, no job-related words
        if (text.match(/^[A-ZÄÖÜ]/) &&
            !lower.includes('engineer') && !lower.includes('manager') &&
            !lower.includes('developer') && !lower.includes('analyst') &&
            !lower.includes('schweiz') && !lower.includes('switzerland') &&
            !lower.includes('oerlikon') && !lower.includes('zürich')) {

          // Check if element is a link (company names are often clickable)
          if (el.tagName === 'A' || el.closest('a')) {
            data.company = text;
            console.log('[Lazy Worker] Found company in header area:', text);
            break;
          }
        }
      }
    }

    // Strategy D: Look for any element near "Arbeitgeber:" label
    if (!data.company) {
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const rect = el.getBoundingClientRect();
        if (rect.left < 300) continue;

        const text = el.textContent.trim();
        if (text.match(/^(Arbeitgeber|Unternehmen|Firma|Company|Employer)\s*:?\s*$/i)) {
          const parent = el.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children);
            const idx = siblings.indexOf(el);
            if (idx >= 0 && idx < siblings.length - 1) {
              const nextText = siblings[idx + 1].textContent.trim();
              if (isValidCompanyName(nextText) && nextText.length < 100) {
                data.company = nextText;
                console.log('[Lazy Worker] Found company via label:', nextText);
                break;
              }
            }
          }
        }
      }
    }

    // 2. POSITION - Look for the job title heading IN MAIN SECTION
    // Blacklist of UI text that is NOT a job title
    const positionBlacklist = [
      'auf einen blick', 'at a glance', 'overview',
      'marketing jobs', 'stellenangebote', 'job alert', 'alle stellen',
      'weitere', 'relevante', 'jobsuchen', 'ähnliche', 'mehr jobs',
      'empfohlene', 'passende', 'benefits', 'vorteile', 'anforderungen',
      'requirements', 'aufgaben', 'tasks', 'responsibilities',
      'qualifikationen', 'qualifications', 'wir bieten', 'we offer',
      'über uns', 'about us', 'kontakt', 'contact', 'bewerbung',
      'dein profil', 'ihr profil', 'your profile', 'was wir bieten',
      'deine aufgaben', 'ihre aufgaben', 'passt dieser job'
    ];

    // First try h1 (most likely to be the job title)
    const h1Elements = document.querySelectorAll('h1');
    for (const h of h1Elements) {
      if (!isInMainSection(h)) continue;

      const text = h.textContent.trim();
      const lower = text.toLowerCase();

      // Check against blacklist
      let isBlacklisted = false;
      for (const bad of positionBlacklist) {
        if (lower.includes(bad)) {
          isBlacklisted = true;
          break;
        }
      }

      if (!isBlacklisted && text.length > 3 && text.length < 150 &&
          !text.match(/^\d+\s*(Jobs|Stellen)/i)) {
        data.position = text;
        console.log('[Lazy Worker] Found position via h1:', text);
        break;
      }
    }

    // If no h1 found, try h2/h3
    if (!data.position) {
      const headings = document.querySelectorAll('h2, h3');
      for (const h of headings) {
        if (!isInMainSection(h)) continue;

        const text = h.textContent.trim();
        const lower = text.toLowerCase();

        let isBlacklisted = false;
        for (const bad of positionBlacklist) {
          if (lower.includes(bad)) {
            isBlacklisted = true;
            break;
          }
        }

        if (!isBlacklisted && text.length > 3 && text.length < 150 &&
            !text.match(/^\d+\s*(Jobs|Stellen)/i)) {
          data.position = text;
          console.log('[Lazy Worker] Found position via h2/h3:', text);
          break;
        }
      }
    }

    // 3. LOCATION - Look for Swiss cities in the main panel area
    const cities = ['Zürich', 'Basel', 'Bern', 'Genf', 'Lausanne', 'Winterthur', 'Luzern', 'Lugano',
                   'Zug', 'St. Gallen', 'Adliswil', 'Dübendorf', 'Opfikon', 'Kloten', 'Uster',
                   'Dietikon', 'Wetzikon', 'Baden', 'Aarau', 'Chur', 'Schaffhausen', 'Thun',
                   'Biel', 'Fribourg', 'Neuchâtel', 'Sion', 'Hünenberg', 'Wädenswil', 'Horgen',
                   'Meilen', 'Küsnacht', 'Zollikon', 'Kilchberg', 'Thalwil', 'Rüschlikon'];

    const mainSectionElements = searchScope.querySelectorAll('span, div, p, li');
    for (const el of mainSectionElements) {
      if (!isInMainSection(el)) continue;

      const text = el.textContent.trim();
      if (text.length < 60) {
        for (const city of cities) {
          if (text === city || text.includes(city)) {
            data.city = city;
            console.log('[Lazy Worker] Found city:', city);
            break;
          }
        }
        if (data.city) break;
      }
    }

    // If we found company or position, return
    if (data.company || data.position) {
      console.log('[Lazy Worker] jobs.ch scraped data:', data);
      return data;
    }
  }

  // DOM scraping fallback for other sites

  // 1. POSITION - from h1 (most reliable)
  const h1 = document.querySelector('h1');
  if (h1 && !data.position) {
    data.position = h1.textContent.trim().substring(0, 100);
  }

  // 2. COMPANY - try multiple strategies
  if (!data.company) {
    // Try meta tags first
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName && !ogSiteName.content.toLowerCase().includes('jobs')) {
      data.company = ogSiteName.content;
    }

    // Try title tag (often "Position - Company")
    if (!data.company) {
      const title = document.title;
      const titleParts = title.split(/\s*[-|–|]\s*/);
      if (titleParts.length >= 2) {
        // Company is often the second-to-last part (last is often site name)
        const candidate = titleParts.length > 2 ? titleParts[titleParts.length - 2] : titleParts[titleParts.length - 1];
        // Filter out generic site names
        if (!candidate.toLowerCase().includes('jobs') && !candidate.toLowerCase().includes('karriere')) {
          data.company = candidate.trim();
        }
      }
    }

    // Try common selectors
    if (!data.company) {
      const companySelectors = [
        '[data-testid="company-name"]',
        '[class*="company-name"]',
        '[class*="CompanyName"]',
        '[class*="employer-name"]',
        '[class*="EmployerName"]',
        '[itemprop="hiringOrganization"]',
        'a[href*="/company/"]',
        'a[href*="/firma/"]',
        '.company', '.employer'
      ];
      for (const sel of companySelectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent.trim()) {
          data.company = el.textContent.trim().substring(0, 100);
          break;
        }
      }
    }

    // Try from URL (careers.abb -> ABB)
    if (!data.company) {
      const host = window.location.hostname;
      const match = host.match(/careers\.(\w+)\.|(\w+)\.jobs\./i);
      if (match) {
        data.company = (match[1] || match[2]).toUpperCase();
      }
    }
  }

  // 3. PLZ & CITY/LOCATION
  if (!data.city) {
    const locationSelectors = [
      '[data-testid="location"]',
      '[itemprop="jobLocation"]',
      '[class*="location" i]',
      '[class*="Location"]',
      '[class*="address" i]'
    ];
    for (const sel of locationSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        // Swiss format: "8000 Zürich" or just city name
        const match = text.match(/(\d{4})\s*([A-Za-zäöüÄÖÜéèê\s-]+)/);
        if (match) {
          data.plz = match[1];
          data.city = match[2].trim().substring(0, 50);
          break;
        }
        // Just city name
        const cityMatch = text.match(/^([A-Za-zäöüÄÖÜéèê\s-]+)/);
        if (cityMatch) {
          data.city = cityMatch[1].trim().substring(0, 50);
          break;
        }
      }
    }
  }

  return data;
}

/**
 * Render applications list
 */
function renderApplications() {
  // Sort by date (newest first)
  const sorted = [...applications].sort((a, b) =>
    new Date(b.appliedAt) - new Date(a.appliedAt)
  );

  if (sorted.length === 0) {
    elements.applicationsList.innerHTML = `
      <div class="empty-state">
        <p>Keine Bewerbungen vorhanden</p>
        <p class="hint">Öffne ein Job-Inserat und klicke "Diese Seite erfassen"</p>
      </div>
    `;
    return;
  }

  elements.applicationsList.innerHTML = sorted.map(app => `
    <div class="application-card ${app.submittedToRav ? 'submitted' : ''}" data-id="${app.id}">
      <div class="card-header">
        <span class="card-company">${escapeHtml(app.company) || 'Unbekannt'}</span>
        <div class="card-actions">
          <span class="card-date">${formatDate(app.appliedAt)}</span>
          <button class="card-delete-btn" data-id="${app.id}" title="Löschen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="card-position">${escapeHtml(app.position) || '-'}</div>
      <div class="card-location">${app.location?.plz ? app.location.plz + ' ' : ''}${escapeHtml(app.location?.city) || '-'}</div>
      ${app.submittedToRav ? '<span class="badge badge-success">RAV</span>' : ''}
    </div>
  `).join('');

  // Click handlers for cards (edit)
  document.querySelectorAll('.application-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't open modal if delete button was clicked
      if (e.target.closest('.card-delete-btn')) return;
      const app = applications.find(a => a.id === card.dataset.id);
      if (app) openModal(app);
    });
  });

  // Click handlers for delete buttons
  document.querySelectorAll('.card-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const app = applications.find(a => a.id === id);
      if (!app) return;

      applications = applications.filter(a => a.id !== id);
      await chrome.storage.local.set({ applications });
      showToast('Gelöscht', 'success');
      await loadData();
    });
  });
}

/**
 * Open edit modal
 */
function openModal(application) {
  elements.modalTitle.textContent = 'Bewerbung bearbeiten';

  formFields.appId.value = application.id;
  formFields.appliedAt.value = application.appliedAt;
  formFields.company.value = application.company || '';
  formFields.position.value = application.position || '';
  formFields.plz.value = application.location?.plz || '';
  formFields.city.value = application.location?.city || '';
  formFields.sourceUrl.value = application.sourceUrl || '';

  elements.editModal.classList.add('active');
}

/**
 * Close modal
 */
function closeModal() {
  elements.editModal.classList.remove('active');
}

/**
 * Handle form submit
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = formFields.appId.value;
  const index = applications.findIndex(a => a.id === id);

  if (index === -1) return;

  applications[index] = {
    ...applications[index],
    appliedAt: formFields.appliedAt.value,
    company: formFields.company.value,
    position: formFields.position.value,
    location: {
      plz: formFields.plz.value,
      city: formFields.city.value
    },
    sourceUrl: formFields.sourceUrl.value
  };

  await chrome.storage.local.set({ applications });
  showToast('Gespeichert', 'success');
  closeModal();
  await loadData();
}

/**
 * Handle delete
 */
async function handleDelete() {
  const id = formFields.appId.value;
  if (!confirm('Wirklich löschen?')) return;

  applications = applications.filter(a => a.id !== id);
  await chrome.storage.local.set({ applications });

  showToast('Gelöscht', 'success');
  closeModal();
  await loadData();
}

/**
 * Export CSV
 */
async function handleExport() {
  const headers = ['Datum', 'Firma', 'Stelle', 'PLZ', 'Ort', 'Bewerbungsart', 'RAV Zuweisung', 'Pensum', 'Ergebnis', 'URL/Email'];
  const rows = applications.map(app => [
    app.appliedAt,
    app.company,
    app.position,
    app.location?.plz || '',
    app.location?.city || '',
    app.method || 'elektronisch',
    app.ravZuweisung ? 'Ja' : 'Nein',
    app.pensum || 'vollzeit',
    app.ergebnis || 'offen',
    app.sourceUrl
  ]);

  const csv = [
    headers.join(';'),
    ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bewerbungen_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);

  showToast('CSV exportiert', 'success');
}

// Helpers
function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Init
document.addEventListener('DOMContentLoaded', init);
