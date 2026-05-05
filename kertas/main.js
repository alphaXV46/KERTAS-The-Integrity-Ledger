// main.js — Bootstrap entry point
import { I18n } from './src/i18n.js';
import { AudioManager } from './src/AudioManager.js';
import { StorageManager } from './src/StorageManager.js';
import { GameState } from './src/GameState.js';
import { CaseLoader } from './src/CaseLoader.js';
import { Renderer } from './src/Renderer.js';
import { StateMachine } from './src/StateMachine.js';

(async () => {
  const i18n    = new I18n();
  const audio   = new AudioManager();
  const storage = new StorageManager();
  const state   = new GameState();
  const loader  = new CaseLoader();
  const renderer = new Renderer(i18n, audio);

  const sm = new StateMachine({
    renderer, gameState: state, caseLoader: loader,
    storage, audio, i18n
  });

  await sm.boot();
})();
