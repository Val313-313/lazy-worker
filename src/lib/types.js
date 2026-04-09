/**
 * @typedef {Object} JobLocation
 * @property {string} [street] - Street name
 * @property {string} [number] - Street number
 * @property {string} [postalCode] - PLZ
 * @property {string} [city] - Ort
 * @property {string} country - Country (default: "Schweiz")
 */

/**
 * @typedef {'elektronisch' | 'brieflich' | 'persoenlich' | 'telefonisch'} ApplicationMethod
 */

/**
 * @typedef {'vollzeit' | 'teilzeit'} WorkloadType
 */

/**
 * @typedef {'offen' | 'vorstellungsgespraech' | 'anstellung' | 'absage'} ApplicationResult
 */

/**
 * @typedef {Object} JobApplication
 * @property {string} id - UUID
 * @property {string} capturedAt - ISO timestamp when captured
 * @property {string} appliedAt - Date of application (YYYY-MM-DD)
 * @property {string} company - Company name (max 100 chars)
 * @property {string} position - Job title (max 100 chars)
 * @property {JobLocation} location - Location details
 * @property {ApplicationMethod} method - How the application was submitted
 * @property {WorkloadType} workload - Full-time or part-time
 * @property {boolean} ravAssignment - RAV Zuweisung (Ja/Nein)
 * @property {ApplicationResult} result - Current status
 * @property {string} sourceUrl - Original job posting URL
 * @property {string} sourceSite - Source site (jobs.ch, linkedin, etc.)
 * @property {boolean} submittedToRav - Whether already submitted to RAV
 * @property {string} [notes] - Optional user notes
 */

/**
 * @typedef {Object} UserSettings
 * @property {string} defaultCountry - Default country for applications
 * @property {boolean} autoCapture - Auto-save on apply click
 * @property {string[]} enabledSites - Which job boards to monitor
 */

/**
 * @typedef {Object} Stats
 * @property {number} totalCaptured - Total applications captured
 * @property {number} totalSubmitted - Total submitted to RAV
 * @property {string} currentMonth - Current month (YYYY-MM)
 * @property {number} monthlyCount - Applications this month
 */

/**
 * @typedef {Object} StorageSchema
 * @property {JobApplication[]} applications - All saved applications
 * @property {UserSettings} settings - User preferences
 * @property {Stats} stats - Usage statistics
 */

// Export empty object for module compatibility
export {};
