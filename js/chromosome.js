export const CODON_MAX_VALUE = 6;

class Chromosome {
  // Hash object can have keys: "codons", "oldCodons", "mutatedIndices"
  constructor(opts = {}) {
    this.codons = opts["codons"] || this.initRandomCodons();

    // If we mutate, old codons are saved here.
    this.oldCodons = opts["oldCodons"];
    this.mutatedIndices = opts["mutatedIndices"];
  }

  toString() {
    return this.codons.join("");
  }

  static loadFromHash(h) {
    return new Chromosome(h);
  }

  static clone(c) {
    // Use slice() to make a copy. Since codons is an array of Ints it works fine.
    let codons = c.codons.slice();
    return new Chromosome({"codons": codons});
  }

  displayAsTable() {
    let row = $('<tr>').addClass('text-monospace');
    let index = 0;
    const CHROMOSOME_GENE_SIZES = $.exposed.generations.config["array-chromosome-gene-sizes"];
    for(let geneNum = 0; geneNum < CHROMOSOME_GENE_SIZES.length; geneNum++){
      let size = CHROMOSOME_GENE_SIZES[geneNum];
      let geneTd = $('<td>');
      for (let j = index; j < index + size; j++) {
        let mutated = this.mutatedIndices && this.mutatedIndices.includes(j);
        let codonClass = mutated ? 'mutatedCodon' : '';
        geneTd.append($('<span>').addClass(codonClass).text(this.codons[j]));
      }
      row.append(geneTd);
      index += size;
    }
    return $('<table>').addClass('codon').append(row);
  }

  static numCodons() {
    return $.exposed.generations.config["array-chromosome-gene-sizes"].reduce((x, y) => x + y);
  }

  hasEliminationGene() {
    return (this.codons[Chromosome.numCodons() - 1] < CODON_MAX_VALUE);
  }

  hasDuplicationGene() {
    return (this.codons[Chromosome.numCodons() - 2] > 1);
  }

  resetDuplicationGene() {
    this.codons[Chromosome.numCodons() - 2] = 1;
  }

  resetScaleGene() {
    this.codons[Chromosome.numCodons() - 3] = 1;
  }

  initRandomCodons() {
    var c = [];
    for (var i = 0; i < Chromosome.numCodons() - 3; i++) {
      c.push(this.generateRandomCodon());
    }
    c.push(1); // Scale gene always starts at 1
    c.push(1); // Add gene always starts as 1
    c.push(6); // Subtract gene always starts as 6
    return c;
  }

  generateRandomCodon() {
    return Math.floor(Math.random() * CODON_MAX_VALUE) + 1;
  }

  calculateNumericDifference(archetypeChromosome) {
    var difference = 0;
    for (var i = 0; i < Chromosome.numCodons(); i++) {
      difference += Math.abs(this.codons[i] - archetypeChromosome.codons[i]);
    }
    return difference;
  }

  // Generates an array containing the number of codons with each degree of
  // difference. diff[0] contains the number of codons that are the same.
  // diff[1] contains the number of codons 1 different, etc.
  calculateArrayDifference(archetypeChromosome) {
    let diff = Array.from({length: CODON_MAX_VALUE}, x => 0);
    if (archetypeChromosome) {
      for (var i = 0; i < Chromosome.numCodons(); i++) {
        diff[Math.abs(this.codons[i] - archetypeChromosome.codons[i])] += 1;
      }
    }
    return diff;
  }

  // Generates a new Chromosome
  generateNewMutation() {
    let c = Chromosome.clone(this);
    c.mutate();
    return c;
  }

  // Affects this chromosome
  mutate() {
    // Use slice() to make a copy
    this.oldCodons = this.codons.slice();

    this.selectIndicesToMutate();

    // Mutate those indices
    for (let index of this.mutatedIndices) {
      if (index == Chromosome.numCodons() - 3) {
        // Scale gene can only go up or down one number
        let min = Math.max(this.codons[index] - 1, 1);
        let max = Math.min(this.codons[index] + 1, CODON_MAX_VALUE);
        console.log("min", min);
        console.log("max", max);
        // From https://stackoverflow.com/a/1527820/6996496
        this.codons[index] = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        this.codons[index] = this.generateRandomCodon();
      }
    }
  }

  // Select indices to mutate https://stackoverflow.com/a/48089/6996496
  selectIndicesToMutate() {
    let indicesToMutate = [];
    let numNeeded = $.exposed.generations.config["num-mutations"];;
    for (let i = 0; i < Chromosome.numCodons() && numNeeded > 0; i++) {
      let probability = numNeeded / (Chromosome.numCodons() - i);
      if (Math.random() < probability) {
        indicesToMutate.push(i);
        numNeeded -= 1;
      }
    }
    this.mutatedIndices = indicesToMutate;
  }
}

export default Chromosome;
