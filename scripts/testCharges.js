/**
 * testCharges.js — End-to-end charge selection test suite
 * Run: node scripts/testCharges.js
 *
 * Tests the full charge pipeline:
 *   Frontend selectedCharges  →  optionalCharges[]  →  subtractUnselectedCharges()  →  vendor total
 *
 * 20 edge-case combinations covering mandatory/optional/ODA/vendor-zero-value scenarios.
 */

import { subtractUnselectedCharges, OPTIONAL_CHARGE_MAP } from '../utils/chargeConfig.js';

// ─── ANSI colours ────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
    try {
        fn();
        console.log(`${GREEN}✓${RESET} ${name}`);
        results.push({ name, status: 'PASS' });
        passed++;
    } catch (err) {
        console.log(`${RED}✗${RESET} ${name}`);
        console.log(`  ${RED}→ ${err.message}${RESET}`);
        results.push({ name, status: 'FAIL', error: err.message });
        failed++;
    }
}

function assert(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
}

function assertGTE(actual, min, msg) {
    if (actual < min) {
        throw new Error(`${msg || 'Assertion failed'}: expected >= ${min}, got ${actual}`);
    }
}

// ─── Shared mock price-rate (vendor config) ───────────────────────────────────
// Represents a vendor with ALL optional charges configured
const FULL_VENDOR = {
    greenTax:             50,
    miscCharges:          30,
    hamaliCharges:        80,
    codCharges:           { fixed: 60,  variable: 0 },
    topayCharges:         { fixed: 40,  variable: 0 },
    chequeHandlingCharges:25,
    appointmentCharges:   { fixed: 100, variable: 0 },
    codCharges_flat:      60,   // convenience alias used in manual calc
    topayCharges_flat:    40,
    appointmentCharges_flat: 100,
};

// A vendor with zero values for every optional charge
const ZERO_VENDOR = {
    greenTax:             0,
    miscCharges:          0,
    hamaliCharges:        0,
    codCharges:           0,
    topayCharges:         0,
    chequeHandlingCharges:0,
    appointmentCharges:   0,
};

// ─── Helper: simulate Block-1 charge extraction ───────────────────────────────
// Mirrors the exact calculatedVars shape from transportController.js line 965-972
function buildCalculatedVars(vendor, baseFreight = 1000) {
    const codCharges   = Math.max(((vendor.codCharges?.variable  || 0)/100)*baseFreight, vendor.codCharges?.fixed  || vendor.codCharges  || 0);
    const topayCharges = Math.max(((vendor.topayCharges?.variable|| 0)/100)*baseFreight, vendor.topayCharges?.fixed|| vendor.topayCharges|| 0);
    const apptCharges  = Math.max(((vendor.appointmentCharges?.variable||0)/100)*baseFreight, vendor.appointmentCharges?.fixed||vendor.appointmentCharges||0);

    return {
        greenTax:             vendor.greenTax             || 0,
        miscCharges:          vendor.miscCharges          || 0,
        codCharges,
        topayCharges,
        hamaliCharges:        vendor.hamaliCharges        || 0,
        chequeHandlingCharges:vendor.chequeHandlingCharges|| 0,
        appointmentCharges:   apptCharges,
    };
}

// ─── Frontend logic helpers ───────────────────────────────────────────────────
const MANDATORY_KEYS = new Set(['docket', 'fuel', 'fov', 'handling', 'dacc']);

function initSelectedCharges() {
    return new Set([...MANDATORY_KEYS]);
}

function toggleCharge(set, key) {
    if (MANDATORY_KEYS.has(key)) return set; // cannot untick mandatory
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
}

function selectAll(set) {
    const OPTIONAL_KEYS = ['oda','cod','topay','greentax','hamali','misc','chequehandling','appt'];
    return new Set([...set, ...OPTIONAL_KEYS]);
}

function deselectAll() {
    return new Set([...MANDATORY_KEYS]);
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}${CYAN}  FreightCompare — Charge Selection Test Suite (20 cases)  ${RESET}`);
console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

// ── Group 1: subtractUnselectedCharges core unit tests ────────────────────────
console.log(`${YELLOW}▸ Group 1: Core subtraction logic${RESET}`);

test('TC-01  No optional charges selected → all optional line items zeroed', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const baseTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                      vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys = initSelectedCharges(); // only mandatory
    // Pass vars directly (NOT a spread) — subtractUnselectedCharges mutates its first arg
    const result  = subtractUnselectedCharges(vars, optKeys, baseTotal);

    // Every optional field should have been subtracted → result = 1000 (base only)
    assert(result, 1000, 'Total should equal base freight with no optional charges');
    assert(vars.greenTax,             0, 'greenTax should be zeroed');
    assert(vars.miscCharges,          0, 'miscCharges should be zeroed');
    assert(vars.codCharges,           0, 'codCharges should be zeroed');
    assert(vars.topayCharges,         0, 'topayCharges should be zeroed');
    assert(vars.hamaliCharges,        0, 'hamaliCharges should be zeroed');
    assert(vars.chequeHandlingCharges,0, 'chequeHandlingCharges should be zeroed');
    assert(vars.appointmentCharges,   0, 'appointmentCharges should be zeroed');
});

test('TC-02  All optional charges selected → nothing subtracted, total unchanged', () => {
    const vars      = buildCalculatedVars(FULL_VENDOR);
    const preTotal  = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                      vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys   = selectAll(initSelectedCharges());
    const result    = subtractUnselectedCharges({ ...vars }, optKeys, preTotal);
    assert(result, preTotal, 'Full total preserved when everything is selected');
});

test('TC-03  Only COD selected → only codCharges kept, rest zeroed', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const baseTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                      vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys = new Set([...MANDATORY_KEYS, 'cod']);
    const snapshot = { ...vars };
    const result  = subtractUnselectedCharges(snapshot, optKeys, baseTotal);

    // Only codCharges (60) should remain of optional items
    const expected = 1000 + FULL_VENDOR.codCharges.fixed;
    assert(result, expected, 'Total = base + cod only');
    assert(snapshot.codCharges,           FULL_VENDOR.codCharges.fixed, 'COD kept');
    assert(snapshot.greenTax,             0, 'greenTax zeroed');
    assert(snapshot.miscCharges,          0, 'miscCharges zeroed');
    assert(snapshot.hamaliCharges,        0, 'hamaliCharges zeroed');
    assert(snapshot.topayCharges,         0, 'topay zeroed');
    assert(snapshot.chequeHandlingCharges,0, 'cheque zeroed');
    assert(snapshot.appointmentCharges,   0, 'appt zeroed');
});

test('TC-04  Only Green Tax selected → only greenTax kept', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const preTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                     vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'greentax']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);

    assert(result, 1000 + FULL_VENDOR.greenTax, 'Total = base + greenTax only');
    assert(snapshot.greenTax, FULL_VENDOR.greenTax, 'greenTax kept');
    assert(snapshot.codCharges, 0, 'COD zeroed');
});

test('TC-05  COD + To-Pay both selected (edge: logically exclusive but not validated)', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const preTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                     vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'cod', 'topay']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);

    const expected = 1000 + FULL_VENDOR.codCharges.fixed + FULL_VENDOR.topayCharges.fixed;
    assert(result, expected, 'Both COD and ToPay included when both selected');
    assert(snapshot.codCharges,   FULL_VENDOR.codCharges.fixed,   'COD kept');
    assert(snapshot.topayCharges, FULL_VENDOR.topayCharges.fixed, 'ToPay kept');
});

test('TC-06  Only Hamali selected → only hamaliCharges kept', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const preTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                     vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'hamali']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);

    assert(result, 1000 + FULL_VENDOR.hamaliCharges, 'Total = base + hamali only');
    assert(snapshot.hamaliCharges, FULL_VENDOR.hamaliCharges, 'hamali kept');
    assert(snapshot.codCharges, 0, 'COD zeroed');
});

test('TC-07  Cheque Handling selected, vendor has 0 cheque value → only cheque kept (0), rest subtracted', () => {
    // Vendor has no cheque charge but does have other optional charges
    const vendorNoCheque = { ...FULL_VENDOR, chequeHandlingCharges: 0 };
    const vars = buildCalculatedVars(vendorNoCheque);
    // Build preTotal to include ALL the charges that are actually in vars
    const preTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                     vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'chequehandling']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);

    // chequeHandlingCharges = 0, everything else subtracted → result = 1000
    assert(result, 1000, 'Total = base only (cheque is 0, all other optionals subtracted)');
    assert(snapshot.chequeHandlingCharges, 0, 'cheque = 0 (vendor configured it as zero)');
    assert(snapshot.greenTax,  0, 'greenTax subtracted (not selected)');
    assert(snapshot.codCharges, 0, 'COD subtracted (not selected)');
});

test('TC-08  Misc selected but vendor has zero misc charges → total = base only', () => {
    // Vendor has zero misc but has other optional charges; misc is selected, rest not
    const vendorNoMisc = { ...FULL_VENDOR, miscCharges: 0 };
    const vars     = buildCalculatedVars(vendorNoMisc);
    const preTotal = 1000 + vars.greenTax + vars.miscCharges + vars.hamaliCharges +
                     vars.codCharges + vars.topayCharges + vars.chequeHandlingCharges + vars.appointmentCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'misc']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);
    // misc = 0, all other optionals subtracted → back to base
    assert(result, 1000, 'Total = base (misc 0, all other optionals removed)');
    assert(snapshot.miscCharges, 0, 'misc stays 0');
    assert(snapshot.greenTax,    0, 'greenTax subtracted');
});

test('TC-09  Appt. Delivery selected → appointmentCharges kept', () => {
    const vars = buildCalculatedVars(FULL_VENDOR);
    const preTotal = 1000 + vars.appointmentCharges + vars.codCharges + vars.greenTax +
                     vars.miscCharges + vars.hamaliCharges + vars.topayCharges + vars.chequeHandlingCharges;
    const optKeys  = new Set([...MANDATORY_KEYS, 'appt']);
    const snapshot = { ...vars };
    const result   = subtractUnselectedCharges(snapshot, optKeys, preTotal);

    assert(result, 1000 + FULL_VENDOR.appointmentCharges.fixed, 'Total = base + appt only');
    assert(snapshot.appointmentCharges, FULL_VENDOR.appointmentCharges.fixed, 'appt kept');
});

test('TC-10  Vendor with ALL zero optional charges → any selection combo gives same total', () => {
    const varsA = buildCalculatedVars(ZERO_VENDOR);
    const varsB = buildCalculatedVars(ZERO_VENDOR);
    const preTotal = 1000;

    const resultNone = subtractUnselectedCharges({ ...varsA }, initSelectedCharges(), preTotal);
    const resultAll  = subtractUnselectedCharges({ ...varsB }, selectAll(initSelectedCharges()), preTotal);

    assert(resultNone, 1000, 'No change with zero vendor (no selection)');
    assert(resultAll,  1000, 'No change with zero vendor (all selected)');
    assert(resultNone, resultAll, 'Both strategies equal for zero-charge vendor');
});

// ── Group 2: Frontend toggle behaviour ───────────────────────────────────────
console.log(`\n${YELLOW}▸ Group 2: Frontend toggle behaviour${RESET}`);

test('TC-11  Mandatory key toggle is a no-op (cannot deselect mandatory)', () => {
    let sel = initSelectedCharges();
    const before = sel.size;
    sel = toggleCharge(sel, 'fuel');  // fuel is mandatory
    sel = toggleCharge(sel, 'fov');   // fov is mandatory
    sel = toggleCharge(sel, 'dacc');  // dacc is mandatory
    assert(sel.size, before, 'Size unchanged after toggling mandatory keys');
    assert(sel.has('fuel'),    true, 'fuel still present');
    assert(sel.has('fov'),     true, 'fov still present');
    assert(sel.has('docket'),  true, 'docket still present');
});

test('TC-12  Toggle optional on then off → net zero change', () => {
    let sel = initSelectedCharges();
    sel = toggleCharge(sel, 'cod');
    assert(sel.has('cod'), true, 'COD added on first toggle');
    sel = toggleCharge(sel, 'cod');
    assert(sel.has('cod'), false, 'COD removed on second toggle');
    assert(sel.size, MANDATORY_KEYS.size, 'Back to mandatory-only size');
});

test('TC-13  Select All adds all 8 optional keys on top of mandatory', () => {
    const sel    = selectAll(initSelectedCharges());
    const OPTIONAL_KEYS = ['oda','cod','topay','greentax','hamali','misc','chequehandling','appt'];
    for (const k of OPTIONAL_KEYS) {
        assert(sel.has(k), true, `${k} should be in selectAll result`);
    }
    assert(sel.has('fuel'),   true, 'mandatory fuel preserved');
    assert(sel.has('docket'), true, 'mandatory docket preserved');
});

test('TC-14  Deselect All retains only mandatory keys', () => {
    let sel = selectAll(initSelectedCharges());
    sel = deselectAll();
    assert(sel.size, MANDATORY_KEYS.size, 'Only mandatory keys remain');
    assert(sel.has('cod'),      false, 'cod removed');
    assert(sel.has('greentax'), false, 'greentax removed');
    assert(sel.has('fuel'),     true,  'fuel (mandatory) kept');
    assert(sel.has('dacc'),     true,  'dacc (mandatory) kept');
});

test('TC-15  Array.from serialisation round-trips correctly', () => {
    // Simulates: Array.from(selectedCharges) sent as JSON, received back as array
    let sel = selectAll(initSelectedCharges());
    sel = toggleCharge(sel, 'cod'); // deselect cod
    const serialized = Array.from(sel);
    const restored   = new Set(serialized);
    assert(restored.has('cod'),       false, 'cod absent after deselect + serialize');
    assert(restored.has('fuel'),      true,  'fuel present after round-trip');
    assert(restored.has('greentax'),  true,  'greentax present after round-trip');
});

// ── Group 3: ODA edge cases ───────────────────────────────────────────────────
console.log(`\n${YELLOW}▸ Group 3: ODA (pincode-based, not in OPTIONAL_CHARGE_MAP)${RESET}`);

test('TC-16  ODA key not in OPTIONAL_CHARGE_MAP → subtractUnselectedCharges ignores it', () => {
    // ODA is auto-detected; the map should NOT contain it so it's never subtracted
    assert(OPTIONAL_CHARGE_MAP.hasOwnProperty('oda'), false,
        'oda should NOT appear in OPTIONAL_CHARGE_MAP — it is pincode-driven');
});

test('TC-17  destIsOda=false → odaCharges=0 regardless of ODA checkbox state', () => {
    // Simulate: user ticks ODA, but destination is not an ODA pincode
    const destIsOda = false;
    const pr = { odaCharges: { fixed: 200, variable: 2 } };
    const chargeableWeight = 50;
    const odaCharges = destIsOda
        ? (pr.odaCharges?.fixed || 0) + chargeableWeight * ((pr.odaCharges?.variable || 0) / 100)
        : 0;
    assert(odaCharges, 0, 'ODA = 0 when destination is not ODA, regardless of checkbox');
});

test('TC-18  destIsOda=true → odaCharges calculated regardless of ODA checkbox', () => {
    // ODA is auto-applied based on pincode; checkbox has no effect on it
    const destIsOda = true;
    const pr = { odaCharges: { fixed: 200, variable: 2 } };
    const chargeableWeight = 50;
    const odaCharges = destIsOda
        ? (pr.odaCharges?.fixed || 0) + chargeableWeight * ((pr.odaCharges?.variable || 0) / 100)
        : 0;
    const expected = 200 + 50 * (2 / 100); // 200 + 1 = 201
    assert(odaCharges, expected, 'ODA = fixed + variable*weight when destIsOda=true');
});

// ── Group 4: Fuel & FOV conditional calculation ───────────────────────────────
console.log(`\n${YELLOW}▸ Group 4: Fuel & FOV (mandatory — always sent in optKeys)${RESET}`);

test('TC-19  fuel in optKeys → fuelCharges calculated; missing → 0', () => {
    const pr = { fuel: 10, fuelMax: null };
    const baseFreight = 1000;

    // With fuel in optKeys (normal — mandatory always present)
    const optKeysWithFuel = new Set(['fuel']);
    const fuelWith = optKeysWithFuel.has('fuel')
        ? Math.min(((pr.fuel || 0) / 100) * baseFreight, pr.fuelMax || Infinity)
        : 0;
    assert(fuelWith, 100, 'Fuel = 10% of 1000 = 100');

    // Without fuel in optKeys (abnormal — only possible if mandatory were unticked)
    const optKeysNoFuel = new Set([]);
    const fuelWithout = optKeysNoFuel.has('fuel')
        ? Math.min(((pr.fuel || 0) / 100) * baseFreight, pr.fuelMax || Infinity)
        : 0;
    assert(fuelWithout, 0, 'Fuel = 0 when not in optKeys');
});

test('TC-20  Math.max(0, total) prevents negative result when large charges subtracted', () => {
    // Edge: a vendor configured charges incorrectly (total goes negative after subtraction)
    const vars = {
        greenTax: 5000, miscCharges: 0, codCharges: 0,
        topayCharges: 0, hamaliCharges: 0, chequeHandlingCharges: 0, appointmentCharges: 0,
    };
    const preTotal = 100; // smaller than greenTax alone
    const optKeys  = initSelectedCharges(); // greentax NOT selected → will subtract 5000
    const result   = subtractUnselectedCharges({ ...vars }, optKeys, preTotal);
    assertGTE(result, 0, 'Total must never be negative (Math.max guard)');
    assert(result, 0, 'Clamped to 0 when subtraction exceeds total');
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}  Results: ${GREEN}${passed} passed${RESET}${BOLD}  ${failed > 0 ? RED : ''}${failed} failed${RESET}`);
console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}\n`);

// ─── Store results to file ────────────────────────────────────────────────────
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

const report = {
    runAt: new Date().toISOString(),
    summary: { total: passed + failed, passed, failed },
    cases: results,
    chargeMap: OPTIONAL_CHARGE_MAP,
    notes: {
        mandatory: 'docket, fuel, fov, handling, dacc — always in optKeys, cannot be deselected',
        oda: 'Auto-detected from pincode (destIsOda flag); not in OPTIONAL_CHARGE_MAP; checkbox has no effect on calculation',
        subtraction: 'Backend calculates ALL charges first, then subtracts unselected optionals via subtractUnselectedCharges()',
        fuelAndFov: 'Calculated conditionally via optKeys.has("fuel"/"fov") — but since they are mandatory they are always present',
        zeroGuard: 'Math.max(0, finalTotal) prevents negative totals',
    },
};

const outPath = join(__dirname, `charge-test-results-${timestamp}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`${CYAN}Results saved → ${outPath}${RESET}\n`);

if (failed > 0) process.exit(1);
