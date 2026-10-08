/**
 * Wonder Heights gallery API (Google Apps Script web app).
 * Returns every image inside GALLERY_FOLDER_ID (including subfolders) as JSON:
 *   [{ src, caption, folder, date }]
 * gallery.html tags photos using the folder and file names, so name subfolders
 * like "Primary", "JHS", "Graduation 2026", "Field Trip 2026".
 */

// The ID is the last part of the folder's URL: drive.google.com/drive/folders/<THIS_PART>
const GALLERY_FOLDER_ID = 'PASTE_YOUR_FOLDER_ID_HERE';

const CACHE_KEY = 'gallery-v1';
const CACHE_SECONDS = 600;

function doGet(e) {
  const refresh = e && e.parameter && e.parameter.refresh === '1';
  const cache = CacheService.getScriptCache();

  let json = refresh ? null : cache.get(CACHE_KEY);
  if (!json) {
    json = JSON.stringify(listImages_());
    // Script cache values are capped at 100 KB; very large galleries just skip caching.
    if (json.length < 100000) cache.put(CACHE_KEY, json, CACHE_SECONDS);
  }

  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function listImages_() {
  const root = DriveApp.getFolderById(GALLERY_FOLDER_ID);
  const images = [];
  collect_(root, '', images);
  images.sort((a, b) => b.date.localeCompare(a.date));
  return images;
}

function collect_(folder, folderPath, out) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (!file.getMimeType().startsWith('image/')) continue;
    out.push({
      src: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600',
      caption: prettyName_(file.getName()),
      folder: folderPath || 'School Life',
      date: file.getDateCreated().toISOString()
    });
  }

  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    collect_(sub, folderPath ? folderPath + ' / ' + sub.getName() : sub.getName(), out);
  }
}

function prettyName_(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Run this once from the editor to grant Drive permission and preview the output in the log.
function testListImages() {
  const images = listImages_();
  Logger.log(images.length + ' images found');
  Logger.log(JSON.stringify(images.slice(0, 5), null, 2));
}
