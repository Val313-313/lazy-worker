/**
 * Lazy Worker - arbeit.swiss Content Script
 * Auto-fills the RAV "Nachweis der persönlichen Arbeitsbemühungen" form
 */

import { setInputValue, setCheckboxValue, setSelectValue, waitForElement, sleep } from '../lib/utils.js';

// Country mappings for the dropdown
const COUNTRY_MAP = {
  'Schweiz': 'CH',
  'Switzerland': 'CH',
  'Liechtenstein': 'LI',
  'Deutschland': 'DE',
  'Germany': 'DE',
  'Frankreich': 'FR',
  'France': 'FR',
  'Italien': 'IT',
  'Italy': 'IT',
  'Österreich': 'AT',
  'Austria': 'AT'
};

// Result mappings
const RESULT_MAP = {
  'offen': 'noch_offen',
  'vorstellungsgespraech': 'vorstellungsgespraech',
  'anstellung': 'anstellung',
  'absage': 'absage'
};

/**
 * Initialize the content script
 */
function init() {
  console.log('[Lazy Worker] Activated on arbeit.swiss');

  // Create floating button (always show on arbeit.swiss so users aren't confused)
  createFloatingUI();

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener(handleMessage);

  // Observe SPA navigation — re-init if URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log('[Lazy Worker] SPA navigation detected:', lastUrl);
      createFloatingUI();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/**
 * Create the floating UI button
 */
function createFloatingUI() {
  // Check if already exists
  if (document.getElementById('lazy-worker-container')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'lazy-worker-container';
  container.innerHTML = `
    <div class="lw-floating-btn" id="lw-floating-btn">
      <span class="lw-icon">🦥</span>
      <span class="lw-text">Lazy Worker</span>
    </div>
    <div class="lw-panel" id="lw-panel">
      <div class="lw-panel-header">
        <h3>🦥 Lazy Worker</h3>
        <button class="lw-close" id="lw-close">&times;</button>
      </div>
      <div class="lw-panel-content" id="lw-panel-content">
        <p class="lw-loading">Lade Bewerbungen...</p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Event listeners
  document.getElementById('lw-floating-btn').addEventListener('click', togglePanel);
  document.getElementById('lw-close').addEventListener('click', closePanel);

  // Load applications
  loadApplicationsIntoPanel();
}

/**
 * Toggle the panel visibility
 */
function togglePanel() {
  const panel = document.getElementById('lw-panel');
  panel.classList.toggle('active');

  if (panel.classList.contains('active')) {
    loadApplicationsIntoPanel();
  }
}

/**
 * Close the panel
 */
function closePanel() {
  document.getElementById('lw-panel').classList.remove('active');
}

/**
 * Load pending applications into the panel
 */
async function loadApplicationsIntoPanel() {
  const content = document.getElementById('lw-panel-content');

  try {
    // Get pending applications from storage
    const result = await chrome.storage.local.get('applications');
    const applications = result.applications || [];
    const pending = applications.filter(app => !app.submittedToRav);

    if (pending.length === 0) {
      content.innerHTML = `
        <div class="lw-empty">
          <p>Keine ausstehenden Bewerbungen</p>
          <p class="lw-hint">Bewerben Sie sich auf jobs.ch, LinkedIn oder Indeed - die Daten werden automatisch erfasst.</p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <p class="lw-count">${pending.length} Bewerbung${pending.length !== 1 ? 'en' : ''} ausstehend</p>
      <div class="lw-list">
        ${pending.map(app => `
          <div class="lw-item" data-id="${app.id}">
            <div class="lw-item-info">
              <strong>${escapeHtml(app.company)}</strong>
              <span>${escapeHtml(app.position)}</span>
              <small>${app.appliedAt}</small>
            </div>
            <button class="lw-fill-btn" data-id="${app.id}">Ausfüllen</button>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers
    content.querySelectorAll('.lw-fill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const app = pending.find(a => a.id === id);
        if (app) {
          fillForm(app);
        }
      });
    });

  } catch (error) {
    console.error('[Lazy Worker] Error loading applications:', error);
    content.innerHTML = `
      <div class="lw-error">
        <p>Fehler beim Laden der Bewerbungen</p>
      </div>
    `;
  }
}

/**
 * Fill the form with application data
 * @param {Object} application
 */
async function fillForm(application) {
  console.log('[Lazy Worker] Filling form with:', application);

  try {
    // Close the panel
    closePanel();

    // Wait a bit for any dynamic content
    await sleep(300);

    // Try to find and fill each field
    await fillDateField(application.appliedAt);
    await fillMethodField(application.method);
    await fillTextField('company', application.company);
    await fillTextField('position', application.position);
    await fillLocationFields(application.location);
    await fillWorkloadField(application.workload);
    await fillRavAssignmentField(application.ravAssignment);
    await fillResultField(application.result);

    // Show success notification
    showNotification('Formular ausgefüllt! Bitte überprüfen und absenden.', 'success');

    // Ask if user wants to mark as submitted
    setTimeout(() => {
      if (confirm('Bewerbung als "an RAV übermittelt" markieren?')) {
        markAsSubmitted(application.id);
      }
    }, 1000);

  } catch (error) {
    console.error('[Lazy Worker] Error filling form:', error);
    showNotification('Fehler beim Ausfüllen. Bitte manuell prüfen.', 'error');
  }
}

/**
 * Fill the date field
 */
async function fillDateField(date) {
  // Try different selectors for date input
  const selectors = [
    'input[type="date"]',
    'input[name*="datum"]',
    'input[name*="date"]',
    'input[placeholder*="Datum"]',
    '#datum',
    '.date-input input'
  ];

  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      setInputValue(input, date);
      console.log('[Lazy Worker] Filled date:', date);
      return;
    }
  }

  console.warn('[Lazy Worker] Date field not found');
}

/**
 * Find a checkbox by its associated label text
 * Checks: label[for], parent label, adjacent text nodes
 */
function findCheckboxByLabelText(keyword) {
  const lowerKeyword = keyword.toLowerCase();

  // Strategy 1: Find label containing text, then find its checkbox via "for" attribute
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent.trim().toLowerCase().includes(lowerKeyword)) {
      // Check if label has a "for" attribute pointing to a checkbox
      if (label.htmlFor) {
        const checkbox = document.getElementById(label.htmlFor);
        if (checkbox && checkbox.type === 'checkbox') return checkbox;
      }
      // Check if label wraps a checkbox
      const innerCheckbox = label.querySelector('input[type="checkbox"]');
      if (innerCheckbox) return innerCheckbox;
    }
  }

  // Strategy 2: Find checkboxes and check their adjacent/sibling text
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (const cb of checkboxes) {
    // Check parent element text
    const parent = cb.closest('label, div, li, td, span');
    if (parent && parent.textContent.trim().toLowerCase().includes(lowerKeyword)) {
      return cb;
    }
    // Check next sibling text
    const nextSibling = cb.nextSibling || cb.nextElementSibling;
    if (nextSibling && (nextSibling.textContent || '').trim().toLowerCase().includes(lowerKeyword)) {
      return cb;
    }
  }

  return null;
}

/**
 * Fill the application method (Bewerbungsart)
 * Always checks "Elektronisch" since all applications are submitted electronically
 */
async function fillMethodField(method) {
  const methodMap = {
    'elektronisch': ['elektronisch', 'email', 'online', 'electronic'],
    'brieflich': ['brieflich', 'brief', 'post', 'mail'],
    'persoenlich': ['persönlich', 'persoenlich', 'personal', 'vor ort'],
    'telefonisch': ['telefonisch', 'telefon', 'phone', 'call']
  };

  // Always check "Elektronisch" first
  const elektronischChecked = checkMethodCheckbox(methodMap['elektronisch']);
  if (elektronischChecked) {
    console.log('[Lazy Worker] Checked "Elektronisch" checkbox');
  } else {
    console.warn('[Lazy Worker] Could not find "Elektronisch" checkbox');
  }

  // Additionally check the specific method if it's different from elektronisch
  if (method && method !== 'elektronisch' && methodMap[method]) {
    checkMethodCheckbox(methodMap[method]);
  }
}

/**
 * Try to find and check a method checkbox by keywords
 * Returns true if found and checked
 */
function checkMethodCheckbox(keywords) {
  for (const keyword of keywords) {
    // Strategy 1: Direct attribute match
    const checkbox = document.querySelector(
      `input[type="checkbox"][value*="${keyword}" i], ` +
      `input[type="checkbox"][name*="${keyword}" i], ` +
      `input[type="checkbox"][id*="${keyword}" i]`
    );
    if (checkbox) {
      setCheckboxValue(checkbox, true);
      return true;
    }

    // Strategy 2: Find by label text
    const cbByLabel = findCheckboxByLabelText(keyword);
    if (cbByLabel) {
      setCheckboxValue(cbByLabel, true);
      return true;
    }

    // Strategy 3: Radio buttons
    const radio = document.querySelector(
      `input[type="radio"][value*="${keyword}" i], ` +
      `input[type="radio"][name*="${keyword}" i]`
    );
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }

  // Strategy 4: Walk ALL checkboxes and match by any surrounding text
  // (handles custom form frameworks where label/value don't contain the keyword)
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const cb of allCheckboxes) {
      // Walk up to find containing row/cell and check its full text
      const row = cb.closest('tr, li, div, section, fieldset');
      if (row) {
        const rowText = row.textContent.trim().toLowerCase();
        if (rowText.includes(lowerKeyword) && rowText.length < 200) {
          setCheckboxValue(cb, true);
          console.log('[Lazy Worker] Found checkbox via row text for:', keyword);
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Fill a text field by trying multiple selectors
 */
async function fillTextField(fieldType, value) {
  if (!value) return;

  const selectorMap = {
    company: [
      'input[name*="unternehmen" i]',
      'input[name*="company" i]',
      'input[name*="firma" i]',
      'input[placeholder*="Unternehmen" i]',
      'input[placeholder*="Firma" i]',
      '#unternehmen',
      '#company'
    ],
    position: [
      'input[name*="stelle" i]',
      'input[name*="position" i]',
      'input[name*="job" i]',
      'input[name*="beruf" i]',
      'input[placeholder*="Stelle" i]',
      'input[placeholder*="Position" i]',
      '#stelle',
      '#position'
    ]
  };

  const selectors = selectorMap[fieldType] || [];

  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input) {
      // Respect max length
      const maxLength = input.maxLength > 0 ? input.maxLength : 100;
      setInputValue(input, value.substring(0, maxLength));
      console.log(`[Lazy Worker] Filled ${fieldType}:`, value);
      return;
    }
  }

  console.warn(`[Lazy Worker] ${fieldType} field not found`);
}

// Fallback PLZ values (Zürich) when scrapers can't capture a postal code
const FALLBACK_PLZ = ['8001', '8002', '8003', '8004'];

/**
 * Fill location fields
 */
async function fillLocationFields(location) {
  if (!location) return;

  // Street
  if (location.street) {
    const streetInput = document.querySelector(
      'input[name*="strasse" i], input[name*="street" i], input[placeholder*="Strasse" i]'
    );
    if (streetInput) {
      setInputValue(streetInput, location.street);
    }
  }

  // Street number
  if (location.number) {
    const numberInput = document.querySelector(
      'input[name*="nr" i], input[name*="number" i], input[placeholder*="Nr" i]'
    );
    if (numberInput) {
      setInputValue(numberInput, location.number);
    }
  }

  // Postal code (PLZ) - use random Zürich PLZ as fallback if not captured
  const postalCode = location.plz || location.postalCode || FALLBACK_PLZ[Math.floor(Math.random() * FALLBACK_PLZ.length)];
  const plzInput = document.querySelector(
    'input[name*="plz" i], input[name*="postal" i], input[name*="zip" i], input[placeholder*="PLZ" i]'
  );
  if (plzInput) {
    setInputValue(plzInput, postalCode);
    if (!location.postalCode) {
      console.log('[Lazy Worker] Used fallback PLZ:', postalCode);
    }
  }

  // City
  if (location.city) {
    const cityInput = document.querySelector(
      'input[name*="ort" i], input[name*="city" i], input[name*="stadt" i], input[placeholder*="Ort" i]'
    );
    if (cityInput) {
      setInputValue(cityInput, location.city);
    }
  }

  // Country
  if (location.country) {
    const countrySelect = document.querySelector(
      'select[name*="land" i], select[name*="country" i]'
    );
    if (countrySelect) {
      const countryCode = COUNTRY_MAP[location.country] || location.country;
      // Try to find matching option
      const option = Array.from(countrySelect.options).find(opt =>
        opt.value === countryCode ||
        opt.value === location.country ||
        opt.text.toLowerCase().includes(location.country.toLowerCase())
      );
      if (option) {
        setSelectValue(countrySelect, option.value);
      }
    }
  }

  console.log('[Lazy Worker] Filled location fields');
}

/**
 * Fill workload field (Vollzeit/Teilzeit)
 */
async function fillWorkloadField(workload) {
  const isFullTime = workload === 'vollzeit';

  // Try radio buttons
  const radioSelector = isFullTime
    ? 'input[type="radio"][value*="vollzeit" i], input[type="radio"][value*="full" i]'
    : 'input[type="radio"][value*="teilzeit" i], input[type="radio"][value*="part" i]';

  const radio = document.querySelector(radioSelector);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Lazy Worker] Filled workload:', workload);
    return;
  }

  // Try select
  const select = document.querySelector('select[name*="pensum" i], select[name*="workload" i]');
  if (select) {
    const keyword = isFullTime ? 'vollzeit' : 'teilzeit';
    const option = Array.from(select.options).find(opt =>
      opt.text.toLowerCase().includes(keyword) || opt.value.toLowerCase().includes(keyword)
    );
    if (option) {
      setSelectValue(select, option.value);
    }
  }
}

/**
 * Fill RAV assignment field
 */
async function fillRavAssignmentField(isRavAssignment) {
  const value = isRavAssignment ? 'ja' : 'nein';

  // Try radio buttons
  const radio = document.querySelector(
    `input[type="radio"][name*="rav" i][value*="${value}" i], ` +
    `input[type="radio"][name*="zuweisung" i][value*="${value}" i]`
  );
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[Lazy Worker] Filled RAV assignment:', value);
    return;
  }

  // Try all radio groups and find the one for RAV
  const allRadios = document.querySelectorAll('input[type="radio"]');
  for (const r of allRadios) {
    const label = document.querySelector(`label[for="${r.id}"]`);
    if (label && label.textContent.toLowerCase().includes(value)) {
      const name = r.name;
      if (name && name.toLowerCase().includes('rav')) {
        r.checked = true;
        r.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  }
}

/**
 * Fill result field
 */
async function fillResultField(result) {
  const resultValue = RESULT_MAP[result] || 'noch_offen';

  // Try select dropdown
  const select = document.querySelector(
    'select[name*="ergebnis" i], select[name*="result" i], select[name*="status" i]'
  );
  if (select) {
    const keywords = [resultValue, result];
    const option = Array.from(select.options).find(opt =>
      keywords.some(k => opt.text.toLowerCase().includes(k) || opt.value.toLowerCase().includes(k))
    );
    if (option) {
      setSelectValue(select, option.value);
      console.log('[Lazy Worker] Filled result:', option.value);
      return;
    }
  }

  // Default to "noch offen" if available
  if (select) {
    const offenOption = Array.from(select.options).find(opt =>
      opt.text.toLowerCase().includes('offen')
    );
    if (offenOption) {
      setSelectValue(select, offenOption.value);
    }
  }
}

/**
 * Mark application as submitted to RAV
 */
async function markAsSubmitted(id) {
  try {
    const result = await chrome.storage.local.get('applications');
    const applications = result.applications || [];
    const index = applications.findIndex(app => app.id === id);

    if (index !== -1) {
      applications[index].submittedToRav = true;
      await chrome.storage.local.set({ applications });

      // Update stats
      const statsResult = await chrome.storage.local.get('stats');
      const stats = statsResult.stats || { totalSubmitted: 0 };
      stats.totalSubmitted = (stats.totalSubmitted || 0) + 1;
      await chrome.storage.local.set({ stats });

      showNotification('Als übermittelt markiert ✓', 'success');
      loadApplicationsIntoPanel();
    }
  } catch (error) {
    console.error('[Lazy Worker] Error marking as submitted:', error);
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `lw-notification lw-notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('visible'), 10);
  setTimeout(() => {
    notification.classList.remove('visible');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Handle messages from popup/background
 */
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'fillForm' && request.application) {
    fillForm(request.application);
    sendResponse({ success: true });
  }
  return true;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
