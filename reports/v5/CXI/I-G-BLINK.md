# Production blink review

Current application fca1a2d1e, index08fb418ead6b44ec5d3bf785bac0ed04e3dae4c0d2fade57cee1c4d86d9b1097. Exact judge URL http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3 at1280×720. Own onset-aligned paused fixture captures; not gameplay footage. Capture UTC and source tool commit in each report.

Gesture harness initially failed because loadRules only exports its explicit simulation list. Native Node24 import of unchanged secondary-motion.ts repairs the harness; fresh four-hero capture passes.

Numerically: feet remain fixed; three blinks per hero over12s; yaw/pitch bounded±10°/±6°; contact and reduced-motion samples suppress added face projection/softness. Own inspected1024×800 gesture sheet reveals straight eye seams and vertical slits on Mochi at600ms,worldTime1.003106305,blink0.883594. This is a visual failure despite passing numbers.

A second controlled current-build capture disables face depth and soft-expression additions in memory and reproduces the same seam. Original shader is unchanged versus m1.6. This isolates the defect from those additions; it is not an exact prior-build screenshot. Reports: work/v5/CXI/face/v7-m17-gestures-r1/report.json and v7-m17-blink-control/report.json. All three reviewed sheets (including idle/field.jpg) must not be reopened.

CXV has the precise REDO and comparison. m17 tag/films held for repair; latest green remains m1.6. Ordinary checks remain valid:5236tests,20.786s firsthit including17.7s reading,10.190s practice detour receipt,0 ordinary errors.
