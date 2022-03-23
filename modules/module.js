import CombatantConfigHandler from "./handlers/CombatantConfigHandler.js";
import CombatantHandler from "./handlers/CombatantHandler.js";
import CombatHandler from "./handlers/CombatHandler.js";
import CombatTrackerHandler from "./handlers/CombatTrackerHandler.js";
import TokenLayerHandler from "./handlers/TokenLayerHandler.js";

/** Starting point of the module */
class DynamicInitiative {
  /** Init all the proper classes */
  static init() {
    TokenLayerHandler.init();
    CombatTrackerHandler.init();
    CombatHandler.init();
    CombatantHandler.init();
    CombatantConfigHandler.init();
  }
}

// Wait for the proper Hook to fire
Hooks.once("libWrapper.Ready", DynamicInitiative.init);
