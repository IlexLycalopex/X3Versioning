# Sage X3 Release Comparator -- MVP Specification (No LLM, Real-Time Data)

## 1. Purpose

Build a lightweight, static web application hosted on GitHub Pages that:

-   Compares Sage X3 releases in real time
-   Allows users to select:
    -   Current version
    -   Target version
    -   Legislations (multi-select)
    -   Functional areas (multi-select)
-   Displays structured delta output between versions
-   Highlights relevant enhancements based on selected criteria

This MVP will NOT use an LLM. All logic is rule-based and client-side.

------------------------------------------------------------------------

## 2. Hosting & Architecture

### 2.1 Hosting

-   Platform: GitHub Pages
-   Architecture: Fully static site
-   No server-side runtime
-   No API keys
-   All processing client-side in JavaScript

### 2.2 Data Source (Real-Time)

Primary source: https://online-help.sagex3.com/x3-release-notes/api/

Release pattern:
/x3-release-notes/api/{locale}/{release-id}/Readme-X3-ENG-{version}.txt

Example:
/x3-release-notes/api/en-US/2025-r2-38/Readme-X3-ENG-12.0.38.txt

The application will: - Fetch release text files dynamically via
`fetch()` - Parse text into structured JSON in-browser - Cache parsed
releases in `localStorage`

------------------------------------------------------------------------

## 3. Functional Scope

### 3.1 Inputs

1.  Current Version (dropdown)
2.  Target Version (dropdown -- must be higher)
3.  Legislations (multi-select)
4.  Functional Areas (multi-select)
5.  Compare Button

### 3.2 Outputs

Results area containing:

1.  Summary Header

    -   Upgrade from X to Y
    -   Total changes identified
    -   Total filtered changes

2.  Highlighted Enhancements Section Rules-based highlights:

    -   Behaviour changes
    -   Entry points
    -   Security-related items
    -   Compliance/legislation items
    -   Platform/API items

3.  Changes by Functional Area Accordion layout per area

4.  Legislation-Specific Changes Only rendered if legislation filter
    applied

------------------------------------------------------------------------

## 4. Data Parsing Logic

### 4.1 Release Text Structure

Release files typically contain:

-   Section headers (Finance, Distribution, Manufacturing, Platform,
    etc)
-   Ticket references (e.g., X3-335955)
-   Change types:
    -   Bug
    -   Behaviour change
    -   Entry point
-   Optional legislation markers:
    -   \[France (FRA)\]
    -   \[Germany (GER)\]

### 4.2 Parsing Strategy

Steps:

1.  Split text into lines
2.  Detect section headers (capitalised lines or structured headings)
3.  Detect ticket entries (regex: X3-`\d+`{=tex})
4.  Extract:
    -   release_id
    -   product_version
    -   area
    -   change_type
    -   legislation_tags (regex: ((`\w{2,4}`{=tex})))
    -   summary text

### 4.3 Structured Object

Each parsed change becomes:

{ release_id: "2025-r2-38", version: "12.0.38", area: "Finance",
change_type: "Behaviour change", legislation_tags: \["FRA"\], ticket:
"X3-335955", summary: "Description text" }

------------------------------------------------------------------------

## 5. Delta Comparison Logic

### 5.1 Version Range

When comparing:

-   Determine chronological order
-   Include all releases strictly greater than current version and \<=
    target version

### 5.2 Filtering Logic

Apply filters:

1.  Functional Areas
    -   Match `area` field
2.  Legislations
    -   Include if:
        -   legislation_tags contains selected code
        -   OR change has no legislation tag (global change)
3.  Highlighting Rules

Mark as highlight if:

-   change_type === "Behaviour change"
-   change_type === "Entry point"
-   area contains "Security"
-   summary contains:
    -   permission
    -   role
    -   compliance
    -   tax
    -   e-invoice
    -   API
    -   authentication

------------------------------------------------------------------------

## 6. UI/UX Specification

### 6.1 Colour Scheme

-   Background: #f2f2f2
-   Primary: Navy
-   Secondary: Cyan
-   Tertiary Accent: Mustard

### 6.2 Layout

Page Structure:

Header - Title - Subtitle

Input Panel (card) - Dropdowns - Multi-select controls - Compare button

Results Panel - Highlight Summary Box - Accordion by Functional Area

### 6.3 Styling Guidelines

-   Clean sans-serif font
-   Navy headings
-   Cyan buttons
-   Mustard highlight badges
-   Subtle shadows on cards
-   Responsive design (mobile-first)

------------------------------------------------------------------------

## 7. Technical Stack

-   HTML5
-   CSS3 (custom, no heavy frameworks)
-   Vanilla JavaScript (ES6+)
-   No build pipeline required for MVP

Optional future: - TypeScript - Modular architecture - Component
separation

------------------------------------------------------------------------

## 8. Performance & Caching

-   Cache fetched releases in localStorage
-   Store parsed JSON to avoid re-parsing
-   Provide "Refresh Data" button to clear cache

------------------------------------------------------------------------

## 9. Error Handling

-   If release fetch fails:
    -   Display error banner
-   If version order invalid:
    -   Disable compare button
-   If no matches:
    -   Display "No changes match selected filters"

------------------------------------------------------------------------

## 10. Security Considerations

-   No credentials stored
-   No server keys exposed
-   All calls are public documentation endpoints
-   Validate and sanitise all rendered content

------------------------------------------------------------------------

## 11. File Structure

/ index.html /css styles.css /js app.js parser.js comparator.js

------------------------------------------------------------------------

## 12. Future Enhancements (Post-MVP)

-   Serverless LLM summary endpoint
-   PDF export
-   Consultant mode (technical detail toggle)
-   Upgrade effort scoring
-   Integration impact detection
-   Client-facing branded export mode

------------------------------------------------------------------------

## 13. Acceptance Criteria

MVP is complete when:

-   User can select versions
-   App fetches releases live
-   Delta is calculated correctly
-   Filters work correctly
-   Highlights render based on rules
-   UI follows brand palette
-   Site deploys successfully on GitHub Pages

------------------------------------------------------------------------

End of Specification
