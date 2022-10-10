const template = `
  <div id="app">
    <div id="floating-container">
    <div id="button-menu">
      <button class="btn" :class="{'btn-toggled': show === 3}" @click="show = (show === 3) ? 0 : 3">
        <i class="material-icons">format_list_numbered_rtl</i>
      </button>
      <button class="btn" :class="{'btn-toggled': show === 2}" @click="show = (show === 2) ? 0 : 2">
        <i class="material-icons">bar_chart</i>
      </button>
      <button class="btn" :class="{'btn-toggled': show === 1}" @click="show = (show === 1) ? 0 : 1">
        <i class="material-icons">menu</i>
      </button>
    </div>
    <div id="current-word" class="font-large">
      <span 
        style="position: absolute;"
      >{{ word }}</span>
      <span 
        class="last-word"
        :class="{'last-word-animated': animateLastWord}" 
        @animationend="animateLastWord = false"
      >{{ lastWord }}</span>
    </div>

      <div id="wrapper"
        @mouseup.stop="handleMouseUp($event, -1, -1)"
        @touchend.stop="handleMouseUp($event, -1, -1)"
      >
        <div id="grid-margin" 
          @mouseleave="handleMouseUp($event, -1, -1)"
        ></div>

        <div v-show="show === 1" id="menu" class="grid-container">
          <h2>Settings</h2>
            <label for="seed">Seed</label>
            <input name="seed" type="text" v-model="newGame.seed"></input>

            <label for="size">Size</label>
            <input name="size" type="number" v-model.number="newGame.size"></input>

            <label for="min-length">Minimum word length</label>
            <input name="min-length" type="number" v-model.number="newGame.minLength"></input>

            <label for="size">Duration (s)</label>
            <input name="size" type="number" step="10" v-model.number="newGame.duration"></input>

            <div style="grid-column-start: 2; justify-self: flex-end; margin-top: 0.5rem;">
            <button class="btn" style="padding: 0.25rem 0.5rem"
              @click="newGame.seed = hashCode(new Date(Date.now()).toISOString()).toString(16)"
            >
              RANDOM SEED
            </button>
            <button class="btn" style="padding: 0.25rem 0.5rem"
              @click="startNewGame"
            >
              NEW GAME
            </button>
          </div>
          
          <p>By <a href="https://tmngo.github.io">Tim Ngo</a>.</p>
        </div>

        <div v-show="show === 2" id="statistics" class="grid-container">
          <h2>Statistics</h2>
          <span>
            Most words (90 s):
          </span>
          <span>
            {{ stats.mostWords }}
          </span>
          <span>
            Best score (90 s):
          </span>
          <span>
            {{ stats.bestScore }}
          </span>
          <span>
            Longest word: 
          </span>
          <span>
            {{ stats.longestWord.toUpperCase() }}
            <span v-show="stats.longestWord.length > 0" >
              ({{ stats.longestWord.length }} letters)
            </span>
          </span>
          <span>
            Best word: 
          </span>
          <span>
            {{ stats.bestWord.toUpperCase() }}
            <span v-show="stats.bestWordPoints > 0" >
              ({{ stats.bestWordPoints }} points)
            </span>
          </span>
          <div style="margin-top: 1rem;">
            <button class="btn" style="padding: 0.25rem 0.5rem"
              @click="clearStats"
            >
              RESET
            </button>
          </div>
        </div>

        <div v-show="show === 3" id="results" class="grid-container">
          <h2>Words</h2>
          <div v-show="game.isActive" id="results-words">
            <span>WORDS FOUND: {{ wordsFound.size }}</span>
            <span>TOTAL POINTS: {{ score }}</span>
            <template v-for="w in wordsLogSorted">
              <span style="cursor: pointer; width: min-content" @click="fetchDefinition(w.word)">{{ w.word.toUpperCase() }}</span>
              <span>{{ w.points }}</span>
            </template>
          </div>
          <div v-show="!game.isActive" id="results-words">
            <span>WORDS FOUND: {{ wordsFound.size }} / {{ game.solution.length }}</span>
            <span>TOTAL POINTS: {{ score }} / {{ computePoints(game.solution.join('')) }}</span>
            <template v-for="w in game.solution">
              <span style="cursor: pointer; width: min-content" :style="{ 'font-weight': wordsFound.has(w) ? 'bold' : 'normal'}" @click="fetchDefinition(w)">{{ w.toUpperCase() }}</span>
              <span :style="{ 'font-weight': wordsFound.has(w) ? 'bold' : 'normal'}">{{ computePoints(w) }}</span>
            </template>
          </div>
        </div>

        <div v-show="show === 0" class="grid-container">
          <svg :viewBox="'-0.5 -0.5 ' + gridSize + ' ' + gridSize" id="grid-svg">
            <path :d="pathDef" stroke="#333" stroke-width="0.125" fill="none"/>
          </svg>
          <div v-for="(row, i) in gridArray" :key="'row' + i" class="grid-row">
            <div 
              v-for="(letter, j) in row" 
              :key="letter + i + j"
              class="grid-tile"
              :class="{ 'grid-tile-selected': isSelected[i][j] }"
              @mousedown="handleMouseDown($event, i, j)"
              @touchstart.prevent="handleMouseDown($event, i, j)"
              @mouseup.stop="handleMouseUp($event, i, j)"
              @touchend.stop="handleMouseUp($event, i, j)"
            >
              
              <div v-show="!loading" class="grid-tile-points font-tiny">
                {{ alphabet[letter][0] }} 
              </div>

              <div v-show="!loading"  :id="letter + i + j" class="grid-tile-hitbox font-large"
                @mouseenter.stop="handleMouseEnter($event, i, j)"
                @touchmove.stop="handleTouchMove($event)"
              >
                {{ letter }}
              </div>

            </div>
            
          </div>
        </div>
      </div>

      <div v-show="game.isActive" class="timer-bar">
        <div :class="{'timer-inner': game.isActive}" :style="timerStyle" @animationend="endGame"></div>
      </div>

      <div v-show="game.isActive" style="display: flex; justify-content: space-between; width: 100%; padding: 0.25rem 1rem;">
        <div>POINTS: {{ score }}</div>
        <div>WORDS: {{ wordsFound.size }}</div>
      </div>

      <div id="definitions">
        <div style="margin-bottom: 0.5rem; text-transform: uppercase; font-weight: bold"> {{ definedWord }} </div>
        <div v-for="p in partsOfSpeech" style="margin-bottom: 0.5rem;">
          {{ p.toUpperCase() }}: {{ definitions[p] }}.
        </div>
      </div>

    </div>

  </div>
`

let app = new Vue({
  el: '#app',
  data: {
    gridSize: 4,
    gridText: "abcd efgh ijkl lmno",
    pathDef: "",
    isPathStarted: false,
    isSelected: [],
    word: "",
    lastWord: "",
    wordPoints: 0,
    score: 0,
    wordsFound: new Set(),
    wordsLog: [],
    score: 0,
    iPrev: -1,
    jPrev: -1,
    alphabet: {
      a: [1, 9],
      b: [3, 2],
      c: [3, 2],
      d: [2, 4],
      e: [1, 12],
      f: [4, 2],
      g: [2, 3],
      h: [4, 2],
      i: [1, 9],
      j: [8, 1],
      k: [5, 1],
      l: [1, 4],
      m: [3, 2],
      n: [1, 6],
      o: [1, 8],
      p: [3, 2],
      q: [10, 1],
      r: [1, 6],
      s: [1, 4],
      t: [1, 6],
      u: [1, 4],
      v: [4, 2],
      w: [4, 2],
      x: [8, 1],
      y: [4, 2],
      z: [10, 1],
    },
    trie: null,
    definedWord: "",
    partsOfSpeech: [],
    definitions: {},
    userId: "",
    show: 0,
    game: {
      isActive: false,
      minLength: 2,
      duration: 0,
      solution: [],
    },
    newGame: {
      size: 4,
      seed: "gamma",
      minLength: 2,
      duration: 90,
    },
    stats: {
      mostWords: 0,
      bestScore: 0,
      longestWord: '',
      bestWord: '',
      bestWordPoints: 0,
    },
    loading: true,
    isTimerActive: false,
    animateLastWord: false,
    timerStyle: {
      'animation-duration': '90s',
      'animation-play-state': 'running'
    },
  },
  watch: {
    stats: {
      handler(newVal) {
        localStorage.setObject("stats", newVal)
      },
      deep: true,
    },
    longestWord(newWord) {
      localStorage.longestWord = newWord;
    }
  },
  computed: {
    gridArray() {
      return this.gridText.split(" ");
    },
    socketUrl() {
      return this.dev
        ? `ws://${location.hostname}:8000`
        : `wss://babble.fly.dev`;
    },
    wordsLogSorted() {
      return [...this.wordsLog].sort(this.compareLength);
    }
  },
  created() {
    /* Get URL parameters. */
    const urlParams = new URLSearchParams(window.location.search);
    const n = urlParams.get('n');
    const s = urlParams.get('s');
    const t = urlParams.get('t');
    this.newGame.size = n ? n : 4;
    this.newGame.seed = s ? s : this.hashCode(new Date(Date.now()).toISOString()).toString(16);
    this.newGame.duration = t ? parseInt(t) : 90;

    this.dev = urlParams.get('dev');

    /* Connect to websocket server and start new game. */
    this.connect();

    /* Reset selection array. */
    for (let i = 0; i < this.gridSize; i++) {
      let row = new Array(this.gridSize);
      for (let j = 0; j < this.gridSize; j++) {
        row[j] = false;
      }
      this.isSelected.push(row);
    }
  },
  mounted() {
    /* Load stats from local storage */
    let storedStats = localStorage.getObject("stats");
    if (storedStats) {
      this.stats = storedStats;
    }
    this.init();
  },
  methods: {
    
    /* Server connection */

    connect() {      
      this.sock = new WebSocket(this.socketUrl);

      this.sock.onopen = (e) => {
        console.log(`Connected to ${this.socketUrl}.`)
        this.sockEmit("user-connected", this.userId);
        this.startNewGame();
      }

      this.sock.onerror = (e) => {
        console.log(`Error: Unable to connect to ${this.socketUrl}.`)
      }

      this.sock.onclose = (e) => {
        console.log("Disconnected!")
        setTimeout(() => {
          console.log("Attempting to reconnect...")
          this.connect();
          this.init();
        }, 1000);
      }
      setTimeout(() => {
        this.submitting = false;
      }, 350)
    },

    init() {
      this.sock.onmessage = (event) => {
        const obj = JSON.parse(event.data);
        const msg = obj.message;
        const data = obj.data;
        console.log("IN: " + msg)
        switch (msg) {
          case "set-user-id":
            this.userId = data.id;
            break;
          case "new-game":
            this.gridText = data.grid;
            this.trie = new SuccinctTrie(data.trieData);
            break;
          case "end-game":
            this.game.solution = data.solution.sort((a, b) => this.compareLength({word: a}, {word: b}));
            break;
          case "time":
            break;
          default:
            break;
        }
        setTimeout(() => {this.loading = false}, 200)
      }
    },
    
    sockEmit(message, data) {
      console.log("OUT: " + message)
      this.sock.send(JSON.stringify({
        message: message,
        data: data,
      }));
    },


    /* Word addition */

    validateWord() {
      let isValidWord = this.trie.has(this.word) && this.word.length >= this.game.minLength;
      let isNewWord = !this.wordsFound.has(this.word)
      if (isValidWord && isNewWord) {
        console.log("Valid word.")
        this.addWord(this.word, this.wordPoints);
        this.fetchDefinition(this.word);
      } else if (isValidWord) {
        console.log("Word already found.")
      } else {
        console.log("Invalid word.")
      }
    },

    addWord(word, points) {
      this.wordsFound.add(word);
      this.wordsLog.push({ word: word, points: points });
      this.score += points;
      this.updateWordStats(word, points);
    },

    addToWord(i, j) {
      let letter = this.gridArray[i][j];
      this.word += letter;
      this.wordPoints += this.alphabet[letter][0];
      this.setCell(this.isSelected, i, j, true)
      this.iPrev = i;
      this.jPrev = j;
      this.pathDef += (this.word.length === 1 ? 'M' : 'L') + j + ',' + i;
    },

    isAdjacent(i, j) {
      if (i == this.iPrev && j == this.jPrev) {
        return false;
      }
      if (Math.abs(i - this.iPrev) < 1.5 && Math.abs(j - this.jPrev) < 1.5) {
        return true;
      }
      return false;
    },

    setCell(arr, i, j, value) {
      arr[i].splice(j, 1, value);
    },

    resetWord() {
      this.word = "";
      this.wordPoints = 0;
      this.pathDef = "";
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          this.setCell(this.isSelected, i, j, false)
        }
      }
    },

    
    /* Game state */

    startNewGame() {
      if (this.newGame.size < 3) {
        return;
      }
      this.sockEmit("new-game", this.newGame)

      /* Reset grid. */
      this.gridSize = this.newGame.size;
      for (let i = 0; i < this.gridSize; i++) {
        let row = new Array(this.gridSize);
        for (let j = 0; j < this.gridSize; j++) {
          row[j] = false;
        }
        this.isSelected.push(row);
      }

      /* Reset score. */
      this.score = 0;
      this.show = 0;
      this.wordsFound.clear();
      this.wordsLog = [];

      /* Clear definitions. */
      this.partsOfSpeech = [];
      this.definitions = {};
      this.definedWord = '';

      /* Restart timer. */
      this.game.isActive = false;
      this.game.duration = this.newGame.duration;
      this.game.minLength = this.newGame.minLength;
      this.timerStyle['animation-duration'] = this.newGame.duration + 's';
      this.timerStyle['animation-play-state'] = 'running';
      setTimeout(() => {
        console.log("Game started.")
        this.game.isActive = true
      }, 10)
      
    },

    endGame() {
      console.log("Game ended.")
      this.sockEmit("end-game", {})
      this.game.isActive = false;
      this.show = 3;
      this.updateGameStats();
    },


    /* Statistics */

    updateWordStats(word, points) {
      if (word.length > this.stats.longestWord.length) {
        this.stats.longestWord = word;
      }
      if (points > this.stats.bestWordPoints) {
        this.stats.bestWord = word;
        this.stats.bestWordPoints = points;
      }
    },

    updateGameStats() {
      if (this.game.duration !== 90) {
        return;
      }
      if (this.score > this.stats.bestScore) {
        this.stats.bestScore = this.score;
      }
      if (this.wordsFound.size > this.stats.mostWords) {
        this.stats.mostWords = this.wordsFound.size;
      }
    },

    clearStats() {
      this.stats = {
        mostWords: 0,
        bestScore: 0,
        longestWord: '',
        bestWord: '',
        bestWordPoints: 0,
      }
      localStorage.clear();
    },


    /* Definitions */

    fetchDefinition(word) {
      axios
      .get(`https://en.wiktionary.org/w/api.php?action=parse&format=json&prop=text&callback=?&origin=*&page=${word}`)
      .then(response => {
        this.definitions = {};
        this.partsOfSpeech = [];

        let wikitext = JSON.parse(response.data.substring(5, response.data.length-1));
        
        if (wikitext.error !== undefined) {
          console.log("The Wiktionary page does not exist.")
          return;
        }

        this.extractDefinition(wikitext, word);
      });
    },
    
    extractDefinition(wikitext, word) {
      let englishData = wikitext.parse.text["*"].match(/id="English"[\s\S]+/)
        
      if (englishData === null) {
        console.log("An English definition does not exist.");
        this.definedWord = word;
        this.partsOfSpeech = [word];
        this.definitions[word] = "Definition not available";
        return;
      }

      console.log("An English definition exists.")
      this.definedWord = word;

      definitionSections = englishData[0].split(/<h2>.*<\/h2>/)[0]
        .match(/<h[234]>((?:[\s\S](?!<h[234]>))+?)<\/ol>(?!<\/li>)/g);
      
      for (let i = 0; i < definitionSections.length; i++) {
        let partOfSpeech = definitionSections[i].match(/id="[\S]+"/)[0];
        partOfSpeech = partOfSpeech
          .substring(4, partOfSpeech.length - 1)
          .toLowerCase();
          
        if (partOfSpeech === "references") {
          continue;
        }
        
        let listData = definitionSections[i].match(/<ol>[\s\S]+<\/ol>/)[0];
        let firstDefinition = listData
          .match(/<li[^>]*>[\s\S]+?<\/li>/)[0]
          .replace(/<li[^>]*><\/li>/g, "")    // Remove empty list items
          .replace(/<li[^>]*>/g, "")          // Remove leading list item tag
          .replace(/<a[^<>]+?>/g, "")         // Remove links
          .match(/[\s\S]*?(?=\.|(<\/li>)|(\s?<ul>))/)[0]
          .replace(/<[^<>]+?>/g, "")          // Remove tags
          .replace(/(&#32;)/g, " ");          // Replace HTML space entity
        
        this.partsOfSpeech.push(partOfSpeech);
        this.definitions[partOfSpeech] = firstDefinition;
        if (this.partsOfSpeech.length > 2) {
          return;
        }
      }
    },
    

    /* Helpers */

    loadFile(filePath) {
      let result = null;
      let xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", filePath, false);
      xmlhttp.send();
      if (xmlhttp.status == 200) {
        result = xmlhttp.responseText;
      }
      return result;
    },

    hashCode(str) {
      let hash = 0, i, chr;
      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash > 0 ? hash : -hash;
    },

    computePoints(word) {
      let points = 0;
      for (let i = 0; i < word.length; i++) {
        points += this.alphabet[word[i]][0];
      }
      return points;
    },

    compareLength(a, b) {
      if (a.word.length === b.word.length) {
        return a.word < b.word ? -1 : 1;
      }
      return a.word.length > b.word.length ? -1 : 1;
    },


    /* Input handling */

    handleTouchMove(evt) {
      let el = document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY);
      if (!el) {
        return;
      }
      if (el.id.length === 3) {
        this.handleMouseEnter(null, parseInt(el.id[1]), parseInt(el.id[2]))
      }
    },

    handleMouseDown(evt, i, j) {
      if (this.game.isActive) {
        this.isPathStarted = true;
        this.addToWord(i, j);
      }
    },

    handleMouseUp(evt, i, j) {
      if (this.show === 0) {
        this.validateWord();
        this.isPathStarted = false;
        this.lastWord = this.word;
        this.animateLastWord = true;
        this.resetWord();
      }
    },

    handleMouseEnter(evt, i, j) {
      if (this.isPathStarted && this.isAdjacent(i, j) && !this.isSelected[i][j]) {
        this.addToWord(i, j);
      }
    },
    
  },
  template: template,
});