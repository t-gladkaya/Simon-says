import { getSymbolsByLevel, levelToLabel } from "./constants.js";

export class startScreen {
  constructor(initialLevel = "easyLevel") {
    this.selectedLevel = initialLevel;
    this.build();
  }

  build() {
    // Title
    this.title = document.createElement("h1");
    this.title.textContent = "Simon Says Game";
    document.body.appendChild(this.title);
    setTimeout(() => (this.title.style.opacity = 1), 50);

    // Main container
    this.container = document.createElement("div");
    this.container.classList.add("container");
    document.body.appendChild(this.container);

    // Top navigation
    this.navigationMenu = document.createElement("div");
    this.navigationMenu.classList.add("navigation");
    this.container.appendChild(this.navigationMenu);

    // Round + Level indicators
    this.roundSection = document.createElement("div");
    this.roundSection.classList.add("roundSection");
    this.navigationMenu.appendChild(this.roundSection);

    this.levelSection = document.createElement("div");
    this.levelSection.classList.add("levelSection");
    this.levelSection.textContent = `Level: ${levelToLabel(this.selectedLevel)}`;
    this.navigationMenu.appendChild(this.levelSection);

    // Placeholder for Repeat/Next and New Game
    this.repeatSequenceButton = document.createElement("button");
    this.repeatSequenceButton.classList.add("repeatSequenceButton");
    this.repeatSequenceButton.textContent = "Repeat the sequence 🔁";
    this.repeatSequenceButton.style.display = "none";
    this.navigationMenu.appendChild(this.repeatSequenceButton);

    this.nextButton = document.createElement("button");
    this.nextButton.classList.add("nextButton");
    this.nextButton.textContent = "Next";
    this.nextButton.style.display = "none";
    this.navigationMenu.appendChild(this.nextButton);

    this.newGameButton = document.createElement("button");
    this.newGameButton.classList.add("newGameButton");
    this.newGameButton.textContent = "New game";
    this.newGameButton.style.display = "none";
    this.navigationMenu.appendChild(this.newGameButton);

    // Content area
    this.containerContent = document.createElement("div");
    this.containerContent.classList.add("containerContent");
    this.container.appendChild(this.containerContent);

    // Start button
    this.startGameButton = document.createElement("button");
    this.startGameButton.classList.add("startButton");
    this.startGameButton.textContent = "START";
    this.containerContent.appendChild(this.startGameButton);
    setTimeout(() => (this.startGameButton.style.opacity = 1), 100);

    // Level select
    this.levelSelection = document.createElement("form");
    const select = document.createElement("select");
    select.name = "level";

    const levels = [
      { value: "easyLevel", text: "Easy" },
      { value: "mediumLevel", text: "Medium" },
      { value: "hardLevel", text: "Hard" },
    ];

    for (const level of levels) {
      const option = document.createElement("option");
      option.classList.add("option");
      option.value = level.value;
      option.textContent = level.text;
      if (level.value === this.selectedLevel) option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener("change", () => {
      this.selectedLevel = select.value;
      this.levelSection.textContent = `Level: ${levelToLabel(this.selectedLevel)}`;
      this.renderKeyboard();
      if (this.onLevelChange) this.onLevelChange(this.selectedLevel);
    });

    this.levelSelection.appendChild(select);
    this.containerContent.appendChild(this.levelSelection);
    setTimeout(() => (this.levelSelection.style.opacity = 1), 150);

    // Input area + message
    this.inputArea = document.createElement("div");
    this.inputArea.classList.add("inputArea");
    this.containerContent.appendChild(this.inputArea);

    this.userInput = document.createElement("input");
    this.userInput.classList.add("userInput");
    this.userInput.placeholder = "Your input...";
    this.userInput.readOnly = true;
    this.inputArea.appendChild(this.userInput);

    this.messageLine = document.createElement("div");
    this.messageLine.classList.add("messageLine");
    this.containerContent.appendChild(this.messageLine);

    // Keyboard
    this.keyboard = document.createElement("div");
    this.keyboard.classList.add("keyboard");
    this.container.appendChild(this.keyboard);
    this.renderKeyboard();

    setTimeout(() => (this.keyboard.style.opacity = 1), 200);
    setTimeout(() => (this.inputArea.style.opacity = 0), 0);
    setTimeout(() => (this.messageLine.style.opacity = 0), 0);

    this.startGameButton.addEventListener("click", () => this.onStart && this.onStart());
  }

  /*Keyboard*/
  renderKeyboard() {
    const symbols = getSymbolsByLevel(this.selectedLevel);
    this.keyboard.innerHTML = "";
    symbols.forEach((sym) => {
      const s = String(sym).toUpperCase();
      const btn = document.createElement("button");
      btn.classList.add("keyboardButton");
      btn.textContent = s;
      btn.setAttribute("data-key", s);
      btn.type = "button";
      btn.addEventListener("click", () => this.onVirtualKey && this.onVirtualKey(s));
      this.keyboard.appendChild(btn);
    });
  }

  showGameUIAfterStart(round, level) {
    this.levelSelection.querySelector("select").disabled = true;
    this.levelSelection.style.display = "none";

    this.startGameButton.style.display = "none";
    this.inputArea.style.opacity = 1;
    this.messageLine.style.opacity = 1;

    this.navigationMenu.style.opacity = 1;
    this.roundSection.textContent = `Round: ${round}`;
    this.levelSection.textContent = `Level: ${levelToLabel(level)}`;

    this.repeatSequenceButton.style.display = "flex";
    this.newGameButton.style.display = "flex";
    this.nextButton.style.display = "none";

    this.repeatSequenceButton.disabled = false;
  }

  setRound(n) {
    this.roundSection.textContent = `Round: ${n}`;
  }

  setUserInput(str) {
    this.userInput.value = str;
  }

  setMessage(text = "") {
    this.messageLine.textContent = text;
  }

  setButtonsDuringPlayback(disabled) {
    const allButtons = [
      ...this.keyboard.querySelectorAll("button"),
      this.repeatSequenceButton,
      this.newGameButton,
      this.nextButton,
    ];
    allButtons.forEach((b) => (b.disabled = !!disabled));
  }

  setInputEnabled(enabled) {
    this.keyboard.querySelectorAll("button").forEach((b) => (b.disabled = !enabled));
  }

  showRepeat(show) {
    this.repeatSequenceButton.style.display = show ? "flex" : "none";
  }

  showNext(show) {
    this.nextButton.style.display = show ? "flex" : "none";
  }

  resetToInitial(selectedLevel) {
    document.body.innerHTML = "";
    const fresh = new startScreen(selectedLevel);

    fresh.onStart = this.onStart;
    fresh.onLevelChange = this.onLevelChange;
    fresh.onVirtualKey = this.onVirtualKey;
    fresh.onRepeat = this.onRepeat;
    fresh.onNext = this.onNext;
    fresh.onNewGame = this.onNewGame;

    return fresh;
  }

  bind(handlers = {}) {
    if (handlers.onStart) this.onStart = handlers.onStart;
    if (handlers.onLevelChange) this.onLevelChange = handlers.onLevelChange;
    if (handlers.onVirtualKey) this.onVirtualKey = handlers.onVirtualKey;
    if (handlers.onRepeat) {
      this.onRepeat = handlers.onRepeat;
      this.repeatSequenceButton.addEventListener("click", () => this.onRepeat());
    }
    if (handlers.onNext) {
      this.onNext = handlers.onNext;
      this.nextButton.addEventListener("click", () => this.onNext());
    }
    if (handlers.onNewGame) {
      this.onNewGame = handlers.onNewGame;
      this.newGameButton.addEventListener("click", () => this.onNewGame());
    }
  }

}