# Contour endpoint scan — independent production acceptance
CXV6ef304a9b, integrated2ee12c29e, is accepted for smaller cold contour scans. The row extrema retain the existing alpha and triangle-containment checks; the hull consumes the already ordered rows. No motion, art or placement edits.

Own exact judge URL at1280x720,17November2026 17:28–17:36UTC: baseline indexad7c85b2, candidate34e015ec. [Evidence](evidence/v7-contour-production.json).
-130 actual production opaqueWorld bounds, fitted root matrices and isolated GPU hashes match exactly. Separate910motion fingerprints and130GPU outputs also match. The latter probe alone is not opacity-algorithm bounds evidence.
-21focused tests across3files, including11alpha/deformation oracle cases, and production build/typecheck pass.
-Normal32s boss:CPU median4.3→4.1ms;startupmax53.3→47.6ms;framep95 remains16.8ms.
-4xCPU32s boss:CPU median19.6→19.5ms;startupmax196.5→167.3ms;whole-run frame max250→200.1ms. Framep95 remains50ms and frames>50.5ms remain37. Steady-window max worsens150.1→166.5ms.
-All four before/after runs:26actor+3status presentations,6ults,171events,zero errors. Two fresh1024x576 review images measured then inspected once.

This pair supports exact sampled output with reduced startup work, not general FPS improvement or stress closure. Included in validatedm1.10 after full suite/build and all9release steps, including fresh films;see I-C.md. Large raw evidence remains ignored under work/v5/CXI.
