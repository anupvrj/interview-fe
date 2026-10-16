# Social Challenge 3 — QA report

**Date:** 2026-03-22  
**Scope:** Share / follow / rate actions + submit URL validation  
**Dashboard:** `/hackathon/hiring-games-hackathon-2026/dashboard`

## Automated results

| Check | Result |
|-------|--------|
| FE `social-links` unit tests | Pass (6) |
| FE `social-post-validation` (mirrors core) | Pass (6) |
| Outbound link health (GET) | Pass (4) — LinkedIn 200; Instagram 200; PH/Capterra reachable (403 bot wall OK, not 404) |
| Core `socialValidator.test.ts` | Pass (7) |

Run locally:

```bash
cd interview-fe && npm test -- src/features/hackathon/__tests__/social
cd interview-core && npm test -- src/modules/hackathon/__tests__/socialValidator.test.ts
```

## Manual matrix (logged-in candidate, Challenge 3 ACTIVE)

| # | Step | Expected | Status |
|---|------|----------|--------|
| 1 | Share on LinkedIn | New tab → `linkedin.com/sharing/share-offsite/?url=…`; caption+URL copied to clipboard | **Verify in browser** (fix applied: sync `window.open` + clipboard) |
| 2 | Share on Instagram | New tab → `instagram.com/create/select/`; caption copied; no popup blocked | **Verify in browser** (fix: open before async clipboard) |
| 3 | Copy caption | Clipboard = suggested caption | **Verify in browser** |
| 4 | Follow LinkedIn | Opens `linkedin.com/company/interview-trix/` | Pass (automated HTTP 200) |
| 5 | Follow Instagram | Opens `instagram.com/interviewtrix_official/` | Pass (automated HTTP 200) |
| 6 | Review on Product Hunt | Opens `producthunt.com/products/interview-trix` (not `/p/` forum) | Pass (link health test) |
| 7 | Find us on Capterra | Opens Capterra search | Pass (HTTP 403 bot wall from CI; works in human browser) |
| 8 | Submit valid post URLs | API accepts URLs matching validator | Pass (FE + BE rules aligned) |
| 9 | Submit profile URLs | Rejected with clear message | Pass (unit tests) |
| 10 | Safari / mobile | Same as 1–2 | **Not run** — recommend spot-check on iOS Safari |

Browser automation on the dashboard did not load Challenge 3 UI without an authenticated session; use a user with Ch1+Ch2 complete (e.g. local seed script).

## Fixes shipped

1. **LinkedIn:** `sharing/share-offsite/?url=` + copy full caption (caption + hackathon landing URL).
2. **Instagram:** Synchronous `window.open` then clipboard (avoids popup blocker).
3. **Validation:** `validateHackathonSocialPostUrl` mirrors `interview-core` `socialValidator`.
4. **Labels:** Product Hunt → canonical `/p/interview-trix`; Capterra still search until review URL is provided.
5. **UX:** Follow + optional rate blocks remain visible after links are submitted.

## Known platform limits

- LinkedIn web share does **not** reliably prefill long text; users paste from clipboard.
- Instagram has **no** one-click share with prefilled text on web; create flow requires login.
- Follow / rate buttons cannot auto-complete actions; they only open the correct pages.
- Replace `INTERVIEWTRIX_CAPTERRA_URL` when marketing provides a direct Capterra review link.
