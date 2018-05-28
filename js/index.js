import Generations from './generations.js';

$(function() {

  $.exposed = { generations: new Generations() };

  $("#btn-initialize").click(function(event) {
    //$(this).prop('disabled', true);
    var min = parseInt($("#num-individuals-min").val());
    var max = parseInt($("#num-individuals-max").val());
    $.exposed.generations.initRandomRange(min, max);
    $.exposed.generations.showInCarousel();
    $("#generations-jumbotron").show();
  });

  $("#btn-save").click(function(event) {
    // TODO: choose a filename
    $.exposed.generations.saveAsFile();
  });

  // https://www.abeautifulsite.net/whipping-file-inputs-into-shape-with-bootstrap-3
  $(document).on('change', ':file', function() {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
  });

  $("#btn-load").on('fileselect', function(event, numFiles, label) {
    // https://stackoverflow.com/questions/34034475/edit-and-save-a-file-locally-with-js
    var reader = new FileReader();
    reader.onload = function(e) {
      $.exposed.generations = Generations.loadFromHash(JSON.parse(e.target.result));
      $.exposed.generations.showInCarousel();
      $("#generations-jumbotron").show();
    };
    reader.readAsText(new Blob([event.target.files[0]], {"type": "application/json"}));
  });
});

jQuery.createNewGeneration = function createNewGeneration() {
  var min = parseInt($("#num-individuals-min").val());
  var max = parseInt($("#num-individuals-max").val());
  let archetypeIndex = $('input[name=selectedIndividual]:checked').val();
  $.exposed.generations.createNewGeneration(archetypeIndex, min, max);
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
