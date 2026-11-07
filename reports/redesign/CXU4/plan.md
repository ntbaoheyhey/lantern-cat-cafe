# CXU4 builder cards

Base: 1fb25edf4c54ada0d161e3c1dd16a4c4550aafba, branch ai/codex-cxu4.
Owner: assigned CXU4 builder; inherited highest model/effort. No agents, pushes, merges or deployment.

1. Read Character/Help/States references at both desktop sizes and current code/tests. Preserve original art, seven rail items and API/rules.
2. Build typed ui/{Modal,ConfirmModal,Toast,Banner,EmptyState,Tabs,index}. Test focus cycle/return/Escape, timers, durable errors, accessible status and tab keyboard behavior.
3. Build character/HeroScreen and three-column CharacterPanel: all nine slots around CatPortrait, existing stats plus telescoping level/gear/bonus power, XP and class action via existing loop. Test equip rerender, power equality and class success/failure.
4. Move unchanged Help content into a topic inventory; searchable two-pane screen and extension tab host. Test every legacy string/config branch and classic steps, query/filter/empty/selection.
5. Wire adjacent StageLayout only for hosts and existing class API; adapt ActionNotice presentation to Banner without changing countdown/API state logic. List remaining modals for CXR2.
6. Focused component/type/build and browser tests at 1280x720 and 1600x900; ten repeats of new/changed specs; at least five scratch-copy behavioral mutants. Record raw outputs, differences and remaining broad gates; no self-scores. At most 16 PNGs under scorecard/cxu4, each <200KB, only SCREENSHOTS=1.

Dependencies: 1 -> 2 -> {3,4,5} -> 6. Work remains serial inside this assigned worker slot.
