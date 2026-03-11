# Freight Optional Charges — Live Calculation Test

> Generated: 10/3/2026, 11:12:33 am IST
> Architecture: **Option A — Conditional Additive** (no post-calculation subtraction)
> Origin fixed: **110020** (SOUTH EAST, DELHI — Zone N1)
> Shipment: 10 kg actual, 30×30×30 cm, 1 box
> Invoice Value: ₹50,000
> Total test cases: **20** | Destinations span all 19 zones

---

## Test 1: None (baseline)

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 122224 — NUH, HARYANA (Zone **N1**) |
| Optional Charges Selected | _none_ |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc` |
| Vendors Found | 4 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹7.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹75

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹75 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹175** |

#### Safexpress ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹120

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹120 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹572** |

#### Delhivery Lite ✓

- **Unit Price:** ₹5.8/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹6 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| **TOTAL** | **₹910** |

#### DP World ✓

- **Unit Price:** ₹6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹7 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| **TOTAL** | **₹1,085** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹7.5 | 10 kg | ₹75 | **₹175** |
| Safexpress ✓ | ₹12 | 10 kg | ₹120 | **₹572** |
| Delhivery Lite ✓ | ₹5.8 | 10 kg | ₹300 | **₹910** |
| DP World ✓ | ₹6 | 10 kg | ₹350 | **₹1,085** |

---

## Test 2: All optional

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 242101 — SHAHJAHANPUR, UTTAR PRADESH (Zone **N3**) |
| Optional Charges Selected | `oda`, `cod`, `topay`, `greentax`, `hamali`, `misc`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda`, `cod`, `topay`, `greentax`, `hamali`, `misc`, `chequehandling` |
| Vendors Found | 1 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| Misc | ₹44 |
| COD | ₹2 |
| To-Pay | ₹2 |
| **TOTAL** | **₹255** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹255** |

---

## Test 3: COD only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 180018 — JAMMU, JAMMU AND KASHMIR (Zone **N4**) |
| Optional Charges Selected | `cod` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `cod` |
| Vendors Found | 9 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| DACC | ₹44 |
| COD | ₹2 |
| **TOTAL** | **₹165** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹9.8/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹98

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹98 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹198** |

#### Ekart ✓

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹9 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹462** |

#### Rivigo ✓

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹9 |
| COD | ₹100 |
| **TOTAL** | **₹484** |

#### Safexpress ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹120

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹120 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹572** |

#### Delhivery Lite ✓

- **Unit Price:** ₹8.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹8 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| COD | ₹100 |
| **TOTAL** | **₹1,012** |

#### DP World ✓

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹11 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| COD | ₹200 |
| **TOTAL** | **₹1,288** |

#### DTDC ✓

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹11 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| COD | ₹100 |
| **TOTAL** | **₹1,341** |

#### Gati ✓

- **Unit Price:** ₹4.62/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| COD | ₹150 |
| **TOTAL** | **₹1,915** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹165** |
| Delhivery (Shipshopy) ✓ | ₹9.8 | 10 kg | ₹98 | **₹198** |
| Ekart ✓ | ₹9 | 10 kg | ₹90 | **₹462** |
| Rivigo ✓ | ₹9 | 10 kg | ₹350 | **₹484** |
| Safexpress ✓ | ₹12 | 10 kg | ₹120 | **₹572** |
| Delhivery Lite ✓ | ₹8.1 | 10 kg | ₹300 | **₹1,012** |
| DP World ✓ | ₹9 | 10 kg | ₹350 | **₹1,288** |
| DTDC ✓ | ₹9 | 10 kg | ₹400 | **₹1,341** |
| Gati ✓ | ₹4.62 | 10 kg | ₹400 | **₹1,915** |

---

## Test 4: ODA only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 141411 — LUDHIANA, PUNJAB (Zone **N2**) |
| Optional Charges Selected | `oda` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda` |
| Vendors Found | 9 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| DACC | ₹44 |
| **TOTAL** | **₹164** |

#### Rivigo ✓

- **Unit Price:** ₹7.25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹7 |
| **TOTAL** | **₹383** |

#### Ekart ✓

- **Unit Price:** ₹7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹70

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹70 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹7 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹440** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹8.6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹86

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹86 |
| Docket Charge | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹686** |

#### Safexpress ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹120

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹120 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹1,072** |

#### Delhivery Lite ✓

- **Unit Price:** ₹6.6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹7 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| ODA | ₹400 |
| **TOTAL** | **₹1,311** |

#### DP World ✓

- **Unit Price:** ₹7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹8 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| ODA | ₹450 |
| **TOTAL** | **₹1,536** |

#### DTDC ✓

- **Unit Price:** ₹6.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹8 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| ODA | ₹500 |
| **TOTAL** | **₹1,738** |

#### Gati ✓

- **Unit Price:** ₹4.62/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| **TOTAL** | **₹1,765** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹164** |
| Rivigo ✓ | ₹7.25 | 10 kg | ₹350 | **₹383** |
| Ekart ✓ | ₹7 | 10 kg | ₹70 | **₹440** |
| Delhivery (Shipshopy) ✓ | ₹8.6 | 10 kg | ₹86 | **₹686** |
| Safexpress ✓ | ₹12 | 10 kg | ₹120 | **₹1,072** |
| Delhivery Lite ✓ | ₹6.6 | 10 kg | ₹300 | **₹1,311** |
| DP World ✓ | ₹7 | 10 kg | ₹350 | **₹1,536** |
| DTDC ✓ | ₹6.5 | 10 kg | ₹400 | **₹1,738** |
| Gati ✓ | ₹4.62 | 10 kg | ₹400 | **₹1,765** |

---

## Test 5: ToPay only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 194109 — NYOMA, LADAKH (Zone **X3**) |
| Optional Charges Selected | `topay` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `topay` |
| Vendors Found | 0 |

> ⚠️ No vendors found serving this route. Destination may not be in any vendor's service area.


---

## Test 6: GreenTax only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 480108 — CHHINDWARA, MADHYA PRADESH (Zone **C2**) |
| Optional Charges Selected | `greentax` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `greentax` |
| Vendors Found | 9 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| **TOTAL** | **₹207** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹120

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹120 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹220** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹250

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹250 |
| Docket Charge | ₹50 |
| **TOTAL** | **₹300** |

#### Ekart ✓

- **Unit Price:** ₹8.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹85

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹85 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹9 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹456** |

#### Rivigo ✓

- **Unit Price:** ₹8.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹9 |
| Green Tax | ₹100 |
| **TOTAL** | **₹484** |

#### Safexpress ✓

- **Unit Price:** ₹13/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹130

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹130 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹582** |

#### Delhivery Lite ✓

- **Unit Price:** ₹9.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹10 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| **TOTAL** | **₹913** |

#### DP World ✓

- **Unit Price:** ₹8.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹10 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| Green Tax | ₹75 |
| **TOTAL** | **₹1,163** |

#### Gati ✓

- **Unit Price:** ₹8.14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹24 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| **TOTAL** | **₹1,975** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹207** |
| Delhivery (Shipshopy) ✓ | ₹12 | 10 kg | ₹120 | **₹220** |
| ShipMove PAN India  ✓ | ₹25 | 10 kg | ₹250 | **₹300** |
| Ekart ✓ | ₹8.5 | 10 kg | ₹85 | **₹456** |
| Rivigo ✓ | ₹8.5 | 10 kg | ₹350 | **₹484** |
| Safexpress ✓ | ₹13 | 10 kg | ₹130 | **₹582** |
| Delhivery Lite ✓ | ₹9.5 | 10 kg | ₹300 | **₹913** |
| DP World ✓ | ₹8.5 | 10 kg | ₹350 | **₹1,163** |
| Gati ✓ | ₹8.14 | 10 kg | ₹400 | **₹1,975** |

---

## Test 7: Hamali only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 413132 — PUNE, MAHARASHTRA (Zone **W2**) |
| Optional Charges Selected | `hamali` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `hamali` |
| Vendors Found | 8 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| DACC | ₹44 |
| **TOTAL** | **₹163** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹17/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹170

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹170 |
| Docket Charge | ₹50 |
| **TOTAL** | **₹220** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹12.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹125

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹125 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹225** |

#### Rivigo ✓

- **Unit Price:** ₹10/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹10 |
| ROV / FOV | ₹1 |
| **TOTAL** | **₹386** |

#### Safexpress ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹140

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹140 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹592** |

#### Delhivery Lite ✓

- **Unit Price:** ₹9.6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹10 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| **TOTAL** | **₹913** |

#### DP World ✓

- **Unit Price:** ₹11/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹13 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| **TOTAL** | **₹1,091** |

#### Gati ✓

- **Unit Price:** ₹8.22/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹25 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| **TOTAL** | **₹1,776** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹163** |
| ShipMove PAN India  ✓ | ₹17 | 10 kg | ₹170 | **₹220** |
| Delhivery (Shipshopy) ✓ | ₹12.5 | 10 kg | ₹125 | **₹225** |
| Rivigo ✓ | ₹10 | 10 kg | ₹350 | **₹386** |
| Safexpress ✓ | ₹14 | 10 kg | ₹140 | **₹592** |
| Delhivery Lite ✓ | ₹9.6 | 10 kg | ₹300 | **₹913** |
| DP World ✓ | ₹11 | 10 kg | ₹350 | **₹1,091** |
| Gati ✓ | ₹8.22 | 10 kg | ₹400 | **₹1,776** |

---

## Test 8: Misc only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 400044 — MUMBAI SUBURBAN, MAHARASHTRA (Zone **W1**) |
| Optional Charges Selected | `misc` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `misc` |
| Vendors Found | 1 |

### Vendor Results (sorted by total, lowest first)

#### DP World ✓

- **Unit Price:** ₹10.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹13 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| **TOTAL** | **₹1,090** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| DP World ✓ | ₹10.5 | 10 kg | ₹350 | **₹1,090** |

---

## Test 9: Cheque Handling only

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 533646 — ALLURI SITHARAMA RAJU, ANDHRA PRADESH (Zone **S2**) |
| Optional Charges Selected | `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `chequehandling` |
| Vendors Found | 1 |

### Vendor Results (sorted by total, lowest first)

#### DP World ✓

- **Unit Price:** ₹12.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹15 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| **TOTAL** | **₹1,093** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| DP World ✓ | ₹12.5 | 10 kg | ₹350 | **₹1,093** |

---

## Test 10: COD + GreenTax

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 462018 — BHOPAL, MADHYA PRADESH (Zone **C1**) |
| Optional Charges Selected | `cod`, `greentax` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `cod`, `greentax` |
| Vendors Found | 8 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| COD | ₹2 |
| **TOTAL** | **₹209** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹11.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹111

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹111 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹211** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹16/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹160

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹160 |
| Docket Charge | ₹50 |
| COD | ₹200 |
| **TOTAL** | **₹410** |

#### Ekart ✓

- **Unit Price:** ₹8/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹80

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹80 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹8 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹451** |

#### Safexpress ✓

- **Unit Price:** ₹13/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹130

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹130 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹582** |

#### Delhivery Lite ✓

- **Unit Price:** ₹8.4/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹8 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| COD | ₹100 |
| **TOTAL** | **₹1,012** |

#### DP World ✓

- **Unit Price:** ₹8/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹10 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| Green Tax | ₹75 |
| COD | ₹200 |
| **TOTAL** | **₹1,362** |

#### Gati ✓

- **Unit Price:** ₹8.14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹24 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| COD | ₹150 |
| **TOTAL** | **₹2,125** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹209** |
| Delhivery (Shipshopy) ✓ | ₹11.1 | 10 kg | ₹111 | **₹211** |
| ShipMove PAN India  ✓ | ₹16 | 10 kg | ₹160 | **₹410** |
| Ekart ✓ | ₹8 | 10 kg | ₹80 | **₹451** |
| Safexpress ✓ | ₹13 | 10 kg | ₹130 | **₹582** |
| Delhivery Lite ✓ | ₹8.4 | 10 kg | ₹300 | **₹1,012** |
| DP World ✓ | ₹8 | 10 kg | ₹350 | **₹1,362** |
| Gati ✓ | ₹8.14 | 10 kg | ₹400 | **₹2,125** |

---

## Test 11: COD + Hamali

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 759039 — ANUGUL, ODISHA (Zone **E2**) |
| Optional Charges Selected | `cod`, `hamali` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `cod`, `hamali` |
| Vendors Found | 8 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹15.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹155

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹155 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹255** |

#### Ekart ✓

- **Unit Price:** ₹10.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹105

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹105 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹11 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹478** |

#### Rivigo ✓

- **Unit Price:** ₹10.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹11 |
| ROV / FOV | ₹1 |
| COD | ₹100 |
| **TOTAL** | **₹486** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹250

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹250 |
| Docket Charge | ₹50 |
| COD | ₹200 |
| **TOTAL** | **₹500** |

#### Safexpress ✓

- **Unit Price:** ₹15/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹150

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹150 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹602** |

#### Delhivery Lite ✓

- **Unit Price:** ₹12.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹12 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| COD | ₹100 |
| **TOTAL** | **₹1,016** |

#### DP World ✓

- **Unit Price:** ₹10.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹13 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| COD | ₹200 |
| **TOTAL** | **₹1,290** |

#### Gati ✓

- **Unit Price:** ₹9.9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹30 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| COD | ₹150 |
| **TOTAL** | **₹1,931** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹15.5 | 10 kg | ₹155 | **₹255** |
| Ekart ✓ | ₹10.5 | 10 kg | ₹105 | **₹478** |
| Rivigo ✓ | ₹10.5 | 10 kg | ₹350 | **₹486** |
| ShipMove PAN India  ✓ | ₹25 | 10 kg | ₹250 | **₹500** |
| Safexpress ✓ | ₹15 | 10 kg | ₹150 | **₹602** |
| Delhivery Lite ✓ | ₹12.1 | 10 kg | ₹300 | **₹1,016** |
| DP World ✓ | ₹10.5 | 10 kg | ₹350 | **₹1,290** |
| Gati ✓ | ₹9.9 | 10 kg | ₹400 | **₹1,931** |

---

## Test 12: COD + Misc + GreenTax

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 560075 — BENGALURU URBAN, KARNATAKA (Zone **S1**) |
| Optional Charges Selected | `cod`, `misc`, `greentax` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `cod`, `misc`, `greentax` |
| Vendors Found | 10 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹13/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹130

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹130 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹230** |

#### CARGO PLANET

- **Unit Price:** ₹9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹90

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹90 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹2 |
| FM Charges | ₹2 |
| Appointment | ₹2 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| Misc | ₹44 |
| COD | ₹2 |
| **TOTAL** | **₹253** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹17/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹170

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹170 |
| Docket Charge | ₹50 |
| COD | ₹200 |
| **TOTAL** | **₹420** |

#### Ekart ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹120

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹120 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹12 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹495** |

#### Rivigo ✓

- **Unit Price:** ₹14.38/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹1 |
| Green Tax | ₹100 |
| COD | ₹100 |
| **TOTAL** | **₹590** |

#### Safexpress ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹140

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹140 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹592** |

#### Delhivery Lite ✓

- **Unit Price:** ₹13.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| COD | ₹100 |
| **TOTAL** | **₹1,017** |

#### DTDC ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| COD | ₹100 |
| **TOTAL** | **₹1,344** |

#### DP World ✓

- **Unit Price:** ₹12/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| Green Tax | ₹75 |
| COD | ₹200 |
| **TOTAL** | **₹1,367** |

#### Gati ✓

- **Unit Price:** ₹9.9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹30 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| COD | ₹150 |
| **TOTAL** | **₹2,131** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹13 | 10 kg | ₹130 | **₹230** |
| CARGO PLANET | ₹9 | 10 kg | ₹90 | **₹253** |
| ShipMove PAN India  ✓ | ₹17 | 10 kg | ₹170 | **₹420** |
| Ekart ✓ | ₹12 | 10 kg | ₹120 | **₹495** |
| Rivigo ✓ | ₹14.38 | 10 kg | ₹350 | **₹590** |
| Safexpress ✓ | ₹14 | 10 kg | ₹140 | **₹592** |
| Delhivery Lite ✓ | ₹13.5 | 10 kg | ₹300 | **₹1,017** |
| DTDC ✓ | ₹12 | 10 kg | ₹400 | **₹1,344** |
| DP World ✓ | ₹12 | 10 kg | ₹350 | **₹1,367** |
| Gati ✓ | ₹9.9 | 10 kg | ₹400 | **₹2,131** |

---

## Test 13: ODA + COD

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 626526 — VIRUDHUNAGAR, TAMIL NADU (Zone **S3**) |
| Optional Charges Selected | `oda`, `cod` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda`, `cod` |
| Vendors Found | 4 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹14.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹147

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹147 |
| Docket Charge | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹747** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹17/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹170

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹170 |
| Docket Charge | ₹50 |
| ODA | ₹500 |
| COD | ₹200 |
| **TOTAL** | **₹920** |

#### Safexpress ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹140

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹140 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹1,092** |

#### Delhivery Lite ✓

- **Unit Price:** ₹13.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹13 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| ODA | ₹400 |
| COD | ₹100 |
| **TOTAL** | **₹1,417** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹14.7 | 10 kg | ₹147 | **₹747** |
| ShipMove PAN India  ✓ | ₹17 | 10 kg | ₹170 | **₹920** |
| Safexpress ✓ | ₹14 | 10 kg | ₹140 | **₹1,092** |
| Delhivery Lite ✓ | ₹13.1 | 10 kg | ₹300 | **₹1,417** |

---

## Test 14: ODA + Hamali + GreenTax

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 683103 — ERNAKULAM, KERALA (Zone **S4**) |
| Optional Charges Selected | `oda`, `hamali`, `greentax` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda`, `hamali`, `greentax` |
| Vendors Found | 7 |

### Vendor Results (sorted by total, lowest first)

#### Ekart ✓

- **Unit Price:** ₹13.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹135

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹135 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹511** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹14.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹147

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹147 |
| Docket Charge | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹747** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹250

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹250 |
| Docket Charge | ₹50 |
| ODA | ₹500 |
| **TOTAL** | **₹800** |

#### Safexpress ✓

- **Unit Price:** ₹15/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹150

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹150 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹1,102** |

#### Delhivery Lite ✓

- **Unit Price:** ₹14.4/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| ODA | ₹400 |
| **TOTAL** | **₹1,318** |

#### DP World ✓

- **Unit Price:** ₹13.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹16 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| ODA | ₹450 |
| Green Tax | ₹75 |
| **TOTAL** | **₹1,619** |

#### DTDC ✓

- **Unit Price:** ₹13.5/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹16 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| ODA | ₹500 |
| **TOTAL** | **₹1,746** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Ekart ✓ | ₹13.5 | 10 kg | ₹135 | **₹511** |
| Delhivery (Shipshopy) ✓ | ₹14.7 | 10 kg | ₹147 | **₹747** |
| ShipMove PAN India  ✓ | ₹25 | 10 kg | ₹250 | **₹800** |
| Safexpress ✓ | ₹15 | 10 kg | ₹150 | **₹1,102** |
| Delhivery Lite ✓ | ₹14.4 | 10 kg | ₹300 | **₹1,318** |
| DP World ✓ | ₹13.5 | 10 kg | ₹350 | **₹1,619** |
| DTDC ✓ | ₹13.5 | 10 kg | ₹400 | **₹1,746** |

---

## Test 15: ToPay + Misc

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 682556 — KAVARATTI, LAKSHADWEEP (Zone **X2**) |
| Optional Charges Selected | `topay`, `misc` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `topay`, `misc` |
| Vendors Found | 0 |

> ⚠️ No vendors found serving this route. Destination may not be in any vendor's service area.


---

## Test 16: ToPay + Hamali + Cheque

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 735136 — JALPAIGURI, WEST BENGAL (Zone **E1**) |
| Optional Charges Selected | `topay`, `hamali`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `topay`, `hamali`, `chequehandling` |
| Vendors Found | 5 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹14.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹147

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹147 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹247** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹17/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹170

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹170 |
| Docket Charge | ₹50 |
| To-Pay | ₹200 |
| **TOTAL** | **₹420** |

#### Safexpress ✓

- **Unit Price:** ₹15/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹150

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹150 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹2 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹602** |

#### Delhivery Lite ✓

- **Unit Price:** ₹11.3/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹11 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| To-Pay | ₹100 |
| **TOTAL** | **₹1,015** |

#### Gati ✓

- **Unit Price:** ₹9.9/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹30 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| **TOTAL** | **₹1,781** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹14.7 | 10 kg | ₹147 | **₹247** |
| ShipMove PAN India  ✓ | ₹17 | 10 kg | ₹170 | **₹420** |
| Safexpress ✓ | ₹15 | 10 kg | ₹150 | **₹602** |
| Delhivery Lite ✓ | ₹11.3 | 10 kg | ₹300 | **₹1,015** |
| Gati ✓ | ₹9.9 | 10 kg | ₹400 | **₹1,781** |

---

## Test 17: Greentax + Misc + Cheque

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 786191 — TINSUKIA, ASSAM (Zone **NE2**) |
| Optional Charges Selected | `greentax`, `misc`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `greentax`, `misc`, `chequehandling` |
| Vendors Found | 7 |

### Vendor Results (sorted by total, lowest first)

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹26.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹261

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹261 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹361** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹40/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹50 |
| **TOTAL** | **₹450** |

#### Rivigo ✓

- **Unit Price:** ₹26.25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹26 |
| ROV / FOV | ₹1 |
| Green Tax | ₹100 |
| **TOTAL** | **₹503** |

#### Ekart ✓

- **Unit Price:** ₹15/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹150

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹150 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹15 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹528** |

#### Safexpress ✓

- **Unit Price:** ₹25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹250

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹250 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹3 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹703** |

#### Delhivery Lite ✓

- **Unit Price:** ₹20/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹20 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| **TOTAL** | **₹924** |

#### Gati ✓

- **Unit Price:** ₹18.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹56 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| **TOTAL** | **₹2,007** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| Delhivery (Shipshopy) ✓ | ₹26.1 | 10 kg | ₹261 | **₹361** |
| ShipMove PAN India  ✓ | ₹40 | 10 kg | ₹400 | **₹450** |
| Rivigo ✓ | ₹26.25 | 10 kg | ₹350 | **₹503** |
| Ekart ✓ | ₹15 | 10 kg | ₹150 | **₹528** |
| Safexpress ✓ | ₹25 | 10 kg | ₹250 | **₹703** |
| Delhivery Lite ✓ | ₹20 | 10 kg | ₹300 | **₹924** |
| Gati ✓ | ₹18.7 | 10 kg | ₹400 | **₹2,007** |

---

## Test 18: ODA + All monetary

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 744206 — KADAMTALA, ANDAMAN & NICOBAR ISLANDS (Zone **X1**) |
| Optional Charges Selected | `oda`, `cod`, `topay`, `hamali`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda`, `cod`, `topay`, `hamali`, `chequehandling` |
| Vendors Found | 0 |

> ⚠️ No vendors found serving this route. Destination may not be in any vendor's service area.


---

## Test 19: No COD/ToPay

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 781025 — KAMRUP METRO, ASSAM (Zone **NE1**) |
| Optional Charges Selected | `oda`, `greentax`, `hamali`, `misc`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `oda`, `greentax`, `hamali`, `misc`, `chequehandling` |
| Vendors Found | 10 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹4/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹44

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹44 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹1 |
| ROV / FOV | ₹1 |
| FM Charges | ₹1 |
| Appointment | ₹1 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| Misc | ₹44 |
| **TOTAL** | **₹202** |

#### Rivigo ✓

- **Unit Price:** ₹16.25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹16 |
| ROV / FOV | ₹1 |
| Green Tax | ₹100 |
| **TOTAL** | **₹492** |

#### Ekart ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹140

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹140 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹517** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹22.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹221

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹221 |
| Docket Charge | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹821** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹40/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹50 |
| ODA | ₹500 |
| **TOTAL** | **₹950** |

#### Safexpress ✓

- **Unit Price:** ₹20/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹200

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹200 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹3 |
| ROV / FOV | ₹100 |
| ODA | ₹500 |
| **TOTAL** | **₹1,153** |

#### Delhivery Lite ✓

- **Unit Price:** ₹16.6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| ODA | ₹400 |
| **TOTAL** | **₹1,321** |

#### DP World ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| ODA | ₹450 |
| Green Tax | ₹75 |
| **TOTAL** | **₹1,620** |

#### DTDC ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| ODA | ₹500 |
| **TOTAL** | **₹1,747** |

#### Gati ✓

- **Unit Price:** ₹18.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹56 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| **TOTAL** | **₹2,007** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹4 | 10 kg | ₹44 | **₹202** |
| Rivigo ✓ | ₹16.25 | 10 kg | ₹350 | **₹492** |
| Ekart ✓ | ₹14 | 10 kg | ₹140 | **₹517** |
| Delhivery (Shipshopy) ✓ | ₹22.1 | 10 kg | ₹221 | **₹821** |
| ShipMove PAN India  ✓ | ₹40 | 10 kg | ₹400 | **₹950** |
| Safexpress ✓ | ₹20 | 10 kg | ₹200 | **₹1,153** |
| Delhivery Lite ✓ | ₹16.6 | 10 kg | ₹300 | **₹1,321** |
| DP World ✓ | ₹14 | 10 kg | ₹350 | **₹1,620** |
| DTDC ✓ | ₹14 | 10 kg | ₹400 | **₹1,747** |
| Gati ✓ | ₹18.7 | 10 kg | ₹400 | **₹2,007** |

---

## Test 20: No ODA/Hamali

| Field | Value |
|---|---|
| Origin | 110020 — SOUTH EAST (Zone **N1**) |
| Destination | 781025 — KAMRUP METRO, ASSAM (Zone **NE1**) |
| Optional Charges Selected | `cod`, `topay`, `greentax`, `misc`, `chequehandling` |
| Full optKeys sent | `docket`, `fuel`, `fov`, `handling`, `dacc`, `cod`, `topay`, `greentax`, `misc`, `chequehandling` |
| Vendors Found | 10 |

### Vendor Results (sorted by total, lowest first)

#### CARGO PLANET

- **Unit Price:** ₹4/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹44

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹44 |
| Docket Charge | ₹22 |
| Fuel Surcharge | ₹1 |
| ROV / FOV | ₹1 |
| FM Charges | ₹1 |
| Appointment | ₹1 |
| Green Tax | ₹44 |
| DACC | ₹44 |
| Misc | ₹44 |
| COD | ₹1 |
| To-Pay | ₹1 |
| **TOTAL** | **₹203** |

#### Delhivery (Shipshopy) ✓

- **Unit Price:** ₹22.1/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹221

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹221 |
| Docket Charge | ₹100 |
| **TOTAL** | **₹321** |

#### Ekart ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹140

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹140 |
| Docket Charge | ₹60 |
| Fuel Surcharge | ₹14 |
| ROV / FOV | ₹100 |
| Handling | ₹203 |
| **TOTAL** | **₹517** |

#### Rivigo ✓

- **Unit Price:** ₹16.25/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹25 |
| Fuel Surcharge | ₹16 |
| ROV / FOV | ₹1 |
| Green Tax | ₹100 |
| COD | ₹100 |
| **TOTAL** | **₹592** |

#### Safexpress ✓

- **Unit Price:** ₹20/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹200

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹200 |
| Docket Charge | ₹350 |
| Fuel Surcharge | ₹3 |
| ROV / FOV | ₹100 |
| **TOTAL** | **₹653** |

#### ShipMove PAN India  ✓

- **Unit Price:** ₹40/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹50 |
| COD | ₹200 |
| To-Pay | ₹200 |
| **TOTAL** | **₹850** |

#### Delhivery Lite ✓

- **Unit Price:** ₹16.6/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹300

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹300 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹501 |
| COD | ₹100 |
| To-Pay | ₹100 |
| **TOTAL** | **₹1,120** |

#### DTDC ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹500 |
| Handling | ₹255 |
| COD | ₹100 |
| **TOTAL** | **₹1,347** |

#### DP World ✓

- **Unit Price:** ₹14/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹350

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹350 |
| Docket Charge | ₹75 |
| Fuel Surcharge | ₹17 |
| ROV / FOV | ₹100 |
| Handling | ₹3 |
| Appointment | ₹550 |
| Green Tax | ₹75 |
| COD | ₹200 |
| **TOTAL** | **₹1,369** |

#### Gati ✓

- **Unit Price:** ₹18.7/kg
- **Chargeable Weight:** 10 kg
- **Base Freight:** ₹400

| Charge | Amount |
|---|---|
| Effective Base Freight | ₹400 |
| Docket Charge | ₹150 |
| Fuel Surcharge | ₹56 |
| ROV / FOV | ₹200 |
| Handling | ₹1,001 |
| Green Tax | ₹200 |
| COD | ₹150 |
| **TOTAL** | **₹2,157** |

### Price Comparison Summary

| Vendor | Unit ₹/kg | Chargeable kg | Base Freight | Total |
|---|---|---|---|---|
| CARGO PLANET | ₹4 | 10 kg | ₹44 | **₹203** |
| Delhivery (Shipshopy) ✓ | ₹22.1 | 10 kg | ₹221 | **₹321** |
| Ekart ✓ | ₹14 | 10 kg | ₹140 | **₹517** |
| Rivigo ✓ | ₹16.25 | 10 kg | ₹350 | **₹592** |
| Safexpress ✓ | ₹20 | 10 kg | ₹200 | **₹653** |
| ShipMove PAN India  ✓ | ₹40 | 10 kg | ₹400 | **₹850** |
| Delhivery Lite ✓ | ₹16.6 | 10 kg | ₹300 | **₹1,120** |
| DTDC ✓ | ₹14 | 10 kg | ₹400 | **₹1,347** |
| DP World ✓ | ₹14 | 10 kg | ₹350 | **₹1,369** |
| Gati ✓ | ₹18.7 | 10 kg | ₹400 | **₹2,157** |

---

## Appendix: All 20 Test Case Definitions

| # | Combo Label | Optional Keys |
|---|---|---|
| 1 | None (baseline) | _none_ |
| 2 | All optional | oda, cod, topay, greentax, hamali, misc, chequehandling |
| 3 | COD only | cod |
| 4 | ODA only | oda |
| 5 | ToPay only | topay |
| 6 | GreenTax only | greentax |
| 7 | Hamali only | hamali |
| 8 | Misc only | misc |
| 9 | Cheque Handling only | chequehandling |
| 10 | COD + GreenTax | cod, greentax |
| 11 | COD + Hamali | cod, hamali |
| 12 | COD + Misc + GreenTax | cod, misc, greentax |
| 13 | ODA + COD | oda, cod |
| 14 | ODA + Hamali + GreenTax | oda, hamali, greentax |
| 15 | ToPay + Misc | topay, misc |
| 16 | ToPay + Hamali + Cheque | topay, hamali, chequehandling |
| 17 | Greentax + Misc + Cheque | greentax, misc, chequehandling |
| 18 | ODA + All monetary | oda, cod, topay, hamali, chequehandling |
| 19 | No COD/ToPay | oda, greentax, hamali, misc, chequehandling |
| 20 | No ODA/Hamali | cod, topay, greentax, misc, chequehandling |