# Practice Cushion spring and mitten jab

Accepted the first candidate after inspecting paired 1440×900 and 1280×720 poses plus the full-size battle frame. The original pillow compresses by up to2.8%, springs through a1.8% extension and settles, with a forward mitten jab and both boot contacts planted. Its face, metal button, stitched diamond pattern and corner tassels remain coherent. Differential head rotation stays below0.004radians to protect the broad head/body seam. Motion self-score7.5→7.7; overall remains7.7. This is restrained rigid-part animation, not simulated cloth or independent tassels.

The same original six-part atlas/rig, portraits and source concept remain untouched. P5's source comparison remains valid; the new paired contact sheet shows the motion change. No new texture, geometry, draw call, HUD event or flag. Main-hand effects follow the moving mitten socket exactly.

27focused tests, typecheck/lint and five-seed/six-mode/102-plan rules parity pass.16paired poses and8natural x1 basic/signature casts include reduced motion, with zero page/shader errors, socket errors, face/HP collisions or bounds failures. Planted boot drift stays below1e-15local units; the actual mitten reaches more than0.05local units toward the party. Reduced motion remains still. Warmed p95<=16.8ms; these short casts do not establish cold-start/all-game performance.

Pinned A6e94713b8e+B is38,189,302bytes, with1,810,698bytes headroom under40MB. B embedded assets remain23,549,548bytes. Compact evidence is in evidence/; full captures/samples are retained locally and in ~/art/look-v3/p22/attempt1. No old evidence or source is removed.

Research recheck: a broad painted face needs whole-body deformation with almost no head differential; the existing inverse foot contact is sufficient for a small squash. Next planned lowest-motion row is Mochi: the original shield/lantern is one rigid part, so raise it as a unit with restrained shoulder motion and tail follow-through.
