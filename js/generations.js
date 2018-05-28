import Population from './population.js';

class Generations {
  constructor(opts = {}) {
    this.generations = opts["generations"] || [];
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

  latest() {
    return this.generations[this.generations.length - 1];
  }

  initRandom(numIndividuals) {
    var pop = new Population();
    pop.initRandom(numIndividuals);
    this.generations = [pop];
  }

  initRandomRange(min, max) {
    var pop = new Population();
    pop.initRandomRange(min, max);
    this.generations = [pop];
  }

  // archetypeIndex is integer 0-n indicating most fit individual
  createNewGeneration(archetypeIndex, min, max) {
    if (archetypeIndex === undefined) {
      $.showAlert("You must select an archetype.");
      return;
    }
    this.generations.push(this.latest().createNewGeneration(archetypeIndex, min, max));
  }
}

export default Generations;
