/**
 * testOptionalChargesLive.js
 *
 * Live integration test: 20 randomized optional-charge combinations
 * against real MongoDB vendor data.
 *
 * Replicates the fixed Option A (conditional) calculation pipeline exactly —
 * no subtractive logic, no double-counting.
 *
 * Origin: 110020 (Delhi South, Zone N1) — fixed
 * Destinations: one per zone (19 zones) + 1 extra random = 20 cases
 * Charges: curated combos covering every meaningful permutation
 *
 * Run: node scripts/testOptionalChargesLive.js
 * Output: scripts/charge-live-results-<timestamp>.md
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Config ────────────────────────────────────────────────────────────────────
const MONGO_URL =
  'mongodb+srv://ForusELectric:BadeDevs%409123@foruscluster.6guqi8k.mongodb.net/';
const FROM_PINCODE = '110020';
const INVOICE_VALUE = 50000;
const SHIPMENT = { actualWeight: 10, length: 30, width: 30, height: 30, noofboxes: 1 };

// All optional keys that appear in the UI (mandatory ones are always sent too)
const MANDATORY_KEYS = ['docket', 'fuel', 'fov', 'handling', 'dacc'];
const OPTIONAL_KEYS  = ['oda', 'cod', 'topay', 'greentax', 'hamali', 'misc', 'chequehandling'];

// 20 curated charge combinations (label → optional keys to send)
const CHARGE_COMBOS = [
  { label: 'None (baseline)',              keys: [] },
  { label: 'All optional',                 keys: ['oda','cod','topay','greentax','hamali','misc','chequehandling'] },
  { label: 'COD only',                     keys: ['cod'] },
  { label: 'ODA only',                     keys: ['oda'] },
  { label: 'ToPay only',                   keys: ['topay'] },
  { label: 'GreenTax only',               keys: ['greentax'] },
  { label: 'Hamali only',                  keys: ['hamali'] },
  { label: 'Misc only',                    keys: ['misc'] },
  { label: 'Cheque Handling only',         keys: ['chequehandling'] },
  { label: 'COD + GreenTax',              keys: ['cod','greentax'] },
  { label: 'COD + Hamali',                keys: ['cod','hamali'] },
  { label: 'COD + Misc + GreenTax',       keys: ['cod','misc','greentax'] },
  { label: 'ODA + COD',                   keys: ['oda','cod'] },
  { label: 'ODA + Hamali + GreenTax',     keys: ['oda','hamali','greentax'] },
  { label: 'ToPay + Misc',               keys: ['topay','misc'] },
  { label: 'ToPay + Hamali + Cheque',     keys: ['topay','hamali','chequehandling'] },
  { label: 'Greentax + Misc + Cheque',    keys: ['greentax','misc','chequehandling'] },
  { label: 'ODA + All monetary',          keys: ['oda','cod','topay','hamali','chequehandling'] },
  { label: 'No COD/ToPay',               keys: ['oda','greentax','hamali','misc','chequehandling'] },
  { label: 'No ODA/Hamali',              keys: ['cod','topay','greentax','misc','chequehandling'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeCharge(config, baseFreight) {
  if (!config) return 0;
  const variable = config.variable ?? config.v ?? 0;
  const fixed    = config.fixed    ?? config.f ?? 0;
  return Math.max((variable / 100) * baseFreight, fixed);
}

function getUnitPrice(zoneRates, originZone, destZone) {
  if (!zoneRates) return null;
  const o = String(originZone).toUpperCase();
  const d = String(destZone).toUpperCase();

  // zoneRates may be a Mongoose Map or plain object — handle both
  const getRaw = (map, key) => {
    if (map instanceof Map) return map.get(key);
    return map?.[key];
  };

  const row = getRaw(zoneRates, o) ?? getRaw(zoneRates, d);
  if (!row) return null;

  // row is also potentially a Map or plain object
  const cell = row instanceof Map
    ? (row.get(d) ?? row.get(o))
    : (row[d] ?? row[o]);
  return cell != null ? Number(cell) : null;
}

function getVolWeight(kFactor, weight, length, width, height, noofboxes) {
  return (length * width * height * noofboxes) / kFactor;
}

function calcVendorPrice(pr, chargeableWeight, baseFreight, optKeys, destIsOda, invoiceValue) {
  // ── Mandatory ──────────────────────────────────────────────────────────────
  const docketCharge = pr.docketCharges || 0;
  const minCharges   = pr.minCharges   || 0;
  const fuelCharges  = optKeys.has('fuel')
    ? Math.min(((pr.fuel || 0) / 100) * baseFreight, pr.fuelMax || Infinity)
    : 0;
  const rovCharges        = optKeys.has('fov') ? computeCharge(pr.rovCharges, baseFreight) : 0;
  const insuaranceCharges = optKeys.has('fov') ? computeCharge(pr.insuaranceCharges, baseFreight) : 0;
  const handlingCharges   = (pr.handlingCharges?.fixed || 0)
    + chargeableWeight * ((pr.handlingCharges?.variable || 0) / 100);
  const fmCharges          = computeCharge(pr.fmCharges, baseFreight);
  const appointmentCharges = computeCharge(pr.appointmentCharges, baseFreight);

  // ── ODA — auto-detected from pincode (mandatory if dest is ODA) ────────────
  const odaAutoCharges = destIsOda
    ? (pr.odaCharges?.fixed || 0) + chargeableWeight * ((pr.odaCharges?.variable || 0) / 100)
    : 0;

  // ── Optional — applied only when user selected ─────────────────────────────
  const greenTax              = optKeys.has('greentax')      ? (pr.greenTax              || 0) : 0;
  const daccCharges           = optKeys.has('dacc')          ? (pr.daccCharges           || 0) : 0;
  const miscCharges           = optKeys.has('misc')          ? (pr.miscellanousCharges   || 0) : 0;
  const codCharges            = optKeys.has('cod')           ? computeCharge(pr.codCharges,   baseFreight) : 0;
  const topayCharges          = optKeys.has('topay')         ? computeCharge(pr.topayCharges, baseFreight) : 0;
  const hamaliCharges         = optKeys.has('hamali')        ? (pr.hamaliCharges         || 0) : 0;
  const chequeHandlingCharges = optKeys.has('chequehandling')? (pr.chequeHandlingCharges || 0) : 0;

  // ── ODA user-forced: add only if dest is NOT already ODA ──────────────────
  const odaForcedCharges = (optKeys.has('oda') && !destIsOda)
    ? (pr.odaCharges?.fixed || 0) + chargeableWeight * ((pr.odaCharges?.variable || 0) / 100)
    : 0;

  const effectiveBaseFreight = Math.max(baseFreight, minCharges);

  const subtotal =
    effectiveBaseFreight +
    docketCharge +
    fuelCharges +
    rovCharges +
    insuaranceCharges +
    handlingCharges +
    fmCharges +
    appointmentCharges +
    odaAutoCharges +
    greenTax +
    daccCharges +
    miscCharges +
    codCharges +
    topayCharges +
    hamaliCharges +
    chequeHandlingCharges +
    odaForcedCharges;

  // ── Invoice addon ──────────────────────────────────────────────────────────
  const ivc = pr.invoiceValueCharges;
  const invoiceAddon = (ivc?.enabled && invoiceValue > 0)
    ? Math.max((invoiceValue * (ivc.percentage || 0) / 100), ivc.minimumAmount || 0)
    : 0;

  return {
    effectiveBaseFreight : Math.round(effectiveBaseFreight),
    docketCharge         : Math.round(docketCharge),
    fuelCharges          : Math.round(fuelCharges),
    rovCharges           : Math.round(rovCharges),
    insuaranceCharges    : Math.round(insuaranceCharges),
    handlingCharges      : Math.round(handlingCharges),
    fmCharges            : Math.round(fmCharges),
    appointmentCharges   : Math.round(appointmentCharges),
    odaCharges           : Math.round(odaAutoCharges + odaForcedCharges),
    greenTax             : Math.round(greenTax),
    daccCharges          : Math.round(daccCharges),
    miscCharges          : Math.round(miscCharges),
    codCharges           : Math.round(codCharges),
    topayCharges         : Math.round(topayCharges),
    hamaliCharges        : Math.round(hamaliCharges),
    chequeHandlingCharges: Math.round(chequeHandlingCharges),
    invoiceAddon         : Math.round(invoiceAddon),
    subtotal             : Math.round(subtotal),
    totalCharges         : Math.round(subtotal + invoiceAddon),
  };
}

// ── Markdown builder ──────────────────────────────────────────────────────────
function fmtINR(n) {
  if (!n || n === 0) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function renderBreakdownTable(b) {
  const rows = [
    ['Effective Base Freight', fmtINR(b.effectiveBaseFreight)],
    ['Docket Charge',          fmtINR(b.docketCharge)],
    ['Fuel Surcharge',         fmtINR(b.fuelCharges)],
    ['ROV / FOV',              fmtINR(b.rovCharges)],
    ['Insurance',              fmtINR(b.insuaranceCharges)],
    ['Handling',               fmtINR(b.handlingCharges)],
    ['FM Charges',             fmtINR(b.fmCharges)],
    ['Appointment',            fmtINR(b.appointmentCharges)],
    ['ODA',                    fmtINR(b.odaCharges)],
    ['Green Tax',              fmtINR(b.greenTax)],
    ['DACC',                   fmtINR(b.daccCharges)],
    ['Misc',                   fmtINR(b.miscCharges)],
    ['COD',                    fmtINR(b.codCharges)],
    ['To-Pay',                 fmtINR(b.topayCharges)],
    ['Hamali',                 fmtINR(b.hamaliCharges)],
    ['Cheque Handling',        fmtINR(b.chequeHandlingCharges)],
    ['Invoice Addon',          fmtINR(b.invoiceAddon)],
  ].filter(r => r[1] !== '—'); // only show non-zero rows

  const lines = ['| Charge | Amount |', '|---|---|'];
  for (const [label, val] of rows) lines.push(`| ${label} | ${val} |`);
  lines.push(`| **TOTAL** | **${fmtINR(b.totalCharges)}** |`);
  return lines.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath   = path.join(__dirname, `charge-live-results-${timestamp}.md`);

  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGO_URL);
  console.log('Connected.');

  // Load pincode → zone map
  const pincodeData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'pincodes.json'), 'utf8')
  );
  const pincodeMap = new Map(pincodeData.map(p => [String(p.pincode), p]));

  // Pick one representative pincode per zone (excluding FROM_PINCODE zone for variety)
  const zoneGroups = {};
  for (const p of pincodeData) {
    if (!zoneGroups[p.zone]) zoneGroups[p.zone] = [];
    if (String(p.pincode) !== FROM_PINCODE) zoneGroups[p.zone].push(p);
  }

  // Select one pincode per zone deterministically (middle index for stability)
  const zoneDestinations = Object.entries(zoneGroups).map(([zone, pincodes]) => {
    const mid = Math.floor(pincodes.length / 2);
    return pincodes[mid];
  });

  // We have up to 19 zones, pad to 20 by repeating the last with a different combo
  while (zoneDestinations.length < 20) {
    zoneDestinations.push(zoneDestinations[zoneDestinations.length - 1]);
  }
  const destinations = zoneDestinations.slice(0, 20);

  const fromInfo = pincodeMap.get(FROM_PINCODE);

  // Fetch all approved public transporters with their service arrays
  const vendors = await mongoose.connection.collection('transporters')
    .find({ approvalStatus: 'approved' })
    .project({ companyName: 1, service: 1, isVerified: 1 })
    .toArray();

  // Fetch all pricing docs in one shot
  const vendorIds = vendors.map(v => v._id);
  const priceDocs = await mongoose.connection.collection('prices')
    .find({ companyId: { $in: vendorIds } })
    .project({ companyId: 1, priceRate: 1, zoneRates: 1, invoiceValueCharges: 1 })
    .toArray();
  const priceMap = new Map(priceDocs.map(p => [String(p.companyId), p]));

  const { actualWeight, length, width, height, noofboxes } = SHIPMENT;
  const volBase = length * width * height * noofboxes; // numerator; divide by kFactor per vendor

  // ── Run 20 test cases ──────────────────────────────────────────────────────
  const testResults = [];

  for (let i = 0; i < 20; i++) {
    const destInfo = destinations[i];
    const combo    = CHARGE_COMBOS[i];
    const toPin    = String(destInfo.pincode);

    // Build optKeys: always include mandatory, add user-selected optional
    const optKeys = new Set([...MANDATORY_KEYS, ...combo.keys]);

    const fromZone = fromInfo?.zone;
    const destZone = destInfo?.zone;

    // Find vendors covering both pincodes
    const matchedVendors = [];
    for (const vendor of vendors) {
      const svcMap = new Map((vendor.service || []).map(s => [String(s.pincode), s]));
      const originEntry = svcMap.get(FROM_PINCODE);
      const destEntry   = svcMap.get(toPin);
      if (!originEntry || !destEntry) continue;

      const priceDoc = priceMap.get(String(vendor._id));
      if (!priceDoc) continue;

      const pr = priceDoc.priceRate || {};
      const kFactor = pr.kFactor ?? pr.divisor ?? 5000;
      const volWeight = volBase / kFactor;
      const chargeableWeight = Math.max(volWeight, actualWeight);
      const unitPrice = getUnitPrice(priceDoc.zoneRates, fromZone, destZone);
      if (!unitPrice) continue;

      const baseFreight = unitPrice * chargeableWeight;
      const destIsOda   = destEntry.isODA === true;

      // Attach invoiceValueCharges if present on priceDoc
      if (priceDoc.invoiceValueCharges) pr.invoiceValueCharges = priceDoc.invoiceValueCharges;

      const breakdown = calcVendorPrice(pr, chargeableWeight, baseFreight, optKeys, destIsOda, INVOICE_VALUE);

      matchedVendors.push({
        name           : vendor.companyName,
        isVerified     : vendor.isVerified || false,
        destIsOda,
        unitPrice,
        chargeableWeight: Math.round(chargeableWeight * 100) / 100,
        breakdown,
      });
    }

    // Sort by total ascending
    matchedVendors.sort((a, b) => a.breakdown.totalCharges - b.breakdown.totalCharges);

    testResults.push({
      caseNo        : i + 1,
      origin        : { pincode: FROM_PINCODE, city: fromInfo?.city, zone: fromInfo?.zone },
      destination   : { pincode: toPin, city: destInfo.city, state: destInfo.state, zone: destInfo.zone },
      comboLabel    : combo.label,
      optionalSelected: combo.keys,
      allOptKeys    : [...optKeys],
      vendors       : matchedVendors,
    });

    console.log(`[${i + 1}/20] ${FROM_PINCODE} → ${toPin} (${destInfo.city}, ${destInfo.state}) | charges: ${combo.label} | vendors found: ${matchedVendors.length}`);
  }

  // ── Render Markdown ────────────────────────────────────────────────────────
  const lines = [];

  lines.push(`# Freight Optional Charges — Live Calculation Test`);
  lines.push(`\n> Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  lines.push(`> Architecture: **Option A — Conditional Additive** (no post-calculation subtraction)`);
  lines.push(`> Origin fixed: **${FROM_PINCODE}** (${fromInfo?.city}, ${fromInfo?.state} — Zone ${fromInfo?.zone})`);
  lines.push(`> Shipment: ${actualWeight} kg actual, ${length}×${width}×${height} cm, ${noofboxes} box`);
  lines.push(`> Invoice Value: ₹${INVOICE_VALUE.toLocaleString('en-IN')}`);
  lines.push(`> Total test cases: **20** | Destinations span all ${Object.keys(zoneGroups).length} zones\n`);
  lines.push(`---\n`);

  for (const tc of testResults) {
    lines.push(`## Test ${tc.caseNo}: ${tc.comboLabel}`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| Origin | ${tc.origin.pincode} — ${tc.origin.city} (Zone **${tc.origin.zone}**) |`);
    lines.push(`| Destination | ${tc.destination.pincode} — ${tc.destination.city}, ${tc.destination.state} (Zone **${tc.destination.zone}**) |`);
    lines.push(`| Optional Charges Selected | ${tc.optionalSelected.length ? tc.optionalSelected.map(k => `\`${k}\``).join(', ') : '_none_'} |`);
    lines.push(`| Full optKeys sent | ${tc.allOptKeys.map(k => `\`${k}\``).join(', ')} |`);
    lines.push(`| Vendors Found | ${tc.vendors.length} |`);
    lines.push('');

    if (tc.vendors.length === 0) {
      lines.push(`> ⚠️ No vendors found serving this route. Destination may not be in any vendor's service area.\n`);
    } else {
      lines.push(`### Vendor Results (sorted by total, lowest first)\n`);

      for (const v of tc.vendors) {
        const badge = v.isVerified ? ' ✓' : '';
        const odaTag = v.destIsOda ? ' `[ODA dest]`' : '';
        lines.push(`#### ${v.name}${badge}${odaTag}`);
        lines.push('');
        lines.push(`- **Unit Price:** ₹${v.unitPrice}/kg`);
        lines.push(`- **Chargeable Weight:** ${v.chargeableWeight} kg`);
        lines.push(`- **Base Freight:** ₹${v.breakdown.effectiveBaseFreight}`);
        lines.push('');
        lines.push(renderBreakdownTable(v.breakdown));
        lines.push('');
      }

      // Summary comparison table
      lines.push(`### Price Comparison Summary\n`);
      lines.push(`| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |`);
      lines.push(`|---|---|---|---|---|`);
      for (const v of tc.vendors) {
        const badge = v.isVerified ? ' ✓' : '';
        const odaTag = v.destIsOda ? ' (ODA)' : '';
        lines.push(`| ${v.name}${badge}${odaTag} | ₹${v.unitPrice} | ${v.chargeableWeight} kg | ${fmtINR(v.breakdown.effectiveBaseFreight)} | **${fmtINR(v.breakdown.totalCharges)}** |`);
      }
    }
    lines.push('');
    lines.push('---\n');
  }

  // ── Appendix: combo map ────────────────────────────────────────────────────
  lines.push(`## Appendix: All 20 Test Case Definitions\n`);
  lines.push(`| # | Combo Label | Optional Keys |`);
  lines.push(`|---|---|---|`);
  for (let i = 0; i < CHARGE_COMBOS.length; i++) {
    const c = CHARGE_COMBOS[i];
    lines.push(`| ${i + 1} | ${c.label} | ${c.keys.length ? c.keys.join(', ') : '_none_'} |`);
  }

  const md = lines.join('\n');
  fs.writeFileSync(outPath, md, 'utf8');

  console.log(`\n✅ Done. Results written to:\n   ${outPath}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
