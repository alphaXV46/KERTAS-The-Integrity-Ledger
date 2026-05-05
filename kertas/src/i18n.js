// i18n.js — Internationalization module
export class I18n {
  constructor() {
    this._lang = 'id';
    this._strings = {};
  }

  async load(lang) {
    const res = await fetch(`data/strings/${lang}.json`);
    this._strings = await res.json();
    this._lang = lang;
    document.documentElement.setAttribute('lang', lang);
    this._applyAll();
  }

  t(key) {
    return this._strings[key] ?? key;
  }

  get lang() { return this._lang; }

  toggle() {
    return this.load(this._lang === 'id' ? 'en' : 'id');
  }

  _applyAll() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = this.t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
    });
    // Update lang toggle button label
    const langLabel = document.getElementById('lang-label');
    if (langLabel) langLabel.textContent = this.t('langToggle');
  }
}
