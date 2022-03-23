import CONSTANTS from "../shared/constants.js";
import { wrap } from "../shared/helpers.js";

/** Handles the combat tracker capabilities */
export default class TokenLayerHandler {
  /** Kickstart the features of this class */
  static init() {
    this.registerWrappers();
  }

  /** Register the necessary wrappers */
  static registerWrappers() {
    wrap("TokenLayer.prototype._onDeleteKey", this._onDeleteKey);
  }

  /**
   * Pevent a dummy token to be deleted
   *
   * @param {function} wrapped The wrapped function
   * @param {...any} args The arguments bound to the wrapped function
   */
  static async _onDeleteKey(wrapped, ...args) {
    if (!game.combats.size) return wrapped(...args);

    const controlledTokens = canvas.tokens.controlled;

    for (const token of controlledTokens) {
      if (token.data.flags?.[CONSTANTS.MODULE_NAME]?.isDummy) token.release();
    }

    wrapped(...args);
  }
}
