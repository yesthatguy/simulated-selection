import Generations from './generations.js';

$(function() {

  var generations = new Generations();
  $.exposed = { generations: generations }

  $("#btn-initialize").click(function(event) {
    //$(this).prop('disabled', true);
    var num = $("#num-individuals").val();
    generations.initRandom(num);
    generations.showInCarousel();
    $("#generations-jumbotron").show();
  });
});

jQuery.createNewGeneration = function createNewGeneration() {
  let archetypeIndex = $('input[name=selectedIndividual]:checked').val();
  $.exposed.generations.createNewGeneration(archetypeIndex);
  $.exposed.generations.showInCarousel();
}

jQuery.showAlert = function showAlert(text) {
  let div = $('<div>').addClass('alert alert-warning alert-dismissible fade show').attr('role', 'alert');
  div.append(text);
  let button = $('<button>').addClass('close').attr('data-dismiss', 'alert').attr('aria-label', 'Close');
  button.append($('<span>').attr('aria-hidden', 'true').append('&times;'));
  div.append(button);
  $('#errors').empty().append(div);
  $('#errors')[0].scrollIntoView();
}
