import {Component,useEffect,useState,type ReactNode} from 'react';
import {OpeningA6} from './OpeningA6';

type RecoveryProps={title:string;onClose:()=>void};
function RecoveryActions({onClose}:Pick<RecoveryProps,'onClose'>){
 return <div className="cr-actions"><button onClick={()=>window.location.reload()}>Reload page</button><button onClick={onClose}>Back to café</button></div>;
}

/** Keep the sheet header and café alive when a deferred screen fails to load. */
export class SheetBoundary extends Component<RecoveryProps&{children:ReactNode},{failed:boolean}>{
 override state={failed:false};
 static getDerivedStateFromError(){return{failed:true};}
 override render(){
  if(this.state.failed)return <section className="uv-detail" role="alert"><h2>Couldn’t open {this.props.title}</h2><p>Reload the page to try again, or return to the café.</p><RecoveryActions onClose={this.props.onClose}/></section>;
  return this.props.children;
 }
}

/** Pending imports can stall without rejecting; an exit must remain available. */
export function SheetLoading({title,onClose,illustrated}:{illustrated:boolean}&RecoveryProps){
 const [slow,setSlow]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setSlow(true),8000);return()=>window.clearTimeout(timer);},[]);
 return <>{illustrated?<OpeningA6 message={`Opening ${title}…`}/>:<p role="status">Opening {title}…</p>}{slow&&<section className="uv-detail" role="status"><p>This is taking longer than expected.</p><RecoveryActions onClose={onClose}/></section>}</>;
}
