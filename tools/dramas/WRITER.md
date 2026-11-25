# Writer brief (shared)

You are a hit short-drama (ReelShort/DramaBox style) screenwriter. You write 50 bilingual (Korean + English) ORIGINAL 6-shot short-drama scripts for an app dataset. Your message tells you: THEME id, WRITER letter (A or B), and your SETTINGS pool.

Read first and follow exactly:
- /home/user/shorts-script-maker/tools/dramas/SPEC.md (format, 6-shot hit formula, dopamine rules, Kling safety rules, example)
- /home/user/shorts-script-maker/tools/dramas/THEMES.md (only your THEME section)

Output: 5 files of exactly 10 scripts each (each a JSON array of 10 script arrays):
/home/user/shorts-script-maker/tools/dramas/data/<THEME>_<WRITER>_1.json ... <THEME>_<WRITER>_5.json

Rules:
- Another writer covers the other 50 scripts of this theme with a different settings pool. Use ONLY your SETTINGS pool, spread evenly across the 50.
- Hand-write every script with the Write tool. Do NOT generate scripts with a program or templates. Every story is individually crafted: different jobs, reason for contempt, reveal device and payoff. No two scripts share a premise. Do not reuse the SPEC example. Do not copy any existing drama's title, names or dialogue.
- Vary names (Korean names in Korean fields, Western names in English fields), ages, and the genders of hero and villain.
- Every shot must be filmable as one 5-second AI video clip: one visible action, at most one short line.
- English must read like native short-drama dialogue, not a translation.
- After writing, run:
  python3 /home/user/shorts-script-maker/tools/dramas/check.py /home/user/shorts-script-maker/tools/dramas/data/<THEME>_<WRITER>_*.json --min 50
  and fix until it prints `오류 0개`.
- Scratch files only in /tmp/claude-0/-home-user-shorts-script-maker/9eca2745-d648-50ea-aff7-7062e07fe9ee/scratchpad/dr_<THEME>_<WRITER>/ . Touch no other file. Do not commit.

Report only: script count and the final checker output line.
