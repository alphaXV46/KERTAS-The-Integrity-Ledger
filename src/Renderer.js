// Renderer.js — All DOM manipulation for KERTAS
const TOKEN_KEYS = ['berani','jujur','mandiri','peduli','adil','disiplin','kerjaKeras','tanggungjawab','sederhana'];
const TOKEN_ICONS = {
  berani: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7z"/></svg>`,
  jujur: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  mandiri: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M8 20v-2a4 4 0 0 1 8 0v2"/></svg>`,
  peduli: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  adil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  disiplin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  kerjaKeras: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  tanggungjawab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  sederhana: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`
};

export class Renderer {
  constructor(i18n, audio) {
    this.i18n = i18n;
    this.audio = audio;
    this._screens = {};
    ['menu','save-slots','case-select','game','win','lose','credits'].forEach(id => {
      this._screens[id] = document.getElementById('screen-' + id);
    });
  }

  // ─── Screen transitions ───────────────────────────────────────────────
  showScreen(id) {
    Object.values(this._screens).forEach(s => s?.classList.remove('active'));
    const target = this._screens[id];
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }
  }

  // ─── Notification toast ───────────────────────────────────────────────
  showToast(msgKey, type = 'info') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast toast-${type}`;
    toast.textContent = this.i18n.t(msgKey);
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  showRawToast(msg, type = 'info') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  // ─── Confirm dialog ───────────────────────────────────────────────────
  showConfirm(msgKey, onYes) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true">
        <p>${this.i18n.t(msgKey)}</p>
        <div class="confirm-actions">
          <button class="btn btn-danger" id="confirm-yes">${this.i18n.t('confirm.yes')}</button>
          <button class="btn btn-ghost" id="confirm-no">${this.i18n.t('confirm.no')}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); onYes(); };
    overlay.querySelector('#confirm-no').onclick = () => overlay.remove();
  }

  // ─── Language toggle button ───────────────────────────────────────────
  updateLangButton() {
    const label = document.getElementById('lang-label');
    if (label) label.textContent = this.i18n.t('langToggle');
  }

  // ─── Menu screen ──────────────────────────────────────────────────────
  renderMenu(hasSave) {
    const btn = document.getElementById('btn-continue');
    if (btn) btn.disabled = !hasSave;
  }

  // ─── Save slots screen ────────────────────────────────────────────────
  renderSaveSlots(slots, mode, onSelect, onDelete) {
    const grid = document.getElementById('save-slots-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const title = document.getElementById('save-slots-title');
    if (title) title.textContent = this.i18n.t('saves.title');

    slots.forEach(({ index, save }) => {
      const card = document.createElement('div');
      card.className = `save-slot-card ${save ? 'has-data' : 'empty'}`;
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.setAttribute('aria-label', `${this.i18n.t('saves.slot')} ${index + 1}`);

      if (save) {
        const d = save.data;
        const caseId = d.currentCaseId ?? '—';
        const dateStr = new Date(save.savedAt).toLocaleDateString(
          this.i18n.lang === 'id' ? 'id-ID' : 'en-US',
          { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }
        );
        card.innerHTML = `
          <div class="slot-num">${this.i18n.t('saves.slot')} ${index + 1}</div>
          <div class="slot-case">${caseId.replace(/_/g,' ').toUpperCase()}</div>
          <div class="slot-meta">${this.i18n.t('saves.lastPlayed')}: ${dateStr}</div>
          <div class="slot-integrity">
            <span class="slot-int-bar-wrap"><span class="slot-int-bar" style="width:${d.integrity ?? 0}%"></span></span>
            <span>${d.integrity ?? 0}</span>
          </div>
          <button class="btn btn-danger-sm slot-delete" aria-label="Delete slot ${index+1}">✕</button>
        `;
        card.querySelector('.slot-delete').addEventListener('click', e => {
          e.stopPropagation();
          this.showConfirm('saves.deleteConfirm', () => onDelete(index));
        });
      } else {
        card.innerHTML = `
          <div class="slot-num">${this.i18n.t('saves.slot')} ${index + 1}</div>
          <div class="slot-empty-label">${this.i18n.t('saves.empty')}</div>
          <div class="slot-new-icon">＋</div>
        `;
      }

      card.addEventListener('click', () => onSelect(index, save));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') onSelect(index, save); });
      grid.appendChild(card);
    });
  }

  // ─── Case select screen ───────────────────────────────────────────────
  renderCaseSelect(cases, loader, completedIds, onPlay) {
    const grid = document.getElementById('cases-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const diffLabels = this.i18n.t('cases.diffLabels');

    cases.forEach((caseData, idx) => {
      const unlocked = loader.isUnlocked(caseData, completedIds);
      const completed = completedIds.includes(caseData.id);
      const title = loader.getTitleForLang(caseData, this.i18n.lang);
      const diff = Array.isArray(diffLabels) ? diffLabels[caseData.difficulty] : ['Pemula','Menengah','Ahli'][caseData.difficulty];

      const card = document.createElement('div');
      card.className = `case-card ${unlocked ? '' : 'locked'} ${completed ? 'completed' : ''}`;
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', title);

      const stars = ['★','★★','★★★'][caseData.difficulty] || '★';
      card.innerHTML = `
        <div class="case-card-top">
          <span class="case-num">KASUS ${String(idx).padStart(2,'0')}</span>
          <span class="case-stars" aria-label="${diff}">${stars}</span>
        </div>
        <h3 class="case-title">${unlocked ? title : this.i18n.t('cases.locked')}</h3>
        <div class="case-diff">${this.i18n.t('cases.difficulty')}: ${diff}</div>
        <div class="case-objectives-count">${caseData.objectives.length} ${this.i18n.lang === 'id' ? 'Tujuan' : 'Objectives'}</div>
        ${completed ? `<div class="case-completed-badge">${this.i18n.t('cases.completed')}</div>` : ''}
        <button class="btn ${unlocked ? 'btn-primary' : 'btn-ghost'} case-play-btn" ${unlocked ? '' : 'disabled'} aria-label="Play ${title}">
          ${unlocked ? this.i18n.t('cases.play') : this.i18n.t('cases.locked')}
        </button>
      `;
      if (unlocked) {
        card.querySelector('.case-play-btn').addEventListener('click', () => onPlay(caseData));
      }
      grid.appendChild(card);
    });
  }

  // ─── Game screen ──────────────────────────────────────────────────────
  initGameScreen(caseData, state) {
    // Header
    const titleEl = document.getElementById('game-case-title');
    if (titleEl) titleEl.textContent = this.i18n.lang === 'en' ? caseData.titleEn : caseData.titleId;
    const turnMax = document.getElementById('turn-max');
    if (turnMax) turnMax.textContent = caseData.passageSequence.length;

    // Case background doc
    const docId = document.getElementById('doc-case-id');
    if (docId) docId.textContent = caseData.id.replace(/_/g,' ').toUpperCase();
    const docBody = document.getElementById('doc-case-body');
    if (docBody) docBody.textContent = this.i18n.lang === 'en' ? caseData.backgroundEn : caseData.backgroundId;

    // Build objectives
    this._renderObjectives(caseData.objectives, []);

    // Build token grid
    this._renderTokenGrid(state.tokens);

    // Reset audit log
    const logList = document.getElementById('audit-log-list');
    if (logList) logList.innerHTML = '';

    this.updateGameState(state, caseData);
  }

  updateGameState(state, caseData) {
    this._updateIntegrity(state.integrity);
    this._updatePressure(state.corruptionPressure);
    this._updateTokens(state.tokens);
    this._updateObjectives(state.objectivesComplete);
    const counter = document.getElementById('turn-counter');
    if (counter) counter.textContent = state.turnCount + 1;
  }

  _updateIntegrity(value) {
    const fill = document.getElementById('integrity-bar-fill');
    const val = document.getElementById('integrity-value');
    const track = document.getElementById('integrity-bar-track');
    if (!fill || !val || !track) return;

    const clamped = Math.max(0, Math.min(100, value));
    fill.style.width = clamped + '%';
    val.textContent = clamped;

    // Color
    fill.className = 'integrity-bar-fill';
    track.className = 'integrity-bar-track';
    if (clamped <= 29) { fill.classList.add('danger'); track.classList.add('danger'); }
    else if (clamped <= 49) { fill.classList.add('warn'); track.classList.add('warn'); }

    track.setAttribute('aria-valuenow', clamped);
  }

  _updatePressure(value) {
    const fill = document.getElementById('pressure-bar-fill');
    const val = document.getElementById('pressure-value');
    if (!fill || !val) return;
    const clamped = Math.max(0, Math.min(100, value));
    fill.style.width = clamped + '%';
    val.textContent = clamped;
    fill.className = 'pressure-bar-fill';
    if (clamped >= 70) fill.classList.add('critical');
    else if (clamped >= 40) fill.classList.add('elevated');
  }

  _renderTokenGrid(tokens) {
    const grid = document.getElementById('tokens-grid');
    if (!grid) return;
    grid.innerHTML = '';
    TOKEN_KEYS.forEach(key => {
      const badge = document.createElement('div');
      badge.className = 'token-badge';
      badge.id = `token-${key}`;
      badge.setAttribute('role', 'listitem');
      badge.setAttribute('aria-label', `${this.i18n.t('tokens.' + key)}: ${tokens[key]}`);
      badge.innerHTML = `
        <div class="token-icon">${TOKEN_ICONS[key]}</div>
        <div class="token-name">${this.i18n.t('tokens.' + key)}</div>
        <div class="token-value" id="token-val-${key}">${tokens[key]}</div>
      `;
      badge.title = this.i18n.t(`tokens.${key}.desc`);
      grid.appendChild(badge);
    });
  }

  _updateTokens(tokens) {
    TOKEN_KEYS.forEach(key => {
      const badge = document.getElementById(`token-${key}`);
      const valEl = document.getElementById(`token-val-${key}`);
      if (!badge || !valEl) return;
      const v = tokens[key];
      valEl.textContent = v;
      badge.className = 'token-badge';
      badge.setAttribute('aria-label', `${this.i18n.t('tokens.' + key)}: ${v}`);
      if (v <= 0) badge.classList.add('depleted');
      else if (v <= 2) badge.classList.add('low');
    });
  }

  _renderObjectives(objectives, completedIds) {
    const list = document.getElementById('objectives-list');
    if (!list) return;
    list.innerHTML = '';
    objectives.forEach(obj => {
      const li = document.createElement('li');
      li.className = 'objective-item';
      li.id = `obj-${obj.id}`;
      const text = this.i18n.lang === 'en' ? obj.textEn : obj.textId;
      li.innerHTML = `<span class="obj-check">○</span><span class="obj-text">${text}</span>`;
      li.setAttribute('role', 'listitem');
      list.appendChild(li);
    });
  }

  _updateObjectives(completedIds) {
    document.querySelectorAll('.objective-item').forEach(li => {
      const id = li.id.replace('obj-', '');
      const done = completedIds.includes(id);
      li.className = `objective-item ${done ? 'done' : ''}`;
      li.querySelector('.obj-check').textContent = done ? '✓' : '○';
    });
  }

  renderRiskNode(node, state) {
    const area = document.getElementById('risk-node-area');
    const card = document.getElementById('risk-node-card');
    const complete = document.getElementById('case-complete-msg');
    if (!area || !card) return;

    if (!node) {
      area.style.display = 'none';
      if (complete) complete.style.display = 'flex';
      return;
    }

    area.style.display = 'block';
    if (complete) complete.style.display = 'none';
    card.classList.add('slide-in');
    setTimeout(() => card.classList.remove('slide-in'), 400);

    const desc = document.getElementById('risk-node-desc');
    const nodeNum = document.getElementById('risk-node-num');
    const seq = state.currentCase?.passageSequence ?? [];
    if (desc) desc.textContent = this.i18n.lang === 'en' ? node.descEn : node.descId;
    if (nodeNum) nodeNum.textContent = `${state.currentNodeIndex + 1}/${seq.length}`;

    this._renderOptions(node.options, state);
  }

  _renderOptions(options, state) {
    const container = document.getElementById('risk-options');
    if (!container) return;
    container.innerHTML = `<div class="options-label">${this.i18n.t('game.chooseAction')}</div>`;

    options.forEach(opt => {
      const cost = opt.cost || {};
      const fx = opt.effects || {};
      const canAfford = Object.entries(cost).every(([k, v]) => (state.tokens[k] ?? 0) >= v);

      const btn = document.createElement('button');
      btn.className = `option-btn ${opt.isGoodChoice ? 'good' : 'risky'} ${!canAfford ? 'unaffordable' : ''}`;
      btn.id = `opt-${opt.id}`;
      btn.disabled = !canAfford;
      btn.setAttribute('aria-label', this.i18n.lang === 'en' ? opt.textEn : opt.textId);

      // Build cost tags
      const costTags = Object.entries(cost).map(([k, v]) =>
        `<span class="cost-tag" title="${this.i18n.t('tokens.' + k)}">${this.i18n.t('tokens.' + k).charAt(0).toUpperCase()}${v > 1 ? '×'+v : ''}</span>`
      ).join('');

      // Build effect indicators
      const intStr = fx.integrity > 0 ? `<span class="fx-good">+${fx.integrity} INT</span>` :
                     fx.integrity < 0 ? `<span class="fx-bad">${fx.integrity} INT</span>` : '';
      const presStr = fx.corruptionPressure < 0 ? `<span class="fx-good">${fx.corruptionPressure} KOR</span>` :
                      fx.corruptionPressure > 0 ? `<span class="fx-bad">+${fx.corruptionPressure} KOR</span>` : '';

      const optText = this.i18n.lang === 'en' ? opt.textEn : opt.textId;
      btn.innerHTML = `
        <div class="opt-text">${optText}</div>
        <div class="opt-meta">
          ${costTags ? `<div class="opt-costs">${costTags}</div>` : ''}
          <div class="opt-effects">${intStr}${presStr}</div>
        </div>
        ${!canAfford ? `<div class="opt-insufficient">${this.i18n.t('game.insufficient')}</div>` : ''}
      `;
      btn.dataset.optId = opt.id;
      container.appendChild(btn);
    });
  }

  addAuditLogEntry(entry, isGood) {
    const list = document.getElementById('audit-log-list');
    if (!list) return;
    const li = document.createElement('li');
    li.className = `audit-entry ${isGood ? 'audit-good' : 'audit-bad'}`;
    li.innerHTML = `<span class="audit-dot">${isGood ? '●' : '○'}</span><span>${entry}</span>`;
    list.prepend(li); // newest first
    // keep max 10 visible
    while (list.children.length > 10) list.removeChild(list.lastChild);
    li.classList.add('audit-new');
    setTimeout(() => li.classList.remove('audit-new'), 500);
  }

  flashIntegrityChange(delta) {
    const val = document.getElementById('integrity-value');
    if (!val) return;
    const flash = document.createElement('span');
    flash.className = `int-flash ${delta > 0 ? 'positive' : 'negative'}`;
    flash.textContent = (delta > 0 ? '+' : '') + delta;
    val.parentElement.appendChild(flash);
    setTimeout(() => flash.remove(), 1000);
  }

  pulseToken(key) {
    const badge = document.getElementById(`token-${key}`);
    if (!badge) return;
    badge.classList.add('pulse');
    setTimeout(() => badge.classList.remove('pulse'), 600);
  }

  // ─── Win screen ───────────────────────────────────────────────────────
  renderWin(scoreBreakdown, caseData, i18n) {
    const s = scoreBreakdown;
    const t = k => i18n.t(k);
    const title = i18n.lang === 'en' ? caseData.titleEn : caseData.titleId;

    document.getElementById('win-case-title').textContent = title;
    document.getElementById('win-score-total').textContent = s.total;
    document.getElementById('win-score-base').textContent = s.base;
    document.getElementById('win-score-token').textContent = '+' + s.tokenBonus;
    document.getElementById('win-score-integrity').textContent = '+' + s.integrityBonus;
    document.getElementById('win-score-efficiency').textContent = '+' + s.efficiencyBonus;

    // Trigger particle burst
    this._particleBurst(document.getElementById('screen-win'));
  }

  _particleBurst(container) {
    if (!container) return;
    const colors = ['#FFD700','#FFC107','#FFFFFF','#1E88E5','#42A5F5'];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-duration:${0.8 + Math.random()*1.2}s;
        animation-delay:${Math.random()*0.5}s;
        width:${4 + Math.random()*8}px;
        height:${4 + Math.random()*8}px;
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 2500);
    }
  }

  // ─── Lose screen ──────────────────────────────────────────────────────
  renderLose(state, i18n) {
    const reasonEl = document.getElementById('lose-reason');
    if (!reasonEl) return;
    if (state.loseReason === 'integrity') {
      reasonEl.textContent = i18n.t('lose.integrityDepleted');
    } else if (state.loseReason) {
      reasonEl.textContent = `${i18n.t('lose.tokenDepleted')} ${i18n.t('tokens.' + state.loseReason)}`;
    }
    document.getElementById('lose-case-title').textContent =
      i18n.lang === 'en' ? state.currentCase?.titleEn : state.currentCase?.titleId;
  }

  // ─── Credits screen ───────────────────────────────────────────────────
  renderCredits() {
    // Static content, already in HTML
  }
}
