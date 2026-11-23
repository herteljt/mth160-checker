/* MTH 160 Portfolio Checker: core logic. Works in the browser and in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Checker = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const VERSION = '1.5.3';          // checker release. Keep in sync with package.json and CHANGELOG.md

  // ===== INSTRUCTOR SETTINGS: edit this block each semester =====
  const CONFIG = {
    templateVersion: '1.2.3',       // current student template. Only major.minor must match
    cover: {                          // the Submission Info tab (first tab of the template)
      sheet: 'Submission Info', name: 'B6', people: 'B7', minutes: 'B8', ai: 'B9', aiHow: 'B10', sources: 'B11', unfinished: 'B12',
      reflection: 'A16', signature: 'B22', date: 'B23', code: 'B27', reflectionWords: [200, 250]
    },
    filePattern: /^[A-Za-z][A-Za-z'\-]*_[A-Za-z][A-Za-z'\-]*\.xlsx$/, // First_Last.xlsx
    allowedFunctions: ['IF', 'AND', 'OR', 'LN', 'EXP'],               // everything else is flagged
    // Extra functions allowed only in specific places (template already uses SUM here)
    extraAllowed: {
      'Income Tax Estimator': { B13: ['SUM'], B28: ['SUM'] },
      'Extra Credit - Card Interest': { E35: ['SUM'], F35: ['SUM'] }
    },
    minInstructionChars: 40,        // text in A1:D2 beyond the word "Instructions:"
    tolerance: 1e-5,                // relative tolerance on numeric answers
    taxIncomes: [9000, 50400, 85000, 150000, 260000, 800000],
    // Bracket upper limits and rates come from the template (2026 tables, Rev. Proc. 2025-32)
    tax: {
      'Single': { input: 'D3', rows: [5, 11], total: 'B13', eff: 'B14', logic: 'D4:J12',
        limits: [12400, 50400, 105700, 201775, 256225, 640600, Infinity] },
      'Married Filing Jointly': { input: 'D18', rows: [20, 26], total: 'B28', eff: 'B29', logic: 'D19:J27',
        limits: [24800, 100800, 211400, 403550, 512450, 768700, Infinity] }
    },
    rates: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37],
    minIfPerFiler: 7,
    // Credit card interest tab (extra credit): inputs B5:B10, outputs B12:B14, daily table D5:F34 (30 days)
    card: { logic: 'E5:E34', minIf: 30, days: 30, daysInYear: 365 },
    // Automated points. All-or-nothing: a category earns its points only if every check in it passes.
    // Reflection (10), scratchwork (10) and the upload question (1) are graded in Canvas, not here.
    points: {
      base: { layout: 5, ops: 10, instructions: 7, values: 3 },   // sums to 25
      calc: { 'Simple Interest': 8, 'Compound Interest': 8, 'Continuous Compounded Interest': 8, 'Future Value': 8, 'Present Value': 8 },
      tax: 7, apy: 7, ec: 2
    },
    // Values students must leave typed in the input cells (the published test values)
    testValues: {
      'Simple Interest': { B5: 3000, B6: 0.045, B7: 3, B11: 3405, B13: 0.045, B14: 3, B18: 3405, B19: 3000, B21: 3, F4: 3405, F5: 3000, F6: 0.045, F12: 3000, F13: 0.045, F14: 3 },
      'Compound Interest': { B5: 5000, B6: 0.06, B7: 12, B8: 10, B12: 10000, B14: 0.05, B15: 4, B16: 8, B20: 15000, B21: 10000, B22: 0.04, B23: 2 },
      'Continuous Compounded Interest': { B5: 2000, B6: 0.05, B7: 10, B11: 5000, B13: 0.04, B14: 6, B18: 3000, B19: 2000, B21: 8, B25: 4000, B26: 2500, B27: 0.06 },
      'Future Value': { B5: 200, B6: 0.05, B7: 12, B8: 20, B12: 100000, B14: 0.06, B15: 12, B16: 25, B20: 50000, B21: 300, B22: 0.05, B23: 12 },
      'Present Value': { B5: 500, B6: 0.06, B7: 12, B8: 5, B12: 20000, B14: 0.07, B15: 12, B16: 4, B20: 15000, B21: 400, B22: 0.06, B23: 12 },
      'APY Calculator': { B8: 0.042, B9: 12, B16: 0.043, B17: 4, F8: 0.045, F16: 0.04 },
      'Income Tax Estimator': { D3: 85000, D18: 150000 }
    }
  };
  // ===============================================================

  const SI = 'Simple Interest', CI = 'Compound Interest', CC = 'Continuous Compounded Interest',
    FV = 'Future Value', PV = 'Present Value', APY = 'APY Calculator',
    TAX = 'Income Tax Estimator', CARD = 'Extra Credit - Card Interest';
  const REQUIRED = [SI, CI, CC, FV, PV, APY, TAX];
  const OPTIONAL = [CARD];
  const COVER = () => CONFIG.cover.sheet;

  function makeRng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildCases(seed) {
    const R = makeRng(seed);
    const between = (lo, hi, step) => +(lo + step * Math.floor(R() * ((hi - lo) / step + 1))).toFixed(6);
    const pick = (arr) => arr[Math.floor(R() * arr.length)];
    const cases = [];
    const add = (sheet, label, inputs, outputs) => cases.push({ sheet, label, inputs, outputs });
    const one = (cell, expected) => [{ cell, expected }];

    // Simple interest
    {
      const P = between(1000, 20000, 500), r = between(0.02, 0.09, 0.005), t = between(1, 10, 1);
      const A = P * (1 + r * t), I = P * r * t;
      add(SI, 'Case 1 (find A)', { B5: P, B6: r, B7: t }, one('B4', A));
      add(SI, 'Case 2 (find P)', { B11: A, B13: r, B14: t }, one('B12', P));
      add(SI, 'Case 3 (find r)', { B18: A, B19: P, B21: t }, one('B20', r));
      add(SI, 'Case 4 (find t)', { F4: A, F5: P, F6: r }, one('F7', t));
      add(SI, 'Case 5 (find I)', { F12: P, F13: r, F14: t }, one('F11', I));
    }
    // Compound interest
    {
      const P = between(1000, 20000, 500), r = between(0.02, 0.09, 0.005), n = pick([2, 4, 12]), t = between(1, 20, 1);
      const A = P * Math.pow(1 + r / n, n * t);
      add(CI, 'Case 1 (find A)', { B5: P, B6: r, B7: n, B8: t }, one('B4', A));
      add(CI, 'Case 2 (find P)', { B12: A, B14: r, B15: n, B16: t }, one('B13', P));
      add(CI, 'Case 3 (find t)', { B20: A, B21: P, B22: r, B23: n }, one('B24', t));
    }
    // Continuous compounding
    {
      const P = between(1000, 20000, 500), r = between(0.02, 0.09, 0.005), t = between(1, 20, 1);
      const A = P * Math.exp(r * t);
      add(CC, 'Case 1 (find A)', { B5: P, B6: r, B7: t }, one('B4', A));
      add(CC, 'Case 2 (find P)', { B11: A, B13: r, B14: t }, one('B12', P));
      add(CC, 'Case 3 (find r)', { B18: A, B19: P, B21: t }, one('B20', r));
      add(CC, 'Case 4 (find t)', { B25: A, B26: P, B27: r }, one('B28', t));
    }
    // Annuities (ordinary annuity, payment at the end of each compounding period)
    {
      const pmt = between(50, 1000, 50), r = between(0.02, 0.09, 0.005), m = pick([2, 4, 12]), t = between(2, 20, 1);
      const i = r / m;
      const fv = pmt * (Math.pow(1 + i, m * t) - 1) / i;
      const pv = pmt * (1 - Math.pow(1 + i, -m * t)) / i;
      add(FV, 'Case 1 (find FV)', { B5: pmt, B6: r, B7: m, B8: t }, one('B4', fv));
      add(FV, 'Case 2 (find PMT)', { B12: fv, B14: r, B15: m, B16: t }, one('B13', pmt));
      add(FV, 'Case 3 (find t)', { B20: fv, B21: pmt, B22: r, B23: m }, one('B24', t));
      add(PV, 'Case 1 (find PV)', { B5: pmt, B6: r, B7: m, B8: t }, one('B4', pv));
      add(PV, 'Case 2 (find PMT)', { B12: pv, B14: r, B15: m, B16: t }, one('B13', pmt));
      add(PV, 'Case 3 (find t)', { B20: pv, B21: pmt, B22: r, B23: m }, one('B24', t));
    }
    // APY: one scenario per winning bank
    for (let w = 1; w <= 4; w++) {
      const r = [], m = [pick([1, 2, 4, 12]), pick([1, 2, 4, 12])];
      for (let b = 1; b <= 4; b++) r[b] = b === w ? 0.07 : between(0.02, 0.05, 0.005);
      const comp = (b) => Math.pow(1 + r[b] / m[b - 1], m[b - 1]) - 1;
      add(APY, 'Scenario ' + w, { B8: r[1], B9: m[0], B16: r[2], B17: m[1], F8: r[3], F16: r[4] },
        [{ cell: 'B10', expected: comp(1) }, { cell: 'B18', expected: comp(2) },
          { cell: 'F9', expected: Math.exp(r[3]) - 1 }, { cell: 'F17', expected: Math.exp(r[4]) - 1 },
          { cell: 'F1', winner: w }]);
    }
    // Income tax
    for (const [name, t] of Object.entries(CONFIG.tax)) {
      for (const inc of CONFIG.taxIncomes) {
        const outs = []; let total = 0, lo = 0;
        t.limits.forEach((hi, k) => {
          const tax = CONFIG.rates[k] * Math.max(0, Math.min(inc, hi) - lo);
          outs.push({ cell: 'B' + (t.rows[0] + k), expected: tax }); total += tax; lo = hi;
        });
        outs.push({ cell: t.total, expected: total }, { cell: t.eff, expected: total / inc });
        add(TAX, name + ', income $' + inc.toLocaleString('en-US'), { [t.input]: inc }, outs);
      }
    }
    // Credit card interest, simple daily interest (extra credit). Five scenarios; every daily row is checked.
    {
      const N = CONFIG.card.days, Y = CONFIG.card.daysInYear;
      const scenarios = [
        { name: 'No purchase or payment', buy: false, pay: false },
        { name: 'Purchase only', buy: true, pay: false },
        { name: 'Payment only', buy: false, pay: true },
        { name: 'Purchase, then payment', buy: true, pay: true, order: 'buyFirst' },
        { name: 'Payment, then purchase', buy: true, pay: true, order: 'payFirst' }
      ];
      for (const s of scenarios) {
        const bal = between(500, 5000, 100), apr = between(0.12, 0.30, 0.005);
        let buyDay = between(2, 28, 1), payDay = between(2, 28, 1);
        if (s.order === 'buyFirst' && buyDay >= payDay) { buyDay = between(2, 14, 1); payDay = between(16, 28, 1); }
        if (s.order === 'payFirst' && payDay >= buyDay) { payDay = between(2, 14, 1); buyDay = between(16, 28, 1); }
        const buy = s.buy ? between(100, 1500, 50) : 0, pay = s.pay ? between(100, Math.min(bal, 1000), 50) : 0;
        const outs = []; let sumBal = 0, sumInt = 0;
        for (let d = 1; d <= N; d++) {
          const b = bal + (d >= buyDay ? buy : 0) - (d >= payDay ? pay : 0), i = b * apr / Y;
          sumBal += b; sumInt += i;
          outs.push({ cell: 'E' + (4 + d), expected: b }, { cell: 'F' + (4 + d), expected: i });
        }
        outs.push({ cell: 'B12', expected: sumInt }, { cell: 'B13', expected: sumBal / N }, { cell: 'B14', expected: bal + buy - pay + sumInt });
        add(CARD, s.name, { B5: bal, B6: apr, B7: buy, B8: buyDay, B9: pay, B10: payDay }, outs);
      }
    }
    return cases;
  }

  // Small non-cryptographic hash (cyrb53). Used for typo detection and file fingerprints, not security.
  function cyrb53(str, seed) {
    let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  const checksum = (body) => cyrb53(body).toString(36).toUpperCase().slice(-3).padStart(3, '0');

  // Fingerprint of the workbook's content (formulas and typed values on the graded tabs), so a re-save
  // that changes nothing keeps the same fingerprint.
  function fingerprint(wb) {
    const parts = [];
    for (const name of REQUIRED.concat(OPTIONAL)) {
      const ws = wb.Sheets[name]; if (!ws) continue;
      for (const addr of Object.keys(ws).filter((k) => k[0] !== '!').sort()) {
        const c = ws[addr];
        if (typeof c.v === 'string' && c.v.indexOf('MTH160|') >= 0 && !c.f) continue; // the pasted submission code is not part of the work
        const v = c.f ? '=' + c.f : (c.v === undefined || c.v === null ? '' : String(c.v));
        if (v !== '') parts.push(name + '!' + addr + '=' + v);
      }
    }
    return cyrb53(parts.join('\n')).toString(16).padStart(14, '0').slice(0, 8);
  }

  // Parse a submission code. Returns null if none is found; .valid is false if the checksum fails.
  function parseCode(raw) {
    const text = String(raw == null ? '' : raw).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    const m = text.match(/MTH160\|[^\s|]+\|[^\s|]+\|B[01]{4}\|C[01]{5}\|T[01]\|A[01]\|E[01]\|P\d+\|S\d+\|F[0-9a-f]{8}\|K[0-9A-Z]{3}/);
    if (!m) return null;
    const full = m[0], i = full.lastIndexOf('|K'), body = full.slice(0, i), f = body.split('|');
    return { raw: full, valid: checksum(body) === full.slice(i + 2), version: f[1], student: f[2],
      flags: f.slice(3, 8).join('|'), points: +f[8].slice(1), seed: +f[9].slice(1), fp: f[10].slice(1) };
  }

  // Find a submission code pasted into any cell of the workbook. Prefers a code with a valid checksum.
  function findCode(wb) {
    let first = null;
    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      for (const addr of Object.keys(ws).filter((k) => k[0] !== '!').sort()) {
        const c = ws[addr];
        if (typeof c.v !== 'string' || c.v.indexOf('MTH160|') < 0) continue;
        const p = parseCode(c.v); if (!p) continue;
        const hit = { sheet: name, addr, parsed: p };
        if (p.valid) return hit;
        if (!first) first = hit;
      }
    }
    return first;
  }

  // Read the Submission Info tab. Missing cells read as empty strings.
  function readCover(wb, fileName, XLSX) {
    const C = CONFIG.cover, ws = wb.Sheets[C.sheet];
    if (!ws) return { present: false, issues: [] };
    const txt = (a) => { const c = ws[C[a]]; return c && c.v !== undefined && c.v !== null ? String(c.v).trim() : ''; };
    const minutesRaw = txt('minutes'), m = parseFloat(minutesRaw.replace(/,/g, ''));
    const aiRaw = txt('ai'), reflection = txt('reflection');
    return {
      present: true, name: txt('name'), people: txt('people'), minutesRaw, minutes: isFinite(m) ? m : null,
      ai: /^I used/i.test(aiRaw) ? 'used' : /^I did not/i.test(aiRaw) ? 'none' : '', aiHow: txt('aiHow'),
      sources: txt('sources'), unfinished: txt('unfinished'), reflection, words: reflection ? reflection.split(/\s+/).filter(Boolean).length : 0,
      signature: txt('signature'), date: txt('date'), issues: []
    };
  }

  function readTemplateVersion(wb) {
    const names = (wb.Workbook && wb.Workbook.Names) || [];
    const dn = names.find((n) => n.Name === 'TPL_VERSION');
    if (dn) { const m = String(dn.Ref).match(/\d+\.\d+\.\d+/); if (m) return m[0]; }
    for (const s of wb.SheetNames) {
      const c = wb.Sheets[s]['AA2'];
      if (c && typeof c.v === 'string' && /^\d+\.\d+\.\d+$/.test(c.v.trim())) return c.v.trim();
    }
    return null;
  }
  const majorMinor = (v) => String(v).split('.').slice(0, 2).join('.');

  const fmt = (x) => (typeof x === 'number' ? String(+x.toPrecision(8)) : String(x));
  const stripStrings = (f) => f.replace(/"[^"]*"/g, '""');

  function run({ XLSX, HyperFormula, data, fileName, seed }) {
    seed = seed == null ? Math.floor(Math.random() * 1e9) : seed;
    const sections = [];
    const sec = (title) => { const s = { title, items: [] }; sections.push(s); return s; };
    const item = (s, ok, text, detail) => s.items.push({ ok, text, detail });

    // File name
    const fs = sec('File');
    const fnOk = CONFIG.filePattern.test(fileName || '');
    item(fs, fnOk, 'File name follows First_Last.xlsx', fileName);

    const wb = XLSX.read(data, { type: 'array', cellFormula: true, sheetStubs: true });
    const cellAt = (sheet, addr) => (wb.Sheets[sheet] || {})[addr];
    const formulaOf = (sheet, addr) => { const c = cellAt(sheet, addr); return c && c.f ? c.f : null; };

    // Template version
    const tvs = sec('Template version');
    const tv = readTemplateVersion(wb);
    const verOk = !!tv && majorMinor(tv) === majorMinor(CONFIG.templateVersion);
    item(tvs, verOk,
      'Built from the current template (v' + CONFIG.templateVersion + ')',
      tv ? 'Your file uses template v' + tv + '. Make a new copy of the current template and move your work into it.'
         : 'No template version found. Start from a fresh copy of the official template.');

    // Tabs and instructions
    const st = sec('Tabs and instructions');
    const present = {};
    let tabsOk = true, instrOk = true;
    for (const name of REQUIRED.concat(OPTIONAL)) {
      present[name] = wb.SheetNames.includes(name);
      if (!present[name]) { if (REQUIRED.includes(name)) { tabsOk = false; instrOk = false; item(st, false, 'Tab "' + name + '" exists', 'Not found. Tab names must match the template exactly.'); } continue; }
      let text = ['A1', 'B1', 'C1', 'D1', 'A2', 'B2', 'C2', 'D2'].map((a) => { const c = cellAt(name, a); return c && typeof c.v === 'string' ? c.v : ''; }).join(' ').replace(/Instructions:?/i, '').trim();
      const hasI = text.length >= CONFIG.minInstructionChars;
      if (REQUIRED.includes(name) && !hasI) instrOk = false;
      item(st, hasI, '"' + name + '" has written instructions (A1:D2)', text.length + ' characters found');
    }

    // Required test values
    const tvSec = sec('Test values');
    let valuesOk = true;
    for (const name of REQUIRED) {
      if (!present[name]) { valuesOk = false; continue; }
      const miss = [];
      for (const [addr, want] of Object.entries(CONFIG.testValues[name] || {})) {
        const c = cellAt(name, addr), got = c ? c.v : undefined;
        if (!(typeof got === 'number' && Math.abs(got - want) <= 1e-9 * Math.max(1, Math.abs(want))))
          miss.push(addr + ' should be ' + want + (got === undefined || got === null || got === '' ? ' (blank)' : ' (found ' + got + ')'));
      }
      if (miss.length) valuesOk = false;
      item(tvSec, miss.length === 0, 'Required test values entered on "' + name + '"',
        miss.slice(0, 6).join('; ') + (miss.length > 6 ? ' (+' + (miss.length - 6) + ' more)' : ''));
    }

    // Function rules
    const fr = sec('Allowed functions');
    const bad = [];
    for (const name of wb.SheetNames) {
      if (name === COVER()) continue;   // the cover tab has a word-count formula that is part of the template
      const ws = wb.Sheets[name];
      for (const addr of Object.keys(ws)) {
        if (addr[0] === '!' || !ws[addr].f) continue;
        const funcs = (stripStrings(ws[addr].f).match(/[A-Za-z_][A-Za-z0-9_.]*(?=\s*\()/g) || []).map((s) => s.toUpperCase());
        const ex = (CONFIG.extraAllowed[name] || {});
        const ok = new Set(CONFIG.allowedFunctions.concat(ex['*'] || [], ex[addr] || []));
        for (const fn of funcs) if (!ok.has(fn)) bad.push(name + '!' + addr + ' uses ' + fn);
      }
    }
    const opsOk = bad.length === 0;
    item(fr, opsOk, 'Only ' + CONFIG.allowedFunctions.join(', ') + ' and basic operators are used',
      bad.length ? bad.slice(0, 10).join('; ') + (bad.length > 10 ? ' (+' + (bad.length - 10) + ' more)' : '') : '');

    // Logic checks
    const lg = sec('IF-statement logic');
    let taxLogicOk = true, apyLogicOk = false;
    for (const [name, t] of Object.entries(CONFIG.tax)) {
      if (!present[TAX]) break;
      const rg = XLSX.utils.decode_range(t.logic); let n = 0;
      for (let r = rg.s.r; r <= rg.e.r; r++) for (let c = rg.s.c; c <= rg.e.c; c++) {
        const f = formulaOf(TAX, XLSX.utils.encode_cell({ r, c }));
        if (f && /\bIF\s*\(/i.test(f)) n++;
      }
      if (n < CONFIG.minIfPerFiler) taxLogicOk = false;
      item(lg, n >= CONFIG.minIfPerFiler, name + ': at least ' + CONFIG.minIfPerFiler + ' IF formulas in ' + t.logic, n + ' found');
    }
    if (present[APY]) { const f = formulaOf(APY, 'F1'); apyLogicOk = !!(f && /\bIF\s*\(/i.test(f)); item(lg, apyLogicOk, 'APY: F1 uses an IF statement', f ? '=' + f : 'F1 has no formula'); }

    let cardLogicOk = true;
    if (present[CARD]) {
      const rg = XLSX.utils.decode_range(CONFIG.card.logic); let n = 0;
      for (let r = rg.s.r; r <= rg.e.r; r++) for (let c = rg.s.c; c <= rg.e.c; c++) {
        const f = formulaOf(CARD, XLSX.utils.encode_cell({ r, c }));
        if (f && /\bIF\s*\(/i.test(f)) n++;
      }
      cardLogicOk = n >= CONFIG.card.minIf;
      item(lg, cardLogicOk, 'Card Interest (extra credit): at least ' + CONFIG.card.minIf + ' IF formulas in ' + CONFIG.card.logic, n + ' found');
    }

    // Dynamic tests
    const cases = buildCases(seed);
    const sheets = {};
    for (const name of wb.SheetNames) {
      if (name === COVER()) continue;
      const ws = wb.Sheets[name]; const rows = [];
      if (ws['!ref']) {
        const rg = XLSX.utils.decode_range(ws['!ref']);
        for (let r = 0; r <= rg.e.r; r++) { const row = []; for (let c = 0; c <= rg.e.c; c++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c })];
          row.push(cell ? (cell.f ? '=' + cell.f : (cell.v === undefined ? null : cell.v)) : null);
        } rows.push(row); }
      }
      sheets[name] = rows.length ? rows : [[]];
    }
    const hf = HyperFormula.buildFromSheets(sheets, { licenseKey: 'gpl-v3' });
    const tol = CONFIG.tolerance;
    const results = {};
    for (const cs of cases) {
      if (!present[cs.sheet]) continue;
      const id = hf.getSheetId(cs.sheet);
      for (const [addr, v] of Object.entries(cs.inputs)) { const a = XLSX.utils.decode_cell(addr); hf.setCellContents({ sheet: id, row: a.r, col: a.c }, v); }
      const fails = [];
      for (const o of cs.outputs) {
        const a = XLSX.utils.decode_cell(o.cell);
        if (!formulaOf(cs.sheet, o.cell)) { fails.push(o.cell + ' is not a formula'); continue; }
        let got = hf.getCellValue({ sheet: id, row: a.r, col: a.c });
        if (got && typeof got === 'object') { fails.push(o.cell + ' returns ' + got.value); continue; }
        if (o.winner) {
          const digits = (String(got).match(/[1-4]/g) || []);
          if (!(digits.length >= 1 && digits.every((d) => +d === o.winner))) fails.push(o.cell + ' should name Bank ' + o.winner + ', got "' + fmt(got) + '"');
        } else if (typeof got !== 'number' || !(Math.abs(got - o.expected) <= tol * Math.max(1, Math.abs(o.expected)))) {
          fails.push(o.cell + ' expected ' + fmt(o.expected) + ', got ' + fmt(got));
        }
      }
      (results[cs.sheet] = results[cs.sheet] || []).push({ label: cs.label, inputs: cs.inputs, fails });
    }
    for (const name of REQUIRED.concat(OPTIONAL)) {
      if (!present[name]) continue;
      const rs = results[name] || [], s = sec('Tests: ' + name + (OPTIONAL.includes(name) ? ' (extra credit)' : ''));
      for (const r of rs) item(s, r.fails.length === 0, r.label,
        r.fails.length ? r.fails.slice(0, 6).join('; ') + (r.fails.length > 6 ? ' (+' + (r.fails.length - 6) + ' more)' : '') + '   [inputs: ' + Object.entries(r.inputs).map(([k, v]) => k + '=' + fmt(v)).join(', ') + ']' : '');
    }

    // Automated score (all-or-nothing per category)
    const passTab = (n) => !!present[n] && (results[n] || []).length > 0 && (results[n] || []).every((r) => r.fails.length === 0);
    const P = CONFIG.points;
    const cats = [
      { key: 'layout', group: 'B', label: 'Template and layout (file name, current template, all tabs)', ok: fnOk && verOk && tabsOk, max: P.base.layout },
      { key: 'ops', group: 'B', label: 'Only allowed operations used', ok: opsOk, max: P.base.ops },
      { key: 'instr', group: 'B', label: 'Instructions on every tab', ok: instrOk, max: P.base.instructions },
      { key: 'values', group: 'B', label: 'Required test values entered', ok: valuesOk, max: P.base.values },
      ...[SI, CI, CC, FV, PV].map((n) => ({ key: n, group: 'C', label: n + ' calculator', ok: passTab(n), max: P.calc[n] })),
      { key: TAX, group: 'T', label: 'Federal Income Tax Estimator', ok: passTab(TAX) && taxLogicOk, max: P.tax },
      { key: APY, group: 'A', label: 'APY Comparison Calculator', ok: passTab(APY) && apyLogicOk, max: P.apy },
      { key: CARD, group: 'E', label: 'Extra credit: Credit Card Interest', ok: passTab(CARD) && cardLogicOk, max: P.ec, extra: true }
    ];
    cats.forEach((c) => { c.earned = c.ok ? c.max : 0; });
    const sumOf = (list) => list.reduce((a, c) => a + c.earned, 0);
    const score = { categories: cats, total: sumOf(cats), core: sumOf(cats.filter((c) => !c.extra)), extra: sumOf(cats.filter((c) => c.extra)),
      max: cats.filter((c) => !c.extra).reduce((a, c) => a + c.max, 0) };
    const bit = (g) => cats.filter((c) => c.group === g).map((c) => (c.ok ? 1 : 0)).join('');
    const flags = 'B' + bit('B') + '|C' + bit('C') + '|T' + bit('T') + '|A' + bit('A') + '|E' + bit('E');
    const fp = fingerprint(wb);
    const who = String(fileName || '').replace(/\.xlsx$/i, '').replace(/[^A-Za-z_'\-]/g, '') || 'unknown';
    const body = 'MTH160|' + VERSION + '|' + who + '|' + flags + '|P' + score.total + '|S' + seed + '|F' + fp;
    const code = body + '|K' + checksum(body);

    // Submission Info tab: read what the student wrote, and report what is missing. Not part of the score.
    const cs = sec('Submission Info tab');
    const cover = readCover(wb, fileName, XLSX);
    const cf = [];
    const chk = (ok, text, detail, problem) => { item(cs, ok, text, detail); if (!ok) cf.push(problem || text); };
    if (!cover.present) { chk(false, 'Tab "' + CONFIG.cover.sheet + '" exists', 'Not found. Start from a fresh copy of the current template.', 'Submission Info tab missing'); }
    else {
      chk(!!cover.name, 'Your name is filled in', '', 'Name missing');
      chk(!!cover.people, 'People you worked with is filled in (write None if none)', '', 'Worked-with missing');
      chk(cover.minutes !== null && cover.minutes > 0, 'Time spent is a number of minutes', cover.minutesRaw ? 'Found: ' + cover.minutesRaw : '', 'Time spent missing or not a number');
      chk(cover.ai !== '', 'AI statement is chosen', '', 'AI statement not chosen');
      if (cover.ai === 'used') chk(!!cover.aiHow, 'AI use is described (which tools and how)', '', 'AI use not described');
      const [lo, hi] = CONFIG.cover.reflectionWords;
      chk(cover.words >= lo && cover.words <= hi, 'Reflection is ' + lo + ' to ' + hi + ' words', cover.words + ' words found', 'Reflection is ' + cover.words + ' words (needs ' + lo + ' to ' + hi + ')');
      chk(!!cover.signature, 'Honor statement signed (full name typed)', '', 'Honor statement not signed');
      const stem = String(fileName || '').replace(/\.xlsx$/i, '').replace(/[^A-Za-z]/g, '').toLowerCase();
      const norm = (t) => String(t || '').replace(/[^A-Za-z]/g, '').toLowerCase();
      if (cover.signature) chk(norm(cover.signature) === stem, 'Typed name matches the file name', 'Name "' + cover.signature + '" and file "' + fileName + '"', 'Typed name differs from file name');
    }
    cover.issues = cf;
    const codeFound = findCode(wb);
    item(cs, !!codeFound && codeFound.parsed.valid && codeFound.parsed.fp === fp, 'Submission code is pasted into the Submission Info tab and matches your current work',
      !codeFound ? 'No code found in the file. Paste the code shown below into cell ' + CONFIG.cover.code + '.' : (codeFound.parsed.valid && codeFound.parsed.fp === fp ? '' : 'The code in ' + codeFound.sheet + '!' + codeFound.addr + ' is out of date or mistyped. Paste the new code.'));
    const found = codeFound;
    const codeInFile = found ? { where: found.sheet + '!' + found.addr, parsed: found.parsed, current: found.parsed.valid && found.parsed.fp === fp } : null;

    const all = sections.flatMap((s) => s.items);
    return { version: VERSION, templateVersion: tv, score, flags, fingerprint: fp, code, codeInFile, cover, seed, sections, passed: all.filter((i) => i.ok).length, failed: all.filter((i) => !i.ok).length };
  }

  return { run, CONFIG, VERSION, parseCode, checksum, findCode };
});
