# Final bounded A5 revisit

Tested a common alpha-weighted deformation field and shared world-space grid on Sorrel, preserving every atlas pixel. The strict alpha check still fails: 407/605/684/438/371/324/354/0 enclosed pixels across the eight extreme poses (source reference 0). Loop seams remain 0 and the bone/event contract passes.

Visual inspection rejects the candidate: the staff bends into a paper-like shape and thin foot/leg slivers appear. Fewer peak hole pixels (1006 to 684) is not a visual improvement. Reverted the compiler and Sorrel runtime exactly to the previous committed versions; the rejected patch, metrics and eight-pose sheet are retained here. No experimental geometry ships.

The original 22-unit evidence remains valid: 20/22 fail the literal alpha gate, with embedded facial/weapon pieces still incomplete. Closing A5 as PARTIAL after the required single revisit. Independent painted parts/hidden-area reconstruction remain unfinished; no threshold or source-negative-space exception was introduced.
