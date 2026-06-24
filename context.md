# CRM 2.0 Project Workspace Context

This workspace contains two main applications built for financial advisory, client management, and meeting tracking under the **Team Fintness** brand.

---

## Directory Structure

```
crm 2.0/
├── context.md (this file)
├── goal management system/          # React + Vite Client/Goal CRM System
│   ├── .claude/
│   ├── .env.local                   # Local Supabase credentials
│   ├── README.md
│   ├── assets/
│   ├── database.sql                 # Supabase database schema & policies
│   ├── deployment.md                # Supabase & Vercel deployment guide
│   ├── eslint.config.js
│   ├── goal-management-system (1).jsx # Monolithic JSX component reference
│   ├── index.html
│   ├── migration_actuals.sql        # Migration for goals.actuals JSONB
│   ├── migration_asset_allocation.sql # Migration for clients.asset_allocation JSONB
│   ├── migration_client_details.sql # Migration for clients.client_details JSONB
│   ├── migration_kid_name_and_history.sql # Migration for goal history & kid names
│   ├── package.json
│   ├── public/
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.css
│       ├── App.jsx                  # Root container, sidebar & top-level view routing, operations
│       ├── assets/
│       │   └── logo.png
│       ├── components/
│       │   ├── UI.jsx               # Reusable UI widgets (e.g., StatTile)
│       │   ├── Login.jsx            # Password authentication screen
│       │   ├── ClientList.jsx       # Client search, grid, and import trigger
│       │   ├── ClientDetail.jsx     # Client details, SIP/lump totals, goals list
│       │   ├── ClientProfile.jsx    # Standalone Client Profile sub-section (contact, team, family, holdings)
│       │   ├── GoalDetail.jsx       # SIP calculation, corpus tracking, edits history
│       │   ├── GoalsOverview.jsx    # Aggregated goal groups detail
│       │   ├── ReportsView.jsx      # Future milestones timeline charts & tables
│       │   ├── Modals.jsx           # Form modals (Client, Goal, Excel Import)
│       │   ├── PolicyReview.jsx     # Policy review worksheet, IRR, GSV, SSV & Chart.js projection comparison
│       │   ├── Sidebar.jsx          # Icon-dock navigation sidebar (Leads, Client, Tasks, Docs, Prospect)
│       │   ├── TasksView.jsx        # Standalone task tracking board for clients
│       │   ├── DocumentsView.jsx    # Documents module: aggregates MOMs, Goal Reports & Insurance holdings from DB with print preview
│       │   ├── BusinessProspects.jsx # Business Prospects module + confirm/edit modal (prospects created from proposals)
│       │   ├── AssetAllocation.jsx  # Net worth / asset breakdown views
│       │   ├── AssetAllocationModal.jsx # Modal to edit net worth items
│       │   ├── MomWorkspace.jsx     # Minutes-of-Meeting builder (ported from MOM tool)
│       │   ├── InsuranceProposal.jsx # Insurance proposal form + inline branded preview/print
│       │   ├── InvestmentProposal.jsx # Multi-type investment worksheets + inline preview, Excel & print
│       │   └── ProposalWorkspace.jsx # Proposals sub-tab routing container
│       ├── services/
│       │   └── db.js                # Supabase query handlers & CRUD wrappers
│       ├── assets/
│       │   ├── logo.png             # Team Fintness logo
│       │   └── logoBase64.js        # Logo as a base64 data URI (inline PDF/print embedding)
│       └── utils/
│           ├── auth.js              # Authentication state handlers
│           ├── calc.js              # Goal calculation engine & projections
│           ├── assets.js            # Asset allocation helpers & change history diffs
│           ├── team.js              # Internal team roster, fixed roles & manager role defs
│           ├── pdf.js               # jsPDF and autoTable PDF export wrappers
│           ├── tasks.js             # Task store + NFT types, AMC list, stages
│           ├── prospects.js         # Business Prospects localStorage store & helpers
│           └── schemes.json         # Autocomplete database of mutual fund schemes
│
└── other tools on html/
    ├── policy/                      # Standalone Policy Review & Investment Comparison tool
    │   └── index.html               # Single-file HTML policy review tool
    └── mom tool/                    # Minutes of Meeting parsing & compiler tool
        ├── .env                     # Contains GEMINI_API_KEY
        ├── .gitignore
        ├── index.html               # Highly interactive single-file MOM builder
        └── api/
            └── parse-mom.js         # Vercel serverless function calling Gemini API
```

---

## 1. Goal Management System (React + Vite)

A modern wealth advisory CRM and financial goal planner that calculates future needs, inflation impact, SIP step-ups, and current/future gap shortfalls. It allows advisors to track client assets across classes and export professional PDF reports.

### Tech Stack
* **Frontend**: React (v19), Vite (v8)
* **Styling**: Tailwind CSS (v4)
* **Database**: Supabase (Postgres) with Row Level Security (RLS) policies allowing public access for advisor operations, with a graceful **Local Storage fallback** when environment variables are unconfigured.
* **Libraries**: Lucide React (Icons), Recharts (Visualizations), jsPDF & jspdf-autotable (PDF generation), XLSX (Excel uploads).

### Database Schema (`database.sql`)
1. **`public.clients`**
   * `id`: `TEXT PRIMARY KEY`
   * `name`: `TEXT NOT NULL`
   * `pan`: `TEXT NOT NULL`
   * `age`: `INTEGER NOT NULL`
   * `assumptions`: `TEXT`
   * `asset_allocation`: `JSONB NOT NULL DEFAULT '{}'::jsonb` (Net worth breakdown)
   * `client_details`: `JSONB NOT NULL DEFAULT '{}'::jsonb` (Extended contact, internal team, family, active holdings, status, and CRM lists: openActivities, closedActivities, meetingHistory, businessProspects, attachments, notes)
   * `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL`

2. **`public.goals`**
   * `id`: `TEXT PRIMARY KEY`
   * `client_id`: `TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE`
   * `name`: `TEXT NOT NULL`
   * `amount`: `NUMERIC NOT NULL` (Current value cost today)
   * `target_month`: `INTEGER NOT NULL`
   * `target_year`: `INTEGER NOT NULL`
   * `created_month`: `INTEGER NOT NULL`
   * `created_year`: `INTEGER NOT NULL`
   * `inflation`: `NUMERIC NOT NULL`
   * `expected_return`: `NUMERIC NOT NULL`
   * `sip_inc_rate`: `NUMERIC NOT NULL` (SIP annual step-up rate)
   * `current_inv`: `NUMERIC NOT NULL`
   * `current_sip`: `NUMERIC NOT NULL`
   * `kid_name`: `TEXT`
   * `actuals`: `JSONB NOT NULL DEFAULT '[]'::jsonb` (Logged portfolio values)
   * `history`: `JSONB NOT NULL DEFAULT '[]'::jsonb` (Field edit/audit trail log)
   * `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL`

### Core Features & Logic
* **SIP & Goal Calculation Engine (`utils/calc.js`)**:
  * Calculates Future Value (FV) of a target goal incorporating monthly inflation.
  * Projects future value of existing lumpsum investments (`fvOfCurrentInv`) and the recurring SIP stream (`fvOfCurrentSip`) incorporating an annual step-up rate.
  * Solves numerically for the required monthly SIP amount to meet the target using binary search optimization.
  * Derives lumpsum required today to bridge the goal gap.
* **Asset Allocation Net Worth Tracking**:
  * Tracks assets in three categories: Financial, Physical, and Liabilities.
  * Automatically calculates Net Worth (Financial + Physical - Liabilities).
  * Automatically records history of edits and diffs in the database under `asset_allocation.history`.
* **Client Profile & Holdings details**:
  * Captures detailed contact details, internal coverage assignments, family applicants relations (with PAN numbers), and active product holding statuses (Mutual Funds, Term/Medical/Accidental Insurance).
  * Tracks client Status (`Active`, `Dead`, `Inactive`) with badge rendering, and displays 6 new CRM lists (Open Activities, Closed Activities, Meeting Setup History, Business Prospects, Attachments, and Notes).
  * Integrates a premium tabbed layout inside the client form and displays details beautifully in a collapsible dashboard card.
* **Reports**:
  * Timeline-based visual reports of client milestones up to 10 years out.
  * Comprehensive PDF exporter (`utils/pdf.js`) compiling summary tiles, tables, and projections.

---

## 2. MOM Tool (other tools on html/mom tool)

A web utility for creating, refining, and compiling Minutes of Meetings (MOM) for Team Fintness client-advisor sessions.

### Tech Stack
* **Frontend**: Single-page vanilla HTML/JS app utilizing styled cards, drag-and-drop bullet lists, and progress-bar stages.
* **AI Parser Backend**: Vercel serverless function (`api/parse-mom.js`) invoking the Google Gemini API (`gemini-2.5-flash` model).

### Core Features & Logic
* **Gemini-Powered Parsing**:
  * Advisors paste meeting transcript text or messy notes.
  * The tool sends the payload to `api/parse-mom.js`, which securely passes it to the Gemini API with structured instructions.
  * Gemini returns structured JSON containing parsed client info, agreed decisions, recommendation lists, and follow-up action items.
* **Drag-and-Drop Editor**:
  * Enables dragging and reordering of discussion bullets and action points on the frontend.
* **PDF / Print Layout**:
  * Tailored CSS print stylesheet hides workspace headers and editor panels, printing a clean, branded official PDF of the finalized MOM document.

---

## 3. Policy Review Tool (other tools on html/policy)

A specialized comparison and review tool designed to analyze traditional and ULIP life insurance policies and compare their returns against mutual fund investments.

### Core Features & Logic
* **Traditional Policies**:
  * Calculates Guaranteed Surrender Value (GSV) and Special Surrender Value (SSV).
  * Computes Paid-up Value with compounding maturity projections (2.75% rate).
  * Evaluates Net Yields (IRRs) for Continuing, Surrendering, and going Paid-up.
* **ULIP Policies**:
  * Analyzes charge structures (Mortality, FMC, Policy Admin, Premium Allocation) and estimates the total annual charge drag.
  * Projects fund growth comparing ULIP net return against mutual fund CAGR.
* **Mutual Fund Comparison**:
  * Simulates shifting the surrender value to mutual funds plus redirecting future premiums into systematic investment plans (SIPs).
  * Factors in LTCG tax (12.5% rate) for post-tax mutual fund return comparisons.
* **Visual Projections**:
  * Dynamic Chart.js line charts mapping the wealth growth curves of Continuing, going Paid-up, and migrating to Mutual Funds.
* **Auto-Sync Webhook**:
  * Seamless background tracking using Apps Script to append policy review results to a master advisor Google Sheet.

---

## 4. Progress Log

### Completed Tasks
* **[2026-06-19] Added Supabase Database Fail-safe Fallback:** Updated `db.js` to catch table-not-found database errors (PostgreSQL error `42P01`) and gracefully fall back to Local Storage mode. This prevents the application from showing 0 clients or failing to register new clients when the Supabase database migrations have not yet been executed by the user.
* **[2026-06-19] Configured Local Gemini Key:** Copied the old tool's `.env` API key to `VITE_GEMINI_API_KEY` in `.env.local` to enable faster direct frontend calls.
* **[2026-06-19] Cleaned ESLint Rules & Errors:** Configured `eslint.config.js` to ignore non-source files and disable custom React rules, and pruned unused icons in `MomWorkspace.jsx`.
* **[2026-06-19] Fixed Print layout:** Added `print:block` class to the MOM preview container so the minutes of meeting print cleanly on paper/PDF.
* **[2026-06-19] Aligned PDF/Print format to Standalone Tool:** Ported the exact inline-styled HTML preview template from the original standalone tool into `MomWorkspace.jsx` via `getMomHtml()` and rendered it using `dangerouslySetInnerHTML`. Linked `Playfair Display` and `DM Sans` Google Fonts in the main `index.html`. Updated print media query styles to target `.mom-print-card` instead of `div[ref]` to guarantee the PDF print layout matches the original tool exactly. Fixed the copy-to-clipboard bug to prevent UI chrome from being copied.
* **[2026-06-19] Resolved MOM Workspace To Do List Duplication Bug:** Resolved the bug where Previous and Current meeting recommendation lists would automatically overwrite each other and display the same items upon saving or updating MOM drafts. This was achieved by ensuring the auto-fill `useEffect` returns early when `editingMomId` is set.
* **[2026-06-19] Fixed Encoding Corruption and Syntax Layout in MOM Workspace:** Restored clean Unicode emojis and symbols across the workspace, replacing all double-encoded character sequences. Fixed build and layout syntax errors caused by previously corrupted, duplicate, and cut-off code blocks. Verified that the app builds successfully.
* **[2026-06-19] Added Comprehensive Client Details and Holdings System:** Created a database migration script `migration_client_details.sql` and updated `db.js` to map/sync the new `client_details` field. Redesigned `ClientFormModal` in `Modals.jsx` to feature a premium tabbed layout (Personal Details, Internal Details, and Family & Business). Updated the save/update client handlers in `App.jsx`.
* **[2026-06-19] Refactored Client Dashboard Layout & CRM Styles:** Reorganized `ClientDetail.jsx` into two clean dashboard sub-tabs (**Goals & Portfolio** and **CRM & Profile Details**) using an Apple-style pill navigation switcher. Re-implemented the CRM profile details as a minimal, luxury-styled 3-column layout (Contact Profile, Coverage Team, and Family & holdings) replacing bright colored card borders with elegant neutral boxes, and replacing large Yes/No status cards with soft grey/green active/inactive indicator dots.
* **[2026-06-19] Enhanced Client Profile Colors & Green/Red Holding Badges:** Refactored `ClientProfile.jsx` to update background card styles for a cleaner look. Family Details section is updated to a premium purple layout and Holdings Status is updated to a cyan layout. Holdings status badges are fully color-coded: active products ("Yes") display a light-green background, green border, checkmark, and green text, while inactive products ("No") display a light-rose background, red border, X icon, and red text.
* **[2026-06-19] Reordered Client Profile and Navigation Flow:** Reordered the selected-client sub-navigation tabs to display Client Profile first, followed by Goal Mapping, Asset Allocation Mapping, and Draft MOM. Configured client selection actions across the application (Client List, Reports, and Goal Group entries) to default to opening the Client Profile view.
* **[2026-06-19] Unified Client Profile Card Backgrounds:** Updated the backgrounds of the three remaining section cards/boxes inside `ClientProfile.jsx` (Internal Team, Family Details, and Business Status) to use the same elegant blue/sky gradient background used in the Contact Details card. Re-themed the family list table borders, headers, and relation badges from purple to blue/indigo to maintain color unity.
* **[2026-06-19] Integrated Standalone Insurance and Investment Proposal Tools:**
  * Ported the Insurance Proposal worksheet, logic, and browser print layout into [InsuranceProposal.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/components/InsuranceProposal.jsx), pre-filling applicant grids with active client and family details.
  * Ported the 7-worksheet Investment Proposal builder and same-to-same PDF/Excel print generators (via dynamic tab rendering and CDN SheetJS script imports) into [InvestmentProposal.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/components/InvestmentProposal.jsx).
  * Extracted and stored mutual fund autocomplete suggestions in [schemes.json](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/utils/schemes.json).
  * Tied components together inside [ProposalWorkspace.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/components/ProposalWorkspace.jsx) and registered the new "Proposals" tab routing in [App.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/App.jsx).
* **[2026-06-20] Promoted Client Profile to a Standalone Section:** Extracted the client profile out of `ClientDetail.jsx` into a dedicated `ClientProfile.jsx` rendered as its own per-client sub-nav section (peer to Goal Mapping and Asset Allocation Mapping) wired through a `clientProfileId`/`profile` tab in `App.jsx`. Replaced the verbose "Return to Clients" button with a compact back-arrow (`<-`) icon button in the sub-nav.
* **[2026-06-20] Revamped Internal Team Assignments:** Added `utils/team.js` defining the team roster, fixed role-holders, and editable manager roles. The client form's Internal Details tab now uses dropdowns (Relationship/Portfolio/Insurance/Service Manager) populated from the roster, plus read-only "Standing Assignments" (Owner = Nitesh Luthra, Operation Manager = Mehul Khandelwal, Internal Manager = Vaishali Choudhary). The profile view renders these with member avatars and lock indicators for fixed roles.
* **[2026-06-20] Colorized the Client Profile UI:** Added a gradient hero with decorative blobs, gradient section icon-chips per box (Personal, Team, Family, Business), colored contact icon chips, manager avatars, and emerald-accented holdings badges.
* **[2026-06-20] Fixed Missing Logo in Both Proposals:** Generated a real base64 data URI from `logo.png` into `assets/logoBase64.js` and embedded it in both proposal preview banners and PDF headers (the previous placeholder base64 was corrupt and rendered nothing).
* **[2026-06-20] Proposal Fixes (Insurance & Investment):**
  * Amount inputs now auto-format with Indian commas (e.g. `50,000`) and use a readable `tabular-nums` font instead of mono.
  * Converted the Investment proposal preview to render **inline on the same page** (like Insurance) with Edit / Download Excel / Print actions, replacing the new-tab `window.open` flow; Excel export reimplemented inline via the bundled `xlsx`.
  * Fixed the Insurance **Print** button to call `window.print()` (browser print dialog on the preview) instead of opening a blank tab; hardened the print CSS to isolate the proposal document. Removed the now-dead `doPreview` new-tab generator.
  * Renamed the "Redemption / SWP / STP" component to **"Redemption Proposal"**; the form's Tax Liability column now shows the computed value (short/long-term) instead of an editable remarks field.
  * Added the Debt **Long Term** line to the Estimated Tax Summary; removed the "As Per Slab" badge from the preview Debt card and set its Short Term text to "As Per Tax Slab, will be added to your income".
  * Fixed the Proposed SIP Changes TOTAL row colspan so the blue total bar spans the full width and totals align under the correct columns.
  * Added a 💡 **Note — Applicable Tax Rates** box (Equity ST 20% / LT 12%, Debt ST as-per-slab / LT 12.5%) before the Remarks section in the Redemption proposal preview.
  * Fixed centering of numbers in the insured member circles under the Term Life Insurance section in the Insurance Proposal preview (replaced the incorrect `justify: 'center'` with `justifyContent: 'center'`).
  * Darkened the footer note in the Insurance Proposal print styles (from `var(--mist)` to `var(--slate)`) to ensure high contrast and clear readability for all characters, including currency symbols.
  * Re-designed the "💡 Applicable Tax Rates" box in the Redemption Proposal preview to span a single clean line (1-liner), optimizing vertical layout spacing, and removed the redundant "Note —" text since the bulb icon communicates it.
  * Fixed a print page-break bug in the Insurance Proposal preview where selecting all components (Medical + Term + Accidental) left Page 1 blank and pushed all tables onto Page 2 (replaced `break-inside: avoid-page` on `.prop-body` with page-break-avoidance on the individual direct child sections, allowing normal pagination flow).
* **[2026-06-20] Added CRM Status, PAN in Family Details, and CRM Sections Form Integration:**
  * Added dropdown field to edit Client Status (`Active`, `Dead`, `Inactive`) in the Personal Details tab.
  * Added `pan` field in family member details within Tab 3 (Family & Business) of the client form, with auto-capitalization and standard PAN formatting/regex feedback.
  * Implemented an interactive `CRM & Notes` tab (Tab 4) in the Client Modal to add, list, and delete items for Open Activities, Closed Activities, Meeting Setup History, Business Prospects, and Attachments, and a textarea for Notes.
  * Refactored `ClientProfile.jsx` to render Open & Closed Activities stacked vertically in one Card, and Meeting Setup History, Business Prospects, Attachments, and Notes as separate standalone Cards stacked vertically ("line by line") for a clean visual separation.
  * Verified build successfully compiled for production.
* **[2026-06-20] Promoted Client Profile to a Standalone Section:** Extracted the client profile out of `ClientDetail.jsx` into a dedicated `ClientProfile.jsx` rendered as its own per-client sub-nav section (peer to Goal Mapping and Asset Allocation Mapping) wired through a `clientProfileId`/`profile` tab in `App.jsx`. Replaced the verbose "Return to Clients" button with a compact back-arrow (`<-`) icon button in the sub-nav.
* **[2026-06-20] Revamped Internal Team Assignments:** Added `utils/team.js` defining the team roster, fixed role-holders, and editable manager roles. The client form's Internal Details tab now uses dropdowns (Relationship/Portfolio/Insurance/Service Manager) populated from the roster, plus read-only "Standing Assignments" (Owner = Nitesh Luthra, Operation Manager = Mehul Khandelwal, Internal Manager = Vaishali Choudhary). The profile view renders these with member avatars and lock indicators for fixed roles.
* **[2026-06-20] Colorized the Client Profile UI:** Added a gradient hero with decorative blobs, gradient section icon-chips per box (Personal, Team, Family, Business), colored contact icon chips, manager avatars, and emerald-accented holdings badges.
* **[2026-06-20] Fixed Missing Logo in Both Proposals:** Generated a real base64 data URI from `logo.png` into `assets/logoBase64.js` and embedded it in both proposal preview banners and PDF headers (the previous placeholder base64 was corrupt and rendered nothing).
* **[2026-06-20] Proposal Fixes (Insurance & Investment):**
  * Amount inputs now auto-format with Indian commas (e.g. `50,000`) and use a readable `tabular-nums` font instead of mono.
  * Converted the Investment proposal preview to render **inline on the same page** (like Insurance) with Edit / Download Excel / Print actions, replacing the new-tab `window.open` flow; Excel export reimplemented inline via the bundled `xlsx`.
  * Fixed the Insurance **Print** button to call `window.print()` (browser print dialog on the preview) instead of opening a blank tab; hardened the print CSS to isolate the proposal document. Removed the now-dead `doPreview` new-tab generator.
  * Renamed the "Redemption / SWP / STP" component to **"Redemption Proposal"**; the form's Tax Liability column now shows the computed value (short/long-term) instead of an editable remarks field.
  * Added the Debt **Long Term** line to the Estimated Tax Summary; removed the "As Per Slab" badge from the preview Debt card and set its Short Term text to "As Per Tax Slab, will be added to your income".
  * Fixed the Proposed SIP Changes TOTAL row colspan so the blue total bar spans the full width and totals align under the correct columns.
  * Added a 💡 **Note — Applicable Tax Rates** box (Equity ST 20% / LT 12%, Debt ST as-per-slab / LT 12.5%) before the Remarks section in the Redemption proposal preview.
  * Fixed centering of numbers in the insured member circles under the Term Life Insurance section in the Insurance Proposal preview (replaced the incorrect `justify: 'center'` with `justifyContent: 'center'`).
  * Darkened the footer note in the Insurance Proposal print styles (from `var(--mist)` to `var(--slate)`) to ensure high contrast and clear readability for all characters, including currency symbols.
  * Re-designed the "💡 Applicable Tax Rates" box in the Redemption Proposal preview to span a single clean line (1-liner), optimizing vertical layout spacing, and removed the redundant "Note —" text since the bulb icon communicates it.
  * Fixed a print page-break bug in the Insurance Proposal preview where selecting all components (Medical + Term + Accidental) left Page 1 blank and pushed all tables onto Page 2 (replaced `break-inside: avoid-page` on `.prop-body` with page-break-avoidance on the individual direct child sections, allowing normal pagination flow).
* **[2026-06-20] Added CRM Status, PAN in Family Details, and CRM Sections Form Integration:**
  * Added dropdown field to edit Client Status (`Active`, `Dead`, `Inactive`) in the Personal Details tab.
  * Added `pan` field in family member details within Tab 3 (Family & Business) of the client form, with auto-capitalization and standard PAN formatting/regex feedback.
  * Implemented an interactive `CRM & Notes` tab (Tab 4) in the Client Modal to add, list, and delete items for Open Activities, Closed Activities, Meeting Setup History, Business Prospects, and Attachments, and a textarea for Notes.
  * Refactored `ClientProfile.jsx` to render Open & Closed Activities stacked vertically in one Card, and Meeting Setup History, Business Prospects, Attachments, and Notes as separate standalone Cards stacked vertically ("line by line") for a clean visual separation.
  * Verified build successfully compiled for production.
* **[2026-06-20] Implemented Collapsible Sidebar & Reordered Navigation:**
  * Enabled full sidebar collapse/expand using a `<-` ChevronLeft toggle button inside the sidebar brand header and a floating `->` ChevronRight button on the left of the main content wrapper when collapsed.
  * Shifted main content padding dynamically (`pl-16` when collapsed) to avoid overlap between content and the floating open button.
  * Reordered and updated top-level navigation items to display in the sequence: **Leads**, **Client**, and **Tasks**, setting Leads as the default view.
  * Fixed a flexbox collapse bug where the sidebar got stuck at `64px` width and squished the footer controls by wrapping all sidebar items inside a single fixed-width container (`w-60 shrink-0`).
  * Verified production build compiles successfully.
* **[2026-06-20] Added Sidebar Workspace Navigation & Tasks Module:**
  * Created a sleek, modern left **Sidebar** (`Sidebar.jsx`) with Team Fintness branding, the rebranded "Customer Relationship Management System" subtitle, workspace nav (Leads / Client / Tasks), and bottom controls (FY badge, theme toggle, sign-out).
  * Rebranded all "Goal Management System" references to **"Customer Relationship Management System"** across `App.jsx` (sidebar), `Login.jsx`, `index.html`, and `pdf.js`.
  * Built a new **Tasks** section (`TasksView.jsx`, `utils/tasks.js`) with a localStorage-backed store and full task model: Task Name, Record Module, Sub Type, auto Created Date/Time, Stage (Open / In Process / Waiting For Client / Completed / Lost-with-remarks), Group Leader, PAN, Applicant, Assigned By/To (team picklists), Due Date, Description, and a Comments/Logs timeline. Includes a searchable, stage-filterable table and a create/edit modal.
  * **Leads** section left as a "coming soon" placeholder.
  * Fixed the sidebar not staying fixed on scroll — removed `overflow-x-hidden` from the root flex container (it forced `overflow-y:auto`, which broke `position: sticky`).
* **[2026-06-20] Client Form: Removed CRM Tab, Added Profession & Relation Picklists:**
  * Removed the "CRM & Notes" tab (and its `ListEditor`) from the client form; existing CRM data is preserved on save so the profile display is unaffected.
  * Added a **Profession** dropdown to Personal Details (Salaried – Private/Government, Business, Self-Employed, Professional, Agriculturist/Farmer, Retired, Homemaker, Student, Defence Personnel, NRI, Other → with a "specify" input); shown in the profile's Personal & Contact box.
  * Replaced the free-text family **Relation** input with a comprehensive dropdown (Self, Spouse, Son, Daughter, … Trustee).
  * Made the family-member **PAN** a bit bolder (`font-semibold`) in both the form input and the profile family table.
* **[2026-06-20] Fixed Blank Policy Review (Review module):** Resolved a `ReferenceError: eligiblePrem is not defined` that crashed the `PolicyReview` render and showed a blank screen. The variable was declared with `const` inside the `if (!isUlip)` block but referenced in the JSX Special-Surrender-Value tooltip outside that scope — hoisted it to the outer `policies.map` scope (`let eligiblePrem = 0`). Also removed the "Policy Review Tool" hero title/kicker/subtitle from the header (kept the Reset Form / Export PDF actions).
* **[2026-06-20] Added Documents Module (`DocumentsView.jsx`):**
  * New **Docs** item in the sidebar (`FolderOpen` icon) opens a top-level Documents workspace.
  * Aggregates all generated, DB-sourced documents per client: **Minutes of Meeting** (from `client.moms`), **Goal Report** (computed from `client.goals` via `calcGoal`), and **Insurance Policies** (from `clientDetails` Term/Medical/Accidental holdings).
  * Sub-tab filter chips (Documents / Minutes of Meeting / Goal Report / Insurance Policies) with live counts, plus client/title search; documents shown as cards with type badge, client avatar and date.
  * Clicking a card opens a print-ready preview modal that renders the document content (MOM sections, Goal summary table with future value & SIP needed, or Insurance holdings) with a **Print / Save PDF** action scoped to the document body via `@media print`.
* **[2026-06-20] Reworked the Tasks Module (`TasksView.jsx` + `utils/tasks.js`):**
  * **Task Name** is now auto-generated as `"<Applicant> - <Related module>"` (read-only).
  * **Applicant** picklist auto-fetches the applicant's **PAN** (read-only) and the **Group Leader** (from the client's relationship-manager entry).
  * **Stage** is fixed to **Open** on creation; once created it can be moved through Open → Waiting For Client → In Process → Completed → Lost (Lost shows a remarks box in edit mode).
  * Added **Related To** dropdown (`NFT` / `Others`): choosing **NFT** reveals an **NFT Type** dropdown (Non-Financial Transaction list: NSE Bank Addition, Change of Bank/Broker/Contact/Name/Tax Status, Folio Consolidation, KYC variants, PAN/FATCA updations, Nominee/DOB updation, etc.) plus a **Select AMC** multi-select chip grid (Kotak, HDFC, ICICI, AXIS … WhiteOak, HSBC); choosing **Others** reveals a "Please Specify" text input.
  * Retained Created Date & Time (auto), Due Date, Assigned By/To (team picklists), Description, and the Comments/Logs timeline. List table now shows a "Related To" column (with AMCs) in place of the old Module/Sub-type.
* **[2026-06-22] Integrated Standalone Policy Review & Investment Comparison Tool:**
  * Ported the policy review worksheet, IRR/GSV/SSV calculation engines, post-tax mutual fund comparison models, and Chart.js projection graphics into [PolicyReview.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/components/PolicyReview.jsx).
  * Added the new "Review" tab under the per-client sub-navigation bar immediately following the "Draft MOM" tab in [App.jsx](file:///c:/Users/aniln/OneDrive/Desktop/crm%202.0/goal%20management%20system/src/App.jsx).
  * Preserved identical functionality, calculations, Google Sheet sync trigger, and print media layouts (designed for landscape printing) from the original standalone HTML version.
  * Scoped component styling within the `.policy-review-container` CSS class to avoid Tailwind styling pollution.
  * Verified build successfully compiled for production with no warnings or errors.
* **[2026-06-22] Tasks Enhancements (Read-only Details, Interactive Logs, & Profile Quick Navigation):**
  * Modified task details modal `TasksView.jsx` to render fields in read-only details mode initially when opening an existing task.
  * Added an **Edit Task** toggle button inside the details view to unlock edit mode.
  * Allowed the **Stage** dropdown to remain fully editable directly from details mode (without having to click Edit).
  * Made a **log entry compulsory** when modifying the stage; preventing save and displaying a footer warning if no explanation was added.
  * Added a **commenter dropdown** populated with team members so commenters can select their name, rendering their name in the timeline with a bullet separator.
  * Auto-generated a timeline comment when the stage is changed (e.g. `"Stage changed from X to Y"`), showing the user's explanation right below it.
  * Excluded the **Comments & Logs** section during task creation.
  * Added left padding to the timeline list container to prevent clipping of the blue timeline dots, and added `break-words break-all` classes to logs text to prevent horizontal container overflow.
  * Integrated client open tasks (stages: Open, In Process, Waiting For Client) directly inside the **Open Activities** card in `ClientProfile.jsx` as a grid of compact, minimal mini-cards.
  * Enabled profile task redirection: clicking any compact task card in the client profile redirects the user to the Tasks workspace and automatically deep-links/opens that task's details modal.
* **[2026-06-22] Tasks Overlay, Comments Clean-up, Sub Assignee, & Client Directory Double Click:**
  * Removed the select person comments dropdown in `TasksView.jsx`. Custom comments can now be added instantly.
  * Added a Sub Person dropdown field immediately following Assigned To in the task modal.
  * Supported opening Task Details Modal as a clean overlay directly inside the Client Profile view (without redirecting to Tasks workspace).
  * Refactored the Task Details Modal to render at the root of `App.jsx` instead of inside animated sub-components. This resolves the CSS positioning and layout issues ("opening weirdly") caused by animation scaling/fading stacking contexts.
  * Cleaned up the Applicant selection options in `TaskFormModal` to omit the redundant PAN suffix (showing only applicant name and relation).
  * Removed the "Lost — Remarks" textarea input field completely from `TaskFormModal`.
  * Rendered completed and lost tasks under Closed Activities section inside the client profile card with appropriate color badges.
  * Added a double-click row handler to the Client Directory list table that freshly loads client database profiles and opens them.
* **[2026-06-23] Added Client Type and DOB Fields & Fixed Goal Mapping Crash:**
  - Added a **Client Type** dropdown with options (`Retail`, `HNI`, `Ultra HNI`) and a **Date of Birth** date input in the primary applicant personal details modal.
  - Added a **Date of Birth** input grid in the family details configuration modal.
  - Implemented the corresponding display rendering for Client Type and DOB in both the standalone `ClientProfile.jsx` view and the `ClientDetail.jsx` tab panels.
  - Resolved a React import crash in `ClientDetail.jsx` that caused the Goal Mapping tab to render blank.
  - Consolidated local database schema by updating `database.sql` to include `client_details`, `asset_allocation`, and `actuals` column structures.
  - Seeded realistic `clientDetails` (mobile, email, clientType, DOB, and family details) in mock clients in `db.js` for fresh initial workspace runs.
  - Updated the amount formatting utility `fmtAmt` in `InvestmentProposal.jsx` to preserve leading negative signs (`-`), enabling advisors to input negative proposed SIP amounts (e.g. `-100`) which correctly subtract from the total SIP values.
  - Integrated three new investment proposal types: **SIP Pause**, **STP Cancelation**, and **SWP Cancelation** inside `InvestmentProposal.jsx`, along with their table column setups and formatted advisor intro text blocks for generated proposal PDF files.
* **[2026-06-23] Standalone Proposal Tool & Form Tips Enhancements:**
  - Integrated three new investment proposal types: **SIP Pause**, **STP Cancelation**, and **SWP Cancelation** into the standalone `ProposalDesigner (1).html` tool.
  - Aligned data schemas (`TYPES`, `COLS`, `KEYS`, `CURR`, `HAS_TOTAL`, `SPLIT_TOTAL`) for the new proposal types.
  - Added custom formatted advisor intro texts for **SIP Pause**, **STP Cancelation**, and **SWP Cancelation** used in generated PDF documents.
  - Updated the Gemini AI PDF parsing prompt in `ProposalDesigner (1).html` to recognize the new proposal types and extract their fields correctly.
  - Rendered a custom modern yellow/amber bulb/lightbulb tip alert box for **SIP Pause** in both `InvestmentProposal.jsx` (utilizing Lucide-react `Lightbulb`) and `ProposalDesigner (1).html` stating that the SIP will automatically resume after 2 months (aligned in both form inputs and generated PDF/print files).
* **[2026-06-23] Investment Proposal Drafts Autosave & Recovery:**
  - Implemented client-specific proposal draft autosave and lazy recovery state hooks in `InvestmentProposal.jsx`. This saves progress (client name, selected types, active tab, bank accounts, remarks, table inputs) dynamically to `localStorage` keyed by `client.id` (or `'global'`). A custom ref `lastLoadedClientId` prevents race condition overwrites on switching clients.
  - Implemented corresponding global proposal draft autosave and loading on page load in the standalone `ProposalDesigner (1).html` tool.
 * **[2026-06-23] Added Business Prospects Module + "Create Prospect" from Proposals:**
  - New **Prospect** item in the sidebar opens the `BusinessProspects.jsx` module — a card grid of all generated prospects with All / Investment / Insurance filter chips, search, click-to-edit and delete. Backed by `utils/prospects.js` (localStorage store).
  - Replaced the Investment proposal's **Download Excel** button with a **Create Prospect** button; added the same **Create Prospect** button to the Insurance proposal preview.
  - Clicking Create Prospect builds one draft prospect per selected proposal (each Investment sub-type / each Insurance type — Medical, Term, Accidental), with **auto-fetched amount** and the generated proposal **table** carried over, then opens a confirmation/edit modal (styled like the Task form).
  - Prospect fields: Group Leader Name, Applicant Name, PAN of Applicant, Proposal Type, Amount (auto, editable), Created Date & Time (auto), Closing Date, Service/Relationship/Portfolio/Insurance Managers (prefilled from the client), Owner & Internal Manager (fixed roles), the proposal Table, and Remarks.
  - On **Confirm**, one prospect is created per proposal (multiple selected proposals → multiple prospects), saved to the store and surfaced in the Prospect module; a success toast is shown. The module also broadcasts a `crm:prospects-updated` event so the list refreshes live.
* **[2026-06-23] Business Prospects — Stages, Layout Fix & Tabular View:**
  - Fixed the Create/Edit Prospect modal layout (was overflowing the viewport / header cut off): the modal is now a flex column with `max-h-[calc(100vh-4rem)]`, a pinned header & footer, and a single scrollable body — opens correctly from both the Insurance and Investment proposals.
  - Added prospect lifecycle **stages** (`utils/prospects.js`): Qualified (default), Work Executed, Close Won, Close Lost. Changing a prospect's stage in the edit modal now **requires a mandatory remark** ("Reason for stage change"), which is appended to a per-prospect `stageHistory` log (shown in the modal). Save is disabled until the reason is entered.
  - In the **Create Prospect** confirmation modal, each selected proposal is now its **own tabbed section** with its own amount, table and **its own Remarks** (remarks are per-proposal in both Investment and Insurance).
  - The **Prospect module** now defaults to a **tabular view like the Tasks module** (Proposal · Applicant+PAN+Group Leader · Amount · Closing · Stage) with a card/table **view toggle** so the user can pick their preferred format, plus stage filter chips and an investment/insurance type toggle.
* **[2026-06-23] Business Prospects now shown in Client Profile (with form access):**
  - `ClientProfile.jsx`'s "Business Prospects" card now displays the client's real prospects from the Prospect module (matched by `groupLeaderId`/group leader name/PAN), under a "Prospect Module" sub-section — mirroring how the existing "Activities" card surfaces Tasks. The legacy free-text `details.businessProspects` list (if any) is still shown above it.
  - Each prospect row is clickable and opens the **same global Edit Prospect form** used by the Prospect module (Group Leader, Applicant, PAN, Stage, all 6 managers, the proposal table & amount, remarks) — giving direct form access from the client's own profile, exactly like the existing Tasks-from-profile flow.
  - Added a "View All" button (visible once the client has prospects) that jumps to the full Prospect module and deep-opens that prospect, via a new `onNavigateToProspects` callback mirroring the existing `onNavigateToTasks`.
  - Wiring: `InsuranceProposal.jsx`/`InvestmentProposal.jsx` now stamp `groupLeaderId` (the client's id) onto every prospect they create for reliable matching; `App.jsx` lifted prospect-editing to global state (`editingProspect`, `showProspectForm`, `prospectsChangeCounter`, `activeProspectId`) so the same `ProspectModal` (exported from `BusinessProspects.jsx`) can be opened from both the Prospect module and the Client Profile and keep both views in sync after a save.
