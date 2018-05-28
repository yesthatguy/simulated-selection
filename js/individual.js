import Chromosome from './chromosome.js';

export const INITIAL_NUM_CHROMOSOMES = 2;
export const FITNESS_SCORE_PER_EXTRA_CHROMOSOME = 95;

class Individual {
  constructor(opts = {}) {
    this.chromosomes = opts["chromosomes"] || this.initRandomChromosomes();

    this.parents = opts["parents"];
    this.eliminatedChromosomes = opts["eliminatedChromosomes"] || [];
  }

  toString() {
    return this.chromosomes.join(", ");
  }

  static loadFromHash(h) {
    let chromosomes = [];
    for (let chromosome of h["chromosomes"]) {
      chromosomes.push(Chromosome.loadFromHash(chromosome));
    }
    return new Individual(chromosomes);
  }

  displayAsTable() {
    let div = $('<div>').data('html', true);
    for (let i = 0; i < this.chromosomes.length; i++) {
      div.append(this.chromosomes[i].displayAsTable());
    }
    div.prop('title', this.getTooltipHtml()).tooltip({"delay": 300});
    return div;
  }

  getTooltipHtml() {
    let rows = [];
    if (this.parents) {
      rows.push("Parents: " + this.parents.join(" + "));
    }
    if (this.eliminatedChromosomes.length) {
      rows.push("Eliminated: " + this.eliminatedChromosomes);
    }
    return rows.length ? rows.join("<br>") : "First-gen individual";
  }

  initRandomChromosomes() {
    var c = [];
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
    let numChromosomes = Math.max(this.chromosomes.length, other.chromosomes.length);
    for (let i = 0; i < numChromosomes; i++) {
      newChromosomes.push(this.weightedSelectChromosome([this.chromosomes[i], other.chromosomes[i]], [myFitness, otherFitness]));
    }
    return new Individual({"chromosomes": newChromosomes, "parents": [this, other]});
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
          newChromosomes.push(Chromosome.clone(this.chromosomes[i]));
        }
        newChromosomes.push(this.chromosomes[i]);
      }
    }
    this.chromosomes = newChromosomes;
  }
}

export default Individual;
