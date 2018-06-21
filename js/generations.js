import Population from './population.js';

export const DEFAULT_CONFIG = {
  "num-individuals-min": 8,
  "num-individuals-max": 12,
  "array-num-chromosome-gene-sizes": [7,6,4,2,1,1,3,1,1,3,1,1,3,1,1,3,1,1,3,1,1,3,1,1,3,1,1,3,1,1,1,1],
  "array-chromosome-gene-colors": ["#FFD3AC", "#FFFCD7", "#D2FEFF", "#FFD9FD", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FF5249", "#6EF582", "#D2FBD7", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"],
  "num-mutations": 2,
  "num-initial-chromosomes": 2
}

class Generations {
  constructor(opts = {}) {
    this.generations = opts["generations"] || [];
    this.config = opts["config"] || Object.assign({}, DEFAULT_CONFIG);
  }

  toString() {
    return "Generations: " + this.generations.length;
  }

  // https://stackoverflow.com/questions/34034475/edit-and-save-a-file-locally-with-js
  saveAsFile(name = "generations") {
    var blob = new Blob([JSON.stringify(this)], {
      "type": "application/json"
    });
    var a = document.createElement("a");
    a.download = name;
    a.href = URL.createObjectURL(blob);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  static loadFromHash(h) {
    h["generations"] = h["generations"].map(g => Population.loadFromHash(g));
    return new Generations(h);
  }

  showInCarousel() {
    var carousel = $("#generations-carousel > .carousel-inner");
    carousel.empty();
    for (var i = 0; i < this.generations.length; i++) {
      var newDiv = $("<div>").addClass("carousel-item");
      let showButtons = false;
      if (i == this.generations.length - 1) {
        newDiv.addClass("active");
        showButtons = true;
      }
      newDiv.append($("<h2>").append("Generation " + (i + 1)));
      newDiv.append(this.generations[i].displayAsTable(showButtons));
      carousel.append(newDiv);
    }
  }

  readConfig() {
    for (const key in this.config) {
      let val = $("#" + key).val();
      if (val !== undefined) {
        if (key.startsWith("num-")) {
          val = parseInt(val);
        } else if (key.startsWith("array-num-")) {
          val = val.split(",").map(x => parseInt(x));
        } else if (key.startsWith("array-")) {
          val = val.split(",");
        }
        this.config[key] = val;
      }
    }
  }

  showConfig() {
    for (const [key, value] of Object.entries(this.config)) {
      $("#" + key).val(value);
    }
  }

  latest() {
    return this.generations[this.generations.length - 1];
  }

  getIndividual(generationIndex, individualIndex) {
    return this.generations[generationIndex].individuals[individualIndex];
  }

  initRandom(numIndividuals) {
    var pop = new Population({"generationIndex": 0});
    pop.initRandom(numIndividuals);
    this.generations = [pop];
  }

  initRandomRangeFromConfig() {
    this.initRandomRange(this.config["num-individuals-min"], this.config["num-individuals-max"]);
  }

  initRandomRange(min, max) {
    var pop = new Population({"generationIndex": 0});
    pop.initRandomRange(min, max);
    this.generations = [pop];
  }

  // archetypeIndex is integer 0-n indicating most fit individual
  createNewGeneration(archetypeIndex) {
    let min = this.config["num-individuals-min"];
    let max = this.config["num-individuals-max"];
    if (archetypeIndex === undefined) {
      $.showAlert("You must select an archetype.");
      return;
    }
    this.generations.push(this.latest().createNewGeneration(archetypeIndex, min, max));
  }
}

export default Generations;
