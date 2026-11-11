import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial, ShaderLib, UniformsUtils, type WebGLRenderer } from 'three';
import { installPuppetMaterial } from './look-puppet';

type CompiledShader = Parameters<MeshStandardMaterial['onBeforeCompile']>[0];
function compile(material: MeshStandardMaterial) {
  const shader = {
    vertexShader: ShaderLib.standard.vertexShader,
    fragmentShader: ShaderLib.standard.fragmentShader,
    uniforms: UniformsUtils.clone(ShaderLib.standard.uniforms),
  } as CompiledShader;
  material.onBeforeCompile(shader, {} as WebGLRenderer);
  return shader;
}

describe('per-actor puppet tail material', () => {
  it('keeps cloned actors independent while retaining the common source', () => {
    const source = new MeshStandardMaterial();
    source.userData = { puppetPart: 'tail', puppetTailOrigin: [.1, .2], puppetTailReach: 1 };
    const first = source.clone(), second = source.clone();
    installPuppetMaterial(first);
    installPuppetMaterial(second);
    const a = compile(first), b = compile(second);
    first.userData.puppetTailBend.value = .04;
    expect(a.uniforms.puppetTailBend!.value).toBe(.04);
    expect(b.uniforms.puppetTailBend!.value).toBe(0);
    expect(source.userData.puppetTailBend).toBeUndefined();
    expect(a.vertexShader).toBe(b.vertexShader);
    expect(a.uniforms.puppetTailOrigin!.value.toArray()).toEqual([.1, .2]);
    first.dispose(); second.dispose(); source.dispose();
  });

  it('keeps rigid layers on an unchanged vertex path and a separate GPU program', () => {
    const rigid = new MeshStandardMaterial(), tail = new MeshStandardMaterial();
    rigid.userData.puppetPart = 'armR';
    tail.userData = { puppetPart: 'tail', puppetTailOrigin: [0, .3], puppetTailReach: 1 };
    installPuppetMaterial(rigid);
    installPuppetMaterial(tail);
    const a = compile(rigid), b = compile(tail);
    expect(a.vertexShader).toBe(ShaderLib.standard.vertexShader);
    expect(a.uniforms.puppetTailBend).toBeUndefined();
    expect(b.vertexShader).not.toBe(a.vertexShader);
    expect(rigid.customProgramCacheKey()).not.toBe(tail.customProgramCacheKey());
    rigid.dispose(); tail.dispose();
  });
});
