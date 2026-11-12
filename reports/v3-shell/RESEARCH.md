# V3B research — 13 November 2026

## Audio and fonts
Official Kenney **RPG Audio**, **Impact Sounds**, **Interface Sounds** and **Music Jingles** downloaded using the site's signed-link flow (browser cookie/referer required). All four bundled licences are CC0. 368 clips inventoried with ffprobe in AUDIO-INVENTORY.json. Selected sources remain compressed; download archives were never retained. Music: MintoDog's Cozy Puzzle Title / In-Game 2 / Hard Battle 1 and pmiller's Chiptune Battle Music on OpenGameArt (CC0 licence fields verified). Voice grain: qubodup's Cat Meow 813119, adapted from Jofae, Freesound CC0. Source URLs, author and date: assets/audio-sources/SOURCES.json; every delivered file: public/audio/LICENSES.json. No paid tools, no subjective listening claim.

Four music loops, three stings and a quiet crockery ambience use decoded samples; effects are packed in sprites. The pipeline uses two-pass ffmpeg loudnorm, Opus/WebM plus MP3 fallback, measures encoded true peaks and first/last 50 ms RMS. Cat-speak uses meow grains, six pitches spaced four semitones across two contrasting formant groups, covering twelve roster cats. A quieter line is rate-limited to seven seconds; ultimate > skill > death > grunt, one active line.

Baloo 2 ExtraBold and Barlow Condensed 500/700 come from @fontsource packages under SIL OFL. Only Latin and Vietnamese WOFF2 subsets are shipped. Vietnamese verification string: Tăng Sức Mạnh Đội Hình Ưu Đãi. Test glyph coverage from the files and render the exact string in the typography lab.

## Landing patterns (structure only)
Read live Pixels https://www.pixels.xyz/, Off The Grid https://gunzillagames.com/en/off-the-grid/ (JS shell; extraction limited), MapleStory Universe https://msu.io/. No images or text are copied.
1. Lead with the game world and a single large play action.
2. Keep wallet connection beside the free entry.
3. Put characters in the hero; limit explanatory copy.
4. Use a silent trailer as optional motion.
5. Separate game benefits from token detail.
6. Surface network and testnet context near ownership actions.
7. Link evidence to the explorer rather than invent activity.
8. Give ownership a visible object, the café Deed.
9. Present season supply/countdown without promising returns.
10. Put odds, contracts and economy detail behind clear links.

## Contract feasibility — no deployments
RelicNFT.mint(Voucher,bytes) permits arbitrary uint256 IDs, including 10001 and 30001–33000. The contract **does not enforce one copy per Deed ID or a 3,000 cap**: the authoritative issuer must reserve distinct IDs atomically and never sign another voucher for an issued ID. Nonce retries must reuse the reservation. No browser save can authorize a mint.

RelicNFT inherits ordinary ERC1155.safeBatchTransferFrom(address,address,uint256[],uint256[],bytes). There is no transfer restriction; 0x000000000000000000000000000000000000dEaD has no receiver hook. These NFTs become inaccessible but ERC1155 total accounting does not decrease. Reconciliation must verify the exact wallet, amounts, IDs and receipt, and must not allow a receipt to fund two fusions.

SeasonRewards.claim(Claim,bytes) can pay a signed net amount. Gross Spool × 75% is the net entitlement; 25% remains in the pre-funded reward pool, **not a token burn**. Read currentSeason() for vouchers. The deployed contract's immutable SEASON_LENGTH is **13 weeks**, with BASE_ROUTINE_CAP=12 YARN, independent of the four-week content season. Keep the current cap; no redeploy. Token fee burns use YarnToken.seal with an intent-bound order (or burn for a direct burn); payment receipts cannot be reused.

Planner section 9 MUST precedes optional currency migration and dynamic median fees. User's explicit B6 list also requires quality buckets, enhancement and diminishing rewards. Hosting, Mythic fusion and paid passes are roadmap; do not count their assumed demand as implemented burn in acceptance simulations.
