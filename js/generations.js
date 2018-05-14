import Population from './population.js';

class Generations {
  constructor(generations = null) {
    this.generations = (generations) ? generations : [];
  }

  toString() {
    return "Generations: " + this.generations.length;
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

  // archetypeIndex is integer 0-n indicating most fit individual
  createNewGeneration(archetypeIndex) {
    if (archetypeIndex === undefined) {
      $.showAlert("You must select an archetype.");
      return;
    }
    this.generations.push(this.latest().createNewGeneration(archetypeIndex));
  }
}

export default Generations;
