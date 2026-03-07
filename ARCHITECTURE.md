# FreightCompare Backend — Architecture Document
### For Engineers New to the Codebase

---

## STEP 1 — PROJECT OVERVIEW

### What This System Does

This is the backend for a **Freight Comparison SaaS Platform** — a B2B logistics tool that allows businesses (customers) to compare freight quotes from multiple transport vendors, manage their own vendor networks, and get real-time pricing for shipments across India.

### Primary Responsibilities

- Authenticating customers and admin users with JWT + OTP dual verification
- Aggregating freight quotes from multiple vendor sources in real-time
- Managing vendor onboarding, pricing matrices, and zone configurations
- Enforcing rate limits and CAPTCHA to prevent abuse of the pricing engine
- Providing an admin layer for vendor approval, user management, and form configuration

### Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 (ES Modules) |
| Framework | Express.js 5.1.0 |
| Primary Database | MongoDB (Mongoose 8.15.1) |
| Cache / Session Store | Redis 5.5.6 (Redis Cloud) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer 2.0.2 |
| Email | Resend API |
| SMS OTP | 2Factor.in API |
| Distance | Google Maps Distance Matrix API |
| CAPTCHA | Google reCAPTCHA v2/v3 |
| Deployment | Railway.app |

### Request Lifecycle

```
Client Request (REST, JSON)
    │
    ├─► HTTPS Enforcement (301 redirect if HTTP in production)
    ├─► Per-Request UUID Generation (async context for tracing)
    ├─► Morgan HTTP Logger
    ├─► Helmet (security headers)
    ├─► CORS Validation (whitelist)
    ├─► Cookie Parser
    ├─► JSON Body Parser (10MB limit)
    ├─► NoSQL Sanitization (mongoSanitize)
    │
    ├─► Express Router
    │       │
    │       ├─► [authMiddleware.protect] — JWT verification
    │       ├─► [isAdmin / superAdmin] — Role checks
    │       ├─► [rateLimiter / calculatorRateLimiter] — Abuse prevention
    │       │
    │       └─► Controller Function
    │               │
    │               ├─► Service / Utility Layer
    │               ├─► MongoDB (Mongoose models)
    │               ├─► Redis (sessions, OTPs, rate counters)
    │               └─► External APIs (Google, 2Factor, Resend)
    │
    └─► JSON Response
```

---

## STEP 2 — FOLDER STRUCTURE

```
FC backend/
├── index.js                    ← Express server entry point
├── railway.json                ← Railway.app deployment config
├── package.json                ← ESM ("type": "module"), deps, scripts
│
├── config/
│   └── adminPermissions.js     ← Permission flag definitions
│
├── controllers/                ← Request handlers, 15 files
├── routes/                     ← Route definitions, 18 files
├── middleware/                 ← Cross-cutting concerns, 5 files
├── model/                      ← Mongoose schemas, 31 files
├── services/                   ← Business logic services, 2 files
├── utils/                      ← Shared helpers & clients, 12 files
│
├── data/
│   ├── pincodes.json           ← Static India pincode registry
│   ├── pincode_centroids.json  ← Lat/lon for geo-distance calculations
│   ├── wheelseyeRates.json     ← FTL pricing table (static data)
│   ├── zones_data.json         ← Zone definitions
│   └── utsf/                   ← UTSF transporter JSON files (disk store)
│
├── db/
│   └── db.js                   ← MongoDB connection initializer
│
└── workers/                    ← Background job workers
```

### Folder Responsibilities

**`controllers/`** — One file per domain. Controllers receive `req`/`res`, call services/models, and return responses. They contain no reusable business logic; that lives in `utils/` or `services/`.

**`routes/`** — Maps HTTP verbs + paths to controllers. Also chains middleware per route. No business logic here.

**`middleware/`** — Reusable Express middleware: JWT auth, admin checks, rate limiting. Applied in route files.

**`model/`** — Mongoose schema definitions only. Each file exports one model. 31 total, covering customers, vendors, pricing, ratings, forms, drafts, etc.

**`services/`** — Higher-level orchestration services. `utsfService.js` loads all UTSF transporter files into memory at startup and exposes O(1) lookup methods. `worker-pool.service.js` manages background workers.

**`utils/`** — Standalone utility functions and external API clients. Includes Redis client, distance calculator, chargeable weight calculator, freight rate logic, invoice charge calculator, and validators.

**`data/`** — Static reference data loaded at startup into memory. Pincode registry, geo-centroids, Wheelseye FTL rate table, zone mappings.

**`config/`** — Static configuration objects. `adminPermissions.js` defines the permission keys used across the admin system.

---

## STEP 3 — COMPLETE ROUTE INVENTORY

### Auth Routes — `/api/auth`

| Method | Path | Controller | Middleware | Purpose |
|---|---|---|---|---|
| POST | `/signup/initiate` | `authController.initiateSignup` | `authLimiter` | Begin registration: send email OTP + phone OTP |
| POST | `/signup/verify` | `authController.verifyOtpsAndSignup` | `authLimiter` | Verify both OTPs and create account |
| POST | `/login` | `authController.loginController` | `authLimiter` | Authenticate customer, issue JWT access + refresh tokens |
| POST | `/refresh` | `authController.refreshController` | — | Use refresh token to issue new access token |
| POST | `/logout` | `authController.logoutController` | `protect` | Clear cookies, delete refresh token from Redis |
| POST | `/forgot-password` | `authController.forgotPasswordController` | `authLimiter` | Generate temp password, send via email |
| PUT | `/change-password` | `authController.changePasswordController` | `protect` | Change password, increment session version |
| GET | `/me` | `authController.getCurrentUser` | `protect` | Return fresh user data from DB |

### Transporter Routes — `/api/transporter`

| Method | Path | Controller | Middleware | Purpose |
|---|---|---|---|---|
| POST | `/calculate` | `transportController.calculatePrice` | `protect`, `calculatorRateLimiter` | Calculate freight quotes from all tied-up vendors |
| GET | `/get-tied-up` | `transportController.getTemporaryTransporters` | `protect` | List tied-up (temporary) vendors for a customer |
| POST | `/add-tied-up` | `transportController.addTemporaryTransporter` | `protect`, `uploadLimiter` | Add a new tied-up vendor |
| PUT | `/update/:id` | `transportController.updateTemporaryTransporter` | `protect` | Update vendor details |
| DELETE | `/delete/:id` | `transportController.deleteTemporaryTransporter` | `protect` | Remove a tied-up vendor |
| PUT | `/:id/status` | `transportController.updateTemporaryTransporterStatus` | `protect`, `isAdmin` | Admin: approve/reject vendor |
| PUT | `/:id/verification` | `transportController.toggleTemporaryTransporterVerification` | `protect`, `isAdmin` | Admin: toggle verified badge |
| GET | `/packing-list` | `transportController.getPckingList` | `protect` | Get saved box dimension presets |
| POST | `/packing-list` | `transportController.savePckingList` | `protect` | Save box dimension presets |
| GET | `/zone-matrix/:id` | `transportController.getZoneMatrix` | `protect` | Get custom zone rate overrides |
| PUT | `/zone-matrix/:id` | `transportController.updateZoneMatrix` | `protect` | Update zone rate overrides |
| GET | `/wizard-data` | `transportController.getWizardData` | `protect` | Sync in-progress form state |
| POST | `/wizard-data` | `transportController.saveWizardData` | `protect` | Save in-progress form state |

### UTSF Routes — `/api/utsf`

| Method | Path | Controller | Middleware | Purpose |
|---|---|---|---|---|
| GET | `/transporters` | `utsfController.listAll` | — | List all UTSF transporters |
| GET | `/transporters/:id` | `utsfController.getOne` | — | Get single UTSF transporter |
| POST | `/calculate` | `utsfController.calculate` | `protect`, `calculatorRateLimiter` | Calculate price using UTSF in-memory engine |
| POST | `/serviceability` | `utsfController.checkServiceability` | — | Check if origin→destination is serviceable |
| POST | `/upload-json` | `utsfController.uploadJson` | `protect`, `isAdmin` | Upload a UTSF transporter as JSON body |
| POST | `/upload` | `utsfController.uploadFile` | `protect`, `isAdmin`, `multer` | Upload a `.utsf.json` file |
| DELETE | `/transporters/:id` | `utsfController.deleteOne` | `protect`, `isAdmin` | Delete UTSF transporter |
| GET | `/health` | `utsfController.healthCheck` | `protect`, `isAdmin` | Compliance scores and governance status |
| GET | `/compare/:id` | `utsfController.compare` | `protect`, `isAdmin` | Compare UTSF pincodes vs master list |
| POST | `/repair/:id` | `utsfController.repair` | `protect`, `isAdmin` | Repair malformed UTSF data |
| POST | `/rollback/:id` | `utsfController.rollback` | `protect`, `isAdmin` | Revert UTSF to previous version |
| GET | `/my-vendors` | `utsfController.myVendors` | `protect` | Get customer's own UTSF vendors |
| PUT | `/my-vendors/:id` | `utsfController.updateMyVendor` | `protect` | Update own UTSF vendor |
| DELETE | `/my-vendors/:id` | `utsfController.deleteMyVendor` | `protect` | Delete own UTSF vendor |
| GET | `/nearest-serviceable` | `utsfController.nearestServiceable` | — | Find nearest serviceable pincode (geo-search) |

### Vendor (Wheelseye FTL) Routes — `/api/vendor`

| Method | Path | Controller | Middleware | Purpose |
|---|---|---|---|---|
| POST | `/wheelseye-pricing` | `wheelseyePricingController.calculate` | `protect`, `calculatorRateLimiter` | Calculate FTL price from Wheelseye rate table |
| POST | `/wheelseye-distance` | `wheelseyePricingController.getDistance` | `protect` | Get distance between pincodes (Google Maps) |

### Admin Routes — `/api/admin`

| Method | Path | Controller | Middleware | Purpose |
|---|---|---|---|---|
| GET | `/customers` | `adminController.getCustomers` | `protect`, `isAdmin` | List all customers (paginated) |
| GET | `/customers/:id` | `adminController.getCustomerById` | `protect`, `isAdmin` | Get single customer profile |
| PUT | `/customers/:id` | `adminController.updateCustomer` | `protect`, `isAdmin` | Update customer details |
| DELETE | `/customers/:id` | `adminController.deleteCustomer` | `protect`, `isAdmin` | Delete customer account |
| GET | `/pending-vendors` | `adminController.getPendingVendors` | `protect`, `isAdmin(vendorApproval)` | List unapproved vendors |
| PUT | `/vendors/:id/approve` | `adminController.approveVendor` | `protect`, `isAdmin(vendorApproval)` | Approve a vendor |
| PUT | `/vendors/:id/reject` | `adminController.rejectVendor` | `protect`, `isAdmin(vendorApproval)` | Reject a vendor |
| GET | `/stats` | `adminController.getDashboardStats` | `protect`, `isAdmin(dashboard)` | Platform-level statistics |

### Other Routes

| Route File | Base Path | Purpose |
|---|---|---|
| `freightRateRoute.js` | `/api/freight-rate` | Weight/distance slab pricing lookup |
| `odaRoute.js` | `/api/oda` | ODA zone upload and query |
| `formConfigRoute.js` | `/api/form-config` | Dynamic vendor form field management |
| `ratingRoute.js` | `/api/rating` | Vendor ratings submission and retrieval |
| `searchHistoryRoute.js` | `/api/search-history` | Recent freight search history |
| `draftRoutes.js` | `/api/drafts` | Incomplete vendor registration drafts |
| `newsRoute.js` | `/api/news` | Google News RSS proxy |
| `invoiceChargesRoutes.js` | `/api/transporters` | Invoice value handling charge config |
| `userManagementRoute.js` | `/api/users` | Admin user management |
| `biddingRoute.js` | `/api/bidding` | Competitive bidding/quoting |
| `vendorZoneController.js` | `/api/vendor-zone` | Zone mapping for vendors |

---

## STEP 4 — CONTROLLER ANALYSIS

### `authController.js` (875 lines)

**`initiateSignup(req, res)`**
- Input: `email`, `phone`, `password`, `firstName`, `lastName`, profile fields
- Validates email format + phone is 10 digits
- Checks for duplicate email/phone in DB
- Generates 6-digit numeric email OTP
- Calls 2Factor.in API to send phone OTP (stores `sessionId`)
- Stores entire payload + both OTPs in Redis with 10-minute TTL under `pendingSignup:{email}`
- Sends OTP email via Resend API
- Response: `{ message: "OTPs sent" }`

**`verifyOtpsAndSignup(req, res)`**
- Input: `email`, `emailOtp`, `phoneOtp`
- Loads pending signup from Redis
- Verifies email OTP (string match)
- Calls 2Factor.in API to verify phone OTP using stored `sessionId`
- Hashes password with bcrypt (10 rounds)
- Creates `Customer` document in MongoDB
- Issues access + refresh JWT tokens
- Stores hashed refresh token in Redis (7-day TTL)
- Sets httpOnly cookies (`authToken`, `refreshToken`)
- Response: Customer profile object

**`loginController(req, res)`**
- Input: `email`, `password`
- Checks Redis for account lock (`loginLock:{email}`)
- Finds customer by email; validates password with bcrypt
- On failure: increments `loginFail:{email}` counter; locks at 10 failures
- On success: increments `sessionVersion` in DB (invalidates old tokens on other devices)
- Issues access + refresh tokens, stores refresh hash in Redis
- Response: Customer profile object

**`refreshController(req, res)`**
- Reads `refreshToken` from cookie
- Verifies JWT signature
- Looks up hashed token in Redis
- Issues new access token (does not rotate refresh token)
- Response: `{ message: "Token refreshed" }`

**`logoutController(req, res)`**
- Deletes `refreshToken:{userId}` from Redis
- Clears both cookies
- Response: `{ message: "Logged out" }`

**`forgotPasswordController(req, res)`**
- Input: `email`
- Generates random 12-char password via `generate-password`
- Updates DB with new bcrypt hash
- Increments `sessionVersion` (logs out all active sessions)
- Sends temp password via Resend email
- Response: `{ message: "Temporary password sent" }`

**`changePasswordController(req, res)`**
- Input: `currentPassword`, `newPassword`
- Validates current password with bcrypt
- Updates with new bcrypt hash
- Increments `sessionVersion`
- Sends confirmation email
- Response: `{ message: "Password changed" }`

**`getCurrentUser(req, res)`**
- Returns `req.customer` (freshly loaded in `protect` middleware)
- Response: Full customer document

---

### `transportController.js` (3764 lines — largest file)

**`calculatePrice(req, res)`**
- Input: `fromPincode`, `toPincode`, `weight`, `noofboxes`, `length`, `width`, `height`, `invoiceValue`
- Calculates chargeable weight = max(actual, volumetric)
- Queries `usertransporterrelationshipModel` for all tied-up vendors of the customer
- For each vendor: checks serviceability of `toPincode`, finds zone, looks up price rate
- Applies multi-component surcharge formula (fuel, ROV, insurance, handling, FM, appointment, ODA)
- Returns sorted array of quotes
- Response: `{ quotes: [...], chargeableWeight, distance }`

**`getTemporaryTransporters(req, res)`**
- Input: query filters (`status`, `verified`, search term), pagination
- Returns paginated list of `TemporaryTransporter` documents owned by customer
- Response: `{ transporters: [...], total, page, limit }`

**`addTemporaryTransporter(req, res)`**
- Input: Full vendor object (companyName, serviceability array, pricing, zones)
- Creates `TemporaryTransporter` + links to customer via relationship model
- Initial status: `pending`
- Response: Created vendor document

**`updateTemporaryTransporterStatus(req, res)`**
- Input: `status` (`approved` | `rejected`), optional `rejectionReason`
- Admin only (requires `vendorApproval` permission)
- Updates `TemporaryTransporter.status`
- Response: Updated document

**`savePckingList(req, res)` / `getPckingList(req, res)`**
- Stores/retrieves named box presets (L×W×H + weight) per customer
- Used to speed up repeat shipment calculations

**`updateZoneMatrix(req, res)` / `getZoneMatrix(req, res)`**
- Stores per-origin-pincode custom zone rate tables
- Overrides default pricing matrix for that vendor

**`getWizardData(req, res)` / `saveWizardData(req, res)`**
- Persists in-progress multi-step form state (e.g., vendor add wizard)
- Keyed by customer ID
- Enables cross-device form continuity

---

### `formConfigController.js` (363 lines)

**`getFormConfig(req, res)`**
- Input: `pageId` (e.g., `"add-vendor"`)
- If no config exists → auto-seeds default fields
- Auto-merges any new default fields missing from existing config (schema evolution)
- Response: Ordered array of field definitions

**`updateField(req, res)`**
- Input: `pageId`, `fieldId`, field properties
- Requires `formBuilder` admin permission
- Records `editedBy` (admin ID) + `editedAt` timestamp
- Response: Updated field

**`deleteField(req, res)`**
- Marks field as deleted (soft delete) or removes from config array
- Admin only with `formBuilder` permission

---

### `ratingController.js` (474 lines)

**`submitRating(req, res)`**
- Input: `vendorId`, `vendorType`, ratings object (5 dimensions: price, delivery, tracking, sales, damage)
- Validates all rating values are 1–5
- Upserts `VendorRating` document (one rating per customer per vendor)
- Response: Saved rating

**`getRatings(req, res)`**
- Input: `vendorId`, `vendorType`
- Aggregates all ratings for vendor
- Calculates per-dimension averages + overall average
- Response: `{ averages: {...}, count, ratings: [...] }`

**`getMyRating(req, res)`**
- Returns the calling customer's own rating for a specific vendor

---

### `searchHistoryController.js` (147 lines)

**`saveSearch(req, res)`**
- Input: `fromPincode`, `toPincode`, `mode`, `weight`, `boxes`, `topQuotes`
- Saves to `SearchHistory` model with 7-day TTL
- Response: Saved document

**`getSearchHistory(req, res)`**
- Paginated list (default 15/page, max 50/page)
- Sorted by most recent first
- Response: `{ history: [...], total, page }`

**`clearHistory(req, res)` / `deleteEntry(req, res)`**
- Deletes all entries or single entry for calling customer

---

### `adminController.js`

**`getCustomers(req, res)`**
- Paginated customer list with optional search by name/email/phone
- Returns sanitized profiles (no passwords)

**`updateCustomer(req, res)`**
- Updates any customer field including admin flags and permissions
- Used to promote/demote admins and grant specific permissions

**`getDashboardStats(req, res)`**
- Aggregate counts: total customers, total vendors, pending approvals, calculations today
- Requires `dashboard` permission

---

## STEP 5 — BUSINESS LOGIC FLOWS

### Flow 1: Customer Registration (Dual OTP)

```
1. Customer submits signup form
2. Server validates no duplicate email/phone in DB
3. Server generates 6-digit email OTP
4. Server calls 2Factor.in → SMS OTP sent to phone
5. Both OTPs + full form payload stored in Redis (10-min TTL)
6. Customer enters both OTPs on verification screen
7. Server verifies email OTP (string match)
8. Server verifies phone OTP via 2Factor.in session
9. Customer document created in MongoDB (password bcrypt hashed)
10. JWT access token (15m) + refresh token (7d) issued
11. Refresh token hash stored in Redis
12. Both tokens set as httpOnly cookies
13. Customer is now logged in
```

### Flow 2: Login with Account Lockout

```
1. Customer submits email + password
2. Server checks Redis for loginLock:{email} → if set: reject immediately
3. Server fetches customer from DB by email
4. bcrypt.compare(inputPassword, hashedPassword)
5a. On failure:
    - Increment loginFail:{email} counter in Redis
    - If counter reaches 10: set loginLock:{email} for 15 minutes
    - Return 401 with attempts remaining
5b. On success:
    - Delete loginFail:{email} from Redis
    - Increment customer.sessionVersion in DB (invalidates all existing sessions)
    - Issue new access + refresh tokens
    - Store refresh hash in Redis (7d TTL)
    - Set httpOnly cookies
    - Return customer profile
```

### Flow 3: Freight Quote Calculation (Tied-Up Vendors)

```
1. Authenticated customer submits shipment details
2. calculatorRateLimiter checks remaining quota (Redis counter)
   - If 5th/10th/15th request: require CAPTCHA token in header
   - Verify CAPTCHA with Google reCAPTCHA API
3. Calculate chargeable weight:
   - Volumetric weight = (L × W × H × qty) / divisor
   - Chargeable = max(actual, volumetric)
4. Get distance from Google Maps Distance Matrix API
5. For each tied-up vendor of this customer:
   a. Check if fromPincode is in vendor's priceChart
   b. Check if toPincode is in vendor's serviceability array
   c. Determine zone for toPincode
   d. Get base rate from priceChart[fromPincode][zone]
   e. Apply minimum charge if base × weight < minCharges
   f. Add surcharges (fuel %, ROV, insurance, handling, FM, appointment)
   g. Check ODA flag → add ODA charges if applicable
   h. Check invoice value handling charges → add if enabled
   i. Collect total quote
6. Sort quotes ascending by total price
7. Return top quotes array + calculation metadata
8. [Async, fire-and-forget]: Save search to SearchHistory
```

### Flow 4: UTSF Price Calculation (In-Memory)

```
1. Authenticated customer submits shipment details
2. calculatorRateLimiter check (same as above)
3. Calculate chargeable weight
4. For each UTSF transporter (in-memory, loaded at startup):
   a. Check if fromPincode exists in transporter's serviceability set (O(1))
   b. Check if toPincode exists in serviceability set (O(1))
   c. Look up zone for toPincode
   d. Get price from transporter's rate matrix
   e. Check ODA flag for toPincode
   f. Return quote object
5. Filter out transporters that can't service the route
6. Sort by price
7. Return quotes array
```

### Flow 5: Vendor Onboarding (Tied-Up Vendor)

```
1. Customer fills Add Vendor form (fields defined by FormConfig)
2. Customer submits: company name, service pincodes+zones, pricing matrix
3. TemporaryTransporter document created in DB (status: pending)
4. Relationship record created linking customer → vendor
5. Admin sees new entry in pending vendors dashboard
6. Admin reviews vendor details
7a. Admin approves → status: approved, vendor active for calculations
7b. Admin rejects → status: rejected, optional rejection reason stored
8. Admin can also toggle "verified" badge (trusted vendor flag)
```

### Flow 6: Token Refresh

```
1. Client's access token expires (after 15 minutes)
2. Client sends request with expired access token (or no access token)
3. Client calls POST /api/auth/refresh with httpOnly refresh token cookie
4. Server extracts refresh token from cookie
5. Server verifies JWT signature with refresh secret
6. Server computes SHA256(refreshToken) and looks up in Redis
7. If hash matches: issue new access token (15m), set new authToken cookie
8. If hash missing or mismatch: return 401, client must re-login
```

### Flow 7: Nearest Serviceable Pincode (Geo-Search)

```
1. Frontend queries: GET /api/utsf/nearest-serviceable?pincode=X&fromPincode=Y
2. Server collects all pincodes served by any vendor:
   - From UTSF transporters (in-memory sets)
   - From MongoDB tied-up vendors (aggregation pipeline)
3. Remove the requested pincode itself from candidates
4. Load pincode centroids (lat/lon) from data/pincode_centroids.json
5. For each candidate pincode:
   - Calculate Haversine distance from requested pincode
   - Keep only pincodes within 200km radius
6. Sort remaining candidates by distance (ascending)
7. For each candidate (closest first):
   - Actually attempt price calculation for fromPincode→candidate
   - Skip if no vendor can price the route (avoids false positives)
8. Return first working pincode + list of vendors that can service it
```

---

## STEP 6 — DATABASE MODELS

### `customerModel.js` — Platform Users

| Field | Type | Notes |
|---|---|---|
| `email` | String, unique | Login identifier |
| `phone` | Number, unique | Used for OTP |
| `password` | String | bcrypt hashed |
| `firstName`, `lastName` | String | Profile display |
| `companyName` | String | Business identity |
| `gstNumber` | String | Tax compliance |
| `isAdmin` | Boolean | Admin flag |
| `adminPermissions` | Object | `{ formBuilder, dashboard, vendorApproval, userManagement }` |
| `isSubscribed` | Boolean | Bypasses rate limits |
| `rateLimitExempt` | Boolean | Full rate limit bypass |
| `customRateLimit` | Number | Per-user custom quota |
| `sessionVersion` | Number | Incremented on login/password change; invalidates old JWTs |
| `tokenAvailable` | Number | Default: 10 |

---

### `temporaryTransporterModel.js` — Customer-Added Vendors

| Field | Type | Notes |
|---|---|---|
| `companyName` | String | Vendor name |
| `serviceability` | Array | `[{ pincode, zone, isOda }]` |
| `priceChart` | Object | Origin pincode → zone → rate |
| `priceRate` | Object | Weight slabs → rate |
| `status` | Enum | `pending / approved / rejected` |
| `isVerified` | Boolean | Admin-granted trust badge |
| `rejectionReason` | String | Populated on rejection |
| `invoiceCharges` | Object | `{ enabled, percentage, minimumAmount }` |
| `createdBy` | ObjectId | Ref: Customer |

---

### `transporterModel.js` — Legacy/Regular Transporters

Similar structure to `temporaryTransporterModel` but older schema. Still used in the bidding system.

---

### `freightRateModel.js` — Weight/Distance Slab Pricing

| Field | Type | Notes |
|---|---|---|
| `weightSlab` | Number | Max weight for this slab |
| `distanceSlab` | Number | Max distance in km |
| `vehicleType` | String | Recommended vehicle |
| `price` | Number | Rate for this slab |

Relationships: Standalone lookup table, no foreign keys.

---

### `wheelseyePricingModel.js` — FTL Rate Table

| Field | Type | Notes |
|---|---|---|
| `weightSlab` | Number | Chargeable weight threshold |
| `distanceBuckets` | Array | `[{ maxKm, price }]` |
| `vehicleType` | String | FTL vehicle category |

---

### `biddingModel.js` — Quote Requests

| Field | Type | Notes |
|---|---|---|
| `customerId` | ObjectId | Ref: Customer |
| `fromPincode`, `toPincode` | Number | Route |
| `weight` | Number | Shipment weight |
| `quotes` | Array | Collected vendor quotes |
| `status` | Enum | `open / closed / accepted` |
| `selectedQuote` | ObjectId | Accepted quote |

---

### `vendorRatingModel.js` — Multi-Dimension Ratings

| Field | Type | Notes |
|---|---|---|
| `vendorId` | String | ID from any vendor type |
| `vendorType` | Enum | `regular / temporary / special` |
| `customerId` | ObjectId | Who rated |
| `ratings.priceSupport` | 1–5 | Pricing competitiveness |
| `ratings.deliveryTime` | 1–5 | On-time performance |
| `ratings.tracking` | 1–5 | Shipment visibility |
| `ratings.salesSupport` | 1–5 | Account management |
| `ratings.damageLoss` | 1–5 | Cargo safety |
| `overallRating` | Number | Computed average |
| `comment` | String | Optional text review |

---

### `searchHistoryModel.js` — Recent Searches

| Field | Type | Notes |
|---|---|---|
| `customerId` | ObjectId | Owner |
| `fromPincode`, `toPincode` | Number | Route queried |
| `weight`, `boxes` | Number | Shipment params |
| `topQuotes` | Array | Snapshot of best quotes |
| `createdAt` | Date | TTL index: expires at 7 days |

---

### `formConfigModel.js` — Dynamic Form Builder

| Field | Type | Notes |
|---|---|---|
| `pageId` | String, unique | e.g., `"add-vendor"` |
| `fields` | Array | Field definitions |
| `fields[].fieldId` | String | Stable identifier |
| `fields[].label` | String | Display name |
| `fields[].type` | String | `text / select / checkbox / etc` |
| `fields[].visible` | Boolean | Show/hide toggle |
| `fields[].order` | Number | Render order |
| `fields[].editedBy` | ObjectId | Last admin to change |
| `fields[].editedAt` | Date | Timestamp of last change |

---

### `VendorDraft.js` — Incomplete Registrations

| Field | Type | Notes |
|---|---|---|
| `customerId` | ObjectId | Owner |
| `draftId` | String, unique | UUID |
| `draftName` | String | User-assigned name |
| `payload` | Object | Full incomplete vendor object |
| `createdAt` | Date | Used for oldest-first deletion |

Constraint: Max 2 drafts per customer. Oldest auto-deleted on third save.

---

### `VendorZoneMapping.js` — Zone Assignments

| Field | Type | Notes |
|---|---|---|
| `vendorId` | ObjectId | Ref: TemporaryTransporter |
| `originPincode` | Number | Route origin |
| `zoneMap` | Object | `{ pincode: zone }` key-value pairs |

---

### `utsfModel.js` — UTSF Backup in MongoDB

Mirrors the UTSF file format stored on disk. Used as backup/audit trail. Primary source is in-memory from disk files.

---

## STEP 7 — AUTHENTICATION SYSTEM

### Overview

The system uses a **dual-token JWT architecture** with stateful refresh tokens stored in Redis.

### Login Flow (Step-by-Step)

```
1. POST /api/auth/login  { email, password }
2. Check Redis loginLock:{email} → block if locked
3. Find customer by email in MongoDB
4. bcrypt.compare(password, customer.password)
5. On success:
   a. Reset loginFail counter in Redis
   b. Increment customer.sessionVersion (++ in DB)
   c. Generate accessToken: JWT signed with JWT_SECRET, expires 15m
      Payload: { id: customer._id, sessionVersion }
   d. Generate refreshToken: JWT signed with JWT_REFRESH_SECRET, expires 7d
      Payload: { id: customer._id }
   e. SHA256(refreshToken) → stored in Redis as refreshToken:{userId}, TTL 7d
   f. Set cookie: authToken = accessToken (httpOnly, secure in prod, sameSite)
   g. Set cookie: refreshToken = refreshToken (httpOnly, secure, sameSite)
6. Return customer profile (sans password)
```

### Protected Route Flow

```
Every request to a protected route passes through authMiddleware.protect:

1. Extract token from:
   a. Authorization: Bearer <token> header
   b. Cookie: authToken=<token>
   c. Manual cookie header parse (fallback)
2. jwt.verify(token, JWT_SECRET)
3. Extract { id, sessionVersion } from decoded payload
4. Query: Customer.findById(id)
5. Compare decoded.sessionVersion === customer.sessionVersion
   - Mismatch → token from old session (pre-logout/password-change) → 401
6. Attach customer to req.customer (and req.user for backward compat)
7. Call next()
```

### Token Refresh Flow

```
POST /api/auth/refresh (no auth middleware required)

1. Extract refreshToken from cookie
2. jwt.verify(refreshToken, JWT_REFRESH_SECRET)
3. SHA256(refreshToken) → compute hash
4. GET Redis refreshToken:{userId} → compare with computed hash
5. If match: issue new accessToken (15m), set new authToken cookie
6. If mismatch or missing: return 401 (requires re-login)
```

### Session Invalidation Strategy

The `sessionVersion` field in the Customer document is the key mechanism:
- Incremented on **every login** (each login invalidates all previous sessions)
- Incremented on **password change**
- Incremented on **forgot password** (temp password issued)

This means if a user changes their password, all devices with old tokens get a 401 on next request.

### Cookie Configuration

```javascript
// Production
{
  httpOnly: true,
  secure: true,           // HTTPS only
  sameSite: 'None',       // Required for cross-origin (Vercel → Railway)
  domain: undefined       // Defaults to current domain
}

// Development
{
  httpOnly: true,
  secure: false,
  sameSite: 'Lax'
}
```

---

## STEP 8 — MIDDLEWARE

### `authMiddleware.protect`

**What it does:** Validates JWT, loads customer from DB, enforces session version check.

**Where used:** All routes that require authentication. Applied per-route in route files.

**Why it exists:** Stateless JWT verification with stateful session invalidation (sessionVersion).

**Code path:** `middleware/authMiddleware.js`

---

### `isAdminMiddleware`

**What it does:** Checks `req.customer.isAdmin === true`, then optionally checks a specific permission key.

```javascript
// Usage variants
router.get('/form', protect, isAdmin, handler)                        // any admin
router.get('/form', protect, isAdmin('formBuilder'), handler)         // specific permission
```

**Super admin bypass:** If `req.customer.email === 'forus@gmail.com'`, all permission checks pass automatically.

**Where used:** Admin-only routes in admin, formConfig, userManagement route files.

---

### `superAdminMiddleware`

**What it does:** Only allows the hardcoded super admin email through. More restrictive than `isAdmin`.

**Where used:** Routes that should never be delegated to regular admins (e.g., creating new admin accounts, changing admin permissions).

---

### `rateLimiter.js`

Contains multiple rate limiter instances:

**`apiLimiter`** — Global: 100 req / 15 min per IP. Applied to all `/api/*` routes in `index.js`.

**`authLimiter`** — Auth routes: 5 req / 15 min per IP in production, unlimited in development.

**`uploadLimiter`** — File/vendor uploads: 10 req / hour per IP.

**`calculatorRateLimiter`** — Per-authenticated-user sliding window:
- Default: 15 calculations/hour
- Bypassed for admins, subscribers, exempt users, super admin
- Custom limit read from `customer.customRateLimit` if set
- CAPTCHA verification triggered on every 5th request
- Backed by Redis counters (not express-rate-limit's in-memory store)
- Returns rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

### Error Handling Middleware (in `index.js`)

Applied as the last middleware:

```javascript
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})
```

404 handler for unmatched routes returns `{ success: false, message: "Route not found" }`.

---

## STEP 9 — EXTERNAL SERVICES

### MongoDB

- **Provider:** MongoDB Atlas (cloud-hosted)
- **Library:** Mongoose 8.15.1
- **Connection:** `db/db.js` — connects at startup, logs success/failure
- **Usage:** Primary data store for all persistent entities (customers, vendors, ratings, history, config)

### Redis (Redis Cloud)

- **Provider:** Redis Cloud (AWS us-east-1)
- **Library:** redis 5.5.6
- **Connection:** `utils/redisClient.js` — connects at startup with 3-retry exponential backoff
- **Tested at startup:** Writes `connection_test` key with 10-second TTL to verify connectivity
- **Usage breakdown:**

| Key Pattern | Purpose | TTL |
|---|---|---|
| `pendingSignup:{email}` | OTP + signup payload during verification | 10 min |
| `loginFail:{email}` | Failed login attempt counter | 15 min |
| `loginLock:{email}` | Account lockout flag | 15 min |
| `refreshToken:{userId}` | Hashed refresh token for session validation | 7 days |
| `calc_limit:{userId}` | Per-user calculation counter | 1 hour |

### 2Factor.in (SMS OTP)

- **Used in:** `authController.initiateSignup` (send OTP) and `verifyOtpsAndSignup` (verify OTP)
- **Endpoint:** `https://2factor.in/API/V1/{API_KEY}/SMS/{phone}/{OTP}`
- **Verify endpoint:** Session-based verification using returned `sessionId`
- **Failure handling:** If 2Factor fails, signup can proceed with email-only verification (degraded security)

### Resend (Email Service)

- **From address:** `tech@foruselectric.com`
- **Used in:** Signup confirmation, forgot password temp password, password change notification
- **Library:** resend 6.6.0
- **Template:** HTML emails with branded styling

### Google Maps Distance Matrix API

- **Used in:** `utils/distanceService.js`
- **Called by:** Tied-up vendor price calculation (to get origin→destination distance for surcharge calculations)
- **Called by:** Wheelseye FTL distance lookup endpoint
- **Caching:** Results are not cached (live API call per request)

### Google reCAPTCHA

- **Used in:** `rateLimiter.js` `calculatorRateLimiter`
- **Trigger:** Every 5th calculation request (at count 5, 10, 15, ...)
- **Client sends:** `X-Captcha-Token` header
- **Verification:** POST to `https://www.google.com/recaptcha/api/siteverify`
- **Failure behavior:** If Google API is unreachable, CAPTCHA check is bypassed gracefully

### Google News RSS (Proxy)

- **Used in:** `newsRoute.js` / `newsController`
- **Source:** Google News RSS feed (India business/economy topics)
- **Cache:** 30-minute in-memory cache
- **Purpose:** Avoids CORS issues for frontend by proxying through backend
- **Response format:** NewsAPI-compatible JSON structure

---

## STEP 10 — FUNCTION INVENTORY

### `controllers/authController.js`
- `initiateSignup` — Begin registration, send dual OTPs
- `verifyOtpsAndSignup` — Complete registration, create account
- `loginController` — Authenticate, issue tokens
- `logoutController` — Invalidate session, clear cookies
- `refreshController` — Issue new access token from refresh token
- `forgotPasswordController` — Generate and email temporary password
- `changePasswordController` — Authenticated password change
- `getCurrentUser` — Return current user profile

### `controllers/transportController.js`
- `calculatePrice` — Multi-vendor freight quote calculation
- `getTemporaryTransporters` — Paginated vendor list
- `addTemporaryTransporter` — Create new tied-up vendor
- `updateTemporaryTransporter` — Edit vendor details
- `deleteTemporaryTransporter` — Remove vendor
- `updateTemporaryTransporterStatus` — Admin approve/reject
- `toggleTemporaryTransporterVerification` — Admin verify badge
- `savePckingList` / `getPckingList` — Box preset management
- `updateZoneMatrix` / `getZoneMatrix` — Zone rate overrides
- `getWizardData` / `saveWizardData` — Cross-device form state sync
- `calculateBiddingPrice` — Bidding-specific calculation variant

### `controllers/adminController.js`
- `getCustomers` — Paginated customer list
- `getCustomerById` — Single customer profile
- `updateCustomer` — Edit customer / promote to admin
- `deleteCustomer` — Remove customer account
- `getPendingVendors` — Unapproved vendor queue
- `approveVendor` / `rejectVendor` — Vendor status management
- `getDashboardStats` — Platform metrics

### `controllers/formConfigController.js`
- `getFormConfig` — Get (or auto-seed) form field config
- `updateField` — Modify a form field (admin)
- `deleteField` — Remove a form field (admin)
- `addField` — Add new form field (admin)

### `controllers/ratingController.js`
- `submitRating` — Save/update a vendor rating
- `getRatings` — Aggregated ratings for a vendor
- `getMyRating` — Caller's own rating for a vendor
- `getRatingSummary` — Summary stats for multiple vendors

### `controllers/searchHistoryController.js`
- `saveSearch` — Persist a search with top quotes
- `getSearchHistory` — Paginated search history
- `clearHistory` — Delete all history for user
- `deleteEntry` — Delete single history entry

### `controllers/freightRateController.js`
- `calculateRate` — Slab-based weight/distance rate lookup
- `getAvailableOptions` — List available vehicles/slabs
- `getStats` — Rate table statistics

### `controllers/wheelseyePricingController.js`
- `calculate` — FTL price from Wheelseye rate table
- `getDistance` — Distance between pincodes via Google Maps

### `controllers/biddingController.js`
- `createBid` — Open a new bid request
- `getBids` — List bids for a customer
- `acceptBid` — Accept a specific quote
- `closeBid` — Close bidding without selection

### `controllers/odaController.js`
- `uploadOdaZones` — Upload ODA-enabled zone list
- `getOdaZones` — Retrieve ODA configuration

### `controllers/draftController.js`
- `saveDraft` — Save incomplete vendor registration (max 2)
- `getDrafts` — List saved drafts
- `deleteDraft` — Delete a specific draft

### `controllers/vendorZoneController.js`
- `getZoneMapping` — Get zone assignments for vendor
- `updateZoneMapping` — Update pincode→zone mapping

### `utils/redisClient.js`
- `getRedisClient` — Returns singleton Redis client
- `connectRedis` — Initialize and test connection

### `utils/distanceService.js`
- `getDistanceBetweenPincodes(from, to)` — Google Maps Distance Matrix call, returns `{ distanceKm, estimatedTime }`

### `utils/chargeableWeightService.js`
- `calculateChargeableWeight(actual, L, W, H, qty, divisor)` — Returns max(actual, volumetric)

### `utils/freightRateService.js`
- `findRateForWeightDistance(weight, distance)` — DB lookup for closest slab
- `getAvailableSlabs()` — List all defined slabs

### `utils/invoiceChargeCalculator.js`
- `calculateInvoiceCharge(invoiceValue, vendorConfig)` — Returns additional charge based on invoice value percentage

### `utils/pincodeStore.js`
- `getAllPincodes()` — In-memory set of all valid India pincodes
- `isPincodeValid(pincode)` — O(1) validity check

### `services/utsfService.js`
- `loadAllTransporters()` — Load all `.utsf.json` files from disk into memory at startup
- `getTransporter(id)` — O(1) by ID lookup
- `getAllTransporters()` — Full list
- `calculatePrice(transporterId, from, to, weight, dims)` — Price from in-memory rate matrix
- `checkServiceability(transporterId, pincode)` — O(1) serviceability check
- `addTransporter(data)` — Write new UTSF file to disk + add to memory
- `deleteTransporter(id)` — Remove from disk + memory
- `repairTransporter(id)` — Fix malformed data fields
- `rollback(id)` — Restore from backup

---

## STEP 11 — CRITICAL SYSTEM AREAS

### 1. Authentication & Session Management

**Risk level: High**

The `sessionVersion` field is the core mechanism preventing session hijacking across devices. Any code that touches `Customer.sessionVersion` must:
- Always increment (never decrement or reset to 0)
- Always be called whenever credentials change

The Redis refresh token store is equally critical. If `refreshToken:{userId}` is not deleted on logout, sessions remain alive indefinitely.

**Sensitive files:** `middleware/authMiddleware.js`, `controllers/authController.js`

---

### 2. Freight Price Calculation Engine

**Risk level: High**

`transportController.calculatePrice` is the core revenue-generating feature. The multi-component surcharge formula is complex:

```
totalCharge = baseFreight
  + docketCharges + greenTax + DACC + miscCharges
  + (baseFreight × fuelSurchargePercent)
  + ROV charges (tiered % + fixed)
  + insurance (% + fixed)
  + handlingCharges (fixed + %)
  + FM charges (% + fixed)
  + appointmentCharges (% + fixed)
  [+ ODA charges if applicable]
  [+ invoiceValueCharges if enabled]
```

A bug here directly causes incorrect pricing visible to customers. Rounding, order-of-operations, and minimum charge enforcement must all be tested carefully.

**Sensitive files:** `controllers/transportController.js`, `utils/invoiceChargeCalculator.js`

---

### 3. UTSF In-Memory Store

**Risk level: Medium-High**

The UTSF service loads all transporter data into process memory at startup. This means:
- Restarts clear in-memory state (must reload from disk)
- Writes to disk must be atomic or data corruption is possible
- The in-memory store and disk files can drift if a write partially fails

Any changes to `utsfService.addTransporter`, `deleteTransporter`, or `rollback` must ensure disk writes complete before updating memory.

**Sensitive files:** `services/utsfService.js`

---

### 4. Rate Limiter & CAPTCHA

**Risk level: Medium**

The `calculatorRateLimiter` in Redis is the only abuse prevention for the pricing engine. Issues to watch for:
- Redis key expiry must use sliding window correctly (reset TTL on each increment)
- CAPTCHA bypass on Google API failure is intentional but means a Google outage = no CAPTCHA
- The per-user limit exemption logic checks multiple fields; any new bypass path must be added carefully

**Sensitive files:** `middleware/rateLimiter.js`

---

### 5. Admin Permission System

**Risk level: Medium**

The `isAdminMiddleware` has a hardcoded super admin email bypass. Concerns:
- Super admin email (`forus@gmail.com`) is a literal string in middleware — if this account is compromised, no permission system applies
- The `updateCustomer` endpoint can set `isAdmin: true` and modify `adminPermissions` — this is intentional but must never be accessible to non-super-admins
- Permission checks are string-based (`'formBuilder'`, `'dashboard'`, etc.) — typos in route files would silently grant unrestricted admin access

**Sensitive files:** `middleware/isAdminMiddleware.js`, `controllers/adminController.js`

---

### 6. Vendor Approval Flow

**Risk level: Medium**

Vendors in `pending` status are not included in price calculations. The status transition (`pending → approved`) immediately makes a vendor active in all future calculations. Ensure no race conditions where a partially-entered vendor gets approved before all required pricing data is present.

---

## STEP 12 — SUMMARY OF FEATURES

| Feature | Description | Key Files |
|---|---|---|
| **Customer Authentication** | Dual OTP signup (email + SMS), JWT + httpOnly cookie login, session version enforcement, account lockout | `authController.js`, `authMiddleware.js` |
| **Token Management** | Short-lived access tokens (15m), long-lived refresh tokens (7d) stored as Redis hashes, single-session enforcement | `authController.js`, `redisClient.js` |
| **Freight Quote Engine (Tied-Up Vendors)** | Multi-component surcharge calculation per vendor, distance-based pricing, ODA surcharges, invoice value charges | `transportController.js`, `invoiceChargeCalculator.js` |
| **UTSF Quote Engine** | Fast in-memory price calculation from disk-loaded transporter files, O(1) serviceability checks | `utsfService.js`, UTSF routes |
| **FTL Pricing (Wheelseye)** | Weight-slab + distance-bucket rate table for full-truckload shipments | `wheelseyePricingController.js` |
| **Vendor Onboarding** | Dynamic form (admin-configurable fields), tied-up vendor submission, admin approval/rejection workflow | `transportController.js`, `formConfigController.js` |
| **Vendor Management** | CRUD for tied-up vendors, zone matrix overrides, pricing updates, ODA configuration | `transportController.js`, `vendorZoneController.js` |
| **Vendor Ratings** | 5-dimension rating system (price, delivery, tracking, sales, damage), works for all vendor types including special types | `ratingController.js`, `vendorRatingModel.js` |
| **UTSF File Management** | Upload/download/repair/rollback UTSF transporter files, admin health checks, governance versioning | `utsfService.js`, UTSF admin routes |
| **Per-User Rate Limiting** | Redis-backed sliding window, dynamic limits (admin/subscriber bypasses, custom limits), CAPTCHA every 5 requests | `rateLimiter.js` |
| **Dynamic Form Builder** | Admin UI to add/remove/hide vendor registration form fields without code changes; schema auto-evolution | `formConfigController.js`, `formConfigModel.js` |
| **Search History** | Automatic search saves with top quotes, 7-day TTL, pagination | `searchHistoryController.js` |
| **Vendor Drafts** | Save incomplete vendor registrations (max 2), restore later; oldest auto-deleted | `draftController.js`, `VendorDraft.js` |
| **ODA Management** | Per-zone and per-transporter ODA flag management, affects surcharge in calculations | `odaController.js` |
| **Nearest Serviceable Pincode** | Geo-search combining UTSF + MongoDB vendors, Haversine distance, 200km radius, verified by actual pricing | UTSF routes, `utsfService.js` |
| **Admin Dashboard** | Customer management, vendor approval queue, platform statistics, user promotion/demotion | `adminController.js` |
| **Granular Admin Permissions** | Four permission types (formBuilder, dashboard, vendorApproval, userManagement), super admin override | `isAdminMiddleware.js`, `customerModel.js` |
| **News Proxy** | Google News RSS aggregation for India business news, 30-minute cache, CORS bypass | `newsRoute.js` |
| **Bidding System** | Competitive quote requests to multiple vendors, quote comparison, bid acceptance | `biddingController.js` |
| **Security Infrastructure** | Helmet headers, CORS whitelist, NoSQL injection protection, HTTPS enforcement, bcrypt hashing | `index.js`, middleware |
| **Observability** | Per-request UUID tracing, async context store, Morgan HTTP logs, Axios call logging, 15-second memory health metrics | `index.js` |

---

*Document generated from live codebase analysis — 31 models, 15 controllers, 18 route files, 12 utilities, 5 middleware files.*
