import Individual from './individual.js';

class Population {
  constructor(opts = {}) {
    this.generationIndex = opts["generationIndex"];
    this.individuals = opts["individuals"] || [];
    this.archetypeIndex = opts["archetypeIndex"];
    this.sample = opts["sample"] || [];
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
    console.log("fitnessScores", fitnessScores);
    let parentIndices = this.selectNParents(this.getRandomNumIndividuals(min, max), fitnessScores);
    console.log("parentIndices", parentIndices);
    let newIndividuals = this.generateOffspring(parentIndices, fitnessScores);
    let newPopulation = new Population({"individuals": newIndividuals, "generationIndex": this.generationIndex + 1});
    newPopulation.mutate();
    newPopulation.sample = newPopulation.generateSample(archetype);
    return newPopulation;
  }

  calculatePopulationFitness(archetype) {
    let differences = [];
    let archetypeIndex;
    for (let i = 0; i < this.individuals.length; i++) {
      differences.push(this.individuals[i].calculateArrayDifference(archetype));
      if (this.individuals[i] == archetype) {
        archetypeIndex = i;
      }
    }
    //console.log("differences", differences);

    // Turn array like [24, 30, 21, 2, 4, 1] into a number like 24.5 based on
    // just the first two numbers.
    let maxD1 = Math.max(...differences.map((d) => d[1]));
    let initialFitness = differences.map((d) => d[0] + d[1] / maxD1);
    //console.log("initialFitness", initialFitness);

    // Limit max probability of archetype
    if (archetypeIndex !== undefined) {
      let nonArchetypeFitness = initialFitness.filter((x, i) => i != archetypeIndex);
      let avgFitness = nonArchetypeFitness.reduce((sum, x) => sum + x) / nonArchetypeFitness.length;
      const MAX_WEIGHT_ARCHETYPE = $.exposed.generations.config["num-max-weight-archetype"];
      initialFitness[archetypeIndex] = Math.min(initialFitness[archetypeIndex], MAX_WEIGHT_ARCHETYPE * avgFitness);
    }

    // Normalize
    let totalFitness = initialFitness.reduce((sum, x) => sum + x);
    let normalizedFitness = initialFitness.map((f) => f / totalFitness);
    //console.log("normalizedFitness", normalizedFitness);
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

  generateSampleByIndex(archetypeIndex) {
    console.log("archetypeIndex", archetypeIndex);
    return this.generateSample(this.individuals[archetypeIndex]);
  }

  generateSample(archetype) {
    let fitnessScores = this.calculatePopulationFitness(archetype);
    // https://stackoverflow.com/questions/11301438/return-index-of-greatest-value-in-an-array
    let mostFitIndex = fitnessScores.reduce((a, b, i) => a[0] < b ? [b, i] : a, [Number.MIN_VALUE, -1])[1];
    console.log("fitnessScores", fitnessScores);

    let leastFitIndex = fitnessScores.reduce((a, b, i) => a[0] > b ? [b, i] : a, [Number.MAX_VALUE, -1])[1];
    console.log("leastFitIndex", leastFitIndex);
    let leastFitFitnessScores = this.calculatePopulationFitness(this.individuals[leastFitIndex]);
    let combinedFitnessScores = leastFitFitnessScores.map((x, i) => x + fitnessScores[i]);
    let thirdIndex = combinedFitnessScores.reduce((a, b, i) => a[0] > b ? [b, i] : a, [Number.MAX_VALUE, -1])[1];
    console.log("thirdIndex", thirdIndex);
    return [mostFitIndex, leastFitIndex, thirdIndex];
  }

  decorateSample(mostFitIndex, leastFitIndex, thirdIndex) {
    this.clearDecorations();
    this.decorateRow(mostFitIndex, 'M', 'Most fit');
    this.decorateRow(leastFitIndex, 'L', 'Least fit');
    this.decorateRow(thirdIndex, 'D', 'Most different individual');
  }

  clearDecorations() {
    $('table.generation-' + this.generationIndex + ' .decorator').empty();
  }

  decorateRow(i, initial, tooltip) {
    let div = $('table.generation-' + this.generationIndex + ' tr.individual-' + i + ' td.individual-index .decorator');
    div.prop('title', tooltip);
    div.text(initial);
  }

  displayAsTable(showButtons = false) {
    let outerDiv = $('<div>').addClass("horizontal-scroll");
    var table = $('<table>').addClass('table generation-' + this.generationIndex);
    var headerRow = $('<tr>');
    if (showButtons) {
      headerRow.append($('<th>'));
    }
    headerRow.append($('<th>').attr('scope', 'col').text('#'));
    headerRow.append($('<th>').attr('scope', 'col'));
    headerRow.append($('<th>').attr('scope', 'col').text('Chromosomes'));
    table.append(headerRow);

    for(var i = 0; i < this.individuals.length; i++){
        var row = $('<tr>').addClass('individual-' + i);
        if (showButtons) {
          let radio = $('<input type="radio" name="selectedIndividual" value="' + i + '">');
          radio.click((e) => this.decorateSample(...this.generateSampleByIndex(e.target.value)));
          row.append($('<td>').append(radio));
        }
        let indexCell = $('<td>').attr('scope', 'row').addClass('individual-index');
        indexCell.append($('<div>').text(i + 1));
        indexCell.append($('<div>').addClass('decorator'));
        row.append(indexCell);

        let infoLink = $('<a>').addClass('link-like').text("ⓘ");
        let detailCell = $('<td>').attr('scope', 'row').append(infoLink);
        let showDetail = this.individuals[i].showDetail.bind(this.individuals[i]);
        detailCell.click(function(e) {
          var div = $(e.currentTarget).closest('.carousel-item').find('.individual-detail');
          div.empty();
          div.append(showDetail());
        });
        row.append(detailCell);

        let individualTd = $('<td>').addClass('individual');
        if (this.sample) {
          if (i == this.sample[0]) { individualTd.append('M::'); }
          if (i == this.sample[1]) { individualTd.append('L::'); }
          if (i == this.sample[2]) { individualTd.append('D::'); }
        }
        individualTd.append(this.individuals[i].displayAsTable());
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
