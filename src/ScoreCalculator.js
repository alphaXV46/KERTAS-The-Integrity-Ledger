// ScoreCalculator.js — Scoring formula per GDD §3
export class ScoreCalculator {
  static BASE_SCORE = 500;

  /**
   * @param {object} state - final GameState snapshot
   * @param {object} caseData - the case JSON
   * @returns {{ base, tokenBonus, integrityBonus, efficiencyBonus, total }}
   */
  static calculate(state, caseData) {
    const base = this.BASE_SCORE;

    // Sum remaining token values
    const tokenSum = Object.values(state.tokens).reduce((a, b) => a + b, 0);
    const tokenBonus = tokenSum * 5;

    // Integrity bonus
    const integrityBonus = Math.max(0, state.integrity) * 2;

    // Efficiency = objectives completed / total objectives
    const totalObj = caseData.objectives.length;
    const doneObj = state.objectivesComplete.length;
    const efficiencyBonus = totalObj > 0
      ? Math.round((doneObj / totalObj) * 100)
      : 0;

    const total = base + tokenBonus + integrityBonus + efficiencyBonus;
    return { base, tokenBonus, integrityBonus, efficiencyBonus, total };
  }
}
