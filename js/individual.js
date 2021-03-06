import Chromosome from './chromosome.js';

export const FITNESS_SCORE_PER_EXTRA_CHROMOSOME = 95;

class Individual {
  constructor(opts = {}) {
    this.chromosomes = opts["chromosomes"] || this.initRandomChromosomes();

    this.generationIndex = opts["generationIndex"];
    this.index = opts["index"];
    this.parentIndices = opts["parentIndices"];
    this.eliminatedChromosomes = opts["eliminatedChromosomes"] || [];
    this.isArchetype = opts["isArchetype"];
  }

  toString() {
    let prefix = (this.isArchetype) ? "(A) " : "";
    return prefix + this.chromosomes.join(", ");
  }

  static loadFromHash(h) {
    h["chromosomes"] = h["chromosomes"].map(c => Chromosome.loadFromHash(c));
    if (h["eliminatedChromosomes"]) {
      h["eliminatedChromosomes"] = h["eliminatedChromosomes"].map(c => Chromosome.loadFromHash(c));
    }
    return new Individual(h);
  }

  displayAsTable() {
    let div = $('<div>').data('html', true);
    if (this.isArchetype) {
      div.addClass('archetype');
    }
    for (let i = 0; i < this.chromosomes.length; i++) {
      div.append(this.chromosomes[i].displayAsTable());
    }
    div.prop('title', this.getTooltipHtml()).tooltip({"delay": 300});
    return div;
  }

  getTooltipHtml() {
    let rows = [];
    if (this.parentIndices) {
      rows.push("Parents: " + this.parentIndices.map((x) => x + 1).join(" + "));
    }
    if (this.eliminatedChromosomes.length) {
      rows.push("Eliminated: " + this.eliminatedChromosomes);
    }
    return rows.length ? rows.join("<br>") : "First-gen individual";
  }

  showDetail() {
    let div = $('<div>');

    let closeLink = $('<a>').addClass('link-like').text('(Hide) ');
    closeLink.click(() => div.empty());
    div.append(closeLink);

    div.append("Details for individual: " + (this.index + 1));
    div.append(this.displayAsTable());
    if (this.parentIndices) {
      div.append($('<div>').append("Parents:"));
      let table = $('<table>');
      for (let parentIndex of this.parentIndices) {
        let parent = $.exposed.generations.getIndividual(this.generationIndex - 1, parentIndex);
        let tr = $('<tr>');
        tr.append($('<td>').append(parent.index + 1));
        tr.append($('<td>').append(parent.displayAsTable()));
        table.append(tr);
      }
      div.append(table);
    }
    let detailLinksDiv = $('<div>').append("Click for chromosome detail: ");
    let detailDiv = $('<div>');
    for (let i = 0; i < this.chromosomes.length; i++) {
      let link = $('<a>').addClass('link-like').text((i + 1));
      link.click(() => this.chromosomes[i].showDetailInDiv(detailDiv));
      detailLinksDiv.append(link).append(' ');
    }
    div.append(detailLinksDiv);
    div.append(detailDiv);
    return div;
  }

  initRandomChromosomes() {
    var c = [];
    const INITIAL_NUM_CHROMOSOMES = $.exposed.generations.config["num-initial-chromosomes"];
    for (var i = 0; i < INITIAL_NUM_CHROMOSOMES; i++) {
      c.push(new Chromosome());
    }
    return c;
  }

  isEmpty() {
    return this.chromosomes.length == 0;
  }

  // Calculates difference from this individual to a defined archetype (another
  // Individual selected as the most fit). Lower difference = more fit.
  calculateNumericDifference(archetype) {
    var difference = 0;
    for (var i = 0; i < this.chromosomes.length; i++) {
      difference += this.chromosomes[i].calculateNumericDifference(archetype.chromosomes[i]);
    }
    difference += FITNESS_SCORE_PER_EXTRA_CHROMOSOME * Math.max(0, archetype.chromosomes.length - this.chromosomes.length);
    return difference;
  }

  calculateArrayDifference(archetype) {
    let diffs = this.chromosomes.map((c, i) => c.calculateArrayDifference(archetype.chromosomes[i]));
    // Element-wise sum
    return diffs.reduce((sum, x) => sum.map((j, i) => j + x[i]))
  }

  generateOffspring(other, myFitness, otherFitness) {
    let newChromosomes = [];
    let numChromosomes = this.selectOffspringNumChromosomes(other);
    for (let i = 0; i < numChromosomes; i++) {
      newChromosomes.push(this.weightedSelectChromosome([this.chromosomes[i], other.chromosomes[i]], [myFitness, otherFitness]));
    }
    return new Individual({"chromosomes": newChromosomes, "parentIndices": [this.index, other.index], "generationIndex": this.generationIndex + 1});
  }

  // If the two individuals have different numbers of chromosomes, randomly
  // choose a value in the interval between them (inclusive).
  selectOffspringNumChromosomes(other) {
    let min = Math.min(this.chromosomes.length, other.chromosomes.length);
    let max = Math.max(this.chromosomes.length, other.chromosomes.length);
    // From https://stackoverflow.com/a/1527820/6996496
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  weightedSelectChromosome(chromosomes, weights) {
    // Eliminate undefined
    let definedChromosomes = [];
    let definedWeights = [];
    for (let i = 0; i < chromosomes.length; i++) {
      if (chromosomes[i] !== undefined) {
        definedChromosomes.push(chromosomes[i]);
        definedWeights.push(weights[i]);
      }
    }

    // Pick one based on weights
    let sumWeights = definedWeights.reduce((sum, x) => sum + x);
    let scaledWeights = definedWeights.map((w) => w / sumWeights);
    let rand = Math.random();
    let cumulativeWeight = 0;
    for (let i = 0; i < definedChromosomes.length; i++) {
      cumulativeWeight += scaledWeights[i];
      if (cumulativeWeight > rand) {
        return definedChromosomes[i];
      }
    }
    console.error("Failed to pick a chromosome", chromosomes, weights);
  }

  // Modifies this individual
  mutate() {
    // Random variable mutation
    this.chromosomes = this.chromosomes.map(c => c.generateNewMutation());

    // Emergent mutation - Elimination and Duplication
    let newChromosomes = [];
    for (let i = 0; i < this.chromosomes.length; i++) {
      if (this.chromosomes[i].hasEliminationGene()) {
        this.eliminatedChromosomes.push(this.chromosomes[i]);
      } else {
        if (this.chromosomes[i].hasDuplicationGene()) {
          this.chromosomes[i].resetDuplicationGene();
          let duplicatedChromosome = Chromosome.clone(this.chromosomes[i]);
          duplicatedChromosome.resetScaleGene();
          newChromosomes.push(duplicatedChromosome);
        }
        newChromosomes.push(this.chromosomes[i]);
      }
    }
    this.chromosomes = newChromosomes;
  }
}

export default Individual;
