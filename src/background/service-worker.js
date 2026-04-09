/**
 * Lazy Worker - Background Service Worker
 * Handles messaging between content scripts and popup
 */

// Default settings
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
 * Generate UUID v4
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Lazy Worker] Extension installed:', details.reason);

  // Initialize storage with defaults if needed
  const result = await chrome.storage.local.get(['applications', 'settings', 'stats']);

  if (!result.applications) {
    await chrome.storage.local.set({ applications: [] });
  }

  if (!result.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  if (!result.stats) {
    await chrome.storage.local.set({ stats: DEFAULT_STATS });
  }

  console.log('[Lazy Worker] Storage initialized');
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Lazy Worker] Message received:', request.action);

  // Handle async operations
  (async () => {
    try {
      switch (request.action) {
        case 'saveApplication':
          const saved = await saveApplication(request.data);
          sendResponse({ success: true, application: saved });
          break;

        case 'getApplications':
          const apps = await getApplications();
          sendResponse({ success: true, applications: apps });
          break;

        case 'getPendingApplications':
          const pending = await getPendingApplications();
          sendResponse({ success: true, applications: pending });
          break;

        case 'updateApplication':
          const updated = await updateApplication(request.id, request.data);
          sendResponse({ success: true, application: updated });
          break;

        case 'deleteApplication':
          await deleteApplication(request.id);
          sendResponse({ success: true });
          break;

        case 'markAsSubmitted':
          await markAsSubmitted(request.id);
          sendResponse({ success: true });
          break;

        case 'getStats':
          const stats = await getStats();
          sendResponse({ success: true, stats });
          break;

        case 'getSettings':
          const settings = await getSettings();
          sendResponse({ success: true, settings });
          break;

        case 'updateSettings':
          const newSettings = await updateSettings(request.data);
          sendResponse({ success: true, settings: newSettings });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('[Lazy Worker] Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

/**
 * Save a new application
 */
async function saveApplication(applicationData) {
  const result = await chrome.storage.local.get('applications');
  const applications = result.applications || [];

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

  console.log('[Lazy Worker] Application saved:', newApplication.id);
  return newApplication;
}

/**
 * Get all applications
 */
async function getApplications() {
  const result = await chrome.storage.local.get('applications');
  return result.applications || [];
}

/**
 * Get pending (not submitted) applications
 */
async function getPendingApplications() {
  const applications = await getApplications();
  return applications.filter(app => !app.submittedToRav);
}

/**
 * Update an application
 */
async function updateApplication(id, updates) {
  const result = await chrome.storage.local.get('applications');
  const applications = result.applications || [];

  const index = applications.findIndex(app => app.id === id);
  if (index === -1) {
    throw new Error('Application not found');
  }

  // Enforce character limits
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
 */
async function deleteApplication(id) {
  const result = await chrome.storage.local.get('applications');
  const applications = result.applications || [];

  const filtered = applications.filter(app => app.id !== id);
  await chrome.storage.local.set({ applications: filtered });
}

/**
 * Mark application as submitted to RAV
 */
async function markAsSubmitted(id) {
  await updateApplication(id, { submittedToRav: true });
  await incrementStats('totalSubmitted');
}

/**
 * Get statistics
 */
async function getStats() {
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
 * Increment a stats counter
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
 * Get settings
 */
async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...result.settings };
}

/**
 * Update settings
 */
async function updateSettings(updates) {
  const settings = await getSettings();
  const newSettings = { ...settings, ...updates };
  await chrome.storage.local.set({ settings: newSettings });
  return newSettings;
}

/**
 * Handle extension icon click (optional - opens popup by default)
 */
chrome.action.onClicked.addListener((tab) => {
  // Popup handles this, but we could add badge updates here
});

/**
 * Update badge with pending count
 */
async function updateBadge() {
  try {
    const pending = await getPendingApplications();
    const count = pending.length;

    if (count > 0) {
      await chrome.action.setBadgeText({ text: count.toString() });
      await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('[Lazy Worker] Error updating badge:', error);
  }
}

// Update badge periodically
setInterval(updateBadge, 30000);

// Update badge on storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.applications) {
    updateBadge();
  }
});

// Initial badge update
updateBadge();

console.log('[Lazy Worker] Service worker started');
