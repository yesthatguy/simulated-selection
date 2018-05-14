import Chromosome from './chromosome.js';

export const INITIAL_NUM_CHROMOSOMES = 2;
export const FITNESS_SCORE_PER_EXTRA_CHROMOSOME = 95;

class Individual {
  constructor(chromosomes = null) {
    this.chromosomes = (chromosomes) ? chromosomes : this.initRandomChromosomes();
  }

  toString() {
    return this.chromosomes.join(", ");
  }

  initRandomChromosomes() {
    var c = [];
    for (var i = 0; i < INITIAL_NUM_CHROMOSOMES; i++) {
      c.push(new Chromosome());
    }
    return c;
  }

  // Calculates difference from this individual to a defined archetype (another
  // Individual selected as the most fit). Lower difference = more fit.
  calculateDifference(archetype) {
    var difference = 0;
    for (var i = 0; i < this.chromosomes.length; i++) {
      difference += this.chromosomes[i].calculateDifference(archetype.chromosomes[i]);
    }
    difference += FITNESS_SCORE_PER_EXTRA_CHROMOSOME * Math.max(0, archetype.chromosomes.length - this.chromosomes.length);
    return difference;
  }

  generateOffspring(other, myFitness, otherFitness) {
    let newChromosomes = [];
    let numChromosomes = Math.max(this.chromosomes.length, other.chromosomes.length);
    for (let i = 0; i < numChromosomes; i++) {
      newChromosomes.push(this.weightedSelectChromosome([this.chromosomes[i], other.chromosomes[i]], [myFitness, otherFitness]));
    }
    return new Individual(newChromosomes);
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
    this.chromosomes = this.chromosomes.map((c) => c.generateNewMutation())
  }
}

export default Individual;
