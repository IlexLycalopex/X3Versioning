/**
 * parser.js
 * Parses Sage X3 release note text files into structured change objects
 */

const Parser = (() => {

  // Known section headers that map to functional areas
  const AREA_KEYWORDS = [
    'Finance', 'Accounting', 'Fixed Assets', 'Accounts Payable', 'Accounts Receivable',
    'Distribution', 'Purchasing', 'Sales', 'Stock', 'Inventory',
    'Manufacturing', 'Production', 'MRP', 'Scheduling',
    'Platform', 'Administration', 'Security', 'Setup', 'Configuration',
    'CRM', 'Customer Relationship', 'Workflow', 'Automation',
    'Reporting', 'Business Intelligence', 'Analytics',
    'Interoperability', 'API', 'Integration', 'Web Services',
    'Project', 'Timesheet', 'Expenses',
    'HR', 'Human Resources', 'Payroll',
    'Quality', 'Maintenance', 'Service'
  ];

  // Change type patterns
  const CHANGE_TYPE_PATTERNS = [
    { type: 'Behaviour change', regex: /behaviour\s+change|behavior\s+change/i },
    { type: 'Entry point',      regex: /entry\s+point/i },
    { type: 'Bug fix',          regex: /bug\s+fix|anomaly|correction/i },
    { type: 'Enhancement',      regex: /enhancement|improvement|evolution/i },
    { type: 'New feature',      regex: /new\s+feature|new\s+function/i },
  ];

  // Legislation tag patterns
  const LEGISLATION_REGEX = /\[([A-Z]{2,4})\]|\(([A-Z]{2,4})\)/g;

  // Ticket reference pattern
  const TICKET_REGEX = /\b(X3[-\s]?\d{4,8})\b/i;

  function detectArea(line, currentArea) {
    const trimmed = line.trim();
    // All-caps section headers or known keywords
    if (/^[A-Z][A-Z\s\/&\-]{3,}$/.test(trimmed) && trimmed.length < 60) {
      return trimmed;
    }
    for (const kw of AREA_KEYWORDS) {
      if (trimmed.toLowerCase().startsWith(kw.toLowerCase()) && trimmed.length < 80) {
        return trimmed;
      }
    }
    return currentArea;
  }

  function detectChangeType(text) {
    for (const p of CHANGE_TYPE_PATTERNS) {
      if (p.regex.test(text)) return p.type;
    }
    return 'Change';
  }

  function extractLegislations(text) {
    const tags = [];
    let match;
    const rx = new RegExp(LEGISLATION_REGEX.source, 'g');
    while ((match = rx.exec(text)) !== null) {
      const tag = (match[1] || match[2]).toUpperCase();
      if (!tags.includes(tag)) tags.push(tag);
    }
    return tags;
  }

  function extractTicket(text) {
    const m = text.match(TICKET_REGEX);
    return m ? m[1].replace(/\s/, '-').toUpperCase() : null;
  }

  /**
   * Parse a full release text file into an array of change objects
   */
  function parseReleaseText(text, releaseId, version) {
    const lines = text.split(/\r?\n/);
    const changes = [];
    let currentArea = 'General';
    let buffer = [];
    let inEntry = false;

    const flushBuffer = () => {
      if (!buffer.length) return;
      const combined = buffer.join(' ').trim();
      if (combined.length < 10) { buffer = []; return; }

      const ticket = extractTicket(combined);
      const legislations = extractLegislations(combined);
      const changeType = detectChangeType(combined);

      // Clean up the summary text
      const summary = combined
        .replace(TICKET_REGEX, '')
        .replace(/\[[A-Z]{2,4}\]/g, '')
        .replace(/\([A-Z]{2,4}\)/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (summary.length >= 10) {
        changes.push({
          release_id: releaseId,
          version,
          area: currentArea,
          change_type: changeType,
          legislation_tags: legislations,
          ticket,
          summary
        });
      }
      buffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushBuffer();
        inEntry = false;
        continue;
      }

      // Detect section header
      const newArea = detectArea(trimmed, null);
      if (newArea && newArea !== currentArea) {
        flushBuffer();
        currentArea = newArea;
        inEntry = false;
        continue;
      }

      // Detect start of a new ticket entry
      if (TICKET_REGEX.test(trimmed)) {
        flushBuffer();
        inEntry = true;
        buffer.push(trimmed);
        continue;
      }

      // Skip separator lines
      if (/^[-=*_]{3,}$/.test(trimmed)) {
        flushBuffer();
        continue;
      }

      if (inEntry || trimmed.length > 20) {
        buffer.push(trimmed);
      }
    }

    flushBuffer();
    return changes;
  }

  /**
   * Parse version string to comparable array of numbers
   * e.g. "12.0.38" -> [12, 0, 38]
   */
  function parseVersion(vStr) {
    return vStr.split('.').map(n => parseInt(n, 10) || 0);
  }

  function compareVersions(a, b) {
    const av = parseVersion(a);
    const bv = parseVersion(b);
    for (let i = 0; i < Math.max(av.length, bv.length); i++) {
      const diff = (av[i] || 0) - (bv[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  return { parseReleaseText, parseVersion, compareVersions };

})();
