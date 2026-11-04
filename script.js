const roomNames = {
    1: "DISC MEMORY",
    2: "SIMON SAYS",
    3: "TEAM CONNECTIONS",
    4: "THE CHASE"
};

// Load saved room times
let roomTimes = JSON.parse(
    sessionStorage.getItem("roomTimes")
) || {};

let currentRoom = null;
let roomStartTime = null;
let timerInterval = null;


// FORMAT TIME
function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = Math.floor(milliseconds % 1000);

    return (
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") + "." +
        String(ms).padStart(3, "0")
    );
}


// SHUFFLE ARRAY
function shuffleArray(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled;
}


// ENTER A ROOM
function enterRoom(roomNumber) {

    if (roomTimes[roomNumber] !== undefined) {
        return;
    }

    if (currentRoom !== null) {
        return;
    }

    currentRoom = roomNumber;
    roomStartTime = Date.now();

    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.add("hidden");
    document.getElementById("room-screen").classList.remove("hidden");

    document.getElementById("room-label").textContent =
        "ROOM " + String(roomNumber).padStart(2, "0");

    document.getElementById("room-title").textContent =
        roomNames[roomNumber];

    document.getElementById("room-timer").textContent =
        "00:00.000";

    if (roomNumber === 1) {
        initializeDiscMemory();
    } else if (roomNumber === 2) {
        initializeSimonSays();
    } else if (roomNumber === 3) {
        initializeTeamConnections();
    } else {
        document.getElementById("room-content").innerHTML =
            "<p>This challenge is coming soon!</p>";
    }

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (currentRoom === null || roomStartTime === null) {
            return;
        }

        const elapsed = Date.now() - roomStartTime;

        document.getElementById("room-timer").textContent =
            formatTime(elapsed);

    }, 30);
}


// ==========================================
// ROOM 1: DISC MEMORY
// ==========================================

function initializeDiscMemory() {

    const words = [
        "HANDLER",
        "CUTTER",
        "HAMMER",
        "FLICK",
        "BACKHAND",
        "CHEEKS",
        "BURN",
        "BOX"
    ];

    const cards = shuffleArray([...words, ...words]);

    let firstCard = null;
    let secondCard = null;

    let lockBoard = false;
    let matches = 0;
    let moves = 0;

    const roomContent = document.getElementById("room-content");

    roomContent.innerHTML = `
        <p class="memory-instructions">
            Turn over two boxes at a time.
            Find all eight matching pairs to escape the room!
        </p>

        <div class="memory-stats">
            <span>MATCHES: <span id="match-count">0 / 8</span></span>
            <span>MOVES: <span id="move-count">0</span></span>
        </div>

        <div class="memory-grid" id="memory-grid"></div>
    `;

    const memoryGrid = document.getElementById("memory-grid");

    cards.forEach((word) => {

        const card = document.createElement("button");

        card.className = "memory-card";
        card.dataset.word = word;

        card.innerHTML = `
            <span class="card-back">?</span>
            <span class="card-word">${word}</span>
        `;

        card.addEventListener("click", () => {
            flipCard(card);
        });

        memoryGrid.appendChild(card);
    });


    function flipCard(card) {

        if (lockBoard) return;

        if (
            card.classList.contains("flipped") ||
            card.classList.contains("matched")
        ) {
            return;
        }

        card.classList.add("flipped");

        if (firstCard === null) {
            firstCard = card;
            return;
        }

        secondCard = card;

        moves++;

        document.getElementById("move-count").textContent =
            moves;

        checkMatch();
    }


    function checkMatch() {

        const isMatch =
            firstCard.dataset.word === secondCard.dataset.word;

        if (isMatch) {
            handleMatch();
        } else {
            handleMismatch();
        }
    }


    function handleMatch() {

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        firstCard.disabled = true;
        secondCard.disabled = true;

        matches++;

        document.getElementById("match-count").textContent =
            matches + " / 8";

        resetTurn();

        if (matches === 8) {
            finishDiscMemory();
        }
    }


    function handleMismatch() {

        lockBoard = true;

        setTimeout(() => {

            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");

            resetTurn();

        }, 800);
    }


    function resetTurn() {

        firstCard = null;
        secondCard = null;
        lockBoard = false;
    }


    function finishDiscMemory() {

        roomContent.innerHTML = `
            <div class="memory-complete">
                <h2>ROOM 01 COMPLETE!</h2>
                <p>You successfully matched every disc term.</p>
                <p>Moves: ${moves}</p>
                <p>Returning to room selection...</p>
            </div>
        `;

        completeRoom();
    }
}


// ==========================================
// ROOM 2: SIMON SAYS
// ==========================================

function initializeSimonSays() {

    const actions = [
        "CUT",
        "DUMP",
        "SWING",
        "HUCK"
    ];

    let sequence = [];
    let currentRound = 1;
    let playerPosition = 0;

    let mistakes = 0;
    let acceptingInput = false;
    let gameStarted = false;
    let awaitingNextRound = false;

    let playbackTimeouts = [];

    const roomContent = document.getElementById("room-content");

    roomContent.innerHTML = `
        <div class="simon-panel">

            <div class="simon-round" id="simon-round">
                ROUND 1 OF 7
            </div>

            <p class="simon-instructions">
                Watch the sequence of ultimate actions.
                Repeat the sequence in the exact same order.
                Each round adds one new action!
            </p>

            <div class="simon-status" id="simon-status">
                Press START to begin.
            </div>

            <div class="simon-grid">

                <button class="simon-button" data-action="CUT" disabled>
                    CUT
                </button>

                <button class="simon-button" data-action="DUMP" disabled>
                    DUMP
                </button>

                <button class="simon-button" data-action="SWING" disabled>
                    SWING
                </button>

                <button class="simon-button" data-action="HUCK" disabled>
                    HUCK
                </button>

            </div>

            <div class="simon-progress">
                PROGRESS:
                <strong id="simon-progress">0 / 7 ROUNDS</strong>
            </div>

            <div class="simon-progress">
                MISTAKES:
                <strong id="simon-mistakes">0</strong>
            </div>

            <button class="simon-start" id="simon-start">
                START
            </button>

        </div>
    `;

    const simonButtons = document.querySelectorAll(".simon-button");
    const startButton = document.getElementById("simon-start");


    function setStatus(message) {
        document.getElementById("simon-status").textContent =
            message;
    }


    function setButtonsEnabled(enabled) {

        simonButtons.forEach(button => {
            button.disabled = !enabled;
        });
    }


    function clearPlayback() {

        playbackTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });

        playbackTimeouts = [];

        simonButtons.forEach(button => {
            button.classList.remove("lit");
        });
    }


    function flashAction(action, duration) {

        const button = document.querySelector(
            `.simon-button[data-action="${action}"]`
        );

        if (!button) return;

        button.classList.add("lit");

        const timeout = setTimeout(() => {
            button.classList.remove("lit");
        }, duration);

        playbackTimeouts.push(timeout);
    }


    function addToSequence() {

        const randomAction =
            actions[Math.floor(Math.random() * actions.length)];

        sequence.push(randomAction);
    }


    function playSequence() {

        clearPlayback();

        acceptingInput = false;
        playerPosition = 0;

        setButtonsEnabled(false);

        startButton.disabled = true;

        setStatus("WATCH THE SEQUENCE...");

        document.getElementById("simon-round").textContent =
            `ROUND ${currentRound} OF 7`;

        const flashDuration =
            Math.max(250, 550 - currentRound * 35);

        const gapDuration =
            Math.max(100, 200 - currentRound * 10);

        let index = 0;

        function playNextAction() {

            if (index >= sequence.length) {

                const finishTimeout = setTimeout(() => {

                    acceptingInput = true;

                    setButtonsEnabled(true);

                    startButton.disabled = false;
                    startButton.textContent = "REPLAY SEQUENCE";

                    setStatus("YOUR TURN! REPEAT THE SEQUENCE.");

                }, 400);

                playbackTimeouts.push(finishTimeout);

                return;
            }

            const action = sequence[index];

            flashAction(action, flashDuration);

            index++;

            const nextTimeout = setTimeout(() => {
                playNextAction();
            }, flashDuration + gapDuration);

            playbackTimeouts.push(nextTimeout);
        }

        const initialTimeout = setTimeout(() => {
            playNextAction();
        }, 600);

        playbackTimeouts.push(initialTimeout);
    }


    function handlePlayerInput(action) {

        if (!acceptingInput) return;

        if (currentRoom !== 2) return;

        const expectedAction = sequence[playerPosition];

        if (action === expectedAction) {

            flashAction(action, 180);

            playerPosition++;

            if (playerPosition === sequence.length) {

                acceptingInput = false;
                setButtonsEnabled(false);

                document.getElementById("simon-progress").textContent =
                    `${currentRound} / 7 ROUNDS`;

                if (currentRound === 7) {

                    finishSimonSays();

                } else {

                    awaitingNextRound = true;

                    setStatus(
                        `ROUND ${currentRound} COMPLETE!`
                    );

                    startButton.disabled = false;
                    startButton.textContent = "NEXT ROUND";
                }
            }

        } else {

            mistakes++;

            document.getElementById("simon-mistakes").textContent =
                mistakes;

            acceptingInput = false;

            setButtonsEnabled(false);

            startButton.disabled = true;

            setStatus("INCORRECT! WATCH THE SEQUENCE AGAIN.");

            const retryTimeout = setTimeout(() => {
                playSequence();
            }, 900);

            playbackTimeouts.push(retryTimeout);
        }
    }


    function finishSimonSays() {

        acceptingInput = false;

        setButtonsEnabled(false);

        clearPlayback();

        startButton.disabled = true;

        const elapsed = Date.now() - roomStartTime;

        roomContent.innerHTML = `
            <div class="memory-complete">
                <h2>ROOM 02 COMPLETE!</h2>

                <p>You successfully completed all seven rounds.</p>

                <p>Mistakes: ${mistakes}</p>

                <p>Returning to room selection...</p>
            </div>
        `;

        completeRoom(elapsed);
    }


    simonButtons.forEach(button => {

        button.addEventListener("click", () => {

            const action = button.dataset.action;

            handlePlayerInput(action);

        });

    });


    startButton.addEventListener("click", () => {

        if (startButton.disabled) return;

        if (!gameStarted) {

            gameStarted = true;

            addToSequence();

            startButton.disabled = true;

            playSequence();

            return;
        }

        if (awaitingNextRound) {

            awaitingNextRound = false;

            currentRound++;

            addToSequence();

            startButton.disabled = true;
            startButton.textContent = "WATCHING...";

            playSequence();

            return;
        }

        if (acceptingInput) {

            playSequence();

        }

    });

}


// ==========================================
// ROOM 3: TEAM CONNECTIONS
// ==========================================

function initializeTeamConnections() {

    const categories = [
        {
            name: "ROOKIES",
            difficulty: "YELLOW",
            members: ["COOPER", "LEO", "BILLY", "LOUIS"]
        },
        {
            name: "NICKNAMES",
            difficulty: "GREEN",
            members: ["POOKIE", "STICK", "MUFF", "CHRISPY"]
        },
        {
            name: "SCAV HUNT TOP SCORERS",
            difficulty: "BLUE",
            members: ["TATE", "LINK", "TREVOR", "TOMMY"]
        },
        {
            name: "4 ABSENCES",
            difficulty: "PURPLE",
            members: ["CARTER", "MICHAEL", "KAI", "TRENT"]
        }
    ];

    let selectedTiles = [];
    let mistakes = 0;
    let solvedCategories = [];

    const maxMistakes = 4;

    const roomContent = document.getElementById("room-content");

    // BUILD THE GAME LAYOUT
    roomContent.innerHTML = `
        <div class="connections-panel">

            <p class="connections-instructions">
                Find four groups of four connected names.
                Select four tiles and submit your guess.
            </p>

            <div class="connections-attempts">
                INCORRECT GUESSES:
                <strong id="connections-mistakes">0 / 4</strong>
            </div>

            <div class="connections-status" id="connections-status">
                Find the four hidden categories.
            </div>

            <div class="connections-solved" id="connections-solved"></div>

            <div class="connections-grid" id="connections-grid"></div>

            <div class="connections-controls">
                <button
                    class="connections-submit"
                    id="connections-submit"
                    disabled
                >
                    SUBMIT
                </button>

                <button
                    class="connections-shuffle"
                    id="connections-shuffle"
                >
                    SHUFFLE
                </button>

                <button
                    class="connections-deselect"
                    id="connections-deselect"
                >
                    DESELECT ALL
                </button>
            </div>

            <p class="connections-feedback" id="connections-feedback">
                Select four names to make a guess.
            </p>

        </div>
    `;

    const grid = document.getElementById("connections-grid");
    const submitButton = document.getElementById("connections-submit");
    const shuffleButton = document.getElementById("connections-shuffle");
    const deselectButton = document.getElementById("connections-deselect");

    let allTiles = categories.flatMap((category, categoryIndex) => {
        return category.members.map(member => ({
            name: member,
            categoryIndex: categoryIndex
        }));
    });

    let remainingTiles = shuffleArray(allTiles);


    // DRAW THE REMAINING TILES
    function renderTiles() {

        grid.innerHTML = "";

        remainingTiles.forEach(tile => {

            const button = document.createElement("button");

            button.className = "connection-tile";
            button.textContent = tile.name;

            if (selectedTiles.includes(tile.name)) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => {
                toggleTile(tile.name);
            });

            grid.appendChild(button);
        });

        updateControls();
    }


    // SELECT OR DESELECT A TILE
    function toggleTile(name) {

        if (mistakes >= maxMistakes) return;

        if (selectedTiles.includes(name)) {

            selectedTiles = selectedTiles.filter(
                tile => tile !== name
            );

        } else {

            if (selectedTiles.length >= 4) return;

            selectedTiles.push(name);
        }

        renderTiles();
    }


    // UPDATE BUTTON STATES
    function updateControls() {

        submitButton.disabled =
            selectedTiles.length !== 4 ||
            mistakes >= maxMistakes;

        shuffleButton.disabled =
            mistakes >= maxMistakes;

        deselectButton.disabled =
            selectedTiles.length === 0 ||
            mistakes >= maxMistakes;
    }


    // CALCULATE THE LARGEST CATEGORY OVERLAP
    function getCommonCount(guess) {

        let highestOverlap = 0;

        categories.forEach(category => {

            const overlap = guess.filter(name =>
                category.members.includes(name)
            ).length;

            highestOverlap = Math.max(
                highestOverlap,
                overlap
            );
        });

        return highestOverlap;
    }


    // CHECK THE PLAYER'S GUESS
    function submitGuess() {

        if (selectedTiles.length !== 4) return;
        if (mistakes >= maxMistakes) return;

        const guess = [...selectedTiles];

        // CHECK WHETHER ALL FOUR BELONG TO THE SAME CATEGORY
        const matchedCategory = categories.find(category => {

            return guess.every(name =>
                category.members.includes(name)
            );

        });

        if (matchedCategory) {

            handleCorrectGuess(matchedCategory);

        } else {

            handleIncorrectGuess(guess);

        }
    }


    // CORRECT CATEGORY
    function handleCorrectGuess(category) {

        const categoryIndex = categories.indexOf(category);

        solvedCategories.push(categoryIndex);

        // Remove the four solved tiles
        remainingTiles = remainingTiles.filter(tile =>
            !category.members.includes(tile.name)
        );

        selectedTiles = [];

        document.getElementById("connections-status").textContent =
            "CATEGORY FOUND!";

        document.getElementById("connections-feedback").textContent =
            `You found: ${category.name}`;

        renderSolvedCategories();

        renderTiles();

        // Check whether all four categories are solved
        if (solvedCategories.length === 4) {
            finishConnections();
        }
    }


    // INCORRECT CATEGORY
    function handleIncorrectGuess(guess) {

        mistakes++;

        document.getElementById("connections-mistakes").textContent =
            `${mistakes} / ${maxMistakes}`;

        const commonCount = getCommonCount(guess);

        const feedback = document.getElementById(
            "connections-feedback"
        );

        feedback.textContent =
            `${commonCount} COMMON`;

        feedback.classList.remove("connections-feedback-wrong");

        // Restart animation
        void feedback.offsetWidth;

        feedback.classList.add("connections-feedback-wrong");

        selectedTiles = [];

        renderTiles();

        if (mistakes >= maxMistakes) {
            showConnectionsFailure();
        }
    }


    // SHOW COMPLETED CATEGORIES
    function renderSolvedCategories() {

        const solvedContainer = document.getElementById(
            "connections-solved"
        );

        solvedContainer.innerHTML = "";

        solvedCategories.forEach(index => {

            const category = categories[index];

            const categoryBox = document.createElement("div");

            categoryBox.className =
                `solved-category solved-category-${index + 1}`;

            categoryBox.innerHTML = `
                <strong>${category.name}</strong>
                <span>${category.members.join(" · ")}</span>
            `;

            solvedContainer.appendChild(categoryBox);
        });
    }


    // SHUFFLE REMAINING TILES
    function shuffleRemainingTiles() {

        if (mistakes >= maxMistakes) return;

        remainingTiles = shuffleArray(remainingTiles);

        selectedTiles = [];

        document.getElementById("connections-feedback").textContent =
            "Tiles shuffled.";

        renderTiles();
    }


    // CLEAR SELECTION
    function deselectAll() {

        selectedTiles = [];

        document.getElementById("connections-feedback").textContent =
            "Selection cleared.";

        renderTiles();
    }


    // GAME OVER
    function showConnectionsFailure() {

        submitButton.disabled = true;
        shuffleButton.disabled = true;
        deselectButton.disabled = true;

        document.getElementById("connections-status").textContent =
            "NO GUESSES REMAINING";

        document.getElementById("connections-feedback").textContent =
            "You ran out of attempts. Restart to try again.";

        roomContent.querySelector(".connections-panel").insertAdjacentHTML(
            "beforeend",
            `
                <div class="connections-failure">
                    <h2>OUT OF GUESSES!</h2>
                    <p>You used all four incorrect guesses.</p>
                    <p>Your room timer is still running.</p>

                    <button
                        class="connections-restart"
                        id="connections-restart"
                    >
                        TRY AGAIN
                    </button>
                </div>
            `
        );

        document.getElementById("connections-restart")
            .addEventListener("click", restartConnections);
    }


    // RESTART THE PUZZLE WITHOUT RESETTING THE TIMER
    function restartConnections() {

        selectedTiles = [];
        mistakes = 0;
        solvedCategories = [];

        remainingTiles = shuffleArray(allTiles);

        document.getElementById("connections-mistakes").textContent =
            "0 / 4";

        document.getElementById("connections-status").textContent =
            "Find the four hidden categories.";

        document.getElementById("connections-feedback").textContent =
            "Select four names to make a guess.";

        const failure = roomContent.querySelector(
            ".connections-failure"
        );

        if (failure) {
            failure.remove();
        }

        renderSolvedCategories();
        renderTiles();
    }


    // COMPLETE THE GAME AND SHOW RESULTS
    function finishConnections() {

        // Capture the final time before stopping the timer
        const elapsed = Date.now() - roomStartTime;

        // Save the room time and stop the timer.
        // The true argument keeps the player on this screen.
        completeRoom(elapsed, true);

        // Build the completed category results
        const completedCategories = solvedCategories.map(index => {

            const category = categories[index];

            return `
                <div class="solved-category solved-category-${index + 1}">
                    <strong>${category.name}</strong>
                    <span>${category.members.join(" · ")}</span>
                </div>
            `;
        }).join("");

        // Display the Connections results instead of returning to the menu
        roomContent.innerHTML = `
            <div class="connections-results">

                <h2>ROOM 03 COMPLETE!</h2>

                <p class="connections-results-intro">
                    You successfully found all four hidden categories.
                </p>

                <div class="connections-result-stat">
                    <span>YOUR CONNECTIONS TIME</span>
                    <strong>${formatTime(elapsed)}</strong>
                </div>

                <div class="connections-result-stat">
                    <span>INCORRECT GUESSES</span>
                    <strong>${mistakes} / ${maxMistakes}</strong>
                </div>

                <h3 class="results-heading">
                    ALL FOUR CATEGORIES
                </h3>

                <div class="connections-results-categories">
                    ${completedCategories}
                </div>

                <p class="connections-results-message">
                    Great work! Your Connections time has been saved
                    and added to your overall time. Reviewing these
                    results will not add any extra time.
                </p>

                <button
                    class="connections-menu-button"
                    onclick="returnToMenu()"
                >
                    BACK TO ROOMS
                </button>

            </div>
        `;
    }


    // CONNECT BUTTONS
    submitButton.addEventListener("click", submitGuess);

    shuffleButton.addEventListener("click", shuffleRemainingTiles);

    deselectButton.addEventListener("click", deselectAll);

    renderTiles();
}


// ==========================================
// COMPLETE A ROOM
// ==========================================

function completeRoom(completionTime, stayOnRoom = false) {

    if (currentRoom === null) return;

    const elapsed = completionTime !== undefined
        ? completionTime
        : Date.now() - roomStartTime;

    // Save the completed room time
    roomTimes[currentRoom] = elapsed;

    sessionStorage.setItem(
        "roomTimes",
        JSON.stringify(roomTimes)
    );

    // Stop the timer immediately
    clearInterval(timerInterval);
    timerInterval = null;

    // Show the exact final time on the room screen
    document.getElementById("room-timer").textContent =
        formatTime(elapsed);

    currentRoom = null;
    roomStartTime = null;

    updateMenu();

    // Connections stays on its results screen.
    // Other rooms return to the menu as before.
    if (!stayOnRoom) {

        setTimeout(() => {
            returnToMenu();
        }, 700);

    }
}


// ==========================================
// RETURN TO MENU
// ==========================================

function returnToMenu() {

    if (currentRoom !== null) {
        alert("Finish the challenge before returning to the menu!");
        return;
    }

    clearInterval(timerInterval);

    document.getElementById("room-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.add("hidden");
    document.getElementById("menu-screen").classList.remove("hidden");

    updateMenu();
}


// ==========================================
// UPDATE MENU AND ESCAPE BUTTON
// ==========================================

function updateMenu() {

    let totalTime = 0;

    for (let i = 1; i <= 4; i++) {

        const status = document.getElementById("status-" + i);
        const button = document.getElementById("room-button-" + i);

        if (roomTimes[i] !== undefined) {

            status.textContent = formatTime(roomTimes[i]);
            status.classList.add("completed");
            button.disabled = true;

        } else {

            status.textContent = "NOT STARTED";
            status.classList.remove("completed");
            button.disabled = false;

        }
    }

    Object.values(roomTimes).forEach(time => {
        totalTime += time;
    });

    document.getElementById("total-time").textContent =
        formatTime(totalTime);

    const allComplete = [1, 2, 3, 4].every(
        room => roomTimes[room] !== undefined
    );

    document.getElementById("escape-button").disabled =
        !allComplete;
}


// ==========================================
// SHOW FINAL RESULTS
// ==========================================

function showResults() {

    const allComplete = [1, 2, 3, 4].every(
        room => roomTimes[room] !== undefined
    );

    if (!allComplete) return;

    document.getElementById("menu-screen").classList.add("hidden");
    document.getElementById("room-screen").classList.add("hidden");
    document.getElementById("results-screen").classList.remove("hidden");

    const resultsList = document.getElementById("results-list");

    resultsList.innerHTML = "";

    let totalTime = 0;

    for (let i = 1; i <= 4; i++) {

        const time = roomTimes[i];

        totalTime += time;

        resultsList.innerHTML += `
            <div class="result-row">
                <span>${roomNames[i]}</span>
                <strong>${formatTime(time)}</strong>
            </div>
        `;
    }

    document.getElementById("final-time").textContent =
        formatTime(totalTime);
}


// ==========================================
// INSTRUCTIONS POPUP
// ==========================================

document.getElementById("instructions-button")
    .addEventListener("click", () => {

        document.getElementById("instructions-modal")
            .classList.remove("hidden");

    });

document.getElementById("close-instructions")
    .addEventListener("click", () => {

        document.getElementById("instructions-modal")
            .classList.add("hidden");

    });


// ==========================================
// INITIALIZE MENU
// ==========================================

updateMenu();
