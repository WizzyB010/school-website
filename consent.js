/*
  Wonder Heights International School — site-wide privacy notice.
  Blocks submission of any form marked data-requires-consent until the
  visitor has accepted the notice, and gates our own non-essential
  localStorage usage until then too, so nothing is collected before opt-in.
*/
(function () {
  var CONSENT_KEY = 'whis-consent';

  function hasConsent() {
    try { return localStorage.getItem(CONSENT_KEY) === 'accepted'; }
    catch (e) { return false; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); }
    catch (e) { /* storage unavailable — banner will just reappear next visit */ }
  }

  function gateForms(locked) {
    document.querySelectorAll('form[data-requires-consent]').forEach(function (form) {
      form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
        el.disabled = locked;
      });
      var btn = form.querySelector('button');
      if (btn) {
        btn.title = locked
          ? 'Please accept the privacy notice below before submitting your information.'
          : '';
      }
    });
  }

  function buildBanner() {
    if (document.getElementById('whis-consent-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'whis-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Privacy notice');
    banner.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:10000;background:#050f22;color:#e2e8f0;' +
      'padding:1rem 1.5rem;display:flex;gap:1rem;flex-wrap:wrap;align-items:center;' +
      'justify-content:center;font-family:"DM Sans",sans-serif;font-size:.85rem;' +
      'box-shadow:0 -4px 24px rgba(0,0,0,.35);';
    banner.innerHTML =
      '<span style="max-width:640px;line-height:1.5;">' +
        'We only collect the personal information you choose to submit through our forms ' +
        '(e.g. Admissions, Newsletter). We do not use tracking, profiling, or advertising cookies. ' +
        'A small amount of local storage remembers your light/dark display preference only. ' +
        'Read our <a href="' + rootPath('privacy-policy.html') + '" style="color:#f0b429;text-decoration:underline;">Privacy Policy</a> ' +
        'and <a href="' + rootPath('terms-of-service.html') + '" style="color:#f0b429;text-decoration:underline;">Terms of Service</a>.' +
      '</span>' +
      '<button type="button" id="whis-consent-accept" style="background:#f0b429;color:#002855;border:none;' +
      'padding:.6rem 1.4rem;border-radius:50px;font-weight:700;cursor:pointer;font-family:inherit;font-size:.85rem;white-space:nowrap;">' +
        'Accept &amp; Continue' +
      '</button>';
    document.body.appendChild(banner);
    document.getElementById('whis-consent-accept').addEventListener('click', function () {
      setConsent('accepted');
      banner.remove();
      gateForms(false);
    });
  }

  // Pages inside /sites/ need a "../" prefix to reach these root-level pages.
  function rootPath(file) {
    var inSubfolder = /\/sites\//.test(window.location.pathname);
    return (inSubfolder ? '../' : '') + file;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var consented = hasConsent();
    gateForms(!consented);
    if (!consented) buildBanner();
  });
})();
