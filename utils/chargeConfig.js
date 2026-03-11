// Centralized configuration for optional charges filtering
// This allows the backend to calculate all charges initially, then subtract
// exactly and only the ones the user didn't explicitly select on the frontend.
//
// MANDATORY charges (ALWAYS included, never subtracted):
//   docket, fuel, minCharges, fov/rov/insurance, minWeight, handling,
//   oda, greenTax, miscCharges, hamaliCharges, fmCharges
//
// OPTIONAL charges (subtracted if user did NOT tick them):
//   cod, topay, chequehandling, dacc

export const OPTIONAL_CHARGE_MAP = {
    // Frontend Key : Backend DB Field / Variable Name
    cod: 'codCharges',
    topay: 'topayCharges',
    chequehandling: 'chequeHandlingCharges',
    dacc: 'daccCharges',
    // ODA is auto-detected (pincode-based) — always mandatory when dest is ODA
    // Appointment Delivery is mandatory (always included)
    // greenTax, miscCharges, hamaliCharges are mandatory — never subtracted
};

/**
 * Subtracts unselected optional charges from the aggregated total.
 * 
 * @param {Object} calculatedCharges - Dictionary of exactly what was calculated { codCharges: 250, greenTax: 40... }
 * @param {Set} userOptKeys - Set of frontend keys selected by user e.g. Set('cod')
 * @param {Number} currentTotal - The total calculated before subtraction
 * @returns {Number} The new, final total after unselected charges are subtracted.
 */
export const subtractUnselectedCharges = (calculatedCharges, userOptKeys, currentTotal) => {
    let finalTotal = currentTotal;

    for (const [frontendKey, backendVarList] of Object.entries(OPTIONAL_CHARGE_MAP)) {
        if (!userOptKeys.has(frontendKey)) {
            // If the user didn't select it, but we calculated an amount for it, subtract it.
            // Support array of backend vars if multiple variables map to one frontend key
            const variables = Array.isArray(backendVarList) ? backendVarList : [backendVarList];

            for (const backendVar of variables) {
                if (calculatedCharges[backendVar]) {
                    finalTotal -= calculatedCharges[backendVar];
                    calculatedCharges[backendVar] = 0; // Zero it out so the breakdown UI is accurate
                }
            }
        }
    }

    return Math.max(0, finalTotal); // Prevent negative freight quotes
};
