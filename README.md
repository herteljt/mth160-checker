# MTH 160 Portfolio Checker

Students open the GitHub Pages URL, select their .xlsx file, and get a pass/fail report, an estimate of
their automated points, and a submission code. The student pastes the code into a cell of their own spreadsheet (Submission Info tab) and submits that file.
The file is processed in the browser and never uploaded.

## Deploy
1. Create a GitHub repository and upload the files in this folder to its root: `index.html`, `grader.html`, `checker.js`, `grading.js`, `README.md`, `CHANGELOG.md`, `.gitignore`.
2. Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. The site appears at `https://<username>.github.io/<repo>/`.
4. Students use `index.html`. Do not link `grader.html` from anything students see. Its address is unlisted (`noindex`) but not secret.
5. Do not upload student files to GitHub, even to a private repository, unless your institution has approved it. Both graders read files locally.

## Scoring (automated, all-or-nothing)
Points are set in `CONFIG.points` in `checker.js`. A category earns its points only if every check in it passes.

| Category | Points | What must pass |
| --- | --- | --- |
| Template and layout | 5 | File name `First_Last.xlsx`, current template version, all seven required tabs present |
| Only allowed operations | 10 | No function outside IF, AND, OR, LN, EXP (the template's own SUM cells are allowed) |
| Instructions on every tab | 7 | Written instructions present in A1:D2 on each required tab (quality is graded by hand) |
| Required test values entered | 3 | The published test values are typed in the input cells of each required tab |
| Each financial calculator | 8 x 5 | Every randomized test case passes, and answers are formulas, not typed numbers |
| Federal Income Tax Estimator | 7 | All tests pass and each filer's logic area (D4:G12, D19:G27) holds at least 7 IF formulas |
| APY Comparison Calculator | 7 | All tests pass and F1 uses an IF statement |
| Extra credit: GPA | 2 | All tests pass |

The first tab of the template, Submission Info, holds the student's name, who they worked with, time spent, AI statement, reflection, honor statement, and the submission code. It is not part of the score and not fingerprinted: the checker lists missing fields under "Things to fix", and the grader shows them with the reflection. Instruction quality, scratchwork, and the reflection are graded by hand.

Code status values: `OK`, `OK_GRADING_SEED_DIFFERS`, `FILE_CHANGED`, `CLAIM_MISMATCH`, `NAME_MISMATCH`, `BAD_CHECKSUM`, `NO_CODE`, `CODE_NO_FILE`. A status other than `OK` is a reason to look at the submission, not a finding of misconduct.

## Submission code
After a check, the page shows a code such as
`MTH160|1.3.0|Jordan_Smith|B1111|C11111|T1|A1|E1|P81|S600473659|F1332120e|KDZR`
(version, student, pass flags by category, points, test seed, file fingerprint, checksum).
Students paste it into the Submission Info tab (the first tab of the template), save the file under the same name, and submit it. The instructor tools read the code out of each spreadsheet, so no quiz export is needed. The code cell is left out of the file fingerprint, so pasting the code does not change it, but any later change to the work does. The code is not tamper-proof (the checker runs in the browser), so the instructor tools recompute everything from the uploaded file.

## Grade a class online (instructor page)
Open `https://<username>.github.io/<repo>/grader.html`.
1. Choose the Canvas submissions .zip (or several .xlsx files). Nested folders, `__MACOSX` entries, and `~$` lock files are skipped.
2. Optional: choose the quiz Student Analysis .csv. It is used only for files that contain no code of their own.
3. Enter a grading seed (any whole number you keep private).
4. Click Run grading. The table shows each student's automated score, the categories without points, and the code status. Click a row for the failed checks. Use "Show only files that need review" to focus, and Download CSV for the full results.
Files are read and graded in your browser and are not uploaded.

## Update each semester
Edit the CONFIG block at the top of `checker.js`: allowed functions, points, test values, file-name pattern,
tax brackets and rates, test incomes, and the number of IF formulas required.
If the template's cell layout changes, update the cell addresses in `buildCases` and `testValues`.

## Versioning
Current release: **1.4.0** (see `CHANGELOG.md`). The checker shows its version and the expected template
version in the page header and in every report. A file built on a different MAJOR or MINOR template version
fails the version check; PATCH differences are ignored.

To release a change: update `VERSION` (and `templateVersion` if the template changed) in `checker.js`,
add an entry to `CHANGELOG.md`, and name the release zip with the version.
