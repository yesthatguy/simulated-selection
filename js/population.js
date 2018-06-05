import Individual from './individual.js';

class Population {
  constructor(opts = {}) {
    this.generationIndex = opts["generationIndex"];
    this.individuals = opts["individuals"] || [];
    this.previousArchetypeIndex = opts["previousArchetypeIndex"];
    this.archetypeIndex = opts["archetypeIndex"];
  }

  toString() {
    return this.individuals.join(" ::: ");
  }

  static loadFromHash(h) {
    h["individuals"] = h["individuals"].map(i => Individual.loadFromHash(i));
    return new Population(h);
  }

  initRandom(numIndividuals) {
    var individuals = [];
    for (var i = 0; i < numIndividuals; i++) {
      individuals.push(new Individual({"generationIndex": this.generationIndex, "index": i}));
    }
    this.individuals = individuals;
  }

  initRandomRange(min, max) {
    this.initRandom(this.getRandomNumIndividuals(min, max));
  }

  getRandomNumIndividuals(min, max) {
    if (min > max) {
      $.showAlert("Max must be greater than min.");
      return;
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // Archetype is the individual selected from this generation which is
  // considered to be most fit.
  // archetypeIndex is integer 0-n indicating archetype's position
  createNewGeneration(archetypeIndex, min, max) {
    this.archetypeIndex = archetypeIndex;
    let archetype = this.individuals[archetypeIndex];
    archetype.isArchetype = true;
    let fitnessScores = this.calculatePopulationFitness(archetype);
    let parentIndices = this.selectNParents(this.getRandomNumIndividuals(min, max), fitnessScores);
    console.log("parentIndices", parentIndices);
    let newIndividuals = this.generateOffspring(parentIndices, fitnessScores);
    let newPopulation = new Population({"individuals": newIndividuals, "previousArchetypeIndex": archetypeIndex, "generationIndex": this.generationIndex + 1});
    newPopulation.mutate();
    return newPopulation;
  }

  calculatePopulationFitness(archetype) {
    let differences = [];
    for (let i = 0; i < this.individuals.length; i++) {
      differences.push(this.individuals[i].calculateArrayDifference(archetype));
    }
    console.log("differences", differences);

    let maxD1 = Math.max(...differences.map((d) => d[1]));
    let initialFitness = differences.map((d) => d[0] + d[1] / maxD1);
    console.log("initialFitness", initialFitness);

    let totalFitness = initialFitness.reduce((sum, x) => sum + x);
    let normalizedFitness = initialFitness.map((f) => f / totalFitness);
    return normalizedFitness;
  }

  selectNParents(n, fitnessScores) {
    let parents = [];
    for (let i = 0; i < n; i++) {
      parents.push(this.selectOneCouple(fitnessScores));
    }
    return parents;
  }

  // Selects pairs of individuals based on weighted fitness scores
  // Uses https://stackoverflow.com/a/30226926/6996496
  // Could fairly easily be adapted to choose more than 2 parents.
  // Returns indexes of the parents.
  selectOneCouple(fitnessScores) {
    let expDist = fitnessScores.map((f) => -Math.log(Math.random()) / f)

    // Select the smallest two (to adapt to more than 2, consider using
    // Quickselect as in the Stackoverflow link above)
    let index1;
    let index2;
    let value1 = Number.MAX_SAFE_INTEGER;
    let value2 = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < fitnessScores.length; i++) {
      if (expDist[i] < value1) {
        index2 = index1;
        value2 = value1;
        index1 = i;
        value1 = expDist[i];
      } else if (expDist[i] < value2) {
        index2 = i;
        value2 = expDist[i];
      }
    }

    return [index1, index2];
  }

  // Returns an array of Individuals
  generateOffspring(parentIndices, fitnessScores) {
    let offspring = [];
    for (let i = 0; i < parentIndices.length; i++) {
      let couple = parentIndices[i];
      let parent1 = this.individuals[couple[0]];
      let parent2 = this.individuals[couple[1]];
      let fitness1 = fitnessScores[couple[0]];
      let fitness2 = fitnessScores[couple[1]];
      let newIndividual = parent1.generateOffspring(parent2, fitness1, fitness2);
      newIndividual.index = i;
      offspring.push(newIndividual);
    }
    return offspring;
  }

  mutate() {
    for (let individual of this.individuals) {
      individual.mutate();
    }
    this.individuals = this.individuals.filter((i) => !i.isEmpty());
  }

  displayAsTable(showButtons = false) {
    let outerDiv = $('<div>').addClass("horizontal-scroll");
    var table = $('<table>').addClass('table');
    var headerRow = $('<tr>');
    if (showButtons) {
      headerRow.append($('<th>'));
    }
    headerRow.append($('<th>').attr('scope', 'col').text('#'));
    headerRow.append($('<th>').attr('scope', 'col'));
    headerRow.append($('<th>').attr('scope', 'col').text('Chromosomes'));
    table.append(headerRow);

    for(var i = 0; i < this.individuals.length; i++){
        var row = $('<tr>');
        if (showButtons) {
          row.append($('<td>').append($('<input type="radio" name="selectedIndividual" value="' + i + '">')));
        }
        row.append($('<td>').attr('scope', 'row').text(i));

        let detailCell = $('<td>').attr('scope', 'row').text("ⓘ");
        let showDetail = this.individuals[i].showDetail.bind(this.individuals[i]);
        detailCell.click(function(e) {
          var div = $(e.currentTarget).closest('.carousel-item').find('.individual-detail');
          div.empty();
          div.append(showDetail());
        });
        row.append(detailCell);

        let individualTd = $('<td>').append(this.individuals[i].displayAsTable());
        row.append(individualTd);
        table.append(row);
    }


    outerDiv.append(table);
    if (showButtons) {
      let newGenButton = $('<button>').addClass("btn btn-outline-primary").append("New Generation");
      newGenButton.click(function(event) { $.createNewGeneration() });
      outerDiv.append(newGenButton);
    }

    let detailDiv = $('<div>').addClass('individual-detail mt-3');
    outerDiv.append(detailDiv);

    return outerDiv;
  }
}

export default Population;
