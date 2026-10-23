
"use strict";

// ==============================
// 1. SELECT HTML ELEMENTS
// ==============================

const homeScreen = document.getElementById("home-screen");
const gameScreen = document.getElementById("game-screen");
const gameBoard = document.getElementById("game-board");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const homeBtn = document.getElementById("home-btn");
const changeLevelBtn = document.getElementById("change-level-btn");

const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const matchesDisplay = document.getElementById("matches");
const bestScoreDisplay = document.getElementById("best-score");
const levelLabel = document.getElementById("level-label");

const victoryModal = document.getElementById("victory-modal");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");
const finalBest = document.getElementById("final-best");
const playAgainBtn = document.getElementById("play-again-btn");

const difficultyButtons =
    document.querySelectorAll(".difficulty-btn");

// ==============================
// 2. GAME SETTINGS
// ==============================

const allEmojis = [
    "🍎", "🚀", "🐱", "🎮",
    "🌈", "⚽", "🎸", "🐼",
    "🍕", "⭐", "🦋", "🍩"
];

const levels = {
    easy: 6,
    medium: 8,
    hard: 12
};

let currentLevel = "easy";

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let seconds = 0;

let timerInterval = null;
let flipTimeout = null;
let victoryTimeout = null;

let isLocked = false;
let gameStarted = false;

// ==============================
// 3. CHOOSE DIFFICULTY
// ==============================

difficultyButtons.forEach(button => {

    button.addEventListener("click", () => {

        currentLevel = button.dataset.level;

        difficultyButtons.forEach(btn => {
            btn.classList.remove("selected");
        });

        button.classList.add("selected");
    });
});

// ==============================
// 4. SHUFFLE CARDS
// ==============================

function shuffleCards() {

    const pairCount = levels[currentLevel];

    const selectedEmojis = allEmojis.slice(0, pairCount);

    cards = [...selectedEmojis, ...selectedEmojis];

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
}

// ==============================
// 5. CREATE GAME BOARD
// ==============================

function createCards() {

    gameBoard.innerHTML = "";

    cards.forEach(emoji => {

        const card = document.createElement("button");

        card.type = "button";
        card.classList.add("memory-card");

        card.dataset.emoji = emoji;
        card.setAttribute("aria-label", "Hidden memory card");

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">${emoji}</div>
            </div>
        `;

        card.addEventListener("click", () => flipCard(card));

        gameBoard.appendChild(card);
    });
}

// ==============================
// 6. TIMER
// ==============================

function formatTime(totalSeconds) {

    const minutes = Math.floor(totalSeconds / 60);
    const remaining = totalSeconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}

function startTimer() {

    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = formatTime(seconds);
    }, 1000);
}

// ==============================
// 7. FLIP A CARD
// ==============================

function flipCard(card) {

    if (
        isLocked ||
        card.classList.contains("flipped") ||
        card.classList.contains("matched")
    ) {
        return;
    }

    // Begin timer on first click
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    card.classList.add("flipped");
    card.setAttribute("aria-label", card.dataset.emoji);

    flippedCards.push(card);

    if (flippedCards.length === 2) {

        moves++;
        movesDisplay.textContent = moves;

        checkMatch();
    }
}

// ==============================
// 8. MATCHING LOGIC
// ==============================

function checkMatch() {

    const [firstCard, secondCard] = flippedCards;

    if (
        firstCard.dataset.emoji ===
        secondCard.dataset.emoji
    ) {

        // Correct match
        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        firstCard.setAttribute(
            "aria-label",
            "Matched " + firstCard.dataset.emoji
        );

        secondCard.setAttribute(
            "aria-label",
            "Matched " + secondCard.dataset.emoji
        );

        matchedPairs++;

        matchesDisplay.textContent =
            matchedPairs + "/" + levels[currentLevel];

        flippedCards = [];

        if (matchedPairs === levels[currentLevel]) {
            endGame();
        }

    } else {

        // Incorrect match
        isLocked = true;

        flipTimeout = setTimeout(() => {

            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            firstCard.setAttribute(
                "aria-label", "Hidden memory card"
            );

            secondCard.setAttribute(
                "aria-label", "Hidden memory card"
            );

            flippedCards = [];
            isLocked = false;
            flipTimeout = null;

        }, 1000);
    }
}

// ==============================
// 9. BEST SCORE
// ==============================

function getBestScore() {

    const key = "memory-best-" + currentLevel;

    try {
        const saved = localStorage.getItem(key);
        if (saved === null) return null;

        const value = Number(saved);

        return Number.isInteger(value) && value > 0
            ? value
            : null;

    } catch (error) {
        return null;
    }
}

function saveBestScore() {

    const previousBest = getBestScore();

    if (previousBest === null || moves < previousBest) {

        try {
            localStorage.setItem(
                "memory-best-" + currentLevel,
                String(moves)
            );
        } catch (error) {
            console.log("Best score could not be saved.");
        }
    }

    updateBestScore();
}

function updateBestScore() {

    const best = getBestScore();

    bestScoreDisplay.textContent =
        best === null ? "—" : best;
}

// ==============================
// 10. WINNING THE GAME
// ==============================

function endGame() {

    clearInterval(timerInterval);
    timerInterval = null;

    isLocked = true;

    saveBestScore();

    finalMoves.textContent = "Moves: " + moves;

    finalTime.textContent =
        "Time: " + formatTime(seconds);

    finalBest.textContent =
        "Best Moves: " + bestScoreDisplay.textContent;

    victoryTimeout = setTimeout(() => {

        victoryModal.classList.remove("hidden");
        victoryModal.classList.add("flex");
        playAgainBtn.focus();

        victoryTimeout = null;

    }, 600);
}

// ==============================
// 11. RESTART GAME
// ==============================

function restartGame() {

    clearInterval(timerInterval);
    clearTimeout(flipTimeout);
    clearTimeout(victoryTimeout);

    timerInterval = null;
    flipTimeout = null;
    victoryTimeout = null;

    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    seconds = 0;

    isLocked = false;
    gameStarted = false;

    movesDisplay.textContent = "0";
    timerDisplay.textContent = "00:00";

    matchesDisplay.textContent =
        "0/" + levels[currentLevel];

    levelLabel.textContent =
        currentLevel.toUpperCase() + " MODE";

    victoryModal.classList.add("hidden");
    victoryModal.classList.remove("flex");

    updateBestScore();
    shuffleCards();
    createCards();
}

// ==============================
// 12. NAVIGATION
// ==============================

function showHome() {

    // Stop an active game
    clearInterval(timerInterval);
    clearTimeout(flipTimeout);
    clearTimeout(victoryTimeout);

    timerInterval = null;
    flipTimeout = null;
    victoryTimeout = null;

    victoryModal.classList.add("hidden");
    victoryModal.classList.remove("flex");

    gameScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
}

function showGame() {

    homeScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    restartGame();
}

// ==============================
// 13. BUTTON EVENTS
// ==============================

startBtn.addEventListener("click", showGame);

restartBtn.addEventListener("click", restartGame);

homeBtn.addEventListener("click", showHome);

changeLevelBtn.addEventListener("click", showHome);

playAgainBtn.addEventListener("click", restartGame);

// Show homepage when first loaded
showHome();
