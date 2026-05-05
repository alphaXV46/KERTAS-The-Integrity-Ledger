// StateMachine.js — MENU → CASE_SELECT → PLAYING → WIN/LOSE
import { ScoreCalculator } from './ScoreCalculator.js';

export class StateMachine {
  constructor({ renderer, gameState, caseLoader, storage, audio, i18n }) {
    this.r = renderer;
    this.gs = gameState;
    this.cl = caseLoader;
    this.store = storage;
    this.audio = audio;
    this.i18n = i18n;
    this._state = 'MENU';
    this._activeSlot = null;
    this._completedCaseIds = [];
    this._pendingCase = null;
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  async boot() {
    const settings = this.store.loadSettings();
    await this.i18n.load(settings.lang || 'id');
    if (settings.muted) {
      this.audio.toggleMute();
      this._syncMuteIcon(true);
    }
    await this.cl.loadAll();
    this._wireStaticButtons();
    this._transition('MENU');
  }

  // ── Transitions ───────────────────────────────────────────────────────
  _transition(newState, payload = {}) {
    this._state = newState;
    switch (newState) {
      case 'MENU':      return this._enterMenu();
      case 'SAVE_SLOTS': return this._enterSaveSlots(payload.mode);
      case 'CASE_SELECT': return this._enterCaseSelect();
      case 'PLAYING':   return this._enterPlaying(payload.caseData);
      case 'WIN':       return this._enterWin();
      case 'LOSE':      return this._enterLose();
      case 'CREDITS':   return this._enterCredits();
    }
  }

  // ── MENU ──────────────────────────────────────────────────────────────
  _enterMenu() {
    this.r.showScreen('menu');
    this.r.renderMenu(this.store.hasAnySave());
    this.r.updateLangButton();
  }

  // ── SAVE SLOTS ────────────────────────────────────────────────────────
  _enterSaveSlots(mode) {
    this.r.showScreen('save-slots');
    const slots = this.store.getAllSlots();
    this.r.renderSaveSlots(
      slots,
      mode,
      (index, save) => this._onSlotSelected(index, save, mode),
      (index) => this._onSlotDelete(index)
    );
  }

  _onSlotSelected(index, save, mode) {
    this.audio.playClick();
    this._activeSlot = index;

    if (mode === 'new') {
      // Start fresh at case select
      this.gs.reset();
      this.gs.activeSlot = index;
      this._completedCaseIds = [];
      this._transition('CASE_SELECT');
    } else if (mode === 'continue' && save) {
      // Resume from save
      const caseData = this.cl.getCase(save.data.currentCaseId);
      if (!caseData) {
        this.r.showRawToast('Case data not found.', 'error');
        return;
      }
      this.gs.fromSaveData(save.data);
      this.gs.currentCase = caseData;
      this.gs.activeSlot = index;
      this._completedCaseIds = save.data.completedCaseIds || [];
      this._transition('PLAYING', { caseData });
    } else if (!save) {
      // Empty slot → new game
      this.gs.reset();
      this.gs.activeSlot = index;
      this._completedCaseIds = [];
      this._transition('CASE_SELECT');
    }
  }

  _onSlotDelete(index) {
    this.store.deleteSlot(index);
    this.audio.playClick();
    this.r.showToast('notif.deleted', 'info');
    this._enterSaveSlots(this._currentSlotsMode || 'new');
  }

  // ── CASE SELECT ───────────────────────────────────────────────────────
  _enterCaseSelect() {
    this.r.showScreen('case-select');
    const slotEl = document.getElementById('slot-indicator');
    if (slotEl) slotEl.textContent = `Slot ${(this._activeSlot ?? 0) + 1}`;
    this.r.renderCaseSelect(
      this.cl.getAll(),
      this.cl,
      this._completedCaseIds,
      (caseData) => {
        this.audio.playClick();
        this._pendingCase = caseData;
        this._transition('PLAYING', { caseData });
      }
    );
  }

  // ── PLAYING ───────────────────────────────────────────────────────────
  _enterPlaying(caseData) {
    this.gs.loadCase(caseData);
    this.r.showScreen('game');
    this.r.initGameScreen(caseData, this.gs);
    this._renderCurrentNode();
    this._wireCaseButtons();
    this._saveProgress();
  }

  _renderCurrentNode() {
    const node = this.gs.currentNode;
    this.r.renderRiskNode(node, this.gs);
    if (!node && !this.gs.allNodesDone) return;
    if (node) this._wireOptionButtons(node);
  }

  _wireOptionButtons(node) {
    node.options.forEach(opt => {
      const btn = document.getElementById(`opt-${opt.id}`);
      if (!btn || btn.disabled) return;
      btn.addEventListener('click', () => this._onOptionChosen(node, opt), { once: true });
    });
  }

  _onOptionChosen(node, opt) {
    this.audio.playClick();
    const prevIntegrity = this.gs.integrity;

    // Animate token pulses
    Object.keys(opt.cost || {}).forEach(k => this.r.pulseToken(k));

    // Apply state changes
    const loseResult = this.gs.applyOption(opt);
    const delta = this.gs.integrity - prevIntegrity;

    // Audit log entry
    const note = this.i18n.lang === 'en' ? opt.auditNoteEn : opt.auditNoteId;
    this.gs.auditLog.push({ note, isGood: opt.isGoodChoice, turn: this.gs.turnCount });
    this.r.addAuditLogEntry(note, opt.isGoodChoice);

    // Visual + audio feedback
    this.r.flashIntegrityChange(delta);
    if (opt.isGoodChoice) this.audio.playGoodChoice();
    else this.audio.playBadChoice();

    // Update all meters
    this.r.updateGameState(this.gs, this.gs.currentCase);

    // Check lose first
    if (loseResult.lost) {
      if (loseResult.reason === 'token') this.audio.playTokenDepleted();
      setTimeout(() => this._transition('LOSE'), 700);
      return;
    }

    // Save after each decision
    this._saveProgress();

    // Advance to next node
    setTimeout(() => {
      const nextNode = this.gs.currentNode;
      this.r.renderRiskNode(nextNode, this.gs);
      if (nextNode) this._wireOptionButtons(nextNode);
    }, 400);
  }

  _wireCaseButtons() {
    const evalBtn = document.getElementById('btn-evaluate');
    if (evalBtn) {
      evalBtn.onclick = () => {
        this.audio.playClick();
        this._evaluateCase();
      };
    }
    const quitBtn = document.getElementById('btn-quit-game');
    if (quitBtn) {
      quitBtn.onclick = () => {
        this.r.showConfirm('confirm.quit', () => {
          this._saveProgress();
          this._transition('MENU');
        });
      };
    }
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.onclick = () => {
        const muted = this.audio.toggleMute();
        this._syncMuteIcon(muted);
        this.store.saveSettings({ lang: this.i18n.lang, muted });
      };
    }
  }

  _evaluateCase() {
    const won = this.gs.checkWin();
    if (won) {
      const score = ScoreCalculator.calculate(this.gs, this.gs.currentCase);
      this.gs.score = score;
      if (!this._completedCaseIds.includes(this.gs.currentCase.id)) {
        this._completedCaseIds.push(this.gs.currentCase.id);
      }
      this._saveProgress();
      this.audio.playWin();
      this._transition('WIN');
    } else {
      this.audio.playLose();
      this._transition('LOSE');
    }
  }

  // ── WIN ───────────────────────────────────────────────────────────────
  _enterWin() {
    this.r.showScreen('win');
    this.r.renderWin(this.gs.score, this.gs.currentCase, this.i18n);

    document.getElementById('btn-win-menu').onclick = () => {
      this.audio.playClick();
      this._transition('MENU');
    };
    document.getElementById('btn-win-next').onclick = () => {
      this.audio.playClick();
      this._transition('CASE_SELECT');
    };
  }

  // ── LOSE ──────────────────────────────────────────────────────────────
  _enterLose() {
    this.r.showScreen('lose');
    this.r.renderLose(this.gs, this.i18n);

    document.getElementById('btn-lose-retry').onclick = () => {
      this.audio.playClick();
      this._transition('PLAYING', { caseData: this.gs.currentCase });
    };
    document.getElementById('btn-lose-menu').onclick = () => {
      this.audio.playClick();
      this._transition('MENU');
    };
  }

  // ── CREDITS ───────────────────────────────────────────────────────────
  _enterCredits() {
    this.r.showScreen('credits');
  }

  // ── Save/Load helpers ─────────────────────────────────────────────────
  _saveProgress() {
    if (this._activeSlot === null) return;
    const data = {
      ...this.gs.toSaveData(),
      completedCaseIds: this._completedCaseIds
    };
    this.store.saveSlot(this._activeSlot, data);
  }

  // ── Wire one-time static buttons ─────────────────────────────────────
  _wireStaticButtons() {
    document.getElementById('btn-new-game')?.addEventListener('click', () => {
      this.audio.playClick();
      this._currentSlotsMode = 'new';
      this._transition('SAVE_SLOTS', { mode: 'new' });
    });

    document.getElementById('btn-continue')?.addEventListener('click', () => {
      this.audio.playClick();
      this._currentSlotsMode = 'continue';
      this._transition('SAVE_SLOTS', { mode: 'continue' });
    });

    document.getElementById('btn-credits')?.addEventListener('click', () => {
      this.audio.playClick();
      this._transition('CREDITS');
    });

    document.getElementById('btn-lang')?.addEventListener('click', async () => {
      await this.i18n.toggle();
      this.store.saveSettings({ lang: this.i18n.lang, muted: this.audio.isMuted });
      // Re-render current screen
      if (this._state === 'MENU') this._enterMenu();
      else if (this._state === 'SAVE_SLOTS') this._enterSaveSlots(this._currentSlotsMode || 'new');
      else if (this._state === 'CASE_SELECT') this._enterCaseSelect();
      else if (this._state === 'CREDITS') this._enterCredits();
    });

    document.getElementById('btn-back-from-saves')?.addEventListener('click', () => {
      this.audio.playClick();
      this._transition('MENU');
    });

    document.getElementById('btn-back-from-cases')?.addEventListener('click', () => {
      this.audio.playClick();
      this._transition('SAVE_SLOTS', { mode: this._currentSlotsMode || 'new' });
    });

    document.getElementById('btn-back-from-credits')?.addEventListener('click', () => {
      this.audio.playClick();
      this._transition('MENU');
    });
  }

  _syncMuteIcon(muted) {
    const on = document.getElementById('icon-mute-on');
    const off = document.getElementById('icon-mute-off');
    if (on) on.style.display = muted ? 'none' : '';
    if (off) off.style.display = muted ? '' : 'none';
  }
}
