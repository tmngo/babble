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

          <label for="size">Duration (min)</label>
          <input name="size" type="number" step="1" v-model.number="duration"></input>

          <div style="grid-column-start: 2; justify-self: flex-end; margin-top: 0.5rem;">
          <button class="btn" style="padding: 0.25rem 0.5rem"
            @click="startNewGame"
          >
            NEW GAME
          </button>
        </div>
        
        <p>By <a href="https://timmngo.github.io">Tim Ngo</a>.</p>
      </div>

      <div v-show="show === 2" id="statistics" class="grid-container">
        <h2>Statistics</h2>
        <span>
          Longest word: 
        </span>
        <span>
          {{ longestWord.toUpperCase() }}
        </span>
        <span>
          Highest scoring word: 
        </span>
        <span>
          {{ longestWord.toUpperCase() }}
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
        <div id="results-words">
          <template v-for="w in wordsLogSorted">
            <span>{{ w.word.toUpperCase() }}</span>
            <span>{{ w.points }}</span>
          </template>
        </div>
        <div style="margin-top: 1rem;">
          <button class="btn" style="padding: 0.25rem 0.5rem"
            @click="clearStats"
          >
            RESET
          </button>
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

    <div class="timer-bar">
      <div :class="{'timer-inner': isTimerActive}" :style="timerStyle" @animationend="isTimerActive = false"></div>
    </div>

    <div style="display: flex; justify-content: space-between; width: 100%; padding: 0.25rem 1rem;">
      <div>POINTS: {{ score }}</div>
      <div>WORDS: {{ wordsFound.size }}</div>
    </div>

    <div style="padding: 0.25rem 1rem; display: flex; justify-content: space-between; width: 100%;">

      <!--<div class="word-log-container">
        <div class="word-log">  
          <div v-for="w in wordsLog" class="grid-row" style="justify-content: flex-start">
            {{ w.word }} ({{ w.points }})
          </div>
        </div>
      </div>-->

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
    gridSize: 5,
    grids: [
      "sluz atdf epul hccs",
      "pier eciz aepa gteg",
      "itoi webk knea tanz"
    ],
    gridText: "xxxx xxxx xxxx xxxx",
    dictText: "",
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
    dictionaries: [
      {
        "slut":1,"slat":1,"slate":1,"slae":1,"slap":1,"sal":1,"salut":1,"salute":1,"salt":1,"saltus":1,"sat":1,"sate":1,"sae":1,"sap":1,"st":1,"stud":1,"stap":1,"staph":1,"steal":1,"step":1,"stupa":1,"stupe":1,"luz":1,"lute":1,"lutea":1,"lud":1,"la":1,"las":1,"last":1,"lat":1,"lats":1,"latu":1,"late":1,"latus":1,"lap":1,"ut":1,"uts":1,"uta":1,"utas":1,"ute":1,"utu":1,"utus":1,"as":1,"al":1,"als":1,"alu":1,"alt":1,"alts":1,"at":1,"ats":1,"ate":1,"ae":1,"apt":1,"apts":1,"ape":1,"ta":1,"tas":1,"tae":1,"tap":1,"tape":1,"tapu":1,"tapus":1,"te":1,"tea":1,"teas":1,"teal":1,"teals":1,"tepa":1,"tepas":1,"tepal":1,"tepals":1,"tec":1,"tech":1,"tup":1,"dufus":1,"dup":1,"dupe":1,"duce":1,"futsal":1,"fud":1,"fusc":1,"flu":1,"flute":1,"flus":1,"ea":1,"eas":1,"east":1,"eat":1,"eats":1,"et":1,"eta":1,"etas":1,"eh":1,"ecu":1,"ecus":1,"ech":1,"pa":1,"pas":1,"past":1,"paste":1,"pal":1,"pals":1,"pat":1,"pats":1,"patu":1,"pate":1,"patus":1,"pe":1,"pea":1,"peas":1,"peal":1,"peals":1,"peat":1,"peats":1,"pet":1,"pets":1,"petal":1,"petals":1,"peh":1,"pec":1,"pech":1,"put":1,"puts":1,"puteal":1,"puteals":1,"pud":1,"pudu":1,"pul":1,"puls":1,"puce":1,"pus":1,"up":1,"upas":1,"upta":1,"us":1,"luteal":1,"luce":1,"he":1,"heast":1,"heal":1,"heals":1,"heald":1,"heat":1,"heats":1,"heap":1,"het":1,"hets":1,"hep":1,"hept":1,"ceas":1,"cep":1,"cut":1,"cuts":1,"cutlas":1,"cute":1,"cud":1,"cup":1,"ch":1,"che":1,"cheat":1,"cheats":1,"cheap":1,"sud":1,"sup":1,"supe":1,"such":1,"sluts":1,"scut":1,"scuts":1,"scuta":1,"scutal":1,"scute":1,"scud":1,"scup":1,"scul":1
      },
      {
        "pi":1,"pie":1,"pier":1,"piece":1,"piecer":1,"pic":1,"pice":1,"pica":1,"pe":1,"pec":1,"pea":1,"peace":1,"peag":1,"peage":1,"peat":1,"pee":1,"peece":1,"peep":1,"peepe":1,"ice":1,"icer":1,"icier":1,"er":1,"eric":1,"erica":1,"re":1,"rei":1,"rec":1,"recipe":1,"receipt":1,"recept":1,"rez":1,"rice":1,"riz":1,"riza":1,"rip":1,"ripe":1,"ript":1,"ria":1,"epic":1,"epicier":1,"ea":1,"eat":1,"ee":1,"ceria":1,"cep":1,"cee":1,"cire":1,"cag":1,"cage":1,"cat":1,"cate":1,"cepage":1,"cepe":1,"cete":1,"ire":1,"ze":1,"zip":1,"za":1,"zaire":1,"zap":1,"zag":1,"ae":1,"aecia":1,"ace":1,"acer":1,"ag":1,"age":1,"agee":1,"at":1,"ate":1,"et":1,"eta":1,"pir":1,"pize":1,"piet":1,"pieta":1,"pia":1,"peize":1,"peg":1,"pet":1,"pa":1,"pair":1,"paire":1,"page":1,"peaze":1,"ai":1,"air":1,"apiece":1,"ape":1,"apt":1,"gae":1,"gat":1,"gate":1,"gee":1,"geep":1,"geat":1,"get":1,"geta":1,"ta":1,"tae":1,"tace":1,"tag":1,"te":1,"tee":1,"tec":1,"tea":1,"tepa":1,"teg":1,"tepee":1,"teaze":1,"epee":1,"etage":1,"gair":1,"gaze":1,"gazer":1,"gazier":1,"gap":1,"gapier":1,"gape":1
      },
      {
        "it":1,"ti":1,"tie":1,"to":1,"toe":1,"toke":1,"token":1,"twee":1,"tween":1,"te":1,"tew":1,"ten":1,"tene":1,"tent":1,"tenne":1,"tee":1,"teek":1,"teen":1,"oi":1,"oik":1,"oe":1,"ob":1,"obi":1,"obe":1,"oba":1,"ok":1,"oke":1,"oka":1,"io":1,"ikebana":1,"ikan":1,"wit":1,"wite":1,"we":1,"wet":1,"web":1,"weka":1,"wen":1,"went":1,"wena":1,"wee":1,"week":1,"ween":1,"et":1,"ew":1,"ewt":1,"ewk":1,"en":1,"ene":1,"ee":1,"eek":1,"een":1,"bo":1,"bot":1,"bote":1,"boi":1,"boet":1,"bok":1,"boke":1,"bi":1,"bio":1,"bike":1,"be":1,"bet":1,"betoken":1,"ben":1,"bene":1,"bent":1,"benne":1,"bee":1,"been":1,"beet":1,"benet":1,"beak":1,"bean":1,"beat":1,"bennet":1,"bez":1,"ba":1,"bake":1,"baken":1,"bae":1,"ban":1,"bannet":1,"bane":1,"banak":1,"ko":1,"koi":1,"kob":1,"koban":1,"ki":1,"kibe":1,"kibei":1,"keet":1,"keek":1,"keen":1,"keb":1,"ken":1,"kent":1,"kea":1,"kennet":1,"ka":1,"kab":1,"kae":1,"kane":1,"kana":1,"kanae":1,"ket":1,"keto":1,"knew":1,"knee":1,"kanban":1,"kant":1,"kat":1,"ne":1,"net":1,"new":1,"newt":1,"neb":1,"nebek":1,"nek":1,"nee":1,"neat":1,"na":1,"nae":1,"nat":1,"nan":1,"nane":1,"nana":1,"eew":1,"enew":1,"ea":1,"ean":1,"eat":1,"ab":1,"abo":1,"abet":1,"ake":1,"akee":1,"akene":1,"akeake":1,"ae":1,"an":1,"ann":1,"anna":1,"annat":1,"ane":1,"anent":1,"ana":1,"anan":1,"ananke":1,"ta":1,"tak":1,"take":1,"taken":1,"tan":1,"tane":1,"tank":1,"tanna":1,"tae":1,"tana":1,"anew":1,"ant":1,"at":1,"nene":1,"nab":1,"nabe":1,"nabk":1,"naze":1,"ze":1,"zee":1,"zek":1,"zen":1,"zenana":1,"zea":1,"za":1
      },
    ],
    dictionary: null,
    trie: null,
    definedWord: "",
    partsOfSpeech: [],
    definitions: {},
    roomName: "",
    userId: "",
    longestWord: '',
    show: 0,
    newGame: {
      size: 5,
      seed: "gamma",
      minLength: 2,
    },
    loading: true,
    duration: 1,
    isTimerActive: false,
    animateLastWord: false,
    timerStyle: {
      'animation-duration': '10s',
      'animation-play-state': 'running'
    },
  },
  watch: {
    longestWord(newWord) {
      localStorage.longestWord = newWord;
    }
  },
  computed: {
    gridArray() {
      return this.gridText.split(" ");
    },
    dict() {
      return this.dictText.split(/\s\n/)
    },
    socketUrl() {
      return `ws://babblegame.herokuapp.com`;
      // return "ws://" + location.host + "/" + this.roomName;
    },
    roomUrl() {
      return "http://" + location.host + "/" + this.roomName;
    },
    wordsLogSorted() {
      return [...this.wordsLog].sort((a, b) => {
        if (a.word.length === b.word.length) {
          return a.word < b.word ? -1 : 1;
        }
        return a.word.length > b.word.length ? -1 : 1;
      });
    }
  },
  created() {
    this.dictionary = this.dictionaries[1];
    /* Get URL parameters. */
    const urlParams = new URLSearchParams(window.location.search);
    const n = urlParams.get('n');
    const seed = urlParams.get('seed');
    this.newGame.size = n ?  n : 4;
    this.newGame.seed = seed ? seed : this.hashCode(new Date(Date.now()).toISOString()).toString(16);

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
    // this.dictText = this.loadFile("./dict.txt")
    if (localStorage.longestWord) {
      this.longestWord = localStorage.longestWord;
    }
    this.init();
  },
  methods: {
    connect() {
      // this.roomName = location.href.substr(location.href.lastIndexOf('/') + 1);
      // if (this.roomName !== "") {
      //   window.document.title = "Set | " + this.roomName;
      // }

      if (["127.0.0.1", "10.0.0.233"].includes(location.hostname)) {
        // Development
        console.log("Connecting to development web socket server.")
        this.sock = new WebSocket(this.socketUrl);
        // this.sock = new WebSocket(`ws://${location.hostname}:8000`);
      } else {
        // Production
        console.log("Connecting to production web socket server.")
        this.sock = new WebSocket(this.socketUrl);
      }
      
      this.sock.onopen = (e) => {
        console.log("Connected!")
        this.sockEmit("user-connected", this.userId);
        this.startNewGame();
      }

      this.sock.onerror = (e) => {
        console.log("Error: Unable to connect.")
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
            console.log(`User ID set to [${data.id}]`)
            break;
          case "new-game":
            this.gridText = data.grid;
            this.dictionary = data.dictionary;
            this.trieData = data.trieData;
            this.trie = new SuccinctTrie(this.trieData);
            break;
          case "time":
            // console.log(data)
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
      this.isTimerActive = false;
      this.timerStyle['animation-duration'] = 60 * this.duration + 's';
      this.timerStyle['animation-play-state'] = 'running';
      setTimeout(() => {
        console.log(this.isTimerActive); 
        this.isTimerActive = true
      }, 10)
      
    },

    endGame() {

    },

    hashCode(str) {
      let hash = 0, i, chr;
      for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash > 0 ? hash : -hash;
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
    handleMouseEnter(evt, i, j) {
      if (!this.isPathStarted || !this.isAdjacent(i, j) || this.isSelected[i][j]) {
        return;
      }
      this.addToWord(i, j);
    },
    handleMouseDown(evt, i, j) {
      this.isPathStarted = true;
      this.addToWord(i, j);
    },
    handleMouseUp(evt, i, j) {
      if (this.word.length > 1) {
        let isValidWord = this.trie.has(this.word);
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
        this.isPathStarted = false;
        this.lastWord = this.word;
        this.animateLastWord = true;
        this.resetWord();
      }
    },
    addWord(word, points) {
      this.wordsFound.add(word);
      this.wordsLog.push({ word: word, points: points });
      this.score += points;

      let isLonger = this.longestWord.length < word.length;
      if (isLonger) {
        this.longestWord = word;
      }
    },
    handleTouchMove(evt) {
      let el = document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY);
      if (!el) {
        return;
      }
      console.log(el.id);
      if (el.id.length === 3) {
        this.handleMouseEnter(null, parseInt(el.id[1]), parseInt(el.id[2]))
      }
    },
    clearStats() {
      this.longestWord = '';
      localStorage.clear();
    },
  },
  template: template,
});