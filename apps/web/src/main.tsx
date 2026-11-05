import { squadEnabled } from './game/squad/gate';

// Independent entries preserve the established game's CSS evaluation order while
// keeping its store/API graph out of the local prototype (and vice versa).
if (squadEnabled(window.location.search, new URLSearchParams(window.location.search).has('demo'))) {
  if (new URLSearchParams(window.location.search).get('cardrpg') === '1') {
    void import('./game/cardrpg/entry');
  } else if (new URLSearchParams(window.location.search).get('squad3d') === '1') {
    void import('./game/squad/turn3d/entry');
  } else {
    void import('./game/squad/entry');
  }
} else {
  void import('./legacy-entry');
}
