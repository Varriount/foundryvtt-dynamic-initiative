import CONSTANTS from "../shared/constants.js";

/**
 * Description for a dummy combatant
 *
 * @extends {Combatant}
 */
export default class DummyCombatant extends Combatant {
  /** @type {string} */
  static ACTOR_NAME = CONSTANTS.MODULE_TITLE;

  /** @type {string} */
  static IMAGE_PATH = `${CONSTANTS.PATH}images/transparent.png`;

  /** @type {string} */
  static FOLDER_NAME = CONSTANTS.MODULE_TITLE;

  /**
   * Create a dummy actor and a dummy token on a scene an returns a dummy combatant link to those
   * @param {Combat} combat The combat for which to create a dummy combatant
   * @returns {Promise<Combatant>} The created dummy combatant
   */
  static async build(combat) {
    if (!combat.scene && !canvas.scene) throw new Error("You must create and activate a scene.");

    const token = await this._createTokenOnScene(combat);

    return new this(
      {
        initiative: CONSTANTS.INITIATIVE.DUMMY_INITIATIVE,
        tokenId: token.id,
        actorId: token.actor.id,
        sceneId: token.scene.id,
        flags: { [CONSTANTS.MODULE_NAME]: { isDummy: true } }
      },
      { parent: combat }
    );
  }

  /**
   * Search for an existing actor (creates it if none) then creates a new dummy token
   * @param {Combat} combat
   * @returns {Promise<Token>} The created dummy token
   */
  static async _createTokenOnScene(combat) {
    let actor = game.actors.getName(this.ACTOR_NAME);

    if (!actor) {
      actor = await this._createActor();
    }

    return await this._createToken(actor, combat);
  }

  /**
   * Search for an existing folder (creates it if none) then creates a new dummy actor
   * @returns {Promise<Actor>} The created dummy actor
   */
  static async _createActor() {
    let folder = game.folders.getName(this.FOLDER_NAME);

    if (!folder) {
      folder = await this._createFolder();
    }

    return await Actor.create({
      name: this.ACTOR_NAME,
      type: "npc",
      img: this.IMAGE_PATH,
      folder: folder.id,
      data: { ["attributes.hp.formula"]: 1 },
      flags: { [`${CONSTANTS.MODULE_NAME}.isDummy`]: true }
    });
  }

  /**
   * Creates a folder that will contains the dummy actor
   * @returns {Promise<Folder>} The created folder
   */
  static async _createFolder() {
    return await Folder.create({
      name: this.FOLDER_NAME,
      type: "Actor"
    });
  }

  /**
   * Creates a dummy token on the requested scene
   * @param {Actor} actor The actor from which to create the token
   * @param {Combat} combat The combat for which to create the token
   * @returns {Promise<Token>} The created dummy token
   */
  static async _createToken(actor, combat) {
    const tokenData = await actor.getTokenData();

    tokenData.update({
      x: 0,
      y: 0,
      actorLink: false,
      hidden: true,
      img: this.IMAGE_PATH,
      disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      displayName: CONST.TOKEN_DISPLAY_MODES.NONE,
      displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
      flags: { [`${CONSTANTS.MODULE_NAME}`]: { isDummy: true } }
    });

    const TokenClass = getDocumentClass("Token");
    const TokenDocument = await TokenClass.create(tokenData, {
      parent: combat.scene || canvas.scene
    });

    return TokenDocument.object;
  }
}
