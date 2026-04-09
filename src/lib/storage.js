/**
 * Storage wrapper for Chrome extension local storage
 * Handles all CRUD operations for job applications
 */

const DEFAULT_SETTINGS = {
  defaultCountry: 'Schweiz',
  autoCapture: true,
  enabledSites: ['jobs.ch', 'linkedin', 'indeed', 'jobup.ch']
};

const DEFAULT_STATS = {
  totalCaptured: 0,
  totalSubmitted: 0,
  currentMonth: new Date().toISOString().slice(0, 7),
  monthlyCount: 0
};

/**
 * Generate a UUID v4
 * @returns {string}
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get all applications from storage
 * @returns {Promise<import('./types.js').JobApplication[]>}
 */
export async function getApplications() {
  const result = await chrome.storage.local.get('applications');
  return result.applications || [];
}

/**
 * Get a single application by ID
 * @param {string} id
 * @returns {Promise<import('./types.js').JobApplication | null>}
 */
export async function getApplication(id) {
  const applications = await getApplications();
  return applications.find(app => app.id === id) || null;
}

/**
 * Save a new application
 * @param {Omit<import('./types.js').JobApplication, 'id' | 'capturedAt'>} applicationData
 * @returns {Promise<import('./types.js').JobApplication>}
 */
export async function saveApplication(applicationData) {
  const applications = await getApplications();

  const newApplication = {
    ...applicationData,
    id: generateId(),
    capturedAt: new Date().toISOString(),
    company: (applicationData.company || '').substring(0, 100),
    position: (applicationData.position || '').substring(0, 100),
    submittedToRav: false
  };

  applications.push(newApplication);
  await chrome.storage.local.set({ applications });

  // Update stats
  await incrementStats('totalCaptured');

  return newApplication;
}

/**
 * Update an existing application
 * @param {string} id
 * @param {Partial<import('./types.js').JobApplication>} updates
 * @returns {Promise<import('./types.js').JobApplication | null>}
 */
export async function updateApplication(id, updates) {
  const applications = await getApplications();
  const index = applications.findIndex(app => app.id === id);

  if (index === -1) {
    return null;
  }

  // Ensure character limits
  if (updates.company) {
    updates.company = updates.company.substring(0, 100);
  }
  if (updates.position) {
    updates.position = updates.position.substring(0, 100);
  }

  applications[index] = { ...applications[index], ...updates };
  await chrome.storage.local.set({ applications });

  return applications[index];
}

/**
 * Delete an application
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteApplication(id) {
  const applications = await getApplications();
  const filtered = applications.filter(app => app.id !== id);

  if (filtered.length === applications.length) {
    return false;
  }

  await chrome.storage.local.set({ applications: filtered });
  return true;
}

/**
 * Mark an application as submitted to RAV
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function markAsSubmitted(id) {
  const result = await updateApplication(id, { submittedToRav: true });
  if (result) {
    await incrementStats('totalSubmitted');
  }
  return !!result;
}

/**
 * Get pending (not yet submitted) applications
 * @returns {Promise<import('./types.js').JobApplication[]>}
 */
export async function getPendingApplications() {
  const applications = await getApplications();
  return applications.filter(app => !app.submittedToRav);
}

/**
 * Get applications for the current month
 * @returns {Promise<import('./types.js').JobApplication[]>}
 */
export async function getCurrentMonthApplications() {
  const applications = await getApplications();
  const currentMonth = new Date().toISOString().slice(0, 7);
  return applications.filter(app => app.appliedAt.startsWith(currentMonth));
}

/**
 * Get user settings
 * @returns {Promise<import('./types.js').UserSettings>}
 */
export async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

/**
 * Update user settings
 * @param {Partial<import('./types.js').UserSettings>} updates
 * @returns {Promise<import('./types.js').UserSettings>}
 */
export async function updateSettings(updates) {
  const settings = await getSettings();
  const newSettings = { ...settings, ...updates };
  await chrome.storage.local.set({ settings: newSettings });
  return newSettings;
}

/**
 * Get statistics
 * @returns {Promise<import('./types.js').Stats>}
 */
export async function getStats() {
  const result = await chrome.storage.local.get('stats');
  const stats = { ...DEFAULT_STATS, ...result.stats };

  // Reset monthly count if month changed
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (stats.currentMonth !== currentMonth) {
    stats.currentMonth = currentMonth;
    stats.monthlyCount = 0;
    await chrome.storage.local.set({ stats });
  }

  return stats;
}

/**
 * Increment a stat counter
 * @param {'totalCaptured' | 'totalSubmitted' | 'monthlyCount'} key
 * @returns {Promise<void>}
 */
async function incrementStats(key) {
  const stats = await getStats();
  stats[key] = (stats[key] || 0) + 1;

  if (key === 'totalCaptured') {
    stats.monthlyCount = (stats.monthlyCount || 0) + 1;
  }

  await chrome.storage.local.set({ stats });
}

/**
 * Export all applications as JSON
 * @returns {Promise<string>}
 */
export async function exportApplications() {
  const applications = await getApplications();
  return JSON.stringify(applications, null, 2);
}

/**
 * Export applications as CSV
 * @returns {Promise<string>}
 */
export async function exportAsCSV() {
  const applications = await getApplications();

  const headers = [
    'Datum',
    'Unternehmen',
    'Stelle',
    'PLZ',
    'Ort',
    'Land',
    'Bewerbungsart',
    'Arbeitspensum',
    'RAV Zuweisung',
    'Ergebnis',
    'URL',
    'An RAV übermittelt'
  ];

  const rows = applications.map(app => [
    app.appliedAt,
    app.company,
    app.position,
    app.location?.postalCode || '',
    app.location?.city || '',
    app.location?.country || 'Schweiz',
    app.method,
    app.workload,
    app.ravAssignment ? 'Ja' : 'Nein',
    app.result,
    app.sourceUrl,
    app.submittedToRav ? 'Ja' : 'Nein'
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  return csvContent;
}

/**
 * Clear all data (for testing/reset)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await chrome.storage.local.clear();
}
