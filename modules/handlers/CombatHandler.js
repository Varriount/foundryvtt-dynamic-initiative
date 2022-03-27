import DummyCombatant from "../classes/DummyCombatant.js";
import CONSTANTS from "../shared/constants.js";
import { determineCombatInitiatives, wrap } from "../shared/helpers.js";

/** Handles the combat capabilities */
export default class CombatHandler {
  /**
   * Kickstart the features of this class
   */
  static init() {
    this.registerWrappers();
  }

  /** Register the necessary wrappers */
  static registerWrappers() {
    wrap("Combat.prototype._onCreate", this._onCreate);
    wrap("Combat.prototype._onDelete", this._onDelete);
    wrap("Combat.prototype._onCreateEmbeddedDocuments", this._onCreateEmbeddedDocuments);
    wrap("Combat.prototype.startCombat", this.startCombat);
    wrap("Combat.prototype.nextRound", this.nextRound);
    wrap("Combat.prototype.previousRound", this.previousRound);
  }

  /**
   * Creates a dummy combatant after a combat is created
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async _onCreate(wrapped, ...args) {
    wrapped(...args);
    const [_data, _options, userId] = args;

    if (game.users.current.id !== userId) return;

    const dummyCombatant = await DummyCombatant.build(this);
    const combatants = this.combatants.map((combatant) => combatant.toObject());

    combatants.push(dummyCombatant.toObject());
    this.update({ combatants });
  }

  /**
   * Deletes the bound dummy token (if it exists) after a combat is deleted
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async _onDelete(wrapped, ...args) {
    wrapped(...args);
    const [_options, userId] = args;

    if (game.users.current.id !== userId) return;

    const dummyCombatants = this.combatants.filter(
      (combatant) => combatant.data.flags?.[CONSTANTS.MODULE_NAME]?.isDummy && combatant.token
    );

    for (const combatant of dummyCombatants) {
      await game.scenes
        .get(combatant.data.sceneId)
        .deleteEmbeddedDocuments("Token", [combatant.data.tokenId]);
    }
  }

  /**
   * Reset the initiative of every combatants below the PC INITIATOIVE when a combatant is added
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static _onCreateEmbeddedDocuments(wrapped, ...args) {
    wrapped(...args);
    const [embeddedName, _documents, _result, _options, userId] = args;

    if (game.users.current.id !== userId || embeddedName !== "Combatant" || !this.started) return;

    const updates = determineCombatInitiatives(this, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    this.updateEmbeddedDocuments("Combatant", updates);
  }

  /**
   * Reset the initiative of every combatants below the ACTIVE_INITIATIVE after starting a combat
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async startCombat(wrapped, ...args) {
    await wrapped(...args);

    const updates = determineCombatInitiatives(this, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    return await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /**
   * Reset the initiative of every combatants below the ACTIVE_INITIATIVE after next round
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async nextRound(wrapped, ...args) {
    await wrapped(...args);

    const updates = determineCombatInitiatives(this, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /**
   * Reset the initiative of every combatants below the ACTIVE_INITIATIVE after previous round
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async previousRound(wrapped, ...args) {
    await wrapped(...args);

    const updates = determineCombatInitiatives(this, {
      threshold: CONSTANTS.INITIATIVE.PC_INITIATIVE
    });
    await this.update({ turn: 0, combatants: updates });
  }
}
