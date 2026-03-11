import fs from 'fs';

const data = JSON.parse(fs.readFileSync('./comparison_results.json', 'utf8'));

let md = `# Rate Comparison: All Optional Charges vs No Optional Charges\n\n`;
md += `Origin Pincode: **110020**, Invoice Value: **₹50,000**, Weight: **50kg**\n\n`;

const chargeKeys = [
  "baseFreight", "effectiveBaseFreight", "docketCharge", "fuelCharges", "rovCharges", "insuaranceCharges", 
  "odaCharges", "handlingCharges", "fmCharges", "appointmentCharges", "daccCharges", "greenTax", 
  "miscCharges", "codCharges", "topayCharges", "hamaliCharges", "chequeHandlingCharges", 
  "customSurcharges", "invoiceValueCharge", "optionalChargesAddon"
];

const uichargeKeys = [
  "baseFreight", "effectiveBaseFreight", "docketCharge", "fuelCharges", "rovCharges", "insuaranceCharges", 
  "odaCharges", "handlingCharges", "fmCharges", "appointmentCharges", "daccCharges", "greenTax", 
  "miscCharges", "codCharges", "topayCharges", "hamaliCharges", "chequeHandlingCharges", 
  "customSurcharges", "invoiceValueCharge"
];

for (const [destPin, res] of Object.entries(data)) {
  md += `## Destination: ${destPin}\n\n`;
  
  if (!res.all || res.all.length === 0) {
    md += `*No vendors serve this route.*\n\n`;
    continue;
  }
  
  md += `| Vendor (Type) | Total (None) | Breakdown (None) | Total (All) | Breakdown (All) | Math Check (All Opt) |\n`;
  md += `|---|---|---|---|---|---|\n`;

  // Process top 3 public + UTSF vendors just to keep it readable, or all
  const vendors = res.all.slice(0, 15); 
  
  for (const vAll of vendors) {
    const cid = vAll.companyId;
    const vNone = res.none.find(x => x.companyId === cid) || {};
    
    // Format breakdown none
    let noneBk = [];
    let noneSum = 0;
    for (const key of uichargeKeys) {
      const hasEffective = vNone['effectiveBaseFreight'] || (vNone.breakdown && vNone.breakdown['effectiveBaseFreight']);
      if (key === 'baseFreight' && hasEffective) continue; // skip base if we have effective
      const val = vNone[key] || (vNone.breakdown ? vNone.breakdown[key] : 0);
      if (val > 0) {
        noneBk.push(`${key}: ₹${val}`);
        noneSum += val;
      }
    }
    
    // Format breakdown all
    let allBk = [];
    let allSum = 0;
    for (const key of uichargeKeys) {
      const hasEffective = vAll['effectiveBaseFreight'] || (vAll.breakdown && vAll.breakdown['effectiveBaseFreight']);
      if (key === 'baseFreight' && hasEffective) continue;
      const val = vAll[key] || (vAll.breakdown ? vAll.breakdown[key] : 0);
      if (val > 0) {
        allBk.push(`${key}: ₹${val}`);
        allSum += val;
      }
    }
    
    const tNone = vNone.totalCharges || 0;
    const tAll = vAll.totalCharges || 0;
    
    // We add floating point fuzziness protection
    const diff = Math.abs(tAll - allSum);
    const mathCheck = diff < 0.05 ? `✅ Match` : `❌ Gap: ₹${diff.toFixed(2)}`;
    
    // Avoid too long lines in markdown
    const sNone = noneBk.join('<br>');
    const sAll = allBk.join('<br>');
    
    md += `| ${vAll.companyName} (${vAll.source || 'MongoDB'}) | ₹${tNone} | ${sNone} | ₹${tAll} | ${sAll} | ${mathCheck} |\n`;
  }
  md += `\n`;
}

fs.writeFileSync('./comparison_table.md', md);
console.log("Generated comparison_table.md");
