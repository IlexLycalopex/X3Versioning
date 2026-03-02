/**
 * comparator.js
 * Delta calculation, filtering, and highlighting logic
 */

const Comparator = (() => {

  // Highlight keyword rules applied against summary text
  const HIGHLIGHT_KEYWORDS = [
    'permission', 'role', 'compliance', 'tax', 'e-invoice',
    'einvoice', 'api', 'authentication', 'security', 'gdpr',
    'vat', 'regulation', 'legislation', 'mandate'
  ];

  /**
   * Determine whether a change should be flagged as a highlight
   */
  function isHighlight(change) {
    if (change.change_type === 'Behaviour change') return true;
    if (change.change_type === 'Entry point') return true;
    if (/security/i.test(change.area)) return true;

    const summaryLower = (change.summary || '').toLowerCase();
    return HIGHLIGHT_KEYWORDS.some(kw => summaryLower.includes(kw));
  }

  /**
   * Calculate delta between two versions.
   *
   * @param {Object[]} allChanges - All parsed changes across all fetched releases
   * @param {string}   fromVersion - "current" version string (excluded)
   * @param {string}   toVersion   - "target" version string (included)
   * @param {string[]} areas       - Selected functional areas (empty = all)
   * @param {string[]} legislations - Selected legislation codes (empty = all)
   * @returns {Object} result with totals, highlights, grouped changes
   */
  function calculateDelta(allChanges, fromVersion, toVersion, areas, legislations) {
    // Step 1: Version range filter
    const inRange = allChanges.filter(c => {
      const gtFrom = Parser.compareVersions(c.version, fromVersion) > 0;
      const lteTarget = Parser.compareVersions(c.version, toVersion) <= 0;
      return gtFrom && lteTarget;
    });

    const totalChanges = inRange.length;

    // Step 2: Functional area filter
    let filtered = inRange;
    if (areas && areas.length > 0) {
      filtered = filtered.filter(c =>
        areas.some(a => c.area.toLowerCase().includes(a.toLowerCase()))
      );
    }

    // Step 3: Legislation filter
    if (legislations && legislations.length > 0) {
      filtered = filtered.filter(c => {
        if (!c.legislation_tags || c.legislation_tags.length === 0) return true; // global
        return c.legislation_tags.some(tag => legislations.includes(tag));
      });
    }

    // Step 4: Tag highlights
    const tagged = filtered.map(c => ({ ...c, highlight: isHighlight(c) }));

    // Step 5: Group by functional area
    const byArea = {};
    for (const c of tagged) {
      if (!byArea[c.area]) byArea[c.area] = [];
      byArea[c.area].push(c);
    }

    // Step 6: Separate highlights
    const highlights = tagged.filter(c => c.highlight);

    // Step 7: Legislation-specific grouping
    const byLegislation = {};
    if (legislations && legislations.length > 0) {
      for (const c of tagged) {
        if (c.legislation_tags && c.legislation_tags.length > 0) {
          for (const tag of c.legislation_tags) {
            if (legislations.includes(tag)) {
              if (!byLegislation[tag]) byLegislation[tag] = [];
              byLegislation[tag].push(c);
            }
          }
        }
      }
    }

    return {
      fromVersion,
      toVersion,
      totalChanges,
      filteredCount: tagged.length,
      highlights,
      byArea,
      byLegislation,
      hasLegislationFilter: legislations && legislations.length > 0
    };
  }

  /**
   * Categorise highlights by type for the summary panel
   */
  function categoriseHighlights(highlights) {
    return {
      behaviourChanges: highlights.filter(h => h.change_type === 'Behaviour change'),
      entryPoints:      highlights.filter(h => h.change_type === 'Entry point'),
      security:         highlights.filter(h => /security/i.test(h.area)),
      compliance:       highlights.filter(h => {
        const s = (h.summary || '').toLowerCase();
        return s.includes('compliance') || s.includes('tax') ||
               s.includes('e-invoice') || s.includes('vat') ||
               s.includes('legislation') || s.includes('mandate');
      }),
      apiPlatform:      highlights.filter(h => {
        const s = (h.summary || '').toLowerCase();
        return s.includes('api') || s.includes('authentication') ||
               /platform|interop/i.test(h.area);
      })
    };
  }

  return { calculateDelta, categoriseHighlights, isHighlight };

})();
