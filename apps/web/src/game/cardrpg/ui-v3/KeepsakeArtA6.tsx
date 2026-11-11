import {useId} from 'react';

// Original small-object illustrations for the DOM. Unit/canvas art stays in Lane B.
const colors: Record<string, [string, string]> = {
 hearthloom:['#ddad69','#75432c'], moonwick:['#b4a0d1','#51455e'],
 mossbrew:['#a6bf82','#4d6947'], rainlace:['#95bbca','#425f73'],
 crumbweave:['#dfb890','#935d3d'], bellsteel:['#b2bfc7','#546777'],
 emberfelt:['#e8a274','#97482e'], velvetrim:['#c2a0b7','#754b68'],
};
export function GearArtA6({slot,setId}:{slot:string;setId:string}) {
 const id=useId(),[light,dark]=colors[setId]??colors.hearthloom!;
 const paint=`url(#${id}-metal)`,cloth=`url(#${id}-cloth)`;
 return <svg className="a6-gear-art" viewBox="0 0 160 150" fill="none" aria-hidden="true">
  <defs><linearGradient id={`${id}-metal`} x1="30" y1="25" x2="122" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor="#fff0bc"/><stop offset=".4" stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient><linearGradient id={`${id}-cloth`} x1="45" y1="25" x2="120" y2="130" gradientUnits="userSpaceOnUse"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient></defs>
  <ellipse cx="80" cy="132" rx="49" ry="9" fill="#593c2a" opacity=".18"/>
  <g stroke="#62462f" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
   {slot==='weapon'&&(setId==='mossbrew'||setId==='rainlace')?<>
    <path d="M104 72c33-26 36 15 4 27" stroke={dark} strokeWidth="10"/>
    <path d="M51 74 29 61l-7 9 25 33" fill={paint}/>
    <path d="M50 66C23 122 53 131 81 130s59-15 27-64Z" fill={paint}/>
    <ellipse cx="79" cy="66" rx="32" ry="8" fill={light}/><path d="M67 57q12-18 24 0" fill={paint}/>
    <path d="M54 91q20 18 45-3M58 112q18 10 38-2" stroke="#fff0ba" opacity=".6"/>
    <path d="M71 47q-12-14 0-23m17 19q9-11 1-21" stroke="#fff0d5" strokeWidth="5"/>
   </>:slot==='weapon'&&(setId==='moonwick'||setId==='velvetrim')?<>
    <path d="M39 125 104 24q10-11 18-4t1 17Z" fill={paint}/><path d="m107 28 7-7 4 4-7 9Z" fill="#66546d"/>
    <path d="M111 24C87-7 138 2 132 46s-39 13-40 43 28 24 37 10" stroke={light} strokeWidth="5"/>
    <path d="M40 119 106 37" stroke="#fff4c5" strokeWidth="2"/>
   </>:slot==='weapon'?<>
    <path d="m100 66 28-40q5-7 11-2t1 10l-28 41Z" fill={dark}/><circle cx="133" cy="29" r="3" fill="#e4c68b"/>
    <ellipse cx="71" cy="91" rx="44" ry="37" transform="rotate(-24 71 91)" fill={paint}/>
    <ellipse cx="71" cy="89" rx="33" ry="27" transform="rotate(-24 71 89)" fill={dark}/>
    <path d="M44 92q0-26 35-31" stroke="#ffde98" strokeWidth="4"/><path d="M52 110q28 10 42-16" stroke={light}/>
    <path d="m69 78 7 4 7-4-3 10 6 6-10 1-5 8-3-10-8-4 9-3Z" stroke="#e6bc76" strokeWidth="2"/>
   </>:
   slot==='outfit'?<>
    <path d="M59 43V27q21-16 41 0v16" stroke={dark} strokeWidth="9"/>
    <path d="M55 41q25 11 50 0l7 34 16 48q-48 15-95 0l15-48Z" fill={cloth}/>
    <path d="m56 49-9 67q33 12 67 0l-13-67" stroke="#f1d6a2" strokeWidth="2" strokeDasharray="4 5"/>
    <path d="M57 83q23 7 46 0l-5 24q-18 8-37 0Z" fill={paint}/>
    <path d="M74 64h13m-7-7v14" stroke="#fff0c3"/><path d="M46 65 22 58m90 7 24-7" stroke={dark} strokeWidth="7"/>
   </>:
   slot==='charm'?<>
    <path d="M58 28c-15-17 14-24 22-3 7-21 37-14 22 3L80 48Z" fill={cloth}/>
    <path d="m68 32-8 36 21-12 20 12-10-36" fill={cloth}/><circle cx="80" cy="91" r="31" fill={paint}/><circle cx="80" cy="91" r="23" stroke="#ffedbe"/>
    <path d="M67 87c-6-16 6-16 12-5 7-14 20-7 12 5 18 7 5 21-11 14-17 7-26-9-13-14Z" fill={dark}/><path d="m78 101 2 9" stroke="#fff1c8"/>
   </>:<>
    <path d="M67 40V27q13-15 26 0v13" stroke={dark} strokeWidth="7"/><path d="m49 49 13-13h37l13 13-7 67H56Z" fill={paint}/>
    <path d="m60 56 40 0-5 51H65Z" fill={cloth}/><path d="m80 63 10 20-10 18-10-18Z" fill="#ffdda0"/><path d="M49 48h63M53 117h56" stroke={dark} strokeWidth="7"/>
   </>}
  </g>
  <path d="m23 39 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#f6dfa6" opacity=".85"/>
 </svg>;
}

export function RelicArtA6({rarity=0}:{rarity?:number}) {
 const id=useId(),tone=['#abb4a3','#79b3d0','#ad87cd','#e1af58'][rarity]??'#abb4a3';
 return <svg className="a6-relic-art" viewBox="0 0 180 160" fill="none" aria-hidden="true">
  <defs><linearGradient id={`${id}-cup`} x1="42" y1="65" x2="130" y2="112" gradientUnits="userSpaceOnUse"><stop stopColor="#fff9dd"/><stop offset=".19" stopColor={tone}/><stop offset=".4" stopColor="#fff4ca"/><stop offset=".66" stopColor={tone}/><stop offset="1" stopColor="#664b3e"/></linearGradient><radialGradient id={`${id}-glow`}><stop stopColor="#fff4b3" stopOpacity=".8"/><stop offset="1" stopColor={tone} stopOpacity="0"/></radialGradient><linearGradient id={`${id}-gilt`} x1="35" y1="60" x2="145" y2="140" gradientUnits="userSpaceOnUse"><stop stopColor="#7e5329"/><stop offset=".28" stopColor="#ffedac"/><stop offset=".52" stopColor="#bc8d45"/><stop offset=".78" stopColor="#ffdfa0"/><stop offset="1" stopColor="#80603a"/></linearGradient><linearGradient id={`${id}-tea`} x1="86" y1="58" x2="86" y2="71" gradientUnits="userSpaceOnUse"><stop stopColor="#593b2a"/><stop offset="1" stopColor="#bf8752"/></linearGradient></defs>
  <ellipse cx="90" cy="75" rx="76" ry="69" fill={`url(#${id}-glow)`}/><ellipse cx="90" cy="141" rx="59" ry="8" fill="#422a25" opacity=".18"/>
  <g stroke="#795738" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
   <path d="M123 65c43-13 37 47 1 43" stroke={`url(#${id}-gilt)`} strokeWidth="13"/><path d="M125 65c40-11 31 41 1 42" stroke="#ffe4a5" strokeWidth="3"/>
   <path d="M43 62q4 65 38 66h18q30-5 30-66Z" fill={`url(#${id}-cup)`}/>
   <ellipse cx="86" cy="63" rx="43" ry="11" fill={`url(#${id}-gilt)`}/><ellipse cx="86" cy="64" rx="33" ry="6" fill={`url(#${id}-tea)`}/><path d="M49 61Q85 48 123 61" stroke="#fff3ca" strokeWidth="2"/><path d="M61 65Q74 60 88 63" stroke="#f5dba2" strokeWidth="1.4" opacity=".65"/>
   <path d="M39 134q48 13 96 0l7 5q-55 22-110 0Z" fill={`url(#${id}-gilt)`}/><path d="M40 138Q87 151 135 138M61 126Q87 135 111 126" stroke="#ffe8a5" strokeWidth="2"/><path d="M51 75Q87 87 122 75M58 111Q87 124 114 111" stroke={`url(#${id}-gilt)`} strokeWidth="4"/>
   <path d="M53 79q3 26 16 35" stroke="#fff8d9" strokeWidth="5" opacity=".7"/>
   <g stroke="#ffedb6" strokeWidth="1.4" opacity=".85"><path d="M62 88Q55 94 66 103M111 88Q118 94 107 103M59 94 65 92M109 92 115 94"/><circle cx="69" cy="84" r="1"/><circle cx="105" cy="84" r="1"/></g>
   {rarity===0?<path d="m77 93 9 9 12-17" stroke="#fff0c3" strokeWidth="5"/>:rarity===1?<path d="M78 88q-14-13-15 1t23 18q29-18 19-25t-19 6Z" fill="#e6f5d8"/>:rarity===2?<><path d="M75 107h24l-5-9V86q-8-14-15 0v12Z" fill="#ffe3a1"/><circle cx="87" cy="109" r="3" fill="#fff1c2"/></>:<><path d="M74 86h26l-4 26H79Z" fill="#ffdd83"/><path d="M79 86v-6q8-9 16 0v6"/><path d="m87 93 5 7-5 8-4-8Z" fill="#fff9dc" stroke="none"/></>}
  </g>
  <g stroke="#fff0c8" strokeWidth="3" strokeLinecap="round" opacity=".9"><path d="M76 47q-9-10 0-19m18 17q10-11 1-22"/><path d="m135 37 0-10m-5 5h10"/></g>
  {rarity===3&&<g fill="#ffdc91"><path d="m40 33 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z"/><path d="m143 116 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z"/></g>}
 </svg>;
}


/** A wrapped cafe parcel, drawn from simple original shapes. */
export function GiftArtA6({variant=0}:{variant?:number}) {
 const id=useId(),tone=['#c18b65','#9aa875','#b49ac0','#82aab6'][variant%4]!;
 return <svg className="a6-gift-art" viewBox="0 0 100 90" fill="none" aria-hidden="true">
  <defs><linearGradient id={`${id}-wrap`} x1="25" y1="25" x2="74" y2="80" gradientUnits="userSpaceOnUse"><stop stopColor="#f7dfae"/><stop offset="1" stopColor={tone}/></linearGradient></defs>
  <ellipse cx="50" cy="81" rx="35" ry="6" fill="#6d4e31" opacity=".15"/>
  <g stroke="#735236" strokeWidth="2.5" strokeLinejoin="round">
   <path d="M21 39h58l-3 39H24Z" fill={`url(#${id}-wrap)`}/><path d="M17 31h66v14H17Z" fill={tone}/>
   <path d="M43 32h14v46H43Z" fill="#ffedbe"/>
   <path d="M49 31C9 24 28 0 45 20l5 9C63-1 88 14 60 28Z" fill="#e9bd77"/>
   <path d="M26 22q10 0 21 9m24-12q-12 5-17 11" stroke="#fff0bb" strokeWidth="2"/>
   <path d="m69 52 10 3-4 16-10-3Z" fill="#fff0c9"/><path d="m70 60 2 2 3-4" stroke="#93663c" strokeWidth="2"/>
  </g><path d="M28 50v21" stroke="#fff7d8" strokeWidth="3" opacity=".7"/>
 </svg>;
}
