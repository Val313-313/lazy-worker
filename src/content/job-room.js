/**
 * Lazy Worker - job-room.ch Content Script
 * Auto-fills the RAV "Nachweis der persönlichen Arbeitsbemühungen" form
 */

(function() {
  console.log('[Lazy Worker] job-room.ch content script loaded');

  // Always show button on job-room.ch so users aren't confused.
  // Wait for Angular to load, then create button.
  setTimeout(init, 2000);

  function init() {
    createFloatingButton();

    // Observe SPA navigation — Angular changes URL without page reload
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[Lazy Worker] SPA navigation detected:', lastUrl);
        // Re-create button if it was removed during navigation
        if (!document.getElementById('lw-float-btn')) {
          createFloatingButton();
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  function createFloatingButton() {
    // Remove if already exists
    const existing = document.getElementById('lw-float-btn');
    if (existing) existing.remove();

    const btn = document.createElement('div');
    btn.id = 'lw-float-btn';
    btn.innerHTML = `
      <style>
        #lw-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        #lw-float-btn .lw-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          padding: 14px 22px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: -0.01em;
        }

        #lw-float-btn .lw-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5), 0 0 60px rgba(99, 102, 241, 0.3);
        }

        #lw-float-btn .lw-btn:active {
          transform: translateY(0);
        }

        #lw-float-btn .lw-btn svg {
          width: 20px;
          height: 20px;
        }

        #lw-panel {
          display: none;
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 340px;
          max-height: 420px;
          background: #141417;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1);
          z-index: 99998;
          overflow: hidden;
        }

        #lw-panel.active {
          display: block;
          animation: lw-slide-up 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes lw-slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        #lw-panel-header {
          background: linear-gradient(180deg, #1c1c21 0%, #141417 100%);
          color: white;
          padding: 16px 18px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        #lw-panel-header-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #lw-panel-header-title svg {
          width: 20px;
          height: 20px;
          color: #6366f1;
        }

        #lw-panel-close {
          background: transparent;
          border: none;
          color: #71717a;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }

        #lw-panel-close:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        #lw-panel-close svg {
          width: 16px;
          height: 16px;
        }

        #lw-panel-content {
          padding: 12px;
          max-height: 340px;
          overflow-y: auto;
        }

        #lw-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        #lw-panel-content::-webkit-scrollbar-track {
          background: transparent;
        }

        #lw-panel-content::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }

        .lw-app-item {
          padding: 14px 16px;
          background: #1c1c21;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .lw-app-item:hover {
          border-color: #6366f1;
          background: #232329;
          transform: translateX(2px);
        }

        .lw-app-item:last-child {
          margin-bottom: 0;
        }

        .lw-app-company {
          font-weight: 600;
          font-size: 14px;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .lw-app-position {
          font-size: 13px;
          color: #a1a1aa;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lw-app-meta {
          font-size: 12px;
          color: #71717a;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .lw-app-meta::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 4px;
          background: #6366f1;
          border-radius: 50%;
        }

        .lw-empty {
          text-align: center;
          padding: 32px 20px;
          color: #71717a;
          font-size: 14px;
        }

        .lw-empty-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 12px;
          opacity: 0.4;
        }

        .lw-toast {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: #232329;
          color: white;
          padding: 12px 20px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 500;
          z-index: 999999;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          animation: lw-toast 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .lw-toast.success {
          background: #10b981;
          border-color: #10b981;
        }

        @keyframes lw-toast {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          10% { opacity: 1; transform: translateX(-50%) translateY(0); }
          90% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      </style>
      <button class="lw-btn" id="lw-trigger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>Formular ausfüllen</span>
      </button>
      <div id="lw-panel">
        <div id="lw-panel-header">
          <div id="lw-panel-header-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="9"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="12" y2="17"/>
            </svg>
            <span>Bewerbung auswählen</span>
          </div>
          <button id="lw-panel-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div id="lw-panel-content">
          <div class="lw-empty">
            <svg class="lw-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Lade...
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(btn);

    // Event listeners
    document.getElementById('lw-trigger').addEventListener('click', togglePanel);
    document.getElementById('lw-panel-close').addEventListener('click', closePanel);
  }

  function togglePanel() {
    const panel = document.getElementById('lw-panel');
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
      loadApplications();
    }
  }

  function closePanel() {
    document.getElementById('lw-panel').classList.remove('active');
  }

  async function loadApplications() {
    const content = document.getElementById('lw-panel-content');

    try {
      // Check if chrome.storage is available
      if (!chrome?.storage?.local) {
        throw new Error('Chrome storage not available');
      }

      console.log('[Lazy Worker] Loading applications from storage...');
      const result = await chrome.storage.local.get('applications');
      console.log('[Lazy Worker] Storage result:', result);
      const apps = result.applications || [];

      if (apps.length === 0) {
        content.innerHTML = '<div class="lw-empty">Keine Bewerbungen gespeichert.<br>Erfasse zuerst Jobs!</div>';
        return;
      }

      // Sort by date, newest first
      apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

      content.innerHTML = apps.map(app => `
        <div class="lw-app-item" data-id="${app.id}">
          <div class="lw-app-company">${app.company || 'Unbekannt'}</div>
          <div class="lw-app-position">${app.position || '-'}</div>
          <div class="lw-app-meta">${formatDate(app.appliedAt)} • ${app.location?.postalCode || app.location?.plz || ''} ${app.location?.city || ''}</div>
        </div>
      `).join('');

      // Click handlers
      content.querySelectorAll('.lw-app-item').forEach(item => {
        item.addEventListener('click', () => {
          const app = apps.find(a => a.id === item.dataset.id);
          if (app) {
            fillForm(app);
            closePanel();
          }
        });
      });

    } catch (err) {
      console.error('[Lazy Worker] Error loading applications:', err);
      console.error('[Lazy Worker] Error details:', err.message, err.stack);
      content.innerHTML = `<div class="lw-empty">Fehler beim Laden<br><small>${err.message || 'Unbekannter Fehler'}</small></div>`;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  }

  // Helper to set input value with Angular compatibility
  function setValue(input, value) {
    if (!input || value === undefined || value === null) return false;

    // Focus first
    input.focus();

    // Clear existing value
    input.value = '';

    // Set new value
    input.value = value;

    // Dispatch all events Angular might need
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));

    console.log('[Lazy Worker] Set value:', input.placeholder || input.name, '=', value);
    return true;
  }

  // Helper to click checkbox/radio
  function clickInput(input) {
    if (!input) return false;
    input.focus();
    input.click();
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));
    console.log('[Lazy Worker] Clicked:', input.id || input.name || input.value);
    return true;
  }

  // Find input by placeholder OR floating label text (partial match)
  function findInputByPlaceholder(text) {
    const searchText = text.toLowerCase();

    // Method 1: Check actual placeholder attribute
    const inputs = document.querySelectorAll('input');
    for (const input of inputs) {
      const placeholder = (input.placeholder || '').toLowerCase();
      if (placeholder.includes(searchText)) {
        return input;
      }
    }

    // Method 2: Find by floating label (mat-label or label element)
    const labels = document.querySelectorAll('mat-label, label, .mat-form-field-label, span');
    for (const label of labels) {
      const labelText = (label.textContent || '').toLowerCase().trim();
      if (labelText.includes(searchText)) {
        // Find the input in the same form field container
        const container = label.closest('mat-form-field, .mat-form-field, .form-group, .field');
        if (container) {
          const input = container.querySelector('input');
          if (input) return input;
        }
        // Try sibling
        const parent = label.parentElement;
        if (parent) {
          const input = parent.querySelector('input');
          if (input) return input;
        }
      }
    }

    // Method 3: Search in any parent element containing the text
    const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of allInputs) {
      const parent = input.closest('.mat-form-field, mat-form-field, .form-field, .form-group');
      if (parent && parent.textContent.toLowerCase().includes(searchText)) {
        return input;
      }
    }

    return null;
  }

  // Find checkbox by label text
  function findCheckboxByLabel(text) {
    // Method 1: Find by label text content
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(text.toLowerCase())) {
        // Check if label contains checkbox
        const cb = label.querySelector('input[type="checkbox"]');
        if (cb) return cb;

        // Check if label has "for" attribute
        if (label.htmlFor) {
          const input = document.getElementById(label.htmlFor);
          if (input && input.type === 'checkbox') return input;
        }
      }
    }

    // Method 2: Find checkbox near text
    const allText = document.body.innerText;
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const cb of checkboxes) {
      const parent = cb.closest('label, div, span, li');
      if (parent && parent.textContent.toLowerCase().includes(text.toLowerCase())) {
        return cb;
      }
    }

    return null;
  }

  // Find radio by label text
  function findRadioByLabel(text) {
    const labels = document.querySelectorAll('label');
    for (const label of labels) {
      if (label.textContent.trim().toLowerCase() === text.toLowerCase()) {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) return radio;

        if (label.htmlFor) {
          const input = document.getElementById(label.htmlFor);
          if (input && input.type === 'radio') return input;
        }
      }
    }

    // Also check parent elements
    const radios = document.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      const parent = radio.closest('label, div, li');
      if (parent && parent.textContent.trim().toLowerCase() === text.toLowerCase()) {
        return radio;
      }
    }

    return null;
  }

  async function fillForm(app) {
    console.log('[Lazy Worker] Filling form with:', app);
    console.log('[Lazy Worker] Scanning page for form elements...');

    // Debug: List all input fields found
    const allInputs = document.querySelectorAll('input');
    console.log('[Lazy Worker] Found', allInputs.length, 'input elements');
    allInputs.forEach((inp, i) => {
      const parent = inp.closest('mat-form-field') || inp.parentElement;
      const label = parent?.querySelector('mat-label, label');
      console.log(`[Lazy Worker] Input ${i}:`, {
        type: inp.type,
        id: inp.id,
        name: inp.name,
        placeholder: inp.placeholder,
        label: label?.textContent?.trim(),
        parentText: parent?.textContent?.substring(0, 50)
      });
    });

    let filled = 0;

    // Small delay to ensure page is ready
    await new Promise(r => setTimeout(r, 500));

    // Strategy: Get all mat-form-field elements and map by their label text
    const formFields = document.querySelectorAll('mat-form-field');
    console.log('[Lazy Worker] Found', formFields.length, 'mat-form-field elements');

    const fieldMap = {};
    formFields.forEach(field => {
      const label = field.querySelector('mat-label, label, .mat-form-field-label');
      const input = field.querySelector('input, textarea');
      if (label && input) {
        const labelText = label.textContent.trim().toLowerCase();
        fieldMap[labelText] = input;
        console.log('[Lazy Worker] Mapped field:', labelText, '→', input.tagName);
      }
    });

    // 1. DATUM - Format: DD.MM.YYYY
    const datumInput = fieldMap['date'] || fieldMap['datum'] || findInputByPlaceholder('date') || findInputByPlaceholder('datum');
    if (datumInput && app.appliedAt) {
      const [y, m, d] = app.appliedAt.split('-');
      if (setValue(datumInput, `${d}.${m}.${y}`)) filled++;
    } else {
      console.log('[Lazy Worker] Date field not found');
    }

    // 2. ELEKTRONISCH - Checkbox
    let elektronischFound = false;

    // Helper to reliably click a mat-checkbox using multiple strategies
    async function clickMatCheckbox(matCheckbox) {
      console.log('[Lazy Worker] Attempting to click mat-checkbox...');

      const input = matCheckbox.querySelector('input[type="checkbox"]');
      const isChecked = () => input && input.checked;

      // Strategy 1: Click the mat-checkbox element itself (Angular handles the event)
      matCheckbox.click();
      console.log('[Lazy Worker] Strategy 1: clicked mat-checkbox element');
      await new Promise(r => setTimeout(r, 100));
      if (isChecked()) { console.log('[Lazy Worker] Checkbox checked via strategy 1'); return; }

      // Strategy 2: Simulate full mouse event sequence on the label
      const label = matCheckbox.querySelector('label');
      if (label) {
        label.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        label.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        label.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        console.log('[Lazy Worker] Strategy 2: full mouse sequence on label');
      }
      await new Promise(r => setTimeout(r, 100));
      if (isChecked()) { console.log('[Lazy Worker] Checkbox checked via strategy 2'); return; }

      // Strategy 3: Click the inner input directly
      if (input) {
        input.focus();
        input.click();
        console.log('[Lazy Worker] Strategy 3: clicked input directly');
      }
      await new Promise(r => setTimeout(r, 100));
      if (isChecked()) { console.log('[Lazy Worker] Checkbox checked via strategy 3'); return; }

      // Strategy 4: Click touch target or mdc-checkbox container
      const clickTargets = matCheckbox.querySelectorAll(
        '.mat-mdc-checkbox-touch-target, .mdc-checkbox, .mdc-checkbox__native-control, .mat-checkbox-inner-container'
      );
      for (const target of clickTargets) {
        target.click();
        console.log('[Lazy Worker] Strategy 4: clicked', target.className);
        await new Promise(r => setTimeout(r, 50));
        if (isChecked()) { console.log('[Lazy Worker] Checkbox checked via strategy 4'); return; }
      }

      // Strategy 5: Force state as last resort
      if (input && !isChecked()) {
        input.checked = true;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        matCheckbox.classList.add('mat-mdc-checkbox-checked', 'mat-checkbox-checked');
        matCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[Lazy Worker] Strategy 5: forced checked state');
      }

      console.log('[Lazy Worker] Checkbox final state:', isChecked());
    }

    // Find mat-checkbox with "elektronisch" or "electronic" text
    const matCheckboxes = document.querySelectorAll('mat-checkbox');
    console.log('[Lazy Worker] Found', matCheckboxes.length, 'mat-checkbox elements');

    for (const cb of matCheckboxes) {
      const text = cb.textContent?.toLowerCase() || '';
      console.log('[Lazy Worker] mat-checkbox text:', text.substring(0, 50));
      if (text.includes('elektron') || text.includes('electronic')) {
        await clickMatCheckbox(cb);
        filled++;
        elektronischFound = true;
        console.log('[Lazy Worker] Processed elektronisch checkbox');
        break;
      }
    }

    // Fallback: search for any checkbox element on the page with elektronisch
    if (!elektronischFound) {
      const allCheckboxInputs = document.querySelectorAll('input[type="checkbox"]');
      console.log('[Lazy Worker] Fallback: found', allCheckboxInputs.length, 'checkbox inputs');
      for (const cb of allCheckboxInputs) {
        const parent = cb.closest('div, label, span, li, section') || cb.parentElement;
        const parentText = parent?.textContent?.toLowerCase() || '';
        console.log('[Lazy Worker] Checkbox parent text:', parentText.substring(0, 60));
        if (parentText.includes('elektron') || parentText.includes('electronic')) {
          cb.click();
          filled++;
          elektronischFound = true;
          console.log('[Lazy Worker] Clicked elektronisch checkbox via fallback');
          break;
        }
      }
    }

    // Last resort: find ANY element with "Elektronisch" text and click it
    if (!elektronischFound) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.trim().toLowerCase() === 'elektronisch') {
          const el = walker.currentNode.parentElement;
          console.log('[Lazy Worker] Found "Elektronisch" text in:', el?.tagName, el?.className);
          // Click the element or its parent (might be a label that toggles a checkbox)
          el?.click();
          filled++;
          elektronischFound = true;
          console.log('[Lazy Worker] Clicked Elektronisch text element');
          break;
        }
      }
    }

    if (!elektronischFound) {
      console.log('[Lazy Worker] Elektronisch checkbox not found');
    }

    // 3. UNTERNEHMEN / BUSINESS
    const firmaInput = fieldMap['business'] || fieldMap['unternehmen'] || fieldMap['firma'] ||
                       findInputByPlaceholder('business') || findInputByPlaceholder('unternehmen');
    if (firmaInput && app.company) {
      if (setValue(firmaInput, app.company)) filled++;
    } else {
      console.log('[Lazy Worker] Business/Company field not found');
    }

    // 4. PLZ / ORT - "Postal code / City"
    // City-to-PLZ mapping for common Swiss cities
    const CITY_PLZ = {
      'zürich': '8001', 'basel': '4001', 'bern': '3001', 'genf': '1201', 'geneva': '1201',
      'lausanne': '1003', 'winterthur': '8400', 'luzern': '6003', 'lucerne': '6003',
      'st. gallen': '9000', 'lugano': '6900', 'biel': '2502', 'thun': '3600',
      'köniz': '3098', 'chur': '7000', 'schaffhausen': '8200', 'fribourg': '1700',
      'neuchâtel': '2000', 'uster': '8610', 'sion': '1950', 'zug': '6300',
      'dietikon': '8953', 'baar': '6340', 'wil': '9500', 'dübendorf': '8600',
      'horgen': '8810', 'wädenswil': '8820', 'adliswil': '8134', 'opfikon': '8152',
      'kloten': '8302', 'wetzikon': '8620', 'baden': '5400', 'aarau': '5000',
      'rapperswil': '8640', 'meilen': '8706', 'küsnacht': '8700', 'zollikon': '8702',
      'kilchberg': '8802', 'thalwil': '8800', 'rüschlikon': '8803', 'fully': '1926'
    };

    // Search through all mapped fields for one containing postal/city/plz/ort
    let plzOrtInput = null;
    for (const [label, input] of Object.entries(fieldMap)) {
      if (label.includes('postal') || label.includes('city') || label.includes('plz') || label.includes('ort')) {
        plzOrtInput = input;
        console.log('[Lazy Worker] Found PLZ/City field with label:', label);
        break;
      }
    }
    if (!plzOrtInput) {
      plzOrtInput = findInputByPlaceholder('postal') || findInputByPlaceholder('plz') || findInputByPlaceholder('city') || findInputByPlaceholder('ort');
    }
    if (plzOrtInput) {
      // Resolve PLZ: use captured PLZ, or look up from city name
      const capturedPlz = app.location?.postalCode || app.location?.plz || '';
      const city = (app.location?.city || '').trim();
      const resolvedPlz = capturedPlz || CITY_PLZ[city.toLowerCase()] || '';
      const plzValue = resolvedPlz || city;
      if (plzValue) {
        // This is an Angular autocomplete field — type value, wait for dropdown, click first option
        setValue(plzOrtInput, plzValue);
        console.log('[Lazy Worker] PLZ/Ort typed:', plzValue, '— waiting for autocomplete dropdown...');
        // Wait for Angular to show autocomplete options
        await new Promise(r => setTimeout(r, 800));
        const option = document.querySelector('mat-option, .mat-option, .mat-autocomplete-panel mat-option, [role="option"]');
        if (option) {
          option.click();
          filled++;
          console.log('[Lazy Worker] Clicked autocomplete option:', option.textContent?.trim());
        } else {
          console.log('[Lazy Worker] No autocomplete option appeared, trying longer wait...');
          await new Promise(r => setTimeout(r, 800));
          const retryOption = document.querySelector('mat-option, .mat-option, [role="option"]');
          if (retryOption) {
            retryOption.click();
            filled++;
            console.log('[Lazy Worker] Clicked autocomplete option (retry):', retryOption.textContent?.trim());
          } else {
            console.log('[Lazy Worker] Autocomplete dropdown not found — PLZ needs manual selection');
          }
        }
      }
    } else {
      console.log('[Lazy Worker] PLZ/City field not found. Available fields:', Object.keys(fieldMap));
    }

    // 5. STELLENBEZEICHNUNG / JOB TITLE
    const stelleInput = fieldMap['job title'] || fieldMap['stellenbezeichnung'] || fieldMap['stelle'] ||
                        findInputByPlaceholder('job title') || findInputByPlaceholder('stelle');
    if (stelleInput && app.position) {
      if (setValue(stelleInput, app.position)) filled++;
    } else {
      console.log('[Lazy Worker] Job title field not found');
    }

    // 6. LINK ZUM ONLINE-FORMULAR
    const linkInput = fieldMap['link to online form'] || fieldMap['link zum online-formular'] ||
                      fieldMap['link'] || findInputByPlaceholder('link') || findInputByPlaceholder('online');
    if (linkInput && app.sourceUrl) {
      if (setValue(linkInput, app.sourceUrl)) filled++;
    } else {
      console.log('[Lazy Worker] Link field not found');
    }

    // 7-9. RADIO BUTTONS - RAV Zuweisung, Pensum, Ergebnis
    // Try mat-radio-button first, then regular radio inputs
    const allRadios = document.querySelectorAll('mat-radio-button, input[type="radio"]');
    console.log('[Lazy Worker] Found', allRadios.length, 'radio elements');

    let clickedNein = false, clickedVollzeit = false, clickedOffen = false;

    for (const radio of allRadios) {
      const radioText = radio.textContent?.trim().toLowerCase() || '';
      const labelEl = radio.closest('label') || radio.parentElement;
      const labelText = labelEl?.textContent?.trim().toLowerCase() || '';
      const combinedText = radioText + ' ' + labelText;

      console.log('[Lazy Worker] Radio:', radio.tagName, combinedText.substring(0, 50));

      // RAV Zuweisung - select "No" / "Nein" (but not "Noch offen")
      if (!clickedNein && (combinedText === 'no' || combinedText === 'nein' ||
          (combinedText.includes('no') && !combinedText.includes('noch')) ||
          (combinedText.includes('nein') && !combinedText.includes('noch')))) {
        radio.click();
        filled++;
        clickedNein = true;
        console.log('[Lazy Worker] Clicked No/Nein');
      }

      // Pensum - select "Full-time" / "Vollzeit"
      if (!clickedVollzeit && (combinedText.includes('full-time') || combinedText.includes('full time') ||
          combinedText.includes('vollzeit'))) {
        radio.click();
        filled++;
        clickedVollzeit = true;
        console.log('[Lazy Worker] Clicked Vollzeit');
      }

      // Ergebnis - select "Still open" / "Noch offen"
      if (!clickedOffen && (combinedText.includes('still open') || combinedText.includes('noch offen') ||
          combinedText.includes('pending') || combinedText.includes('ausstehend'))) {
        radio.click();
        filled++;
        clickedOffen = true;
        console.log('[Lazy Worker] Clicked Noch offen');
      }
    }

    if (!clickedNein) console.log('[Lazy Worker] Nein radio not found');
    if (!clickedVollzeit) console.log('[Lazy Worker] Vollzeit radio not found');
    if (!clickedOffen) console.log('[Lazy Worker] Noch offen radio not found');

    // Show result
    console.log('[Lazy Worker] Total fields filled:', filled);
    if (filled > 0) {
      showToast(`✓ ${filled} Felder ausgefüllt!`);
    } else {
      showToast('⚠ Keine Felder gefunden - bitte manuell ausfüllen');
    }
  }

  function showToast(msg) {
    const existing = document.querySelector('.lw-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'lw-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3500);
  }

})();
