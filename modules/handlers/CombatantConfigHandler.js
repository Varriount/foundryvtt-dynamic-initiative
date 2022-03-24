import { wrap } from "../shared/helpers.js";

/** Handles the combatant configuration window */
export default class CombatantConfigHandler {
  /** Kickstart the features of this class */
  static init() {
    this.registerWrappers();
  }

  /** Register the necessary wrappers */
  static registerWrappers() {
    wrap("CombatantConfig.prototype._render", this._render);
  }

  /**
   * Will remove disable the iniative field
   * @param {Function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async _render(wrapped, ...args) {
    await wrapped(...args);

    const rendered = this.rendered;
    if (!rendered) return;

    const html = this.element[0];

    const initiativeInput = html.querySelector('input[name="initiative"]');
    initiativeInput.disabled = true;
  }
}
