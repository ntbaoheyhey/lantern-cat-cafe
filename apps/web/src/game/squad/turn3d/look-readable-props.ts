import * as T from 'three';
/** Small original spilled props, all constructed during stage loading. Seed 1808. */
export function readableEnemyProps() {
  const root=new T.Group();root.name='readable-opponent-spills-seed1808';
  const plum=new T.MeshStandardMaterial({color:'#72405c',roughness:.92});
  const honey=new T.MeshStandardMaterial({color:'#b88870',roughness:.78});
  for(let i=0;i<3;i++){
    const ball=new T.Mesh(new T.SphereGeometry(.13+i*.015,10,7),plum);
    ball.scale.set(1,.75,1);ball.position.set(3.7-i*.23,.11,-.8-i*.2);root.add(ball);
  }
  const cup=new T.Mesh(new T.CylinderGeometry(.14,.11,.24,12,1,true),honey);
  cup.rotation.set(.12,0,Math.PI*.42);cup.position.set(1.1,.10,.9);root.add(cup);
  const handle=new T.Mesh(new T.TorusGeometry(.085,.022,5,12),honey);
  handle.rotation.set(0,.2,.7);handle.position.set(1.18,.10,.99);root.add(handle);
  return root;
}
