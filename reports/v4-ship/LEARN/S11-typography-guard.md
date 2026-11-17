# QA-7 typography guard consistency

Read17November before editing the guard. No stylesheet, font, ART file or visual rule changes.

1. [CSS Custom Properties Level1](https://www.w3.org/TR/css-variables-1/), formal specification: var() resolves a named custom property and optionally a fallback.
2. [MDN var()](https://developer.mozilla.org/en-US/docs/Web/CSS/var): fallback is part of the variable substitution; validate it rather than accepting any expression containing a token.
3. [MDN font-family](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family): generic families such as sans-serif provide fallback categories without adding a font asset.
4. `apps/web/src/ui/typography.css`: central definitions are --font-body/display/num and --font-ui/title aliases; font faces remain centralized. The legacy typography file is also an existing central font-face file.
5. `docs/ui-guide.md` documents the shared --font-body/display/num tokens. Its older face names do not define the current asset selection; canonical CSS does.
6. Independent QA `Q2/typography-triage.json`: ten declarations in three files already use approved tokens, including one sans-serif fallback; no readability defect was independently established.
7. Own comparison `S11/typography-guard-study-1.json`: old blanket guard rejects10/10valid declarations; token-only candidate rejects0/10 and still rejects4/4literal/unknown-token/unapproved-fallback/trailing-family controls. Keep the400KB payload limit (current82,456B).

Decision: permit only an exact approved variable expression, with an optional generic sans-serif/serif/monospace/system-ui fallback. Keep rejecting literal family choices outside the two canonical typography files. Reject unapproved custom properties, literal fallback families and extra trailing families. Add small negative-control checks for the guard; do not edit ART CSS or waive the documented command.

Implemented result: documented commandPASS82,456B/0errors. Two Node control tests cover valid tokens and rejection of literals, unknown/case-mismatched custom properties, named fallback/trailing families, a disguised typography filename and a400KB+1payload. Font-token names remain case-sensitive. No CSS changed.
