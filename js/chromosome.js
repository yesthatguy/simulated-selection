export const CODON_MAX_VALUE = 6;
export const CHROMOSOME_GENE_SIZES = [4, 1, 3, 1, 4, 1, 2, 3, 1, 1, 1];
export const CHROMOSOME_NUM_CODONS = CHROMOSOME_GENE_SIZES.reduce((x, y) => x + y);
export const NUM_MUTATIONS = 2;

class Chromosome {
  constructor(codons = null) {
    // Use slice() to make a copy. Since codons is an array of Ints it works fine.
    this.codons = (codons) ? codons.slice() : this.initRandomCodons();

    // If we mutate, old codons are saved here.
    this.oldCodons = undefined;
  }

  toString() {
    return this.codons.join("");
  }

  displayAsTable() {
    let row = $('<tr>');
    let index = 0;
    for(var geneNum = 0; geneNum < CHROMOSOME_GENE_SIZES.length; geneNum++){
      let size = CHROMOSOME_GENE_SIZES[geneNum];
      let gene = this.codons.slice(index, index + size);
      row.append($('<td>').addClass('text-monospace').text(gene.join("")));
      index += size;
    }
    return $('<table>').addClass('codon').append(row);
  }



  clone() {
    return new Chromosome(this.codons);
  }

  initRandomCodons() {
    var c = [];
    for (var i = 0; i < CHROMOSOME_NUM_CODONS; i++) {
      c.push(this.generateRandomCodon());
    }
    return c;
  }

  generateRandomCodon() {
    return Math.floor(Math.random() * CODON_MAX_VALUE) + 1;
  }

  calculateDifference(archetypeChromosome) {
    var difference = 0;
    for (var i = 0; i < CHROMOSOME_NUM_CODONS; i++) {
      difference += Math.abs(this.codons[i] - archetypeChromosome.codons[i]);
    }
    return difference;
  }

  // Generates a new Chromosome
  generateNewMutation() {
    let c = this.clone();
    c.mutate();
    return c;
  }

  // Affects this chromosome
  mutate() {
    // Use slice() to make a copy
    this.oldCodons = this.codons.slice();

    let indicesToMutate = this.selectIndicesToMutate();

    // Mutate those indices
    for (let index of indicesToMutate) {
      this.codons[index] = this.generateRandomCodon();
    }
  }

  // Select indices to mutate https://stackoverflow.com/a/48089/6996496
  selectIndicesToMutate() {
    let indicesToMutate = [];
    let numNeeded = NUM_MUTATIONS;
    for (let i = 0; i < CHROMOSOME_NUM_CODONS && numNeeded > 0; i++) {
      let probability = numNeeded / (CHROMOSOME_NUM_CODONS - i);
      if (Math.random() < probability) {
        indicesToMutate.push(i);
        numNeeded -= 1;
      }
    }
    return indicesToMutate;
  }
}

export default Chromosome;
