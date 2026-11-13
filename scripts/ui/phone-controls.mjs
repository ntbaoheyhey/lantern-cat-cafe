/** Exercise scrolling to controls, including controls outside a panel's first view. */
export async function measurePhoneControls() {
  const modal=[...document.querySelectorAll('dialog:modal')].at(-1)||[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).at(-1);
  const scope=modal||document.querySelector('.th-audio details[open]')||document.querySelector('.b-page')||document.querySelector('.uv-sheet')||document.body;
  const saved=[...document.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight||e.scrollWidth>e.clientWidth).map(e=>[e,e.scrollLeft,e.scrollTop]);
  const visible=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
  const elements=[...scope.querySelectorAll('button,a[href],summary,input:not([type=hidden]),select,textarea')].filter(e=>{
    if(!visible(e))return false;
    for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope>summary')?.contains(e))return false;
    return true;
  });
  const rows=[];
  try {
    for(const e of elements){
      e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const r=e.getBoundingClientRect();let left=0,right=innerWidth,top=0,bottom=innerHeight;
      for(let p=e.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();
        if(/hidden|clip|auto|scroll/.test(s.overflowX)){left=Math.max(left,b.left+p.clientLeft);right=Math.min(right,b.left+p.clientLeft+p.clientWidth);}
        if(/hidden|clip|auto|scroll/.test(s.overflowY)){top=Math.max(top,b.top+p.clientTop);bottom=Math.min(bottom,b.top+p.clientTop+p.clientHeight);}
      }
      const point={x:r.left+r.width/2,y:r.top+r.height/2},hit=document.elementFromPoint(point.x,point.y);
      const centerVisible=point.x>=left&&point.x<=right&&point.y>=top&&point.y<=bottom&&!!hit&&(e.contains(hit)||e.disabled&&hit.contains(e));
      const horizontalFit=r.left>=left-2&&r.right<=right+2;
      rows.push({label:e.getAttribute('aria-label')||e.textContent.trim(),tag:e.tagName.toLowerCase(),disabled:!!e.disabled,centerVisible,horizontalFit,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},available:{left,right,top,bottom}});
    }
  } finally {for(const [e,x,y] of saved)e.scrollTo({left:x,top:y,behavior:'instant'});}
  return {tested:rows.length,unreachable:rows.filter(r=>!r.centerVisible||!r.horizontalFit),controls:rows};
}
