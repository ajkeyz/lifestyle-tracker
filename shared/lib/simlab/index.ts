/**
 * Sim Lab — Module Entry Point
 *
 * Registers all templates and re-exports engine types.
 */

export * from "./engine";
export { buyAHouseTemplate, type BuyAHouseInput } from "./templates/buy-a-house";
export { rsuLiquidationTemplate, type RSULiquidationInput, type RSUStrategy } from "./templates/rsu-liquidation";

import { registerTemplate } from "./engine";
import { buyAHouseTemplate } from "./templates/buy-a-house";
import { rsuLiquidationTemplate } from "./templates/rsu-liquidation";

// Register all templates on import
registerTemplate(buyAHouseTemplate as any);
registerTemplate(rsuLiquidationTemplate as any);
