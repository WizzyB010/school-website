/**
 * Server-side protection for the enrollment + newsletter form script.
 * Paste this whole file into the SAME Apps Script project that receives the forms
 * (as a new file, e.g. "form-guard.gs"), then use it at the top of doPost — see below.
 *
 *   function doPost(e) {
 *     const blocked = blockSpam_(e);
 *     if (blocked) return blocked;
 *     const p = cleanParams_(e.parameter);   // use p.fieldName instead of e.parameter.fieldName
 *     ... your existing code that writes to the sheet / sends email ...
 *   }
 */

const MAX_FIELD_LENGTH = 2000;
const MAX_SUBMISSIONS_PER_10_MIN = 30;

// Returns a response to send back if the request should be dropped, or null if it's fine.
function blockSpam_(e) {
  const params = (e && e.parameter) || {};

  // Hidden "website" field: real visitors never fill it in, bots do.
  if (String(params.website || '').trim() !== '') return fakeSuccess_();

  for (const key in params) {
    if (String(params[key]).length > MAX_FIELD_LENGTH) return fakeSuccess_();
  }

  // Apps Script can't see visitor IPs, so cap total submissions to stop floods.
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('submit-count') || 0);
  if (count >= MAX_SUBMISSIONS_PER_10_MIN) return fakeSuccess_();
  cache.put('submit-count', String(count + 1), 600);

  // Ignore the exact same email being submitted again within a minute.
  const email = String(params.email || params.newsletter_email || '').trim().toLowerCase();
  if (email) {
    const key = 'recent-' + Utilities.base64EncodeWebSafe(email).slice(0, 200);
    if (cache.get(key)) return fakeSuccess_();
    cache.put(key, '1', 60);
  }

  return null;
}

// Stops spreadsheet "formula injection": a value like =IMPORTXML(...) would otherwise run as a formula in the sheet.
function cleanParams_(params) {
  const clean = {};
  for (const key in params) {
    if (key === 'website') continue;
    let value = String(params[key]).trim().slice(0, MAX_FIELD_LENGTH);
    if (/^[=+\-@\t\r]/.test(value)) value = "'" + value;
    clean[key] = value;
  }
  return clean;
}

// Bots get the same "ok" as real users so they can't tell they were blocked.
function fakeSuccess_() {
  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
