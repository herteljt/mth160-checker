# Changelog

Versions follow MAJOR.MINOR.PATCH.
- MAJOR or MINOR: the template layout, tested cells, or grading rules changed. Students must use the matching template (the checker compares major.minor).
- PATCH: wording, messages, packaging, or fixes that do not change what is tested.

## 1.2.4 (Fall 2026)
- Student checker page redesigned: a donut chart of the score, a "Things to fix" list shown first, a collapsed "Works" list, and a collapsed detailed breakdown by category.
- No change to scoring, test values, or the template.

## 1.2.3 (Fall 2026)
- Find-the-time tests for Compound Interest, Future Value, and Present Value no longer draw 1 compounding period per year. With n = 1 a formula that left n out of the answer gave the right number by coincidence and passed.
- No change to scoring, test values, or the template.

## 1.2.2 (Fall 2026)
- Release reorganized into separate folders for published files, instructor-only tools, and the student template.
- No change to scoring or to what students see.

## 1.2.1 (Fall 2026)
- Instructor settings are read from a local file that is never published. Several values per setting are accepted.
- Template 1.0.1: internal change only. Layout and tested cells are unchanged, so 1.0.0 files still pass the version check.

## 1.2.0 (Fall 2026)
- New instructor page, `grader.html`: grades a whole class in the browser (Canvas .zip or several .xlsx files, optional quiz CSV, grading seed typed at run time). Nothing is uploaded. Download the same CSV the command-line script produces.
- Shared grading logic moved to `grading.js`.

## 1.1.0 (Fall 2026)
- Automated all-or-nothing scoring by category (template and layout, allowed operations, instructions, test values, five calculators, tax, APY, GPA extra credit). Points are set in `CONFIG.points`.
- New check: students must leave the published test values typed in the input cells of each required tab.
- Student page shows the estimated automated points and a submission code with a copy button.
- Fix: the tax logic-area IF count now looks only at the yellow logic area (D4:G12 and D19:G27).

## 1.0.0 (Fall 2026)
- First versioned release.
- Checker: file name, allowed functions, instructions, IF-logic checks, and randomized answer tests for all tabs.
- Template: cleared example values, shaded input cells, 2026 federal tax brackets (Rev. Proc. 2025-32).
