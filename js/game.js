import {
  getSymbolsByLevel,
  HIGHLIGHT_TIME,
  ALLOWED_ERRORS_PER_ROUND,
  delay,
} from "./constants.js";
import { startScreen } from "./view.js";

export class GameState {
  constructor(initialLevel = "easyLevel") {
    this.initialLevel = initialLevel;
    this.reset(true);
  }

  reset(keepLevel = false) {
    this.currentRound = 1;
    this.maxRounds = 5;
    this.sequence = [];
    this.userSequence = [];
    this.selectedLevel = keepLevel ? this.initialLevel : "easyLevel";
    this.isGameActive = false;
    this.isShowingSequence = false;
    this.errorsThisRound = 0;
    this.hasUsedRepeat = false;
    this.inputLocked = true;
  }

  setLevel(level) {
    this.selectedLevel = level;
    this.initialLevel = level;
  }

  getSequenceLength() {
    return this.currentRound * 2;
  }

  generateSequence() {
    const len = this.getSequenceLength();
    const symbols = getSymbolsByLevel(this.selectedLevel);
    this.sequence = Array.from({ length: len }, () => {
      const idx = Math.floor(Math.random() * symbols.length);
      return String(symbols[idx]).toUpperCase();
    });
    this.userSequence = [];
    this.errorsThisRound = 0;
    this.hasUsedRepeat = false;
  }

  addUserInput(symbol) {
    this.userSequence.push(symbol);
  }

  clearUserInput() {
    this.userSequence = [];
  }

  isSequenceComplete() {
    return this.userSequence.length === this.sequence.length;
  }

  isCurrentInputCorrect() {
    const i = this.userSequence.length - 1;
    return this.userSequence[i] === this.sequence[i];
  }

  nextRound() {
    this.currentRound += 1;
  }

  isGameComplete() {
    return this.currentRound > this.maxRounds;
  }
}

export class KeyboardManager {
  constructor(getState, getKeyboardRoot) {
    this.getState = getState;
    this.getKeyboardRoot = getKeyboardRoot;
    this.processingKey = false;
    this.onPhysicalKey = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  setPhysicalHandler(fn) {
    this.onPhysicalKey = fn;
  }

  async highlightKey(symbol, time = HIGHLIGHT_TIME) {
    const root = this.getKeyboardRoot();
    if (!root) return;
    const key = root.querySelector(`[data-key="${symbol}"]`);
    if (key) {
      key.classList.add("active");
      await delay(time);
      key.classList.remove("active");
    } else {
      await delay(time);
    }
  }

  async handleKeyDown(e) {
    const state = this.getState();
    if (!state.isGameActive || state.isShowingSequence || state.inputLocked) return;

    if (e.repeat) return;
    if (e.location === 3) return;

    let key = e.key;
    if (key.length !== 1) return;
    const upper = key.toUpperCase();

    const allowed = getSymbolsByLevel(state.selectedLevel);
    if (!allowed.includes(upper)) return;

    if (this.processingKey) return;
    this.processingKey = true;

    this.highlightKey(upper, HIGHLIGHT_TIME).catch(() => {});

    if (this.onPhysicalKey) this.onPhysicalKey(upper);

    this.processingKey = false;
  }
}

class App {
  constructor() {
    this.gameState = new GameState("easyLevel");
    this.screen = new startScreen(this.gameState.selectedLevel);

    this.screen.bind({
      onStart: () => this.handleStart(),
      onLevelChange: (lvl) => this.gameState.setLevel(lvl),
      onVirtualKey: (sym) => this.handleSymbol(sym),
      onRepeat: () => this.handleRepeat(),
      onNext: () => this.handleNext(),
      onNewGame: () => this.handleNewGame(),
    });

    this.keyboardManager = new KeyboardManager(
      () => this.gameState,
      () => this.screen.keyboard
    );
    this.keyboardManager.setPhysicalHandler((sym) => this.handleSymbol(sym));
  }

  async handleStart() {
    this.gameState.isGameActive = true;
    this.screen.showGameUIAfterStart(this.gameState.currentRound, this.gameState.selectedLevel);

    await this.startRound(true);
  }

  async startRound(firstStart = false) {
    this.screen.inputArea.style.display = "flex";
    this.screen.messageLine.style.display = "flex";
    this.gameState.generateSequence();

    await this.showSequence();

    this.gameState.inputLocked = false;
    this.screen.setButtonsDuringPlayback(false);
    this.screen.setInputEnabled(true);
    this.screen.setMessage("Write the sequence.");
    this.screen.showRepeat(true);
    this.screen.repeatSequenceButton.disabled = false;
  }

  async showSequence() {
    this.gameState.isShowingSequence = true;
    this.gameState.inputLocked = true;
    this.screen.setButtonsDuringPlayback(true);
    this.screen.setInputEnabled(false);
    this.screen.setUserInput("");
    this.gameState.clearUserInput();
    this.screen.setMessage("Remember the sequence...");

    for (const sym of this.gameState.sequence) {
      await this.keyboardManager.highlightKey(sym, HIGHLIGHT_TIME);
      await delay(200);
    }

    this.gameState.isShowingSequence = false;
  }

  handleSymbol(symbol) {
    const state = this.gameState;
    if (!state.isGameActive || state.isShowingSequence || state.inputLocked) return;

    state.addUserInput(symbol);
    this.screen.setUserInput(state.userSequence.join(""));

    if (!state.isCurrentInputCorrect()) {
      state.errorsThisRound += 1;
      this.screen.setMessage(
        state.errorsThisRound <= ALLOWED_ERRORS_PER_ROUND
          ? "Incorrect. You can repeat the sequence once."
          : "Incorrect again. Game over."
      );
      state.inputLocked = true;
      this.screen.setInputEnabled(false);

      if (state.errorsThisRound > ALLOWED_ERRORS_PER_ROUND) {
        this.finishGame(false);
      } else {
        if (!state.hasUsedRepeat) {
          this.screen.showRepeat(true);
          this.screen.repeatSequenceButton.disabled = false;
        } else {
          this.screen.repeatSequenceButton.disabled = true;
        }
      }
      return;
    }

    if (state.isSequenceComplete()) {
      this.onRoundSuccess();
    }
  }

  onRoundSuccess() {
    const state = this.gameState;
    state.inputLocked = true;
    this.screen.setInputEnabled(false);
    this.screen.setMessage("Correct!");

    this.screen.showRepeat(false);
    this.screen.showNext(true);
    this.screen.nextButton.disabled = false;
  }

  async handleRepeat() {
    const state = this.gameState;
    if (state.isShowingSequence || state.inputLocked === false) {

    }

    if (state.hasUsedRepeat) return;
    state.hasUsedRepeat = true;

    this.screen.setMessage("");
    this.screen.setUserInput("");
    state.clearUserInput();

    this.screen.repeatSequenceButton.disabled = true;

    await this.showSequence();

    state.inputLocked = false;
    this.screen.setButtonsDuringPlayback(false);
    this.screen.setInputEnabled(true);
    this.screen.setMessage("Repeat the sequence.");
  }

  async handleNext() {
    const state = this.gameState;

    if (state.currentRound >= state.maxRounds) {
      this.finishGame(true);
      return;
    }

    state.nextRound();
    this.screen.setRound(state.currentRound);
    this.screen.showNext(false);
    this.screen.showRepeat(true);
    this.screen.repeatSequenceButton.disabled = false;

    await this.startRound();
  }

  handleNewGame() {
    const prevLevel = this.gameState.selectedLevel;
    this.keyboardManager.destroy();

    this.gameState.reset(true);
    this.gameState.setLevel(prevLevel);

    this.screen = this.screen.resetToInitial(prevLevel);

    this.screen.bind({
      onStart: () => this.handleStart(),
      onLevelChange: (lvl) => this.gameState.setLevel(lvl),
      onVirtualKey: (sym) => this.handleSymbol(sym),
      onRepeat: () => this.handleRepeat(),
      onNext: () => this.handleNext(),
      onNewGame: () => this.handleNewGame(),
    });

    this.keyboardManager = new KeyboardManager(
      () => this.gameState,
      () => this.screen.keyboard
    );
    this.keyboardManager.setPhysicalHandler((sym) => this.handleSymbol(sym));
  }

  finishGame(won) {
    this.gameState.isGameActive = false;
    this.gameState.inputLocked = true;

    this.screen.setInputEnabled(false);
    this.screen.setButtonsDuringPlayback(true);
    this.screen.newGameButton.disabled = false;

    this.screen.showRepeat(false);
    this.screen.showNext(false);

    this.screen.setMessage(
      won
        ? "Congratulations! You completed all 5 rounds."
        : "Game over. Try again!"
    );
  }
}

export { App };
