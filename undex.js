// Typing Test - script.js
// Features: ALPHABET, WORD, SENTENCE modes; uppercase-only; real words; unlimited flow until time ends.

const MODE = { ALPHABET: 'alphabet', WORD: 'word', SENTENCE: 'sentence' };

const targetEl = document.getElementById('target');
const inputEl = document.getElementById('input');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeSelect = document.getElementById('mode-select');
const timeEl = document.getElementById('time');
const wpmEl = document.getElementById('wpm');
const accEl = document.getElementById('acc');
const errorsEl = document.getElementById('errors');
const typedEl = document.getElementById('typed');
const durationInput = document.getElementById('duration');

// Small real-word list (can be extended). We'll reuse words sequentially to provide unlimited typing.
const WORDS = `about above across act active add admit adult after again against age agency agent agree air all allow almost alone along already also always among amount analysis and animal another answer any anyone anything appear apply area argue arm around arrive art article artist as ask assume at attack attention attorney audience author available avoid away baby back bad bag ball bank bar base be beat beautiful because become bed before begin behavior behind believe benefit best better between beyond big bill billion bit black blood blue board body book born both box boy break bring brother budget build building business but buy by call camera campaign can cancer candidate capital car card care career carry case catch cause cell center central century certain certainly chair challenge chance change charge check child choice choose church citizen city civil claim class clear clearly close coach cold collection college color come commercial common community company compare computer concern condition conference congress consider consumer contain continue control cost could couple course court cover create crime cultural culture cup current customer cut dark data daughter day dead deal death debate decade decide decision deep defense degree Democrat democratic describe design despite detail determine develop development die difference different difficult dinner direction director discover discuss disease do doctor dog door down draw dream drive drop drug during each early east easy eat economic economy edge education effect effort eight either election else employee end energy enjoy enough enter entire environment environmental especially establish even evening event ever every everybody everyone everything evidence exactly example executive exist expect experience expert explain eye face fact factor factory fall family far fast father fear federal feel feeling few field fight figure fill film final finally financial find fine finger finish fire firm first fish five floor fly focus follow food foot for force foreign forget form former forward four free friend from front full fund future game garden gas general generation get girl give glass go goal good government great green ground group grow growth guess gun guy hair half hand hang happen happy hard have he head health hear heart heat heavy help her here herself high him himself his history hit hold home hope hospital hot hotel hour house how however huge human hundred husband I idea identify if image imagine impact important improve in include including increase indeed indicate individual industry information inside instead institution interest interesting international interview into investment involve issue it item its itself job join just keep key kid kill kind kitchen know knowledge land language large last late later laugh law lawyer lay lead leader learn least leave left leg legal less let letter level lie life light like likely line list listen little live local long look lose loss lot love low machine magazine main maintain major majority make man manage management manager many market marriage material matter may maybe me mean measure media medical meet meeting member memory mention message method middle might military million mind minute miss mission model modern moment money month more morning most mother mouth move movement movie Mr Mrs much music must my myself name nation national natural nature near nearly necessary need network never new news next nice night no none nor north not note nothing notice now number occur of off offer office officer official often oh oil ok old on once one only onto open operation opportunity option or order organization other others our out outside over own owner page pain painting paper parent part participant particular particularly partner party pass past patient pattern pay peace people per perform performance period person personal phone physical pick picture piece place plan play player PM point police policy political politics poor popular population position positive possible power practice prepare present president pressure pretty prevent price private probably problem process produce product production professional professor program progress project property protect prove provide public pull purpose push put quality question quickly quite race radio raise range rate rather reach read ready real reality realize really reason receive recent recently recognize record reduce reflect region relate relationship religious remain remember remove report represent Republican require research resource respond response responsibility rest result return reveal rich right rise risk road rock role room rule run safe said same save say scene school science score sea season seat second section security see seek seem sell send senior sense series serious serve service set seven several sex sexual shake share she shoot short shot should shoulder show side sign significant similar simple since sing single sister sit site situation six size skill skin small smile so social society soldier some somebody someone something sometimes son song soon sort sound source south southern space speak special specific speech spend sport spring staff stage stand standard star start state statement station stay step still stock stop store story strategy street strong structure student study stuff style subject success successful such suddenly suffer suggest summer support sure surface system table take talk task tax teach teacher team technology television tell ten tend term test than thank that the their them themselves then theory there these they thing think this those though thought thousand threat three through throughout throw thus time to today together tonight too top total tough toward town trade traditional training travel treat treatment tree trial trip true truth try turn TV two type under understand unit until up upon us use usually value various variously very victim view violence visit voice vote wait walk wall want war watch water way we weapon wear week weight well West western what whatever when where whether which while white who whole whom whose why wide wife will window wish with within without woman wonder word work worker world worry would write writer wrong yard yeah year yes yet you young your yourself`.split(/\s+/);

let state = {
  running: false,
  mode: MODE.WORD,
  duration: 60,
  timeLeft: 60,
  timerId: null,
  targetText: '',
  cursor: 0,
  errors: 0,
  typed: 0,
  startedAt: null
};

function pickNextChunk(mode, countWords = 10) {
  if (mode === MODE.ALPHABET) {
    // sequence of A..Z repeated
    let s = '';
    for (let i = 0; i < countWords; i++) {
      let char = String.fromCharCode(65 + (i % 26));
      s += char + (i < countWords - 1 ? ' ' : '');
    }
    return s;
  }
  if (mode === MODE.WORD) {
    // pick next `countWords` words sequentially from WORDS
    // We'll maintain an index on state.wordIndex
    state.wordIndex = state.wordIndex || 0;
    let out = [];
    for (let i = 0; i < countWords; i++) {
      out.push(WORDS[(state.wordIndex++) % WORDS.length].toUpperCase());
    }
    return out.join(' ');
  }
  // sentence mode: take a few words and make sentence-like chunks
  let words = [];
  for (let i = 0; i < Math.max(6, countWords); i++) {
    words.push(WORDS[(Math.floor(Math.random() * WORDS.length))].toUpperCase());
  }
  // simple sentence: capitalize first and add a period
  let s = words.join(' ');
  s = s[0] + s.slice(1).toUpperCase();
  return s + '. ';
}

function refillTargetIfNeeded() {
  // keep at least ~80 chars ahead
  if (state.targetText.length - state.cursor < 80) {
    let chunk = pickNextChunk(state.mode, 20);
    if (state.targetText && !state.targetText.endsWith(' ')) chunk = ' ' + chunk;
    state.targetText += chunk;
    renderTarget();
  }
}

function renderTarget() {
  // render with spans marking correct/wrong/next
  const before = state.targetText.slice(0, state.cursor);
  const current = state.targetText[state.cursor] || '';
  const after = state.targetText.slice(state.cursor + 1);

  // We also color previously-typed characters by correctness which we stored in state.typedHistory
  let html = '';
  for (let i = 0; i < state.cursor; i++) {
    const ok = state.typedHistory && state.typedHistory[i] === state.targetText[i];
    html += `<span class=\"token-${ok ? 'correct' : 'wrong'}\">${escape(state.targetText[i])}</span>`;
  }
  if (current) html += `<span class=\"token-next\">${escape(current)}</span>`;
  html += `<span class=\"token-after\">${escape(after)}</span>`;
  targetEl.innerHTML = html;
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function startTest() {
  if (state.running) return;
  state.mode = modeSelect.value;
  state.duration = Math.max(10, Math.min(600, parseInt(durationInput.value) || 60));
  state.timeLeft = state.duration;
  timeEl.textContent = state.timeLeft;
  state.running = true;
  state.startedAt = Date.now();
  state.timerId = setInterval(tick, 1000);
  startBtn.disabled = true;
  modeSelect.disabled = true;
  durationInput.disabled = true;
  inputEl.disabled = false;
  inputEl.focus();

  // reset other counters
  state.targetText = '';
  state.cursor = 0;
  state.errors = 0;
  state.typed = 0;
  state.typedHistory = [];
  state.wordIndex = 0;
  refillTargetIfNeeded();
  renderTarget();
  updateStats();
}

function resetTest() {
  clearInterval(state.timerId);
  state.running = false;
  startBtn.disabled = false;
  modeSelect.disabled = false;
  durationInput.disabled = false;
  inputEl.value = '';
  inputEl.disabled = true;
  state = Object.assign(state, { timeLeft: parseInt(durationInput.value) || 60 });
  timeEl.textContent = state.timeLeft;
  wpmEl.textContent = 0;
  accEl.textContent = 100;
  errorsEl.textContent = 0;
  typedEl.textContent = 0;
  state.targetText = '';
  state.cursor = 0;
  state.typedHistory = [];
  targetEl.textContent = '';
}

function tick() {
  state.timeLeft -= 1;
  timeEl.textContent = state.timeLeft;
  if (state.timeLeft <= 0) endTest();
  updateStats();
  refillTargetIfNeeded();
}

function endTest() {
  clearInterval(state.timerId);
  state.running = false;
  startBtn.disabled = false;
  modeSelect.disabled = false;
  durationInput.disabled = false;
  inputEl.disabled = true;
  alert(`Time up! WPM: ${calcWPM().toFixed(1)}, Accuracy: ${calcAccuracy().toFixed(1)}%`);
}

function calcWPM() {
  const minutes = (state.duration - state.timeLeft) / 60 || 1/60;
  const wordsTyped = state.typed / 5; // standard definition
  return wordsTyped / minutes;
}

function calcAccuracy() {
  if (state.typed === 0) return 100;
  return ((state.typed - state.errors) / state.typed) * 100;
}

function updateStats() {
  wpmEl.textContent = Math.max(0, Math.round(calcWPM()));
  accEl.textContent = Math.max(0, Math.round(calcAccuracy()));
  errorsEl.textContent = state.errors;
  typedEl.textContent = state.typed;
}

// main input handler
inputEl.addEventListener('input', (e) => {
  if (!state.running) {
    inputEl.value = '';
    return;
  }
  // force uppercase and remove disallowed chars
  let raw = inputEl.value.toUpperCase();
  if (raw !== inputEl.value) inputEl.value = raw;

  // find how many new chars were added (we only support appending)
  // If user pastes or moves cursor, we'll reset the input to last char typed.
  let added = raw;
  // We'll process each entered char sequentially
  let changed = false;
  for (let k = 0; k < added.length; k++) {
    const ch = added[k];
    // compare with target
    const expected = state.targetText[state.cursor] || '';
    state.typed++;
    const ok = ch === expected;
    state.typedHistory[state.cursor] = ok ? expected : ch;
    if (!ok) state.errors++;
    state.cursor++;
    changed = true;
  }
  if (changed) {
    inputEl.value = '';
    renderTarget();
    updateStats();
    refillTargetIfNeeded();
  }
});

// Prevent non-uppercase keystrokes and handle backspace correctly
inputEl.addEventListener('keydown', (e) => {
  if (!state.running) return;
  if (e.key === 'Backspace') {
    // allow a logical undo: move cursor back and adjust stats
    e.preventDefault();
    if (state.cursor === 0) return;
    state.cursor--;
    const prevTyped = state.typedHistory[state.cursor];
    if (prevTyped !== undefined) {
      state.typed++;// backspace shouldn't reduce typed for this simple implementation; we'll treat corrections as new input
    }
    renderTarget();
    updateStats();
    return;
  }
  if (e.key.length === 1) {
    // block lowercase by transforming to uppercase on input (handled on input event)
    // allow default
  }
});

startBtn.addEventListener('click', startTest);
resetBtn.addEventListener('click', resetTest);

// init
inputEl.disabled = true;
modeSelect.value = MODE.WORD;

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.running) {
    // pause when tab hidden
    clearInterval(state.timerId);
  } else if (!document.hidden && state.running) {
    state.timerId = setInterval(tick, 1000);
  }
});

// accessibility: focusable target
targetEl.tabIndex = 0;