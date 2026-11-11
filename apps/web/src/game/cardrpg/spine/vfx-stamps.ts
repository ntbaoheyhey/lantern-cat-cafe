/** Original flat brush silhouettes, rasterized once. No 3D geometry or lighting. */
import { FX_COLORS, GLYPHS, PAINTED_STATUSES, type Glyph } from './vfx-registry';
import { PAINT } from './style';
const paths:Record<Glyph,string>={
 spark:'M50 7Q54 42 91 50Q55 55 50 93Q44 55 9 50Q44 43 50 7Z',
 leaf:'M19 83Q8 22 81 11Q94 76 19 83ZM22 80L70 26',
 flame:'M49 7Q72 33 65 46Q81 37 79 29Q103 83 56 92Q10 94 16 56Q18 38 35 26Q28 54 45 57Q59 52 49 7Z',
 drop:'M50 8Q74 43 80 62Q85 90 51 92Q17 92 20 63Q26 43 50 8Z',
 ring:'M90 50A40 32 0 1 1 10 50A40 32 0 1 1 90 50ZM78 50A28 20 0 1 0 22 50A28 20 0 1 0 78 50Z',
 arc:'M8 78Q32 1 94 22Q50 21 8 78Z',
 shield:'M50 8L87 23L80 67Q68 85 50 94Q32 85 20 67L13 23ZM50 24L73 34L68 59L50 77L32 59L27 34Z',
 lantern:'M35 23Q33 3 50 5Q68 3 65 23M23 29L77 29L70 81L30 81ZM36 29L36 81M64 29L64 81M20 87L80 87M50 37Q28 67 50 72Q70 65 50 37Z',
 door:'M16 90L16 28Q50 1 84 28L84 90M28 90L28 33Q49 19 72 33L72 90M8 91L92 91M61 57L63 57',
 cup:'M18 34L73 34L69 65Q49 89 24 65ZM73 39Q99 32 93 54Q85 67 70 57M12 85Q49 96 82 85M34 9Q21 19 36 25M54 4Q40 17 57 24',
 thread:'M9 59Q27 5 53 40Q87 85 93 34M9 36Q44 79 60 54Q71 35 89 54M24 72Q38 90 61 76',
 star:'M50 7L63 35L95 40L71 62L76 94L50 78L23 94L28 62L5 40L37 35Z',
 crown:'M15 71L7 28L32 47L50 12L68 47L93 28L85 71ZM17 79L83 79L81 91L19 91Z',
 petal:'M50 53Q12 53 20 20Q52 7 54 48Q69 7 91 28Q96 63 57 56Q93 68 75 92Q44 97 51 60Q36 97 13 74Q8 48 50 53Z',
 moon:'M72 12A41 41 0 1 0 87 74Q34 87 32 38Q40 13 72 12Z',
 bell:'M21 68Q33 58 31 34Q30 17 49 16Q72 16 70 38Q69 59 81 68ZM14 76Q50 86 86 76M42 88Q50 98 58 88M49 5L49 14',
 wave:'M6 63Q28 10 61 27Q89 41 65 60Q61 44 50 47Q60 80 94 64Q72 96 39 79Q18 72 6 63Z',
 sprout:'M50 92L50 41M49 63Q10 65 13 25Q49 25 49 63ZM51 48Q48 10 88 13Q87 48 51 48Z',
 slice:'M8 87L83 13L61 48ZM23 91L93 37L73 65Z',
 spore:'M13 53Q12 10 51 12Q90 12 89 53ZM43 55L39 89Q51 99 64 89L57 55M31 32L31 33M54 24L54 25M72 38L72 39',
 bread:'M18 36Q1 16 24 12Q43 4 51 17Q64 4 81 12Q99 23 81 37L81 87Q49 99 19 87ZM34 37L29 63M53 35L48 65M71 37L66 64',
 wing:'M48 81Q1 58 13 20Q45 15 48 81ZM52 81Q99 58 87 20Q55 15 52 81Z',
 button:'M90 50A40 40 0 1 1 10 50A40 40 0 1 1 90 50ZM38 38L62 62M38 62L62 38',
 teapot:'M28 42Q45 27 69 42Q91 66 68 83L30 83Q9 67 28 42ZM28 44L9 33L14 58L24 64M73 44Q101 27 93 57L79 66M35 28L64 28M45 18L55 18',
 heart:'M50 88Q1 58 12 30Q28 8 50 34Q72 8 88 30Q99 58 50 88Z',
 ink:'M51 13Q74 41 75 61Q95 55 89 76Q79 97 62 83Q40 99 23 82Q4 81 14 62Q24 50 33 62Q22 39 51 13Z',
 wind:'M12 35Q57 55 70 27Q76 9 62 14M7 53Q46 71 88 45M24 71Q49 85 69 67',
 apron:'M33 10L67 10L72 37L88 88Q50 99 12 88L28 37ZM36 48L64 48L61 66Q50 76 39 66Z',
 needle:'M15 88L69 11Q82 0 90 11Q96 21 82 31ZM73 16L83 12L81 23Z',
 bow:'M50 47Q20 7 10 31Q2 62 50 47Q80 7 90 31Q98 62 50 47ZM43 54L22 88L37 79L47 89L52 54M58 54L78 88L63 79L53 89',
 oven:'M15 26L85 26L85 89L15 89ZM24 47L76 47L76 77L24 77ZM29 36L32 36M49 36L52 36M69 36L72 36M28 12L74 12',
 whisk:'M25 90L56 56M56 56Q24 37 43 19Q61 1 78 20Q98 40 56 56ZM56 56Q46 26 61 15M56 56Q79 40 82 24',
};
export class PaintedStamps {
 readonly sprites=new Map<string,HTMLCanvasElement>();
 constructor(){for(const color of FX_COLORS)for(const glyph of GLYPHS)this.make(glyph,color,paths[glyph],false);for(const status of PAINTED_STATUSES)this.make('status:'+status.id,status.color,status.path,true);}
 private make(id:string,color:string,shape:string,status:boolean){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=160;const c=canvas.getContext('2d')!,path=new Path2D(shape);
  c.translate(15,15);c.scale(1.3,1.3);if(status)c.scale(100/24,100/24);
  const scale=status?24/100:1;c.lineJoin=c.lineCap='round';
  c.shadowColor=color;c.shadowBlur=PAINT.glow*14;c.strokeStyle=PAINT.rim;c.lineWidth=PAINT.rimWidth*scale;c.fillStyle=color;
  if(!['thread','wind','door','needle','bow','whisk'].includes(id)&&!status)c.fill(path,'evenodd');
  c.stroke(path);c.shadowBlur=0;c.strokeStyle=PAINT.cream;c.globalAlpha=.62;c.lineWidth=.8*scale;c.stroke(path);
  if(!status){c.save();c.clip(path,'evenodd');for(let i=0;i<40;i++){c.globalAlpha=.03+(i%3)*.013;c.fillStyle=i%2?PAINT.cream:PAINT.rim;c.beginPath();c.ellipse((i*37)%100,(i*61)%100,2+i%4,.9,0,0,Math.PI*2);c.fill();}c.restore();}
  this.sprites.set(id+'/'+color,canvas);
 }
 get(id:string,color:string){return this.sprites.get(id+'/'+color);}
 dispose(){this.sprites.clear();}
}
