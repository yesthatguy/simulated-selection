export const CODON_MAX_VALUE = 6;
export const POSITION_FROM_END_ELIMINATION_GENE = 1;
export const POSITION_FROM_END_DUPLICATION_GENE = 2;
export const POSITION_FROM_END_SCALE_GENE = 4;

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
    const CHROMOSOME_GENE_SIZES = $.exposed.generations.config["array-num-chromosome-gene-sizes"];
    const CHROMOSOME_GENE_COLORS = $.exposed.generations.config["array-chromosome-gene-colors"];
    for(let geneNum = 0; geneNum < CHROMOSOME_GENE_SIZES.length; geneNum++){
      let size = CHROMOSOME_GENE_SIZES[geneNum];
      let geneTd = $('<td>').css('background-color', CHROMOSOME_GENE_COLORS[geneNum]);
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

  showDetailInDiv(div) {
    div.empty();
    div.append(this.showDetail());
  }

  showDetail() {
    let table = $('<table>').addClass('chromosome-details');

    let row = $('<tr>');
    row.append($('<th>').append("Property"));
    row.append($('<th>').append("Sub-property"));
    row.append($('<th>').append("In"));
    row.append($('<th>').append("Out"));
    table.append(row);

    table.append(this.generateDetailRow("SHAPE", "AMOUNT", 0, 1, 7));
    table.append(this.generateDetailRow(null, "EXTRUDE", 1));
    table.append(this.generateDetailRow(null, "TAPER", 2, 1, 1));
    table.append(this.generateDetailRow(null, "ROTATION", 3));
    table.append(this.generateDetailRow(null, "FAVOR AXIS", 4));
    table.append(this.generateDetailRow(null, "SUBSURF", 5));
    table.append(this.generateDetailRow(null, "MIRROR", 6));
    table.append(this.generateDetailRow("COLOUR", "RR", 7, 2, 6));
    table.append(this.generateDetailRow(null, null, 8));
    table.append(this.generateDetailRow(null, "GG", 9, 2));
    table.append(this.generateDetailRow(null, null, 10));
    table.append(this.generateDetailRow(null, "BB", 11, 2));
    table.append(this.generateDetailRow(null, null, 12));
    table.append(this.generateDetailRow("ROUGH / REFLECT", "GLOSS", 13, 2, 4));
    table.append(this.generateDetailRow(null, null, 14));
    table.append(this.generateDetailRow(null, "FACTOR", 15, 2));
    table.append(this.generateDetailRow(null, null, 16));
    table.append(this.generateDetailRow("RANDOMIZE", "AMOUNT", 17, 1, 2));
    table.append(this.generateDetailRow(null, "UNIFORM", 18));

    table.append(this.generateActionRows(19));
    table.append(this.generateActionRows(24));
    table.append(this.generateActionRows(29));
    table.append(this.generateActionRows(34));
    table.append(this.generateActionRows(39));
    table.append(this.generateActionRows(44));
    table.append(this.generateActionRows(49));
    table.append(this.generateActionRows(54));

    table.append(this.generateDetailRow("SCALE", "", 59));
    table.append(this.generateDetailRow("POSITION", "", 60));
    table.append(this.generateDetailRow("ADD", "", 61));
    table.append(this.generateDetailRow("SUBTRACT", "", 62));

    return table;
  }

  generateDetailRow(property, subProperty, codonIndex, geneSize = 1, propertyRowspan = 1) {
    let row = $('<tr>');
    if (property !== null) {
      row.append($('<td>', {rowspan: propertyRowspan}).addClass('property-cell').append(property));
    }
    if (subProperty !== null) {
      row.append($('<td>', {rowspan: geneSize}).addClass('sub-property-cell').append(subProperty));
    }
    row.append($('<td>').addClass('in-cell').append(this.codons[codonIndex]));
    if (subProperty !== null) {
      row.append($('<td>', {rowspan: geneSize}).addClass('out-cell').append(this.getOutVal(codonIndex)));
    }
    return row;
  }

  // i is the codon index
  getOutVal(i) {
    switch(i) {
      // SHAPE: TAPER
      case 2: return this.codons[i] / 2;
      // SHAPE: ROTATION
      case 3: return this.codons[i] * 10;
      // SHAPE: FAVOR AXIS
      case 4: return ["X", "Y", "Z", "NULL", "NULL", "NULL"][this.codons[i] - 1];
      // SHAPE: SUBSURF
      case 5: return ["NULL", "NULL", "1", "1", "2", "2"][this.codons[i] - 1];
      // SHAPE: MIRROR
      case 6: return ["X", "Y", "Z", "NULL", "NULL", "NULL"][this.codons[i] - 1];
      // COLOUR: R (7), G (9), B (11)
      case 7: case 9: case 11:
        return ((1/36) * (((this.codons[i] - 1) * 6) + this.codons[i+1])).toFixed(3);
      // ROUGH/REFLECT: GLOSS (13), FACTOR (15)
      case 13: case 15:
        return ((this.codons[i] * 10 + this.codons[i+1]) / 200).toFixed(3);
      // RANDOMIZE: AMOUNT
      case 17: return (this.codons[i] / 40).toFixed(3);
      // RANDOMIZE: UNIFORM
      case 18: return this.codons[i] / 10;
      // SELECT SIDE
      case 19: case 24: case 29: case 34: case 39: case 44: case 49: case 54:
        return ["ctrl 3", "3", "ctrl 1", "1", "ctrl 7", "7"][this.codons[i] - 1];
      // ACTION
      case 20: case 25: case 30: case 35: case 40: case 45: case 50: case 55:
        return Chromosome.getActionName(this.codons[i]);
      // CONDITIONAL 1
      case 21: case 26: case 31: case 36: case 41: case 46: case 51: case 56:
        let actionName1 = Chromosome.getActionName(this.codons[i-1]);
        let actionDetails1 = Chromosome.getActionDetails(actionName1);
        return actionDetails1[0][1](this.codons[i]);
      // CONDITIONAL 2
      case 22: case 27: case 32: case 37: case 42: case 47: case 52: case 57:
        let actionName2 = Chromosome.getActionName(this.codons[i-2]);
        let actionDetails2 = Chromosome.getActionDetails(actionName2);
        return actionDetails2[1][1](this.codons[i]);
      // CONDITIONAL 3
      case 23: case 28: case 33: case 38: case 43: case 48: case 53: case 58:
        let actionName3 = Chromosome.getActionName(this.codons[i-3]);
        let actionDetails3 = Chromosome.getActionDetails(actionName3);
        return actionDetails3[2][1](this.codons[i]);
      // SCALE
      case 59: return this.codons[i] / 2.5 + 0.6;
      // POSITION
      case 60: return ["LEFT", "RIGHT", "BACK", "FRONT", "BOTTOM", "TOP"][this.codons[i] - 1];
      // ADD
      case 61: return (this.codons[i] > 1) ? "REPLICATE" : "";
      // SUBTRACT
      case 62: return (this.codons[i] < 6) ? "DELETE" : "";

      default: return this.codons[i];
    }
  }

  generateActionRows(firstCodonIndex) {
    let actionName = Chromosome.getActionName(this.codons[firstCodonIndex + 1]);
    let actionDetails = Chromosome.getActionDetails(actionName);

    let rows = [];
    rows.push(this.generateDetailRow("SELECT SIDE", "", firstCodonIndex).addClass('new-action-row'));
    rows.push(this.generateDetailRow("ACTION", "", firstCodonIndex + 1));
    rows.push(this.generateDetailRow(actionName, actionDetails[0][0], firstCodonIndex + 2, 1, 3));
    rows.push(this.generateDetailRow(null, actionDetails[1][0], firstCodonIndex + 3));
    rows.push(this.generateDetailRow(null, actionDetails[2][0], firstCodonIndex + 4));
    return rows;
  }

  static getActionName(value) {
    if (value == 1) {
      return "ROTATE";
    } else if (value == 2 || value == 3) {
      return "SUBDIVIDE";
    } else if (value == 4 || value == 5) {
      return "SMOOTH VERTEX";
    } else if (value == 6) {
      return "FATTEN";
    }
  }

  static getActionDetails(action) {
    if (action == "ROTATE") {
      return [["X", (x) => 10 * x], ["Y", (x) => 10 * x], ["Z", (x) => 10 * x]];
    } else if (action == "SUBDIVIDE") {
      return [["# OF CUTS", (x) => x], ["SMOOTHNESS", (x) => x / 10], ["FRACTAL", (x) => x - 1]];
    } else if (action == "SMOOTH VERTEX") {
      return [["SMOOTHING", (x) => x / 10],
              ["REPEAT", (x) => x],
              ["AXIS OFF", (x) => ["NULL", "NULL", "NULL", "X", "Y", "Z"][x - 1]]];
    } else if (action == "FATTEN") {
      return [["OFFSET", (x) => x / -20],
              ["FALLOFF", (x) => ["RANDOM", "CONSTANT", "LINEAR", "SHARP", "SPHERE", "SMOOTH"][x - 1]],
              ["FALLOFF SIZE", (x) => x / 10]];
    }
  }


  static numCodons() {
    return $.exposed.generations.config["array-num-chromosome-gene-sizes"].reduce((x, y) => x + y);
  }

  hasEliminationGene() {
    return (this.codons[Chromosome.numCodons() - POSITION_FROM_END_ELIMINATION_GENE] < CODON_MAX_VALUE);
  }

  hasDuplicationGene() {
    return (this.codons[Chromosome.numCodons() - POSITION_FROM_END_DUPLICATION_GENE] > 1);
  }

  resetDuplicationGene() {
    this.codons[Chromosome.numCodons() - POSITION_FROM_END_DUPLICATION_GENE] = 1;
  }

  resetScaleGene() {
    this.codons[Chromosome.numCodons() - POSITION_FROM_END_SCALE_GENE] = 1;
  }

  initRandomCodons() {
    var c = [];
    for (var i = 0; i < Chromosome.numCodons() - 2; i++) {
      c.push(this.generateRandomCodon());
    }
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
      if (index == Chromosome.numCodons() - POSITION_FROM_END_SCALE_GENE) {
        // Scale gene can only go up or down one number
        let min = Math.max(this.codons[index] - 1, 1);
        let max = Math.min(this.codons[index] + 1, CODON_MAX_VALUE);
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
