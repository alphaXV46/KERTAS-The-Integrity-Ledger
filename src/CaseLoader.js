// CaseLoader.js — Loads and validates case JSON files
const CASE_FILES = [
  'data/cases/case_00_tutorial.json',
  'data/cases/case_01_jalan_desa.json',
  'data/cases/case_02_dana_sekolah.json'
];

export class CaseLoader {
  constructor() {
    this._cases = [];
    this._loaded = false;
  }

  async loadAll() {
    const results = await Promise.all(CASE_FILES.map(f => fetch(f).then(r => r.json())));
    this._cases = results;
    this._loaded = true;
    return this._cases;
  }

  getCase(id) {
    return this._cases.find(c => c.id === id) ?? null;
  }

  getAll() {
    return this._cases;
  }

  getCaseByIndex(i) {
    return this._cases[i] ?? null;
  }

  isUnlocked(caseData, completedCaseIds = []) {
    if (caseData.unlockedByDefault) return true;
    // Each case unlocks when the previous one is completed
    const idx = this._cases.indexOf(caseData);
    if (idx <= 0) return true;
    return completedCaseIds.includes(this._cases[idx - 1].id);
  }

  getTitleForLang(caseData, lang) {
    return lang === 'en' ? caseData.titleEn : caseData.titleId;
  }

  getBackgroundForLang(caseData, lang) {
    return lang === 'en' ? caseData.backgroundEn : caseData.backgroundId;
  }
}
