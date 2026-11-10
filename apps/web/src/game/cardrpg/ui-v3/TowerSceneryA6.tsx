import {useId} from 'react';

/** Original cabinet-like tower scenery; all thirty interactive floors remain DOM buttons. */
export function TowerSceneryA6() {
 const id=useId();
 return <svg className="a6-tower-scenery" viewBox="0 0 560 430" preserveAspectRatio="none" fill="none" aria-hidden="true">
  <defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#28384e"/><stop offset="1" stopColor="#6d7281"/></linearGradient><linearGradient id={`${id}-wall`} x2="1" y2="0"><stop stopColor="#775b50"/><stop offset=".45" stopColor="#b49372"/><stop offset="1" stopColor="#6b514c"/></linearGradient></defs>
  <rect width="560" height="430" rx="20" fill={`url(#${id}-sky)`}/>
  <circle cx="66" cy="57" r="25" fill="#eee3b5"/><circle cx="77" cy="49" r="24" fill="#303f55"/>
  <g fill="#ecd8a7" opacity=".65">{[[35,112],[125,37],[465,46],[516,99],[495,185],[43,225],[160,16],[406,21]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?2:1.2}/>)}</g>
  <path d="M0 361 42 335l29 21 20-15v89H0Zm560-75-35-22-32 24-25-10v152h92" fill="#283745"/>
  <g fill="#d1ad6c" opacity=".55"><path d="M25 367h9v17h-9Zm23 0h9v17h-9ZM501 310h9v18h-9Zm20 0h9v18h-9Z"/></g>
  <path d="M91 79 280 19l189 60-13 16H104Z" fill="#372f35" stroke="#d3af78" strokeWidth="4"/>
  <path d="m129 70 151-39 152 39" stroke="#9f7d62" strokeWidth="3"/>
  <path d="M109 86h343v324H109Z" fill={`url(#${id}-wall)`} stroke="#4a3734" strokeWidth="5"/>
  <path d="M123 88v316m315-316v316" stroke="#dbb886" strokeWidth="7"/>
  {Array.from({length:6},(_,i)=><g key={i}><path d={`M108 ${99+i*50}h346`} stroke="#513e37" strokeWidth="9"/><path d={`M109 ${95+i*50}h343`} stroke="#e0bf88" strokeWidth="3"/><path d={`M126 ${103+i*50}h310v38H126Z`} fill="#423c3c" fillOpacity=".4"/></g>)}
  <path d="M155 372H405V322H155V272H405V222H155V172H405V122H155" stroke="#ffdfa6" strokeOpacity=".65" strokeWidth="2" strokeDasharray="3 9"/>
  <path d="M99 397h362l14 20H85Z" fill="#c8a67c" stroke="#543d35" strokeWidth="4"/>
  <g fill="#f5c979" stroke="#806247" strokeWidth="3"><path d="M77 110h18v29H77Z"/><path d="M465 110h18v29h-18Z"/></g>
  <path d="M85 92v17m389-17v17" stroke="#dfb57b" strokeWidth="3"/>
  <path d="M69 152q-10 92 16 159m396-130q17 92-4 179" stroke="#789082" strokeWidth="3"/>
  <g fill="#839681"><ellipse cx="69" cy="207" rx="8" ry="14" transform="rotate(-40 69 207)"/><ellipse cx="79" cy="254" rx="7" ry="13" transform="rotate(35 79 254)"/><ellipse cx="488" cy="238" rx="8" ry="14" transform="rotate(35 488 238)"/></g>
 </svg>;
}
