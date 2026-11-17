# V5 Audio Manifest Schema & Contract Validation (REFILL-R17)

**Validation Date**: 2026-11-17  
**Audited File**: `apps/web/public/audio/v5/manifest.json`  
**Total Validated Keys**: 1659 registered cues (1801 individual variant deliveries)  
**Schema Compliance**: **100% PASS** (0 schema errors, 0 path traversals, 0 type violations)  
**Security Boundary**: All paths strictly constrained to `/audio/v5/**` with valid MIME formats  

---

## 1. Schema Invariants Enforced

| Rule | Constraint | Status | Result |
| :--- | :--- | :---: | :--- |
| **Path Isolation** | All paths must prefix with `/audio/v5/` | **PASS** | 100% compliant; zero references to external origins or parent directories |
| **No Traversal** | Zero occurrences of `..` | **PASS** | Passed (0 traversal tokens detected) |
| **Dual Codec Support**| Every key must supply both `.opus` and `.m4a` | **PASS** | 100% coverage (1801/1801 variant items provide dual fallback) |
| **Bus Allocation** | Bus field must be in `{sfx, ui, voice, ambience, bgm}` | **PASS** | All cues map to approved audio engine buses |
| **Gain Normalization**| `gainDb` bounded between `-24 dB` and `+12 dB` | **PASS** | Zero runaway digital gain boosts |
| **Duration Bounds** | Duration finite, `0 < t <= 30.0s` | **PASS** | All cues within standard game sound envelope |

---

## 2. Loader Compatibility Assurance

The schema structure directly implements the TypeScript delivery contract consumed by `apps/web/src/audio/v5-manifest-loader.ts`:

```typescript
interface Delivery {
  opus: string;
  m4a: string;
  durationSeconds?: number;
  gainDb?: number;
  bus?: 'sfx' | 'ui' | 'voice' | 'ambience' | 'bgm';
  variantId?: string;
  runtimeCueId?: string;
}
```

---

## 3. Automated CI Command

```sh
node tools/v5audio/validate_audio_manifest.mjs
```
