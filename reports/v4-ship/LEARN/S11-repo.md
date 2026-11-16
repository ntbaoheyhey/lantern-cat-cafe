# S11 repository packaging and scan scope

Read16November2026 before changing distribution files. This continues the S6 acceptance work; it does not establish ownership or editor entitlement.

1. [NIST SP800-218 SSDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf), formal publication,PS.3:retain release integrity and component provenance.
2. [Vite public assets](https://vite.dev/guide/assets.html#the-public-directory):the public directory is copied as-is into production output; verify the resulting bytes.
3. [esbuild legal comments](https://esbuild.github.io/api/#legal-comments):comment preservation depends on markers,placement,and build configuration. Source comments alone do not prove a distributed notice exists.
4. [Spine Runtimes terms](https://esotericsoftware.com/spine-runtimes-license):the current publisher text includes a redistribution-notice condition. Retain the exact installed4.2.120notice rather than silently replacing its2025text.
5. [Spine Editor terms](https://esotericsoftware.com/spine-editor-license),section2:entitlement is a separate issue; package metadata and a copied notice do not establish it.
6. [Git rev-list](https://git-scm.com/docs/git-rev-list):all references are resolved for a traversal; later commits require additional scan coverage.
7. [GitHub secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning):working-tree checks do not substitute for history coverage.

[Own comparison](../S11/repo-notice-before-1.json):source documentation has1notice,matching both installed packages;production4has0heading matches among358distributedJS/TXT/HTML/JSONfiles. The existing current-code documentation check therefore misses a packaging gap. Add an exact public copy, then compare installed,source,built,and HTTP-response hashes. Do not infer a full licence or release pass.

History scanner30159 remains active;its starting3790commit count is older than the observed3843reachable commits. Preserve it,triage redacted locations only,and bind incremental coverage to concrete commit IDs. No history rewrite or credential exposure.
