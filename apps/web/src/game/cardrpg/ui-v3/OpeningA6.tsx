import {artPropsA6} from './art-a6';
import './opening-a6.css';

export function OpeningA6({message = 'Lighting the lanterns…'}: {message?: string}) {
  return <div className="a6-opening" role="status">
    <img {...artPropsA6('clover')} alt=""/>
    <div><span aria-hidden="true">✦ · ✦ · ✦</span><p>{message}</p></div>
  </div>;
}
