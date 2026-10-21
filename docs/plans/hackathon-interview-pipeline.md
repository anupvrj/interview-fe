# Hackathon interview pipeline — redesign

Status: in build (hotfix/hackathon). Owner decisions: 2 tries, "good" = score ≥ 50 and ≥ 8 min,
feedback required everywhere, interview scores hidden until results (resume ATS stays visible).

## Participant journey

1. **Resume** — design in the builder, submit. Challenge 2 unlocks.
2. **Start interview** — uses the *submitted resume snapshot* (already true today).
3. **Interview runs** → ends → **feedback form** (required, no skip — for every interview).
4. Submit feedback → back to the hackathon dashboard with a **result modal** (hackathon style):
   - **Analysing** — loader: "We're analysing your interview…" (polls until the report is in).
   - **Good** (score ≥ 50 and connected ≥ 8 min) → **submitted automatically** → success, next
     challenge unlocked.
   - **Low** (score < 50 *or* < 8 min) and a try left → "Your interview scored low" / "Your
     interview was too short" → **Re-attempt** or **Submit this one**. No number is shown.
   - **Re-attempt** → new hackathon-tagged interview → feedback → same modal → the **higher of
     the two** attempts is submitted automatically (no second question).
   - **Couldn't analyse** (report failed) → the try isn't used → start again.
5. Scores are **never shown** to participants until results are revealed (after 31 Oct).
   Hackathon interviews don't appear in the normal dashboard interview list/report pages.

## State machine (per interview slot, server-owned)

```
idle ──start──▶ in_progress ──end──▶ processing ──report──▶ decide
decide(latest attempt):
  good                              → finalize(best scored attempt)            → submitted
  low  && scoredAttempts < maxTries → awaiting_decision(reason)
  low  && scoredAttempts ≥ maxTries → finalize(best scored attempt)            → submitted
awaiting_decision ──submit──▶ finalize(best)          ──reattempt──▶ idle (score kept)
report failed / internal failure → try not used → idle
deadline passed with scored attempts but not submitted → finalize(best) (reconcile)
```

- Each scored attempt keeps its own `overallScore`, `activeSec`, `lowReason` — needed for
  best-of. A re-attempt no longer erases the earlier score.
- `finalize` writes the best attempt into the submission (`interview.interviewId/overallScore`),
  sets `status: submitted`, `passed` by the challenge min score — leaderboard/summary unchanged.
- Rules live in one pure module (`interviewOutcome.ts`) with unit tests.

## Score privacy

- `hackathon.scoresRevealAt` (default 1 Nov 2026 00:00 IST). Before it, participant APIs strip
  interview scores (`progress.slots[].overallScore`, summary interview scores); the decision
  payload only carries a reason (`low_score` | `short_interview`).
- Core: hackathon-tagged interviews are excluded from the user's interview list (dashboard,
  analytics), coding list and the ChatGPT connector; their report endpoints return 403
  `RESULTS_HIDDEN` to the participant before reveal. Admin views unaffected.

## UI

- Result modal reuses the hackathon modal system (`hk-root hk-modal`, navy panel, loader,
  confetti on success). Opens after feedback (`?result=<interviewId>`) and re-opens on the
  dashboard whenever a slot is analysing or waiting for a decision, so it can't be missed;
  the challenge card shows the same state if dismissed.
- Copy: "2 tries", never a number.

## Edge cases covered

Tab closed on feedback/analysing (state is server-side; modal reappears) · report failure
(free retry) · disconnect / early end (< 8 min → low) · double click / two tabs (atomic
conditional updates) · deadline with an undecided attempt (auto-finalize best) · re-attempt
chosen but never started (best scored is finalized at deadline) · existing participants mid-flow
(old `pendingConfirmation` rows map to `awaiting_decision`).

## Tests

Pure policy (good/low/best-of/limits), progress mapping & score stripping, list/report hiding,
feedback page (no skip), result modal phases; manual run through the whole journey in Chrome.
