/* MTH 160 grading helpers shared by the command-line script (cli.js) and the instructor page (grader.html).
   Contains no secrets: the grading seed, template marker, and trap word are always passed in at run time. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Grading = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const KEYS = ['layout', 'ops', 'instr', 'values', 'Simple Interest', 'Compound Interest', 'Continuous Compounded Interest', 'Future Value', 'Present Value', 'Income Tax Estimator', 'APY Calculator', 'Extra Credit - GPA Estimator'];
  const COLS = ['layout', 'ops', 'instr', 'values', 'SI', 'CI', 'CC', 'FV', 'PV', 'tax', 'apy', 'ec'];
  const HEADER = ['file', 'student_id', 'auto_score', 'max', ...COLS, 'failed_checks', 'code_status', 'code_source', 'claimed_score', 'marker', 'trap_word', 'checker_version', 'template_version', 'failures'];

  const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';

  function parseCsv(text) {
    const rows = []; let row = [], cell = '', inq = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inq) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inq = false; } else cell += c; }
      else if (c === '"') inq = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // Canvas renames uploads: [lastfirst_][LATE_]userid_submissionid_OriginalName[-N].xlsx
  function originalName(file) {
    const base = String(file).split(/[\\/]/).pop();
    const m = base.match(/^(?:[^_]*_)?(?:LATE_)?(\d+)_(\d+)_(.+)$/);
    if (!m) return { name: base, userId: null };
    return { name: m[3].replace(/-\d+(\.xlsx)$/i, '$1'), userId: m[1] };
  }

  // Quiz Student Analysis CSV -> one entry per row, with the submission code found in any cell
  function parseCodes(Checker, csvText) {
    const rows = parseCsv(String(csvText).replace(/^﻿/, ''));
    const head = (rows[0] || []).map((h) => String(h).trim().toLowerCase());
    const idCol = head.indexOf('id'), nameCol = head.indexOf('name');
    return rows.slice(1).map((r) => {
      let code = null;
      for (const cell of r) { code = Checker.parseCode(cell); if (code) break; }
      return { id: idCol >= 0 ? String(r[idCol]).trim() : null, name: nameCol >= 0 ? r[nameCol] : '', code, used: false };
    });
  }

  // Optional template checks. Values are supplied by the instructor at run time,
  // and may each hold several values separated by commas (old and new, for example).
  const list = (v) => String(v == null ? '' : v).split(/[\s,;]+/).filter(Boolean);
  function integrity(XLSX, data, opts) {
    const tokens = list(opts && opts.token), words = list(opts && opts.trap);
    const trapRe = words.length ? new RegExp('\\b(?:' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i') : null;
    const wb = XLSX.read(data, { type: 'array', cellFormula: true, sheetStubs: true });
    let intact = 0, altered = 0; const trap = [];
    if (tokens.length) {
      const dn = ((wb.Workbook && wb.Workbook.Names) || []).find((n) => n.Name === 'TPL_ID');
      if (dn) (tokens.some((t) => String(dn.Ref).includes(t)) ? intact++ : altered++);
    }
    for (const s of wb.SheetNames) {
      const ws = wb.Sheets[s];
      const m = ws['AA1'];
      if (tokens.length && m && m.v !== undefined && m.v !== null && String(m.v) !== '') (tokens.includes(String(m.v)) ? intact++ : altered++);
      if (trapRe) for (const a of Object.keys(ws)) {
        if (a[0] === '!' || a === 'AA1' || a === 'AA2') continue;
        const v = ws[a].v;
        if (typeof v === 'string' && trapRe.test(v)) trap.push(s + '!' + a);
      }
    }
    const marker = !tokens.length ? 'n/a' : intact > 0 ? 'OK' : altered > 0 ? 'ALTERED' : 'MISSING';
    return { marker, intact, altered, trap };
  }

  // Grade one file. codes (optional) is the array from parseCodes; matching entries are marked used.
  function gradeOne({ XLSX, HyperFormula, Checker, fileName, data, seed, codes, token, trap }) {
    const orig = originalName(fileName);
    const res = Checker.run({ XLSX, HyperFormula, data, fileName: orig.name, seed });
    const ig = integrity(XLSX, data, { token, trap });
    // The submission code is read from the spreadsheet itself. A code from the quiz export is used only when the file has none.
    const san = (t) => String(t).replace(/\.xlsx$/i, '').replace(/[^A-Za-z_'\-]/g, '').toLowerCase();
    const stem = san(orig.name);
    let entry = null;
    if (codes) {
      entry = codes.find((e) => orig.userId && e.id === orig.userId) || codes.find((e) => e.code && san(e.code.student) === stem) || null;
      if (entry) entry.used = true;
    }
    const fileCode = res.codeInFile ? res.codeInFile.parsed : null;
    const c = fileCode || (entry && entry.code) || null;
    const source = fileCode ? 'file' : c ? 'quiz' : '';
    let status, claimed = '';
    if (!c) status = 'NO_CODE';
    else if (!c.valid) status = 'BAD_CHECKSUM';
    else {
      claimed = c.points;
      const again = Checker.run({ XLSX, HyperFormula, data, fileName: orig.name, seed: c.seed });
      if (again.fingerprint !== c.fp) status = 'FILE_CHANGED';
      else if (again.flags !== c.flags || again.score.total !== c.points) status = 'CLAIM_MISMATCH';
      else if (san(c.student) !== stem) status = 'NAME_MISMATCH';
      else status = res.flags === c.flags ? 'OK' : 'OK_GRADING_SEED_DIFFERS';
    }
    const fails = res.sections.flatMap((s) => s.items.filter((i) => !i.ok).map((i) => s.title + ' - ' + i.text));
    const missed = res.score.categories.filter((c) => !c.ok && !c.extra).map((c) => c.label);
    const flagged = missed.length > 0 || !['n/a', 'OK'].includes(status) || ['ALTERED', 'MISSING'].includes(ig.marker) || ig.trap.length > 0;
    return { fileName, orig, res, ig, status, source, claimed, fails, missed, flagged };
  }

  const csvHeader = () => HEADER.join(',');
  function csvRow(r) {
    const earned = Object.fromEntries(r.res.score.categories.map((c) => [c.key, c.earned]));
    return [q(r.fileName.split(/[\\/]/).pop()), r.orig.userId || '', r.res.score.total, r.res.score.max, ...KEYS.map((k) => earned[k]), r.res.failed, r.status, r.source, r.claimed,
      r.ig.marker, q(r.ig.trap.join(' ')), r.res.version, r.res.templateVersion || 'none', q(r.fails.join(' | '))].join(',');
  }
  const orphanRows = (codes) => (codes || []).filter((e) => !e.used && e.code)
    .map((e) => [q('(no file found)'), e.id || '', '', '', ...COLS.map(() => ''), '', 'CODE_NO_FILE', 'quiz', e.code.points, '', '', '', '', q(e.code.student)].join(','));
  const noCodeCount = (codes) => (codes || []).filter((e) => !e.code && (e.id || e.name)).length;

  return { KEYS, COLS, HEADER, parseCsv, originalName, parseCodes, integrity, gradeOne, csvHeader, csvRow, orphanRows, noCodeCount };
});
