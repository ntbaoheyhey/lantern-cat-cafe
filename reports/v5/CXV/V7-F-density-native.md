# V7-F native desktop density synchronization

Native source `c0373a1d97b6c991888bb66e259142ed4efe3635` refreshes the renderer and composer when display pixel density changes without changing the CSS viewport. A paused scene becomes dirty on the next visible RAF. The existing2x cap remains; unchanged density/size and disposed callbacks allocate nothing.

18 focused scene tests pass; full web typecheck has0 diagnostics. Untransformed native production:3764 artifact files and7tool snapshots verified,empty runtime patch,index `6c93080042b25bfa98bdf699fb081e2af41ccc8c890ef2ee30a2b36c3982a635`. URL `http://127.0.0.1:6312/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`,desktop1280x720. Capture ended2026-11-18T02:10:04.991Z;22captures measured and6fresh1024x576 views reviewed once at2026-11-18T02:10:42.597663+00:00.

Four initialDPR1/2 × normal/reduced sequences preserve16exact geometry sets and16exact full-frame RGB pairs against unwrapped native API controls at the same density/history. All composer buffers match the renderer. Four paused12RAF windows produce0extra renders/ratio changes;double dispose and a late density change produce0ratio changes.

OrdinaryDPR2 play at1x/4xCPU:32s each,26actions/6ultimates each,exact initial/final state and action order versus the prior native control;0errors/blocked requests,shader diagnostics enabled. Framep9516.7/33.4ms is descriptive coverage,not an optimization claim.

Original failures remain in ignored evidence. Separate CDP sessions were experimentally shown to restore initial DPR during Playwright screenshots;transition captures now use the same CDP session at CSS scale1/liveDPR. InitialHUD placement needs2RAF after a frozen pose. Native1x buffer roundtrips change344normal/148reduced pixels by at most1channel value;the candidate reproduces the native result exactly,including the return delta. No tolerance or region exclusion was introduced.

READY for CXI integration review;local evidence is not independent judge acceptance. OS monitor-event delivery remains untested. Next: complete natural battles with live density changes.
