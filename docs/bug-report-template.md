# Bug Report Template

Copy this for each confirmed defect. One defect per report.

**Title:** [Area] specific symptom, not a guess at the cause
*(example: "Transfer: a negative amount moves money from the destination account to the source")*

**Environment:** application and URL, browser, date and time with time zone, test customer (synthetic username)

**Severity (impact on the business):** Critical / High / Medium / Low
- *Critical:* money created, lost or duplicated; data exposed; access control broken
- *High:* wrong amounts or balances shown; a core flow blocked
- *Medium:* a rule not enforced, with a workaround
- *Low:* cosmetic or wording

**Priority (how soon to fix):** P1 / P2 / P3 (decided with the product owner; severity and priority are not the same thing)

**Preconditions:** the state needed before step 1 (for example "customer with a checking and a savings account")

**Steps to reproduce:**
1. exact action with exact input
2. ...

**Expected result:** what should happen, citing the rule (for example "a negative amount must be refused with no balance change")

**Actual result:** what happened, with the exact message and the exact numbers (balances before and after, in cents)

**Frequency:** always, or n out of m runs

**Evidence:** trace zip, screenshot, the row from `findings/observations.jsonl`

**Money / data / compliance impact:** one sentence on why it matters

**Suspected layer:** UI, API or database (and why you think so)

**Automated test:** file and test title that reproduces it

**Workaround:** if any
