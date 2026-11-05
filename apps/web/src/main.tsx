import { squadEnabled } from './game/squad/gate';

// Independent entries preserve the established game's CSS evaluation order while
// keeping its store/API graph out of the local prototype (and vice versa).
if (squadEnabled(window.location.search, new URLSearchParams(window.location.search).has('demo'))) {
  void import('./game/squad/entry');
} else {
  void import('./legacy-entry');
}
