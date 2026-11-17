import {gameEntry} from './game-entry-loader';

// Independent entries preserve the established game's CSS evaluation order while
// keeping its store/API graph out of the local prototype (and vice versa).
const route=gameEntry(window.location.search);
if(route.search!==window.location.search)window.history.replaceState(window.history.state,'',window.location.pathname+route.search+window.location.hash);
if (route.entry!=='legacy') {
  if (route.entry==='depth') {
    void import('./game/cardrpg/depth/entry');
  } else if (route.entry==='cardrpg') {
    void import('./game/cardrpg/entry');
  } else if (route.entry==='squad3d') {
    void import('./game/squad/turn3d/entry');
  } else {
    void import('./game/squad/entry');
  }
} else {
  void import('./legacy-entry');
}
