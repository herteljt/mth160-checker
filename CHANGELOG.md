# Changelog

Versions follow MAJOR.MINOR.PATCH.
- MAJOR or MINOR: the template layout, tested cells, or grading rules changed. Students must use the matching template (the checker compares major.minor).
- PATCH: wording, messages, packaging, or fixes that do not change what is tested.

## 1.5.4 (Fall 2026)
- Federal Income Tax Estimator is now worth 8 points (the 1-point spreadsheet upload item was removed). Automated core total is 80. Template unchanged (v1.2.3).
- The "required test values typed in" check was removed (3 points); Instructions on every tab is now 10 points. The submission code's base flags are now 3 digits (B###).

## 1.5.3 (Fall 2026)
- Template 1.2.3: every logic area now carries the same note: "Use IF and AND only. Do not use MAX, MIN, VLOOKUP, IFS, or any other built-in function." The instruction to write one IF per bracket is removed.
- Income Tax Estimator: the yellow logic area is larger (D4:J12 for Single, D19:J27 for Married Filing Jointly) so students have room for more than one column of logic. The checker counts IF formulas in the larger area (still at least 7 per filer).
- No change to scoring or tests otherwise.

## 1.5.2 (Fall 2026)
- Template 1.2.2: guidance added next to each logic area. Income Tax Estimator (both filers): write one IF formula per bracket, AND and OR allowed, no MIN, MAX, VLOOKUP, SUMIF, IFS, or other built-in functions. APY Calculator: use IF and AND only, and use an IF in F1 to name the winning bank. Card Interest: use IF statements in the balance column.
- No change to scoring or tests.

## 1.5.1 (Fall 2026)
- Template 1.2.1: the Simple Interest answer cells B4 (Case 1) and B12 (Case 2) now carry the word FINDING, like the other answer cells.
- No change to scoring or tests.

## 1.5.0 (Fall 2026)
- Template 1.2.0: the GPA extra-credit tab is replaced by "Extra Credit - Card Interest". It models one 30-day billing cycle with simple daily interest: inputs for starting balance, APR, one purchase and one payment (amount and day), a 30-row daily table (balance and daily interest), and outputs for interest charged, average daily balance, and ending balance. The template pre-fills the column totals (SUM in E35 and F35).
- Checker: five randomized scenarios (no activity, purchase only, payment only, purchase then payment, payment then purchase). Each scenario checks the three outputs and all 30 daily balances and daily interest values. Each balance in E5:E34 must use an IF statement. Still worth 2 points of extra credit.
- Long lists of failed cells are shortened to the first six on the student page.
- Conventions the tests assume: 30-day cycle, daily rate = APR / 365, a purchase or payment counts in the balance from its day on, interest is not added to the balance until the cycle ends, no rounding, no grace period.

## 1.4.0 (Fall 2026)
- Template 1.1.0: new first tab, Submission Info, with the link to the checker, name, people worked with, minutes, AI statement (dropdown) and description, other sources, unfinished work, the reflection (with a live word count, 200 to 250 words), honor statement, a submit checklist, and the submission code cell. The code cell moved from Simple Interest J9 to Submission Info B27. Templates 1.0.x no longer pass the version check.
- The checker reads the Submission Info tab. Missing or wrong fields (and a reflection outside 200 to 250 words, or a typed name that differs from the file name) appear under "Things to fix" on the student page. They do not change the score.
- The grader shows each student's answers and full reflection in the row details, adds a "Submission Info" column, and flags files with issues for review. New CSV columns: `minutes`, `worked_with`, `ai_use`, `reflection_words`, `cover_issues`.
- The function check and the test recalculation skip the Submission Info tab (its word-count formula is part of the template).

## 1.3.1 (Fall 2026)
- Instructor grader page: added a collapsible key that explains the columns, categories, code statuses, integrity results, and a suggested review order. Hovering over a code status shows its meaning.
- No change to scoring, test values, or the template.

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
