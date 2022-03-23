import CONSTANTS from "../shared/constants.js";
import { determineCombatInitiatives } from "../shared/helpers.js";

/** Augments the combatant capabilities */
export default class CombatantHandler {
  /** Kickstart the features of this class */
  static init() {
    Combatant.prototype.takeTurn = this.takeTurn;
    Combatant.prototype.cancelTurn = this.cancelTurn;
  }

  /** Will make the combatant have the next turn then advance to the next turn */
  static async takeTurn() {
    const combat = this.combat;

    const initiative =
      combat.current.turn === 0
        ? CONSTANTS.INITIATIVE.ACTIVE_INITIATIVE
        : combat.turns[combat.current.turn].initiative - 1;

    await this.update({ initiative });
    combat.nextTurn();
  }

  /** Will cancel the combatant turn by giving the current turn to the previous combatant */
  static async cancelTurn() {
    const combat = this.combat;

    if (this.id === combat.turns[combat.current.turn].id) {
      await combat.update({ turn: combat.data.turn - 1 });
    }

    combat.combatants.get(this.id).data.update({ initiative: undefined });

    const updates = determineCombatInitiatives(combat, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    combat.updateEmbeddedDocuments("Combatant", updates);
  }
}
