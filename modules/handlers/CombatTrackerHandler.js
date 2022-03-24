import CONSTANTS from "../shared/constants.js";
import { wrap } from "../shared/helpers.js";

/** Handles the combat tracker capabilities */
export default class CombatTrackerHandler {
  /** Kickstart the features of this class */
  static init() {
    this.registerWrappers();
  }

  /** Register the necessary wrappers */
  static registerWrappers() {
    wrap("CombatTracker.prototype._getEntryContextOptions", this._getEntryContextOptions);
    wrap("CombatTracker.prototype._render", this._render);
  }

  /**
   * Change the context entries to remove some unsuitable options
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   * @returns {object[]} The context entries
   */
  static _getEntryContextOptions(wrapped, ...args) {
    const entryOptions = wrapped(...args);

    for (const name of ["COMBAT.CombatantClear", "COMBAT.CombatantReroll"]) {
      const index = entryOptions.findIndex((option) => option.name === name);
      if (index) entryOptions.splice(index, 1);
    }

    return entryOptions;
  }

  /**
   * Modify the html once it has been render to add capabilities
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async _render(wrapped, ...args) {
    await wrapped(args);

    const rendered = this.rendered;
    const combat = this.viewed;
    if (!rendered || !combat) return;

    const html = this.element[0];
    html.classList.add("dynamic-initiative");

    CombatTrackerHandler._updateCombatRoundUi(combat, html);
    CombatTrackerHandler._updateCombatControlsUi(combat, html);
    CombatTrackerHandler._updateCombatTrackerUi(combat, html);
  }

  /**
   * Update the top side of the combat tracker ui
   * @param {Combat} combat The current combat
   * @param {jQuery} html The tracker HTMLElement as a jQuery object
   */
  static _updateCombatRoundUi(combat, html) {
    const round = html.querySelector("#combat-round");

    round.querySelector('[data-control="rollAll"]')?.remove();
    round.querySelector('[data-control="rollNPC"]')?.remove();
    round.querySelector('[data-control="resetAll"]')?.remove();
  }

  /**
   * Update the bottom side of the combat tracker ui
   * @param {Combat} combat The current combat
   * @param {jQuery} html The tracker HTMLElement as a jQuery object
   */
  static _updateCombatControlsUi(combat, html) {
    const controls = html.querySelector("#combat-controls");

    controls.querySelector('[data-control="previousTurn"]')?.remove();
    controls.querySelector('[data-control="nextTurn"]')?.remove();
  }

  /**
   * Update the body of the combat tracker ui and add buttons
   * @param {Combat} combat The current combat
   * @param {jQuery} html The tracker HTMLElement as a jQuery object
   */
  static _updateCombatTrackerUi(combat, html) {
    const tracker = html.querySelector("#combat-tracker");

    for (const [index, combatant] of combat.turns.entries()) {
      const li = tracker.querySelector(`.combatant[data-combatant-id="${combatant.id}"]`);
      const tokenInit = li.querySelector(".token-initiative");
      let button;

      switch (true) {
        case combatant.data.flags?.[CONSTANTS.MODULE_NAME]?.isDummy:
          li.classList.add("dummy-combatant");
          tokenInit.innerHTML = "";
          break;

        case !combat.started || combatant.data.defeated:
          tokenInit.innerHTML = "";
          break;

        case combat.current.turn > index:
          li.classList.add("past-turn");
          button = this._createCancelTurnButton(combatant);
          tokenInit.replaceChildren(button);
          break;

        case combat.current.turn === index:
          li.classList.add("active-turn");
          button = this._createActiveTurnButton(combatant);
          tokenInit.replaceChildren(button);
          break;

        case combat.current.turn < index:
          li.classList.add("next-turn", combatant.hasPlayerOwner ? "player" : "npc");
          button = this._createTakeTurnButton(combatant);
          tokenInit.replaceChildren(button);
          break;
      }
    }
  }

  /**
   * Generate a specific type of button: cancel turn
   * @param {Combatant} combatant The combatant for which generate a button
   * @returns {HTMLElement} The button being generated
   */
  static _createCancelTurnButton(combatant) {
    return this._createActionButton(combatant, { action: "cancelTurn", iconClass: "fa-toggle-on" });
  }

  /**
   * Generate a specific type of button: active action
   * @param {Combatant} combatant The combatant for which generate a button
   * @returns {HTMLElement} The button being generated
   */
  static _createActiveTurnButton(combatant) {
    return this._createActionButton(combatant, {
      action: "cancelTurn",
      iconClass: "fa-dot-circle"
    });
  }

  /**
   * Generate a specific type of button: take action
   * @param {Combatant} combatant The combatant for which generate a button
   * @returns {HTMLElement} The button being generated
   */
  static _createTakeTurnButton(combatant) {
    return this._createActionButton(combatant, { action: "takeTurn", iconClass: "fa-toggle-off" });
  }

  /**
   * Generate an action button based on the arguments supplied
   * @param {Combatant} combatant The combatant for which generate a button
   * @param {object} options Options to supply
   * @param {string} [options.action] The type of button action
   * @param {string} [options.iconClass] The associated icon
   * @returns {HTMLElement} The generated button
   */
  static _createActionButton(combatant, { action = "", iconClass = "" }) {
    const button = game.user.isGM ? document.createElement("a") : document.createElement("div");

    button.classList.add("combatant-control");
    button.dataset.control = action;

    const icon = document.createElement("i");
    icon.classList.add("fas", iconClass);
    button.append(icon);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!game.user.isGM) return;

      combatant[action]();
    });

    return button;
  }
}
