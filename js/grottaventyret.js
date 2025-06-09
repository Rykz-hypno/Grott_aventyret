/////////////////////////////
// sounds
/////////////////////////////

const rockSounds = [
  'ljud/sten/sten_1.mp3',
  'ljud/sten/sten_2.mp3',
  'ljud/sten/sten_3.mp3',
  'ljud/sten/sten_4.mp3',
  'ljud/sten/sten_5.mp3',
];
const flashlightOn = [
  'ljud/ficklampa/ficklampa_on.mp3',
];
const flashlightOff = [
  'ljud/ficklampa/ficklampa_off.mp3'
];
const trollsounds = [
  'ljud/troll/giggle.mp3',
  'ljud/troll/springa.mp3',
  'ljud/troll/wee_1.mp3',
  'ljud/troll/wee_2.mp3',
  'ljud/troll/wee_3.mp3',
];
const troll1up = [
  'ljud/troll/1up.mp3'
];
const ambientSounds = [
  'ljud/ambi/ambientLoop.mp3',
];

/////////////////////////////
// facts
/////////////////////////////

const gameContainer = document.getElementById('gameContainer');
const message = document.getElementById('message');
const randomFacts = [
  "Visste du att kalksten är en sedimentär bergart som bildas av döda organismer?",
  "Kalkgrottor kan vara hem för många olika djurarter!",
  "Troll är kända för att vara skygga och sällan ses av människor.",
  "Kalkgrottor kan vara mycket gamla, vissa är miljontals år gamla!",
  "Visste du att det finns över 3000 kända kalkgrottor i Sverige?",
  "Kalksten kan användas för att göra cement och glas!"
];
let trollCounter = 0;
let trollCaught = false;
let trollCurrentRock = null;
let trollJumping = false;
let trollClickable = false;
let trollNextRock = null;
let wiggleRock = null;
let wiggleTimeout = null;
let replay = false;
let snailSpeechBubble = null;
let randomFactInterval = null;
let slimeTrailInterval;
const SLIME_OFFSET_X = 0;  // justera horisontellt
const SLIME_OFFSET_Y = -25;   // justera vertikalt

/////////////////////////////
// ambient loop
/////////////////////////////

function ambientBackground() {
  const sound = new Audio(ambientSounds);
  sound.volume = 0;
  sound.loop = true;
  sound.play();

  // Fade in
  let volume = 0;
  const targetVolume = 0.2;
  const fadeDuration = 3000;
  const fadeSteps = 30;
  const stepTime = fadeDuration / fadeSteps;
  const volumeStep = targetVolume / fadeSteps;

  const fadeIn = setInterval(() => {
    if (volume < targetVolume) {
      volume += volumeStep;
      sound.volume = Math.min(volume, targetVolume);
    } else {
      clearInterval(fadeIn);
    }
  }, stepTime);
}

function initAudioOnFirstInteraction() {
  const startAudio = () => {
    ambientBackground();
    document.removeEventListener('click', startAudio);
  };
  document.addEventListener('click', startAudio);
}
initAudioOnFirstInteraction();

/////////////////////////////
// Rocks
/////////////////////////////

function createRocks() {
  gameContainer.innerHTML = '';

  const containerWidth = gameContainer.offsetWidth;
  const containerHeight = gameContainer.offsetHeight;
  const spotlightButton = document.getElementById('spotlightButton');
  const rocksData = [];    
  const rocksArr = [];

  let buttonRect = null;

  if (spotlightButton) {
    const gameRect = gameContainer.getBoundingClientRect();
    const btnRect = spotlightButton.getBoundingClientRect();
    buttonRect = {
      left: btnRect.left - gameRect.left,
      top: btnRect.top - gameRect.top,
      right: btnRect.right - gameRect.left,
      bottom: btnRect.bottom - gameRect.top    
    };   
  }
  for (let i = 0; i < 300; i++) {     
    let placed = false;
    let tries = 0;
    let size, x, y;
    while (!placed && tries < 20) {      
      size = Math.random() * 60 + 80;
      x = Math.random() * (containerWidth - size);
      y = Math.random() * (containerHeight - size);    
      
      let inButton = false;   
      if (buttonRect) {      
        if (
          x + size  > buttonRect.left &&
          x          < buttonRect.right &&
          y + size  > buttonRect.top  &&
          y          < buttonRect.bottom
        ) inButton = true;      
      }
            
      let overlap = rocksData.some(r => {   
        const dx = (x + size/2) - (r.x + r.size/2);
        const dy = (y + size/2) - (r.y + r.size/2);
        const dist = Math.hypot(dx, dy);
        return dist < (size/2 + r.size/2) * 0.92;      
      });

      if (!inButton && !overlap) {       
        rocksData.push({ x, y, size });
        placed = true;    
      }
      tries++;   
    }
    if (!placed) continue;
            
    const rock = document.createElement('div');       
    rock.classList.add('rock');
    rock.style.width  = `${size}px`;   
    rock.style.height = `${size}px`;
    rock.style.left   = `${x}px`;
    rock.style.top    = `${y}px`;
    rock.style.rotate = `${Math.random() * 360}deg`;    
    rock.hasScored = false;
    rocksArr.push(rock);

    rock.addEventListener('click', () => { 
      const sound = new Audio(rockSounds[Math.floor(Math.random() * rockSounds.length)]);
      sound.play();

      if (rock.classList.contains('disappear')) return;   

      if (rock.hasScored) return;
      rock.hasScored = true;

      const idx = rocksArr.indexOf(rock);    
      if (idx > -1) rocksArr.splice(idx, 1);      
      const cx = rock.offsetLeft + rock.offsetWidth / 2;
      const cy = rock.offsetTop  + rock.offsetHeight / 2; 

      spawnSmoke(cx, cy, gameContainer, rock.offsetWidth);
      rock.classList.add('hacked');
      rock.style.backgroundImage = "url('img/kluven_sten.png')";

      if (rock === trollNextRock && !trollCaught) {
  const troll = document.querySelector('.troll');
  const validRocks = Array.from(document.querySelectorAll('.rock'))
    .filter(r => r !== rock && r !== trollCurrentRock && r.parentElement);

  if (troll && validRocks.length > 0) {
    const newRock = validRocks[Math.floor(Math.random() * validRocks.length)];
    positionTrollOnRock(troll, newRock);
    trollCurrentRock = newRock;
    trollNextRock = newRock;
  }
}
      
const troll = document.querySelector('.troll');
if (troll && isTrollOnRock(troll, rock) && !trollCaught) {
  trollCounter++;
  const sound = new Audio(trollsounds[Math.floor(Math.random() * trollsounds.length)]);
  sound.play();
  document.getElementById('counter').textContent =`Troll hittade: ${trollCounter}`;
  const score = document.createElement('div');
  score.className = 'score-pop plus1';
  score.textContent = '+1';
  score.style.left = `${rock.offsetLeft + rock.offsetWidth / 2}px`;
  score.style.top = `${rock.offsetTop}px`;
  gameContainer.appendChild(score);

setTimeout(() => score.remove(), 1200);

        trollClickable = true;
                      

        
        if (trollCounter >= 20 || rocksArr.length === 0) {       
          trollCaught = true;
          showWinningScreen();
          return;     
        }

        let last = rock;  
        function jump(times) {     
          let next;
          do {       
            next = rocksArr[Math.floor(Math.random() * rocksArr.length)];     
          } while ((!next.parentElement || next === last) && rocksArr.length > 1);    
          trollNextRock = next;  
          positionTrollOnRock(troll, next);
          last = next;     
          if (times > 1) setTimeout(() => jump(times - 1), 420);     
        } 
        setTimeout(() => jump(trollCounter), 400);     
      }
      setTimeout(() => {       
        rock.classList.add('disappear');
        rock.style.zIndex = "1";        
      }, 300);       
     setTimeout(() => {            
      if (rock.parentElement) rock.remove();        
      }, 800);       
    });
    gameContainer.appendChild(rock);      
  }    
}

/////////////////////////////
// Check Overlap
/////////////////////////////

function isTrollOnRock(troll, rock) {
  const tRect = troll.getBoundingClientRect();
  const rRect = rock.getBoundingClientRect();
  return !( 
    rRect.right < tRect.left + tRect.width * 0.4 ||
    rRect.left > tRect.right - tRect.width * 0.4 ||
    rRect.bottom < tRect.top + tRect.height * 0.4 ||
    rRect.top > tRect.bottom - tRect.height * 0.4
  );
}

function showBubble(text, duration = 4000, callback) {
  if (!snailSpeechBubble) return;
  snailSpeechBubble.textContent = text;
  snailSpeechBubble.style.display = "block";
  snailSpeechBubble.style.left = "";
  snailSpeechBubble.style.right = "";
  snailSpeechBubble.style.transform = "";

  const snailContainer = document.querySelector(".snail-container");
  adjustSpeechBubblePosition(snailSpeechBubble, snailContainer);

  const bubbleRect = snailSpeechBubble.getBoundingClientRect();
  const snailRect = snailContainer.getBoundingClientRect();
  const snail = snailContainer.querySelector(".snail-square");
  const isFlipped = window.getComputedStyle(snail).transform.includes("-1");
  const mouthX = isFlipped
    ? snailRect.right - snailRect.width * 0.3
    : snailRect.left + snailRect.width * 0.3;

  let tailOffset = mouthX - bubbleRect.left;
  tailOffset = Math.max(0, Math.min(tailOffset, bubbleRect.width - 10));
  if (isFlipped) {
    tailOffset -= -20;
    tailOffset = Math.max(0, tailOffset);
  }
  snailSpeechBubble.style.setProperty("--tail-offset", `${tailOffset}px`);

  clearTimeout(showBubble._timeout);
  showBubble._timeout = setTimeout(() => {
    snailSpeechBubble.style.display = "none";
    if (callback) callback();
  }, duration);
}

function adjustSpeechBubblePosition(speechBubble, snailContainer) {
  const b = speechBubble.getBoundingClientRect();
  const g = gameContainer.getBoundingClientRect();
  if (b.left < g.left)  { speechBubble.style.left = '0'; speechBubble.style.transform = 'translateX(0)'; }
  if (b.right > g.right){ speechBubble.style.left = 'auto'; speechBubble.style.right = '0'; speechBubble.style.transform = 'translateX(0)'; }
}

/////////////////////////////
// Snail
/////////////////////////////

function initSnail() {
  const oldSnail = document.querySelector('.snail-container');
  if (oldSnail) oldSnail.remove();

  const snailContainer = document.createElement('div');
  snailContainer.classList.add('snail-container');
  gameContainer.appendChild(snailContainer);

  const snail = document.createElement('div');
  snail.classList.add('snail-square');
  snailContainer.appendChild(snail);

  snailSpeechBubble = document.createElement('div');
  snailSpeechBubble.classList.add('snail-speech-bubble');
  snailSpeechBubble.style.display = 'none';
  snailContainer.appendChild(snailSpeechBubble);

  const hasBeatenGame = localStorage.getItem('hasBeatenGame') === 'true';

  if (!replay) {
    setTimeout(() => {
      snailContainer.style.display = 'block';
      snailContainer.style.left = '100%';

      const screenWidth = window.innerWidth;
      const startLeft = screenWidth;
      const endLeft = 20;
      const distance = startLeft - endLeft;
      const speed = 800;
      const duration = distance / speed;

      snailContainer.style.animation = `snailSlideIn ${duration}s ease-out forwards`;
      snailContainer.classList.add('snail-enter');

      const slimeTrailInterval = spawnSlimeTrail(snailContainer);

      snailContainer.addEventListener('animationend', () => {
        clearInterval(slimeTrailInterval);
        snail.style.transform = 'scaleX(-1)';
      });

      setTimeout(() => {
        snail.style.transform = 'scaleX(-1)';
        showBubble(
          "Hej! Jag heter Gary och jag är den hjälpsamma snabba snigeln!",
          5000,
          () => {
            setTimeout(() => {
              showBubble(
                "Vill du hjälpa mig hitta min kompis Trollis? Om du behöver lite hjälp så tryck på ficklampan",
                5000,
                () => {
                  showBubble(
                    "Han är någonstans i denna kalkgrotta, förstör en sten genom att klicka på den",
                    4000,
                    () => {
                      setTimeout(startRandomFacts, 2000);
                    }
                  );
                }
              );
            }, 2000);
          }
        );
      }, 4000);
    }, 2000);
  } else {
    snailContainer.style.display = 'block';
    snailContainer.style.left = '0';
    snail.style.transform = 'scaleX(-1)';
    snailContainer.classList.add('snail-wiggle');
    replay = false;
    setTimeout(() => {
      showBubble(randomFacts[Math.floor(Math.random() * randomFacts.length)], 6000, startRandomFacts);
    }, 1000);
  }
}


function spawnSlimeTrail(snailContainer) {
  return setInterval(() => {
  if (!snailContainer || !snailContainer.parentElement) return;

  const snailRect = snailContainer.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const x = snailRect.left - containerRect.left + snailRect.width / 2 + SLIME_OFFSET_X;
const y = snailRect.top - containerRect.top + snailRect.height + SLIME_OFFSET_Y;

  const slime = document.createElement('div');
  slime.className = 'snail-slime';

  slime.style.left = `${x + (Math.random() * 4 - 2)}px`;
  slime.style.top = `${y}px`;
  slime.style.width = `${28 + Math.random() * 10}px`;
slime.style.height = `${12 + Math.random() * 5}px`;
slime.style.transform = `rotate(${Math.random() * 20 - 10}deg)`;

slime.style.background = `radial-gradient(ellipse at 50% 50%,
  rgba(0, ${200 + Math.floor(Math.random() * 55)}, ${100 + Math.floor(Math.random() * 50)}, 0.5),
  rgba(0, ${120 + Math.floor(Math.random() * 40)}, 64, 0.35), transparent)`;

  gameContainer.appendChild(slime);

  setTimeout(() => slime.remove(), 1200);
}, 10);
}

/////////////////////////////
// Troll
/////////////////////////////

function createTroll() {
  if (!gameContainer) return;

  const oldTroll = document.querySelector('.troll');
  if (oldTroll) oldTroll.remove();
    
  const rocks = gameContainer.querySelectorAll('.rock');
  if (rocks.length === 0) return;

  let rock = rocks[Math.floor(Math.random() * rocks.length)];
  trollCurrentRock = rock;
       
  const size = Math.random() * 30 + 20;
  const troll = document.createElement('div');    
  troll.classList.add('troll');
  troll.style.width = `${size}px`;
  troll.style.height = `${size}px`;

  positionTrollOnRock(troll, rock, size);
  gameContainer.appendChild(troll);

troll.addEventListener('click', () => {

  const sound = new Audio(troll1up); sound.play();

  if (trollCaught || trollJumping || !trollClickable) return;

  trollClickable = false; // stäng av klickmöjlighet tills nästa avslöjning
  trollJumping = true;

  trollCounter += 2;
  document.getElementById('counter').textContent = `Troll hittade: ${trollCounter}`;

  const score = document.createElement('div');
  score.className = 'score-pop plus2';
  score.textContent = '+2';
  score.style.left = `${troll.offsetLeft + troll.offsetWidth / 2}px`;
  score.style.top = `${troll.offsetTop}px`;
  gameContainer.appendChild(score);
  setTimeout(() => score.remove(), 1200);

  const validRocks = Array.from(document.querySelectorAll('.rock'))
    .filter(r => r !== trollCurrentRock && r.parentElement);

  if (validRocks.length === 0) {
    trollJumping = false;
    return;
  }

  const nextRock = validRocks[Math.floor(Math.random() * validRocks.length)];
  trollNextRock = nextRock; // 🔁 Spara nästa destination
  positionTrollOnRock(troll, nextRock);
  trollCurrentRock = nextRock;

  troll.classList.add('troll-pop');
  setTimeout(() => troll.classList.remove('troll-pop'), 400);

  setTimeout(() => {
    trollJumping = false;
  }, 2000);

  if (trollCounter >= 20) {
    trollCaught = true;
    setTimeout(showWinningScreen, 1000);
  }
});
}

/////////////////////////////
// Position Troll On Rock
/////////////////////////////

function positionTrollOnRock(troll, rock) {
  stopRockWiggle();

  troll.style.zIndex = "1";
  rock.style.zIndex = "2";

  const rockWidth = rock.offsetWidth;
  const rockHeight = rock.offsetHeight;
  const trollWidth = rockWidth * 0.8;
  const trollHeight = rockHeight * 0.8;

  troll.style.width = `${trollWidth}px`;
  troll.style.height = `${trollHeight}px`;

  const rockLeft = rock.offsetLeft;
  const rockTop = rock.offsetTop;
  const offsetX = (rockWidth - trollWidth) / 2 + (Math.random() - 0.5) * (rockWidth - trollWidth) / 6;
  const offsetY = (rockHeight - trollHeight) / 2 + (Math.random() - 0.5) * (rockHeight - trollHeight) / 6;

  troll.style.left = `${rockLeft + offsetX}px`;
  troll.style.top = `${rockTop + offsetY}px`;

  wiggleRock = rock;

  startRockWiggle(rock);
}

/////////////////////////////
// Rock Wiggle
/////////////////////////////

function startRockWiggle(rock) {
  if (!rock) return;
  if (wiggleTimeout) clearTimeout(wiggleTimeout);

  rock.classList.add('wiggle');

  const wiggleDuration = Math.random() * 1000 + 1000;
  wiggleTimeout = setTimeout(() => {
    rock.classList.remove('wiggle');

    const nextDelay = Math.random() * 4000 + 2000;
    wiggleTimeout = setTimeout(() => {     
      startRockWiggle(rock);
    }, nextDelay);
  }, wiggleDuration);
}

function stopRockWiggle() {
    if (wiggleTimeout) clearTimeout(wiggleTimeout);
    if (wiggleRock) wiggleRock.classList.remove('wiggle');
}

/////////////////////////////
// Smoke Effect
/////////////////////////////

function spawnSmoke(x, y, parent, rockSize = 100) {
  const smokeCount = 12 + Math.floor(Math.random() * 5); 
  for (let i = 0; i < smokeCount; i++) {  
    const s = document.createElement('div');
    s.className = 'rock-smoke';

    // Random chunk particles
    const isChunk = Math.random() < 0.25;
    const size = isChunk ? rockSize * (0.22 + Math.random() * 0.15) : rockSize * (0.44 + Math.random() * 0.5);
    s.style.background = isChunk
      ? "radial-gradient(circle at 48% 55%, #a85e16 60%, #784616 100%)"
      : "radial-gradient(circle at 48% 60%, #f7c873 50%, #e29c42 75%, #ad6921 100%)";
 
      const angle = Math.random() * Math.PI * 2;
      const distance = rockSize * (0.29 + Math.random() * 0.5);

      s.style.left = `${x - size / 2}px`;
      s.style.top = `${y - size / 2}px`;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.opacity = 0.78 + Math.random() * 0.16;

      parent.appendChild(s);

      setTimeout(() => { 
        s.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px) scale(${0.7 + Math.random() * 0.7})`;
        s.style.opacity = 0; 
      }, 10 + i*16);

      setTimeout(() => {     
        s.remove();
      }, 640 + i*20);
  }
}

/////////////////////////////
// Winning Screen
/////////////////////////////

function showWinningScreen() {

  stopAllTimers();
  const troll = document.querySelector('.troll');
  if (troll) troll.remove();

  const snail = document.querySelector('.snail-container');
  if (snail) snail.remove();

  const lastStone = document.querySelector('.rock.hacked');
  if (lastStone) lastStone.remove();

  const spotlight = document.getElementById('spotlight');
  if (spotlight) {
    spotlight.classList.remove('visible');
    spotlight.style.animation = '';
    spotlightRunning = false;
  }
  if (randomFactInterval) clearTimeout(randomFactInterval);

  document.querySelectorAll('.speech-bubble').forEach(bubble => bubble.remove());
  document.querySelectorAll('.snail-speech-bubble').forEach(bubble => bubble.remove());
  const messageBox = document.getElementById('message');
  if (messageBox) messageBox.style.display = "none";

  const overlay = document.createElement('div');
  overlay.classList.add('winning-overlay');
  overlay.innerHTML = `
    <div class="winning-screen winning-background">
      <div class="winning-content">
        <h1>Grattis!</h1>
        <p>Du har vunnit spelet!</p>
        <div class="winning-buttons">
          <button id="restartBtn">Spela igen</button>
          <button id="menuBtn">Återgå till meny</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('restartBtn').addEventListener('click', () => {
    replay = true;
    overlay.remove();
    resetGame();
  });

  document.getElementById('menuBtn').addEventListener('click', () => {
    window.location.href = "gamemeny.html";
  });
}

/////////////////////////////
// Reset Game
/////////////////////////////

function resetGame() {
  trollCounter = 0;
  trollCaught = false;
  stopAllTimers();
  document.getElementById('counter').textContent = 'Troll hittade: 0';
  clearTimeout(wiggleTimeout);
  clearTimeout(showBubble._timeout);
  if (snailSpeechBubble) snailSpeechBubble.style.display = "none";
  if (randomFactInterval) clearTimeout(randomFactInterval);
  createRocks();
  createTroll();
  initSnail();
}

function showRandomFact() {
    const i = Math.floor(Math.random() * randomFacts.length);
    showBubble(randomFacts[i], 6000);
  }

function startRandomFacts() {
  if (randomFactInterval) clearTimeout(randomFactInterval);

  function showAndSchedule() {
    // Förhindra att vi försöker köra om snailSpeechBubble är borta
    if (!snailSpeechBubble || !snailSpeechBubble.parentElement) return;

    showBubble(
      randomFacts[Math.floor(Math.random() * randomFacts.length)],
      7000,
      () => {
        randomFactInterval = setTimeout(showAndSchedule, Math.random() * 2000 + 3000);
      }
    );
  }

  showAndSchedule();
}
function redrawGame() {
    createRocks();
    createTroll();
    initSnail();
}      

createRocks(); 
createTroll(); 
initSnail();
        
        
const blackoutCurtain = document.getElementById('blackoutCurtain');

setTimeout(() => {
  blackoutCurtain.classList.add('fade-out');         
  setTimeout(() => blackoutCurtain.style.display = 'none', 2000);   
}, 1000);

/////////////////////////////
// Spotlight
/////////////////////////////

const spotlightButton = document.getElementById('spotlightButton');
const spotlight = document.getElementById('spotlight');

let spotlightRunning = false;

spotlightButton.addEventListener('click', () => {

const sound = new Audio(flashlightOn); sound.play();

  if (spotlightRunning) return;     
  spotlightRunning = true;
        
  const troll = document.querySelector('.troll');       
  if (!troll) {       
    spotlightRunning = false;
      return;
  }

  //Center
  const r = troll.getBoundingClientRect();
  spotlight.style.left = `${r.left + r.width/2}px`;
  spotlight.style.top  = `${r.top  + r.height/2}px`;

   spotlight.style.animation = 'infinityMotion 5s linear infinite';
   spotlight.classList.add('visible');

   setTimeout(() => {           
    spotlight.classList.remove('visible');
    const sound = new Audio(flashlightOff); sound.play();
    setTimeout(() => {            
      spotlight.style.animation = '';
      spotlightRunning = false;          
    }, 500);     
  }, 5000);    
});
            
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(redrawGame, 200);
});

function stopAllTimers() {
  clearTimeout(wiggleTimeout);
  clearTimeout(showBubble._timeout);
  clearTimeout(randomFactInterval);
  randomFactInterval = null;
}