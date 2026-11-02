# CXU4 review decisions for current d969f16

Reference: original Character/Help/States mockup, real source registries and unchanged art.
Hero keeps the three-column paper-doll/stat/power structure. Nine real slots and seven real stat rows replace the four placeholder slots and sample values; the secondary Change class action matches the mockup. Help keeps the topic/answer split and original six-answer content. The visible single-tab hosts are the documented extension point for later real panels, not placeholder features. These density/tab-host differences are conservatively scored as explained design departures.

Build comparison against actual main1b299c4: entry CSS153.01→159.89KB (gzip24.01→25.24KB), entry JS248.05→258.41KB (gzip70.23→73.62KB). Combined entry gzip increases4.90%; CSS alone increases5.12%. The CSS increase is justified by scoped Hero/Help layout and shared accessible modal/toast/banner/tab states. No asset, font, framework or dependency was added. Preserve existing styles until the later regression-backed CXR2 consolidation rather than deleting legacy selectors during this scoped card.

Current UI audit/effects check every manifest screen in guest and local-signed modes; screenshot output selects Hero/Help only. Mutable browser build outputs are isolated and ignored by dev watchers. Contract-stub changes are handwritten and remain independent of app/manifest code. All prior assertions stay intact.

The final-round change only moves modal DOM work to a layout effect and adds a browser observer assertion. No CSS, asset or dependency changes were added after the measured Help repair; fresh build logs remain the authoritative byte figures.
