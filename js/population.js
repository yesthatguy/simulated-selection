import Individual from './individual.js';

class Population {
  constructor(individuals = null) {
    this.individuals = (individuals) ? individuals : [];
  }

  toString() {
    return this.individuals.join(" ::: ");
  }

  static loadFromHash(h) {
    let individuals = [];
    for (let individual of h["individuals"]) {
      individuals.push(Individual.loadFromHash(individual));
    }
    return new Population(individuals);
  }

  initRandom(numIndividuals) {
    var individuals = [];
    for (var i = 0; i < numIndividuals; i++) {
      individuals.push(new Individual());
    }
    this.individuals = individuals;
  }

  initRandomRange(min, max) {
    this.initRandom(this.getNumIndividuals(min, max));
  }

  getNumIndividuals(min, max) {
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
    let archetype = this.individuals[archetypeIndex];
    let fitnessScores = this.calculatePopulationFitness(archetype);
    let parentIndices = this.selectNParents(this.getNumIndividuals(min, max), fitnessScores);
    console.log("parentIndices", parentIndices);
    let newIndividuals = this.generateOffspring(parentIndices, fitnessScores);
    let newPopulation = new Population(newIndividuals);
    newPopulation.mutate();
    return newPopulation;
  }

  // This was the original computation used to calculate population fitness.
  // It has been replaced by a codon-level algorithm.
  calculatePopulationFitnessAlt(archetype) {
    let differences = [];
    for (let i = 0; i < this.individuals.length; i++) {
      differences.push(this.individuals[i].calculateNumericDifference(archetype));
    }
    console.log("differences", differences);

    // Given that the archetype will always have score = 0 and other typical
    // scores are 140+ for two chromosomes, trying an inverse log relationship.
    let initialFitness = differences.map((d) => (d == 0) ? 1 : 1 / Math.log(d));
    console.log("initialFitness", initialFitness);

    let totalFitness = initialFitness.reduce((sum, x) => sum + x);
    let normalizedFitness = initialFitness.map((f) => f / totalFitness);
    return normalizedFitness;
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
    for (let couple of parentIndices) {
      let parent1 = this.individuals[couple[0]];
      let parent2 = this.individuals[couple[1]];
      let fitness1 = fitnessScores[couple[0]];
      let fitness2 = fitnessScores[couple[1]];
      offspring.push(parent1.generateOffspring(parent2, fitness1, fitness2));
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
    var table = $('<table>').addClass('table');
    var headerRow = $('<tr>');
    if (showButtons) {
      headerRow.append($('<th>'));
    }
    headerRow.append($('<th>').attr('scope', 'col').text('#'));
    headerRow.append($('<th>').attr('scope', 'col').text('Chromosomes'));
    table.append(headerRow);

    for(var i = 0; i < this.individuals.length; i++){
        var row = $('<tr>');
        if (showButtons) {
          row.append($('<td>').append($('<input type="radio" name="selectedIndividual" value="' + i + '">')));
        }
        row.append($('<td>').attr('scope', 'row').text(i));
        row.append($('<td>').append(this.individuals[i].displayAsTable()));
        table.append(row);
    }

    let div = $('<div>')
    div.append(table);
    if (showButtons) {
      let newGenButton = $('<button>').addClass("btn btn-outline-primary").append("New Generation");
      newGenButton.click(function(event) { $.createNewGeneration() });
      div.append(newGenButton);
    }
    return div;
  }
}

export default Population;
