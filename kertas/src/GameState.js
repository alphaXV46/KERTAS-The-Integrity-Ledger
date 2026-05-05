// GameState.js — Centralized mutable game state
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.integrity = 75;
    this.corruptionPressure = 0;
    this.tokens = {
      berani: 5, jujur: 5, mandiri: 5,
      peduli: 5, adil: 5, disiplin: 5,
      kerjaKeras: 5, tanggungjawab: 5, sederhana: 5
    };
    this.actionPointsMax = 3;
    this.currentCase = null;
    this.currentNodeIndex = 0;
    this.objectivesComplete = [];
    this.turnCount = 0;
    this.auditLog = [];
    this.score = null;
    this.loseReason = null;
    this.activeSlot = null;
  }

  loadCase(caseData) {
    this.currentCase = caseData;
    this.integrity = caseData.startingIntegrity;
    this.corruptionPressure = 0;
    this.tokens = { ...caseData.startingTokens };
    this.currentNodeIndex = 0;
    this.objectivesComplete = [];
    this.turnCount = 0;
    this.auditLog = [];
    this.score = null;
    this.loseReason = null;
  }

  get currentNode() {
    if (!this.currentCase) return null;
    const seq = this.currentCase.passageSequence;
    if (this.currentNodeIndex >= seq.length) return null;
    const nodeId = seq[this.currentNodeIndex];
    return this.currentCase.riskNodes.find(n => n.id === nodeId) ?? null;
  }

  get isLastNode() {
    if (!this.currentCase) return true;
    return this.currentNodeIndex >= this.currentCase.passageSequence.length - 1;
  }

  get allNodesDone() {
    if (!this.currentCase) return true;
    return this.currentNodeIndex >= this.currentCase.passageSequence.length;
  }

  applyOption(option) {
    // Consume token costs
    const cost = option.cost || {};
    for (const [token, amount] of Object.entries(cost)) {
      if (this.tokens[token] !== undefined) {
        this.tokens[token] = Math.max(0, this.tokens[token] - amount);
      }
    }

    // Apply effects
    const fx = option.effects || {};
    if (fx.integrity) {
      this.integrity = Math.max(0, Math.min(100, this.integrity + fx.integrity));
    }
    if (fx.corruptionPressure) {
      this.corruptionPressure = Math.max(0, Math.min(100, this.corruptionPressure + fx.corruptionPressure));
    }

    // Complete objectives
    for (const objId of (option.completesObjectives || [])) {
      if (!this.objectivesComplete.includes(objId)) {
        this.objectivesComplete.push(objId);
      }
    }

    // Passive pressure tick (reduced by Disiplin)
    const disciplineBonus = this.tokens.disiplin;
    const pressureTick = Math.max(0, 5 - Math.floor(disciplineBonus / 2));
    this.corruptionPressure = Math.min(100, this.corruptionPressure + pressureTick);

    // Corruption pressure penalty above 70%
    if (this.corruptionPressure >= 70) {
      this.integrity = Math.max(0, this.integrity - 5);
    }

    this.turnCount++;
    this.currentNodeIndex++;

    return this._checkLose();
  }

  _checkLose() {
    if (this.integrity <= 0) {
      this.loseReason = 'integrity';
      return { lost: true, reason: 'integrity' };
    }
    const depletedToken = Object.entries(this.tokens).find(([, v]) => v <= 0);
    if (depletedToken) {
      this.loseReason = depletedToken[0];
      return { lost: true, reason: 'token', token: depletedToken[0] };
    }
    return { lost: false };
  }

  checkWin() {
    if (!this.currentCase) return false;
    const wc = this.currentCase.winCondition;
    const integrityOk = this.integrity >= wc.minIntegrity;
    const objectivesOk = !wc.allObjectives ||
      this.currentCase.objectives.every(o => this.objectivesComplete.includes(o.id));
    const tokensOk = !wc.allTokensAboveZero ||
      Object.values(this.tokens).every(v => v > 0);
    return integrityOk && objectivesOk && tokensOk;
  }

  toSaveData() {
    return {
      integrity: this.integrity,
      corruptionPressure: this.corruptionPressure,
      tokens: { ...this.tokens },
      currentCaseId: this.currentCase?.id ?? null,
      currentNodeIndex: this.currentNodeIndex,
      objectivesComplete: [...this.objectivesComplete],
      turnCount: this.turnCount,
      auditLog: [...this.auditLog],
      activeSlot: this.activeSlot
    };
  }

  fromSaveData(data) {
    this.integrity = data.integrity;
    this.corruptionPressure = data.corruptionPressure;
    this.tokens = { ...data.tokens };
    this.currentNodeIndex = data.currentNodeIndex;
    this.objectivesComplete = [...data.objectivesComplete];
    this.turnCount = data.turnCount;
    this.auditLog = [...(data.auditLog || [])];
    this.activeSlot = data.activeSlot;
    // currentCase is set externally after loading case JSON
  }
}
