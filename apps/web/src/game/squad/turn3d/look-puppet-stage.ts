/** Small original cafe details for the illustrated roster; built before prewarm. */
import * as T from 'three';
export function puppetCafeDetails(){
 const root=new T.Group();root.name='illustrated-cafe-details';
 // A crisp crescent makes the distant night read through the existing arched glass.
 const crescent=new T.Shape();crescent.absarc(0,0,.20,Math.PI*.3,Math.PI*1.7,false);crescent.absarc(.105,0,.183,Math.PI*1.58,Math.PI*.42,true);crescent.closePath();
 const moon=new T.Mesh(new T.ShapeGeometry(crescent,32),new T.MeshBasicMaterial({color:'#adcbd4',transparent:true,opacity:.62,depthWrite:false}));
 moon.name='cafe-night-crescent';moon.position.set(.98,3.22,-4.29);root.add(moon);
 const threadMaterial=new T.MeshStandardMaterial({color:'#a86a80',roughness:.96});
 const crumbMaterial=new T.MeshStandardMaterial({color:'#d4a66b',roughness:.9});
 const path=new T.CatmullRomCurve3(Array.from({length:28},(_,i)=>{const t=i/27;return new T.Vector3(3.2+Math.sin(t*7.3)*.26,.035,-.9+t*.74)}));
 const thread=new T.Mesh(new T.TubeGeometry(path,40,.012,4,false),threadMaterial);thread.name='opponent-loose-thread';root.add(thread);
 const crumbs=new T.InstancedMesh(new T.DodecahedronGeometry(.038,0),crumbMaterial,7),m=new T.Object3D();crumbs.name='opponent-bakery-crumbs';
 for(let i=0;i<7;i++){m.position.set(1.1+Math.sin(i*2.3)*.25,.035,1.1+Math.cos(i*3.7)*.16);m.rotation.set(i,.3*i,.7*i);m.scale.setScalar(.6+i%3*.2);m.updateMatrix();crumbs.setMatrixAt(i,m.matrix);}
 root.add(crumbs);return root;
}
