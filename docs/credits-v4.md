# V4 credits and licences

Inventory checked on 16 November 2026 against the integration branch. Project-authored code is covered by the root [MIT licence](../LICENSE). That licence does not replace dependency or media terms. This page records the installed versions and repository evidence; it does not certify historical ownership.

| Component | Recorded licence | Evidence |
| --- | --- | --- |
| React 19.3.1, Three 0.180.0, Phaser 3.90.0 | MIT | Pinned packages and their installed licence notices; [web manifest](../apps/web/package.json) and [lockfile](../pnpm-lock.yaml) |
| viem 2.57.10 and wagmi 2.19.5 | MIT | Pinned packages and installed licence notices |
| Spine Core and Spine ThreeJS 4.2.120 | Spine Runtimes License Agreement; package metadata `LicenseRef-LICENSE` | [Exact installed notice](licenses/spine-runtimes-4.2.120.txt), copyright Esoteric Software LLC |
| Baloo 2 and Barlow Condensed fonts | SIL Open Font License 1.1 | [Baloo notice](../apps/web/public/fonts/baloo-2-LICENSE.txt), [Barlow notice](../apps/web/public/fonts/barlow-condensed-LICENSE.txt) |
| Current encoded audio | 58 files recorded as CC0-1.0; 60 as project synthesis | [Per-file source, author, processing and hashes](../apps/web/public/audio/LICENSES.json) |
| Artwork, rigs and earlier media | Per-asset provenance; unresolved historical details stay unresolved | [ART provenance](art/PROVENANCE.md), [asset inventory](../reports/asset-provenance.md) |
| OpenZeppelin contracts | MIT | Pinned [submodule](../.gitmodules) and [upstream notice](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/LICENSE) |
| Forge standard library | MIT or Apache-2.0 | Pinned [submodule](../.gitmodules); retain its bundled licence files |

The installed Spine notice is dated 5 April 2025. The publisher's [current runtime agreement](https://esotericsoftware.com/spine-runtimes-license), dated 14 November 2026 at this check, includes separate integration and redistribution conditions; [Editor Agreement section 2](https://esotericsoftware.com/spine-editor-license) is referenced by both. The repository inspection has not established the project's editor licence entitlement. Keep that evidence requirement open for release review and retain the installed notice. This documentation does not alter the runtime or relicense it.

Audio verification compares the current 118 top-level MP3/WebM files with manifest paths and SHA256 values: 118/118 match. The manifest contains 1,477 historical/source rows, which is not the number of active runtime files. The [measured comparison](../reports/v4-ship/S6/learning-comparison.json) preserves both methods. Project synthesis retains its script/source references; CC0 entries retain their pack and author records. [CC0 terms](https://creativecommons.org/publicdomain/zero/1.0/) do not independently verify who supplied a work.

No new artwork was generated for this SHIP work. Existing ART assets and provenance remain under ART ownership. Build captures show the actual local build and must keep their commit, dimensions and local/public scope. Older screenshots remain historical evidence.
