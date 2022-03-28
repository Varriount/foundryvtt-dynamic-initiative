import CONSTANTS from "../shared/constants.js";
import { determineCombatInitiatives, wrap } from "../shared/helpers.js";

/** Augments the combatant capabilities */
export default class CombatantHandler {
  /** Kickstart the features of this class */
  static init() {
    this.registerWrappers();
    this.extendProtoObject();
  }

  /** Register the necessary wrappers */
  static registerWrappers() {
    wrap("Combatant.prototype.delete", this.delete);
  }

  /**
   * Reset the alpha value of a combatant token when deleted from the combat
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   * @returns {Promise<Document>} The deleted Document instance
   */
  static async delete(wrapped, ...args) {
    await this.token.update({ alpha: 1 });
    return wrapped(...args);
  }

  /** Add some methods to the prototype object */
  static extendProtoObject() {
    Combatant.prototype.takeTurn = this.takeTurn;
    Combatant.prototype.cancelTurn = this.cancelTurn;
  }

  /** Will make the combatant have the next turn then advance to the next turn */
  static async takeTurn() {
    const combat = this.combat;
    const currentCombatant = combat.turns[combat.current.turn];

    await currentCombatant.token.update({ alpha: 0.5 });

    const initiative =
      combat.current.turn === 0
        ? CONSTANTS.INITIATIVE.ACTIVE_INITIATIVE
        : currentCombatant.initiative - 1;

    await this.update({ initiative });
    combat.nextTurn();
  }

  /** Will cancel the combatant turn by giving the current turn to the previous combatant */
  static async cancelTurn() {
    const combat = this.combat;
    const currentCombatant = combat.turns[combat.current.turn];
    const previousCombatant = combat.turns[combat.current.turn - 1];

    if (this.id === currentCombatant.id) {
      await previousCombatant.token.update({ alpha: 1 });
      await combat.update({ turn: combat.data.turn - 1 });
    } else {
      await this.token.update({ alpha: 1 });
    }

    combat.combatants.get(this.id).data.update({ initiative: undefined });

    const updates = determineCombatInitiatives(combat, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    combat.updateEmbeddedDocuments("Combatant", updates);
  }
}
