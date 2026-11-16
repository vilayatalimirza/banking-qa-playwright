# Test plan (release of the suite against ParaBank)

| Item | Detail |
|---|---|
| Objective | Verify the 24 requirements in `docs/TRACEABILITY.md` against ParaBank demo |
| Entry | `tsc` clean, unit and contract tests green, ParaBank reachable |
| Environment | `BASE_URL` (default public demo), Node 22, Playwright 1.64.x, Chromium + Firefox + WebKit + Pixel 7 emulation |
| Schedule | Every push/PR and nightly run (02:30 UTC): typecheck/unit, full Chromium suite (2 serialized shards), Firefox/WebKit/Pixel 7 smoke matrix, and visual comparison (advisory). Manual workflow dispatch can regenerate Linux visual snapshots. |
| Roles | QA owner triages every red within a day: environmental (FLAKY-LOG), new defect (BUG-REPORTS + known-defects), or test bug |
| Data | Generated per test, no shared accounts |
| Defect process | Reproduce via API or minimal UI steps, record observation, write `## BUG-xxx`, register in `data/known-defects.ts`; guard test enforces the report exists |
| Risks | Demo resets mid-run (stale reads), Cloudflare/rate limiting, Windows-only visual baselines |
| Mitigations | Concurrency lock, 1 worker, retries, controls that skip when a detector is broken, Linux baselines via the `update_snapshots` workflow input |
| Exit | See exit criteria in TEST-STRATEGY.md; evidence bundle archived |
| Manual / exploratory | Not automated: usability, content tone, real SCA devices, anything needing a human judgement |
