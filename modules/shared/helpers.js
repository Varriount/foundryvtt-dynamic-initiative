import CONSTANTS from "./constants.js";

/**
 * Preprend logged message with tha module title
 * @param {string} msg Message to print
 * @returns {void}
 */
export const logger = (msg) => console.log(`${CONSTANTS.MODULE_TITLE} | ${msg}`);

/**
 * Wrap a property or a method with Libwrapper (libWrapper.WRAPPER).
 * @param {string} target Path to the target method or property
 * @param {Function} fn Callback function to execute
 * @returns {number} Unique numeric "target" identifier
 */
export const wrap = (target, fn) =>
  libWrapper.register(CONSTANTS.MODULE_NAME, target, fn, libWrapper.WRAPPER);

/**
 * Reset the alpha and initiative for each combatant under an iniative threshold
 * @param {Combat} combat Combat including combatant for which to determine initiative
 * @param {object} options Additional options which customize the method to determine initiative
 * @param {number} [options.threshold] Threshold above which the combatants won't be processed
 * @returns {object[]} Collection of objects describing the processed combatants
 */
export const resetIniative = async (
  combat,
  { threshold = CONSTANTS.INITIATIVE.ACTIVE_INITIATIVE } = {}
) => {
  await resetAlpha(combat, { threshold });
  return determineCombatInitiatives(combat, { threshold });
};

/**
 * Determine the iniative for each combatant under an iniative threshold
 * @param {Combat} combat Combat including combatant for which to determine initiative
 * @param {object} options Additional options which customize the method to determine initiative
 * @param {number} [options.threshold] Threshold above which the combatants won't be processed
 * @returns {object[]} Collection of objects describing the processed combatants
 */
export const determineCombatInitiatives = (
  combat,
  { threshold = CONSTANTS.INITIATIVE.ACTIVE_INITIATIVE } = {}
) => {
  const updates = [];

  const combatants = combat.combatants
    ?.map((combatant) => ({
      ...combatant.toObject(),
      name: combatant.actor.name,
      hasPlayerOwner: combatant.hasPlayerOwner
    }))
    .sort(
      (a, b) => Number(b.hasPlayerOwner) - Number(a.hasPlayerOwner) || a.name.localeCompare(b.name)
    );

  for (const combatant of combatants) {
    if (combatant.flags?.[CONSTANTS.MODULE_NAME]?.isDummy) continue;
    if (combatant.initiative > threshold) continue;

    let initiative;

    if (
      (combatant.hasPlayerOwner && updates[updates.length - 1]?.hasPlayerOwner === true) ||
      (!combatant.hasPlayerOwner && updates[updates.length - 1]?.hasPlayerOwner === false)
    ) {
      initiative = updates[updates.length - 1].initiative - 1;
    } else {
      initiative = combatant.hasPlayerOwner
        ? CONSTANTS.INITIATIVE.PC_INITIATIVE
        : CONSTANTS.INITIATIVE.NPC_INITIATIVE;
    }

    updates.push({
      _id: combatant._id,
      hasPlayerOwner: combatant.hasPlayerOwner,
      initiative
    });
  }

  return updates;
};

/**
 * Reset the alpha each combatant under an iniative threshold
 * @param {Combat} combat Combat including combatant for which to determine initiative
 * @param {object} options Additional options which customize the method to determine initiative
 * @param {number} [options.threshold] Threshold above which the combatants won't be processed
 */
export const resetAlpha = async (
  combat,
  { threshold = CONSTANTS.INITIATIVE.ACTIVE_INITIATIVE } = {}
) => {
  const updates = [];

  for (const combatant of combat.combatants) {
    if (combatant.flags?.[CONSTANTS.MODULE_NAME]?.isDummy) continue;
    if (combatant.initiative > threshold) continue;

    updates.push({
      _id: combatant.token.id,
      alpha: 1
    });
  }

  await combat.scene.updateEmbeddedDocuments("Token", updates);
};
