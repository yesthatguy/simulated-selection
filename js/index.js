$(function() {
  
  $("#btn-initialize").click(function(event) {
    $(this).prop('disabled', true);
    var num = $("#num-individuals").val();
    var population = getRandomPopulation(num);
    var cpDiv = $("#current-population");
    cpDiv.html(population.join("<br>"));
    cpDiv.show();
  })
});

function getRandomPopulation(numChromosomes) {
  pop = [];
  for (var i = 0; i < numChromosomes; i++) {
    pop.push(new Chromosome());
  }
  return pop;
}

var Chromosome = function(codons = null) {
    if (codons) {
      this.codons = codons;
    } else {
      this.initRandomCodons();
    }
}

Chromosome.prototype = {
  CODON_MAX_VALUE: 6,
  CHROMOSOME_NUM_CODONS: 40,
  
  codons: [],
  
  toString: function() {
    return this.codons.join("");
  },
  
  initRandomCodons: function() {
    c = [];
    for (var i = 0; i < this.CHROMOSOME_NUM_CODONS; i++) {
      c.push(Math.floor(Math.random() * this.CODON_MAX_VALUE) + 1);
    }
    this.codons = c;
  }
}