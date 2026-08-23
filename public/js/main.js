/* main.js – shared nav, footer, language toggle */

let currentLang = localStorage.getItem('tvk-lang') || 'en';

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  const btn = document.getElementById('langToggle');
  if (btn) btn.textContent = currentLang === 'en' ? 'தமிழ்' : 'English';
}

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ta' : 'en';
  localStorage.setItem('tvk-lang', currentLang);
  applyTranslations();
}

function injectNavbar() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const links = [
    { key: 'nav_home',      href: 'index.html' },
    { key: 'nav_report',    href: 'report.html' },
    { key: 'nav_track',     href: 'track.html' },
    { key: 'nav_dashboard', href: 'dashboard.html' },
    { key: 'nav_about',     href: 'about.html' },
    { key: 'nav_contact',   href: 'contact.html' },
  ];
  const navHtml = `
  <nav class="navbar" id="mainNav">
    <div class="navbar-brand">
      <img src="assets/tvk-logo.svg" alt="TVK Logo" class="navbar-logo">
      <div class="navbar-title">
        <span>TVK</span>
        <span class="tamil">தமிழக வெற்றிக் கழகம்</span>
      </div>
    </div>
    <ul class="nav-links">
      ${links.map(l => `<li><a href="${l.href}" data-i18n="${l.key}" class="${page===l.href?'active':''}">${t(l.key)}</a></li>`).join('')}
      <li><button class="lang-toggle" id="langToggle" onclick="toggleLang()">${currentLang==='en'?'தமிழ்':'English'}</button></li>
    </ul>
    <button class="hamburger" onclick="toggleMenu()" aria-label="Menu">☰</button>
  </nav>
  <div class="mobile-menu" id="mobileMenu">
    ${links.map(l => `<a href="${l.href}" data-i18n="${l.key}">${t(l.key)}</a>`).join('')}
    <button class="lang-toggle" style="margin:10px 0;width:fit-content" onclick="toggleLang()">${currentLang==='en'?'தமிழ்':'English'}</button>
  </div>`;
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.outerHTML = navHtml;
}

function injectFooter() {
  const footerHtml = `
  <footer>
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="assets/tvk-logo.svg" alt="TVK">
        <h3>TVK Complaint Box</h3>
        <p class="tamil" data-i18n="footer_tagline">${t('footer_tagline')}</p>
        <p style="margin-top:6px;font-size:11px;color:rgba(255,215,100,0.6)">R.K. Nagar Thoguthi</p>
      </div>
      <div class="footer-links">
        <h4>Quick Links</h4>
        <a href="index.html"     data-i18n="nav_home">${t('nav_home')}</a>
        <a href="report.html"    data-i18n="nav_report">${t('nav_report')}</a>
        <a href="track.html"     data-i18n="nav_track">${t('nav_track')}</a>
        <a href="dashboard.html" data-i18n="nav_dashboard">${t('nav_dashboard')}</a>
      </div>
      <div class="footer-links">
        <h4>Information</h4>
        <a href="about.html"   data-i18n="nav_about">${t('nav_about')}</a>
        <a href="contact.html" data-i18n="nav_contact">${t('nav_contact')}</a>
        <a href="#"            data-i18n="footer_privacy">${t('footer_privacy')}</a>
        <a href="#"            data-i18n="footer_terms">${t('footer_terms')}</a>
        <a href="#"            data-i18n="footer_guidelines">${t('footer_guidelines')}</a>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} TVK Complaint Box – R.K. Nagar Thoguthi. Tamilaga Vettri Kazhagam.
    </div>
  </footer>`;
  const placeholder = document.getElementById('footer-placeholder');
  if (placeholder) placeholder.outerHTML = footerHtml;
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
  injectNavbar();
  injectFooter();
  applyTranslations();
});
