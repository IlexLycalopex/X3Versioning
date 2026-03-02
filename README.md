# Sage X3 Release Comparator

A lightweight, static web application for comparing Sage X3 release versions, identifying change deltas, and filtering results by functional area and legislation.

Built to run entirely client-side with no server, no API keys, and no build pipeline. Designed for deployment on GitHub Pages.

---

## Purpose

When planning a Sage X3 upgrade, consultants and customers need to understand:

- What changed between their current version and the target version
- Which changes carry risk (behaviour changes, entry points, security items)
- Which changes are relevant to their functional footprint and legislation

This tool fetches release notes directly from the Sage online help API, parses them in-browser, and presents a structured, filterable delta.

---

## Features

- Select a current and target version from a dropdown of known X3 releases (12.0.30 to 12.0.39)
- Filter results by functional area and legislation (multi-select)
- Automatic highlight detection for:
  - Behaviour changes
  - Entry point changes
  - Security-related items
  - Compliance, tax, and e-invoice items
  - API and authentication items
- Results grouped by functional area in an accordion layout
- Legislation-specific changes surfaced in a dedicated section
- LocalStorage caching of fetched release data with a one-click refresh
- Graceful fallback to demo data if the Sage API is unreachable (CORS)
- Responsive, mobile-first layout

---

## File Structure

```
/
├── index.html          # Application shell and UI markup
├── README.md
├── css/
│   └── styles.css      # All styling — Navy/Cyan/Mustard palette
└── js/
    ├── parser.js       # Parses Sage release text files into structured JSON
    ├── comparator.js   # Delta calculation, filtering, and highlight logic
    └── app.js          # Orchestration, fetch/cache, UI rendering
```

---

## How It Works

### Data Source

Release notes are fetched from:

```
https://online-help.sagex3.com/x3-release-notes/api/en-US/{release-id}/Readme-X3-ENG-{version}.txt
```

Example:

```
https://online-help.sagex3.com/x3-release-notes/api/en-US/2025-r1-38/Readme-X3-ENG-12.0.38.txt
```

### Parsing

`parser.js` splits each release file line by line, detecting:

- Section headers mapped to functional areas
- Ticket references (`X3-XXXXXX`)
- Change types (Behaviour change, Entry point, Bug fix, Enhancement, New feature)
- Legislation tags (`[FRA]`, `[GER]`, etc.)

Each change is structured as:

```json
{
  "release_id": "2025-r1-38",
  "version": "12.0.38",
  "area": "Finance",
  "change_type": "Behaviour change",
  "legislation_tags": ["FRA"],
  "ticket": "X3-335955",
  "summary": "Updated VAT calculation logic to comply with latest tax regulations."
}
```

### Delta Calculation

`comparator.js` collects all changes across releases strictly greater than the current version and up to and including the target version. Filters are then applied:

1. Functional area match on the `area` field
2. Legislation match — includes changes tagged with a selected code, plus all globally applicable (untagged) changes
3. Highlight rules applied to tag items requiring attention

### Caching

Parsed JSON for each release is stored in `localStorage` using a versioned key prefix. The "Refresh Data" button clears all cached entries, forcing a fresh fetch on the next comparison.

---

## Deployment

### GitHub Pages

1. Push the repository contents to a GitHub repository
2. Go to `Settings > Pages`
3. Set source to `Branch: main`, root directory
4. The site will be available at `https://{your-org}.github.io/{repo-name}/`

No build step is required. All files are plain HTML, CSS, and JavaScript.

---

## CORS Considerations

The Sage release notes domain may not permit cross-origin `fetch()` requests from a browser. If a fetch fails for any release, the application falls back silently to deterministic demo data so the UI remains fully functional.

To resolve CORS in production, two options are available:

**Option 1 — Cloudflare Worker proxy**

Deploy a simple Worker that fetches from the Sage domain server-side and returns the response with appropriate CORS headers. Free tier is sufficient for this use case.

**Option 2 — GitHub Actions pre-fetch**

Add a scheduled workflow that fetches and commits release text files to the repository on a regular cadence. The application then reads from the same origin, eliminating the CORS issue entirely and improving load performance.

---

## Adding New Releases

When Sage publishes a new release, add an entry to the `RELEASE_REGISTRY` array in `js/app.js`:

```javascript
{ id: '2025-r3-40', version: '12.0.40', label: 'V12 R11 (12.0.40)' }
```

The release ID and version string must match the Sage URL pattern exactly.

---

## Roadmap (Post-MVP)

As defined in the original specification:

- Serverless LLM summary endpoint for natural language change summaries
- PDF export of the filtered delta report
- Consultant mode with additional technical detail
- Upgrade effort scoring per functional area
- Integration impact detection (X3CloudDocs, third-party connectors)
- Client-facing branded export mode

---

## Technical Stack

- HTML5
- CSS3 (custom, no frameworks)
- Vanilla JavaScript (ES6+)
- No dependencies
- No build pipeline

---

## Licence

Internal use. Not affiliated with or endorsed by Sage Group plc. Release note content is the property of Sage.
