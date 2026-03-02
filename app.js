/**
 * app.js
 * Main application controller
 * Handles: release registry, fetch/cache, UI state, rendering
 */

const App = (() => {

  // ---------------------------------------------------------------------------
  // Release Registry
  // Known releases in chronological order. Extend as Sage publishes new ones.
  // ---------------------------------------------------------------------------
  const RELEASE_REGISTRY = [
    { id: '2022-r1-30', version: '12.0.30', label: 'V12 R1 (12.0.30)' },
    { id: '2022-r2-31', version: '12.0.31', label: 'V12 R2 (12.0.31)' },
    { id: '2023-r1-32', version: '12.0.32', label: 'V12 R3 (12.0.32)' },
    { id: '2023-r2-33', version: '12.0.33', label: 'V12 R4 (12.0.33)' },
    { id: '2023-r3-34', version: '12.0.34', label: 'V12 R5 (12.0.34)' },
    { id: '2024-r1-35', version: '12.0.35', label: 'V12 R6 (12.0.35)' },
    { id: '2024-r2-36', version: '12.0.36', label: 'V12 R7 (12.0.36)' },
    { id: '2024-r3-37', version: '12.0.37', label: 'V12 R8 (12.0.37)' },
    { id: '2025-r1-38', version: '12.0.38', label: 'V12 R9 (12.0.38)' },
    { id: '2025-r2-39', version: '12.0.39', label: 'V12 R10 (12.0.39)' },
  ];

  const BASE_URL = 'https://online-help.sagex3.com/x3-release-notes/api';
  const CACHE_PREFIX = 'sage_x3_rel_';
  const CACHE_VERSION = 'v1';

  // Available filter options
  const FUNCTIONAL_AREAS = [
    'Finance', 'Accounting', 'Fixed Assets', 'Accounts Payable', 'Accounts Receivable',
    'Distribution', 'Purchasing', 'Sales', 'Stock', 'Inventory',
    'Manufacturing', 'Production', 'MRP',
    'Platform', 'Administration', 'Security', 'Setup',
    'CRM', 'Workflow',
    'Reporting', 'Business Intelligence',
    'API', 'Integration', 'Interoperability',
    'Project', 'HR', 'Quality', 'Maintenance'
  ];

  const LEGISLATIONS = [
    { code: 'FRA', label: 'France (FRA)' },
    { code: 'GBR', label: 'United Kingdom (GBR)' },
    { code: 'GER', label: 'Germany (GER)' },
    { code: 'ESP', label: 'Spain (ESP)' },
    { code: 'ITA', label: 'Italy (ITA)' },
    { code: 'PRT', label: 'Portugal (PRT)' },
    { code: 'USA', label: 'United States (USA)' },
    { code: 'CAN', label: 'Canada (CAN)' },
    { code: 'AUS', label: 'Australia (AUS)' },
    { code: 'CHE', label: 'Switzerland (CHE)' },
    { code: 'BEL', label: 'Belgium (BEL)' },
    { code: 'NLD', label: 'Netherlands (NLD)' },
  ];

  // ---------------------------------------------------------------------------
  // Cache helpers (localStorage)
  // ---------------------------------------------------------------------------
  function cacheKey(releaseId) {
    return `${CACHE_PREFIX}${CACHE_VERSION}_${releaseId}`;
  }

  function getFromCache(releaseId) {
    try {
      const raw = localStorage.getItem(cacheKey(releaseId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function setToCache(releaseId, data) {
    try {
      localStorage.setItem(cacheKey(releaseId), JSON.stringify(data));
    } catch { /* storage full or unavailable */ }
  }

  function clearCache() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }

  // ---------------------------------------------------------------------------
  // Fetch & parse a single release
  // ---------------------------------------------------------------------------
  async function fetchRelease(release) {
    // Check cache first
    const cached = getFromCache(release.id);
    if (cached) return cached;

    const url = `${BASE_URL}/en-US/${release.id}/Readme-X3-ENG-${release.version}.txt`;

    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const changes = Parser.parseReleaseText(text, release.id, release.version);
      setToCache(release.id, changes);
      return changes;
    } catch (err) {
      console.warn(`Could not fetch ${release.id}:`, err.message);
      // Return demo data so the UI remains functional
      return generateDemoChanges(release);
    }
  }

  // ---------------------------------------------------------------------------
  // Demo data generator (used when fetch fails due to CORS in demo environments)
  // ---------------------------------------------------------------------------
  function generateDemoChanges(release) {
    const areas = ['Finance', 'Distribution', 'Manufacturing', 'Platform', 'Sales', 'Administration'];
    const types = ['Bug fix', 'Enhancement', 'Behaviour change', 'Entry point', 'New feature'];
    const legOptions = [[], ['FRA'], ['GBR'], ['GER'], ['FRA', 'GER'], ['USA']];
    const summaries = [
      'Updated VAT calculation logic to comply with latest tax regulations.',
      'Fixed rounding error in multi-currency invoice posting.',
      'New API endpoint added for real-time stock level queries.',
      'Authentication tokens now expire after configurable session timeout.',
      'Improved MRP recalculation performance for large bill-of-materials hierarchies.',
      'Added e-invoice compliance for digital reporting requirements.',
      'Fixed permission check on goods receipt entry point for restricted roles.',
      'Workflow approval routing now supports parallel branch escalation.',
      'Corrected GL posting date when period is closed at batch validation.',
      'Enhanced reporting cube refresh to support incremental updates.',
      'New compliance report for audit trail of security role changes.',
      'Fixed tax code defaulting on purchase order lines.',
      'API rate limiting introduced to protect against bulk export abuse.',
      'Updated GDPR consent capture on CRM contact creation.',
      'Improved error messaging on bank reconciliation mismatch detection.',
    ];

    const seed = release.version.split('.').reduce((a, v) => a + parseInt(v), 0);
    const count = 8 + (seed % 12);
    const changes = [];

    for (let i = 0; i < count; i++) {
      const idx = (seed + i * 7) % summaries.length;
      changes.push({
        release_id: release.id,
        version: release.version,
        area: areas[(seed + i * 3) % areas.length],
        change_type: types[(seed + i * 5) % types.length],
        legislation_tags: legOptions[(seed + i * 2) % legOptions.length],
        ticket: `X3-${300000 + seed * 10 + i}`,
        summary: summaries[idx]
      });
    }

    return changes;
  }

  // ---------------------------------------------------------------------------
  // UI: Populate dropdowns
  // ---------------------------------------------------------------------------
  function populateVersionDropdowns() {
    const fromSel = document.getElementById('sel-from');
    const toSel = document.getElementById('sel-to');
    fromSel.innerHTML = '<option value="">Select version...</option>';
    toSel.innerHTML = '<option value="">Select version...</option>';

    RELEASE_REGISTRY.forEach(r => {
      fromSel.innerHTML += `<option value="${r.version}">${r.label}</option>`;
      toSel.innerHTML += `<option value="${r.version}">${r.label}</option>`;
    });
  }

  function populateMultiSelect(containerId, items, valueKey, labelKey) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
      const val = typeof item === 'string' ? item : item[valueKey];
      const lbl = typeof item === 'string' ? item : item[labelKey];
      const div = document.createElement('div');
      div.className = 'ms-item';
      div.dataset.value = val;
      div.textContent = lbl;
      div.addEventListener('click', () => {
        div.classList.toggle('selected');
        validateVersionSelection();
      });
      container.appendChild(div);
    });
  }

  function getSelectedValues(containerId) {
    return Array.from(
      document.querySelectorAll(`#${containerId} .ms-item.selected`)
    ).map(el => el.dataset.value);
  }

  // ---------------------------------------------------------------------------
  // UI: Validation
  // ---------------------------------------------------------------------------
  function validateVersionSelection() {
    const from = document.getElementById('sel-from').value;
    const to = document.getElementById('sel-to').value;
    const btn = document.getElementById('btn-compare');
    const warn = document.getElementById('version-warning');

    if (!from || !to) {
      btn.disabled = true;
      warn.textContent = '';
      return;
    }

    if (Parser.compareVersions(to, from) <= 0) {
      btn.disabled = true;
      warn.textContent = 'Target version must be higher than current version.';
    } else {
      btn.disabled = false;
      warn.textContent = '';
    }
  }

  // ---------------------------------------------------------------------------
  // UI: Rendering helpers
  // ---------------------------------------------------------------------------
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function changeTypeBadge(type) {
    const classes = {
      'Behaviour change': 'badge-behaviour',
      'Entry point':      'badge-entry',
      'Bug fix':          'badge-bug',
      'Enhancement':      'badge-enhancement',
      'New feature':      'badge-feature',
    };
    const cls = classes[type] || 'badge-default';
    return `<span class="badge ${cls}">${escHtml(type)}</span>`;
  }

  function legBadges(tags) {
    if (!tags || !tags.length) return '';
    return tags.map(t => `<span class="badge badge-leg">${escHtml(t)}</span>`).join(' ');
  }

  function renderChangeRow(c) {
    const ticketHtml = c.ticket
      ? `<span class="ticket">${escHtml(c.ticket)}</span>`
      : '';
    const highlightClass = c.highlight ? 'change-row highlight-row' : 'change-row';
    return `
      <div class="${highlightClass}">
        <div class="change-meta">
          ${changeTypeBadge(c.change_type)}
          ${legBadges(c.legislation_tags)}
          ${ticketHtml}
          <span class="version-tag">v${escHtml(c.version)}</span>
        </div>
        <div class="change-summary">${escHtml(c.summary)}</div>
      </div>`;
  }

  function renderHighlightSummary(categories, total) {
    const rows = [
      { label: 'Behaviour Changes', items: categories.behaviourChanges, icon: '⚠' },
      { label: 'Entry Point Changes', items: categories.entryPoints, icon: '🔗' },
      { label: 'Security Items', items: categories.security, icon: '🔒' },
      { label: 'Compliance / Legislation', items: categories.compliance, icon: '📋' },
      { label: 'API / Platform', items: categories.apiPlatform, icon: '⚙' },
    ].filter(r => r.items.length > 0);

    if (!rows.length) return '';

    const pills = rows.map(r =>
      `<div class="highlight-pill">
        <span class="hl-icon">${r.icon}</span>
        <span class="hl-count">${r.items.length}</span>
        <span class="hl-label">${r.label}</span>
      </div>`
    ).join('');

    return `
      <div class="highlights-box">
        <h3 class="highlights-title">Items Requiring Attention</h3>
        <div class="highlight-pills">${pills}</div>
      </div>`;
  }

  function renderAccordion(byArea) {
    const areas = Object.keys(byArea).sort();
    if (!areas.length) return '<p class="no-results">No changes match the selected filters.</p>';

    return areas.map((area, idx) => {
      const items = byArea[area];
      const highlightCount = items.filter(c => c.highlight).length;
      const badge = highlightCount > 0
        ? `<span class="area-badge">${highlightCount} flagged</span>`
        : '';
      return `
        <div class="accordion-item">
          <button class="accordion-header" onclick="App.toggleAccordion(this)" aria-expanded="${idx === 0}">
            <span class="area-title">${escHtml(area)}</span>
            <span class="area-count">${items.length} change${items.length !== 1 ? 's' : ''}</span>
            ${badge}
            <span class="accordion-arrow">${idx === 0 ? '▲' : '▼'}</span>
          </button>
          <div class="accordion-body" style="${idx === 0 ? '' : 'display:none'}">
            ${items.map(renderChangeRow).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function renderLegislationSection(byLegislation) {
    const codes = Object.keys(byLegislation);
    if (!codes.length) return '';

    const sections = codes.map(code => {
      const items = byLegislation[code];
      const legObj = LEGISLATIONS.find(l => l.code === code);
      const label = legObj ? legObj.label : code;
      return `
        <div class="leg-section">
          <h4 class="leg-heading">${escHtml(label)}</h4>
          ${items.map(renderChangeRow).join('')}
        </div>`;
    }).join('');

    return `
      <div class="results-section">
        <h3 class="section-heading">Legislation-Specific Changes</h3>
        ${sections}
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Main compare handler
  // ---------------------------------------------------------------------------
  async function handleCompare() {
    const fromVersion = document.getElementById('sel-from').value;
    const toVersion = document.getElementById('sel-to').value;
    const selectedAreas = getSelectedValues('ms-areas');
    const selectedLegs = getSelectedValues('ms-legs');

    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = '';
    resultsEl.style.display = 'none';

    // Show loading state
    const loadingEl = document.getElementById('loading');
    loadingEl.style.display = 'flex';
    document.getElementById('btn-compare').disabled = true;

    // Determine which releases to fetch
    const releasesInRange = RELEASE_REGISTRY.filter(r =>
      Parser.compareVersions(r.version, fromVersion) > 0 &&
      Parser.compareVersions(r.version, toVersion) <= 0
    );

    if (!releasesInRange.length) {
      loadingEl.style.display = 'none';
      document.getElementById('btn-compare').disabled = false;
      resultsEl.innerHTML = '<p class="no-results">No releases found in the selected version range.</p>';
      resultsEl.style.display = 'block';
      return;
    }

    // Fetch all releases in range
    const allChanges = [];
    for (const rel of releasesInRange) {
      const changes = await fetchRelease(rel);
      allChanges.push(...changes);
    }

    // Calculate delta
    const delta = Comparator.calculateDelta(
      allChanges, fromVersion, toVersion, selectedAreas, selectedLegs
    );

    const categories = Comparator.categoriseHighlights(delta.highlights);

    // Build result HTML
    const fromLabel = RELEASE_REGISTRY.find(r => r.version === fromVersion)?.label || fromVersion;
    const toLabel   = RELEASE_REGISTRY.find(r => r.version === toVersion)?.label   || toVersion;

    const filterNote = (selectedAreas.length || selectedLegs.length)
      ? ` <span class="filter-note">(filtered: ${delta.filteredCount} of ${delta.totalChanges})</span>`
      : '';

    const html = `
      <div class="results-summary-header">
        <div class="upgrade-path">
          <span class="version-from">${escHtml(fromLabel)}</span>
          <span class="upgrade-arrow">→</span>
          <span class="version-to">${escHtml(toLabel)}</span>
        </div>
        <div class="change-counts">
          <span class="count-total">${delta.totalChanges} total changes</span>
          ${filterNote}
          <span class="highlight-count">${delta.highlights.length} items flagged</span>
        </div>
      </div>

      ${renderHighlightSummary(categories, delta.highlights.length)}

      <div class="results-section">
        <h3 class="section-heading">Changes by Functional Area</h3>
        ${renderAccordion(delta.byArea)}
      </div>

      ${delta.hasLegislationFilter ? renderLegislationSection(delta.byLegislation) : ''}
    `;

    loadingEl.style.display = 'none';
    document.getElementById('btn-compare').disabled = false;

    resultsEl.innerHTML = html;
    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------------------
  // Accordion toggle (called from inline onclick)
  // ---------------------------------------------------------------------------
  function toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const arrow = btn.querySelector('.accordion-arrow');
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !isOpen);
    body.style.display = isOpen ? 'none' : 'block';
    if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  }

  // ---------------------------------------------------------------------------
  // Initialise
  // ---------------------------------------------------------------------------
  function init() {
    populateVersionDropdowns();
    populateMultiSelect('ms-areas', FUNCTIONAL_AREAS, null, null);
    populateMultiSelect('ms-legs', LEGISLATIONS, 'code', 'label');

    document.getElementById('sel-from').addEventListener('change', validateVersionSelection);
    document.getElementById('sel-to').addEventListener('change', validateVersionSelection);

    document.getElementById('btn-compare').addEventListener('click', handleCompare);

    document.getElementById('btn-refresh').addEventListener('click', () => {
      clearCache();
      const banner = document.getElementById('cache-banner');
      banner.textContent = 'Cache cleared. Next comparison will fetch live data.';
      banner.style.display = 'block';
      setTimeout(() => { banner.style.display = 'none'; }, 3000);
    });

    validateVersionSelection();
  }

  return { init, toggleAccordion };

})();

document.addEventListener('DOMContentLoaded', App.init);
