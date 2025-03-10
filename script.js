// DOM Elements
const gameArea = document.getElementById('gameArea');
const messageBox = document.getElementById('messageBox');
const message = document.getElementById('message');
const startButton = document.getElementById('startButton');
const lastResult = document.getElementById('lastResult');
const bestResult = document.getElementById('bestResult');
const character = document.getElementById('character');

// Game Variables
let gameStarted = false;
let gameReady = false;
let startTime;
let bestTime = localStorage.getItem('bestTime') ? parseFloat(localStorage.getItem('bestTime')) : null;
let waitTimeout;
let readyForKeypress = false;
let reactionTimes = []; // Array to track recent reaction times for calculating averages

// Performance thresholds in milliseconds
const performanceThresholds = {
    amazing: 150,    // Under 150ms is amazing
    excellent: 200,  // Under 200ms is excellent
    good: 300,       // Under 300ms is good
    average: 500     // Under 500ms is average, above is slow
};

// Update best time from localStorage if available
if (bestTime !== null) {
    bestResult.textContent = `${bestTime.toFixed(3)} ms`;
}

// Sound Effects using Howler.js
const sounds = {
    start: new Howl({
        src: ['https://assets.codepen.io/21542/pop.mp3'],
        volume: 0.7
    }),
    success: new Howl({
        src: ['https://assets.codepen.io/21542/success-1.mp3'],
        volume: 0.7
    }),
    fail: new Howl({
        src: ['https://assets.codepen.io/21542/fail.mp3'],
        volume: 0.7
    }),
    ready: new Howl({
        src: ['https://assets.codepen.io/21542/ready.mp3'],
        volume: 0.5
    }),
    clap: new Howl({
        src: ['https://assets.codepen.io/21542/clap.mp3'],
        volume: 0.5
    }),
    jump: new Howl({
        src: ['https://assets.codepen.io/21542/boing.mp3'],
        volume: 0.6
    }),
    amazing: new Howl({
        src: ['https://assets.codepen.io/21542/tada.mp3'],
        volume: 0.7
    })
};

// Initialize the game
function initGame() {
    startButton.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeydown);
}

// Start the game when the button is clicked
function startGame() {
    if (gameStarted) return;
    
    sounds.start.play();
    gameStarted = true;
    gameReady = false;
    readyForKeypress = false;
    
    // Update UI
    message.textContent = "Wait for GREEN...";
    startButton.style.display = 'none';
    gameArea.classList.remove('green');
    character.classList.remove('happy', 'sad');
    character.classList.add('excited');
    
    // Random delay between 1 and 5 seconds
    const randomDelay = Math.floor(Math.random() * 4000) + 1000;
    
    // Clear any existing timeout
    if (waitTimeout) clearTimeout(waitTimeout);
    
    // Set timeout for the screen to turn green
    waitTimeout = setTimeout(() => {
        gameReady = true;
        readyForKeypress = true;
        gameArea.classList.add('green');
        startTime = Date.now();
        sounds.ready.play();
        character.classList.remove('excited');
        message.textContent = "PRESS ENTER NOW!";
    }, randomDelay);
}

// Determine the performance rating and animate character accordingly
function animateBasedOnPerformance(reactionTime) {
    // Reset all animation classes first
    character.classList.remove('happy', 'sad', 'excited', 'clapping', 'jumping', 'spinning', 'celebrating', 'amazed');
    
    // Determine which animation to play based on performance
    if (reactionTime < performanceThresholds.amazing) {
        // Amazing performance - the character spins and celebrates
        sounds.amazing.play();
        character.classList.add('amazed', 'spinning');
        setTimeout(() => {
            character.classList.remove('spinning');
            character.classList.add('celebrating');
        }, 1000);
        return "INCREDIBLE! Super human reflexes!";
    } 
    else if (reactionTime < performanceThresholds.excellent) {
        // Excellent performance - the character claps
        sounds.clap.play();
        character.classList.add('happy', 'clapping');
        return "EXCELLENT! Lightning fast reflexes!";
    } 
    else if (reactionTime < performanceThresholds.good) {
        // Good performance - the character jumps
        sounds.jump.play();
        character.classList.add('happy', 'jumping');
        return "GREAT JOB! Very quick!";
    } 
    else if (reactionTime < performanceThresholds.average) {
        // Average performance - the character is happy
        sounds.success.play();
        character.classList.add('happy');
        return "Good reaction time!";
    } 
    else {
        // Slow performance - but still show happiness for encouragement
        sounds.success.play();
        character.classList.add('happy');
        return "Keep practicing, you'll get faster!";
    }
}

// Calculate average of last 5 reaction times
function getAverageReactionTime() {
    if (reactionTimes.length === 0) return null;
    
    const sum = reactionTimes.reduce((total, time) => total + time, 0);
    return sum / reactionTimes.length;
}

// Handle keydown events
function handleKeydown(event) {
    if (!gameStarted) return;
    
    if (event.key === 'Enter') {
        if (readyForKeypress && gameReady) {
            // Successful reaction - screen is green
            const endTime = Date.now();
            const reactionTime = endTime - startTime;
            
            // Store this reaction time
            reactionTimes.push(reactionTime);
            // Keep only the last 5 times
            if (reactionTimes.length > 5) {
                reactionTimes.shift();
            }
            
            // Update UI with results
            lastResult.textContent = `${reactionTime.toFixed(3)} ms`;
            
            // Get feedback message based on performance
            const feedbackMessage = animateBasedOnPerformance(reactionTime);
            message.textContent = `${feedbackMessage} (${reactionTime.toFixed(3)} ms)`;
            
            // Check and update best time
            if (bestTime === null || reactionTime < bestTime) {
                bestTime = reactionTime;
                bestResult.textContent = `${reactionTime.toFixed(3)} ms`;
                localStorage.setItem('bestTime', reactionTime);
                
                // Special celebration for new best time
                setTimeout(() => {
                    character.classList.remove('happy', 'clapping', 'jumping', 'spinning', 'amazed');
                    character.classList.add('celebrating');
                    message.textContent += " - NEW BEST TIME! 🏆";
                }, 1500);
            }
            
            resetGame();
        } else if (gameStarted && !gameReady) {
            // Too early - screen is still red
            sounds.fail.play();
            message.textContent = "Too early! Wait for GREEN!";
            character.classList.remove('happy', 'clapping', 'jumping', 'spinning', 'celebrating', 'amazed');
            character.classList.add('sad');
            
            // Clear the timeout
            if (waitTimeout) clearTimeout(waitTimeout);
            
            resetGame();
        }
    }
}

// Reset the game
function resetGame() {
    gameStarted = false;
    gameReady = false;
    readyForKeypress = false;
    
    // Reset UI after a short delay
    setTimeout(() => {
        startButton.style.display = 'block';
        startButton.textContent = 'Try Again';
        gameArea.classList.remove('green');
    }, 1500);
    
    // Stop clapping animation after a delay
    setTimeout(() => {
        character.classList.remove('clapping', 'jumping', 'celebrating');
    }, 3000);
}

// Add bouncing animation to the character using GSAP
function animateCharacter() {
    gsap.to('.character', {
        y: -15,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
    });
}

// Initialize animations and the game
window.addEventListener('DOMContentLoaded', () => {
    animateCharacter();
    initGame();
}); 