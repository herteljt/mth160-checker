# Changelog

Versions follow MAJOR.MINOR.PATCH.
- MAJOR or MINOR: the template layout, tested cells, or grading rules changed. Students must use the matching template (the checker compares major.minor).
- PATCH: wording, messages, packaging, or fixes that do not change what is tested.

## 1.3.0 (Fall 2026)
- The submission code now travels inside the spreadsheet. Students paste it into Simple Interest!J9 and submit the file. The grader and `cli.js` read the code from each file; the quiz export is optional and is used only for files with no code of their own.
- The file fingerprint ignores the cell that holds the code, so pasting the code does not change it, while any later edit to the work still does (`FILE_CHANGED`). Fingerprints of files without a code are unchanged.
- New status `NAME_MISMATCH` (a valid code issued under another name, such as a copied file). New CSV column `code_source`. A file with no code is now `NO_CODE` even when no quiz export is loaded.
- Student page tells the student whether the file already holds a code, and whether it is current.
- Template 1.0.2: labeled code cell (J8 and J9); rate cells display as 4.50% instead of 5%; the Payment cells on Future Value and Present Value (B21) no longer show as percentages. No change to tested cells. Template 1.0.0 and 1.0.1 files still pass the version check.
- Fixed an extra empty column in the `CODE_NO_FILE` rows of the CSV.

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
