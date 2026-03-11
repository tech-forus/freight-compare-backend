import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/FORUS/Downloads/optional charges/freight-compare-backend/data/utsf';
const files = [
  '6968ddedc2cf85d3f4380d52.utsf.json',
  '68663285ae45acbf7506f352.utsf.json',
  '67b4b800cf900000000000c1.utsf.json'
];

files.forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (data.meta && data.meta.companyName && data.meta.companyName.toLowerCase().includes('delhivery')) {
      console.log('File:', f);
      console.log('Company:', data.meta.companyName);
      console.log('priceRate codCharges:', JSON.stringify(data.pricing?.priceRate?.codCharges));
      console.log('priceRate docketCharges:', JSON.stringify(data.pricing?.priceRate?.docketCharges));
      console.log('priceRate daccCharges:', JSON.stringify(data.pricing?.priceRate?.daccCharges));
      console.log('---');
    }
  }
});
