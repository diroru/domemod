var mediaContainer = require('./dmMediaContainer.js');
var paramManager = require('./dmParamManager.js');

//TODO:
var panTiltOn = true;
var dollyOn = false;
var zoomOn = false;
var activePointerCount = 0;
var mainPointerId = -1;
var panTiltFactor = 0.1;
var dollyFactor = 0.1;
var zoomFactor = 0.1;

function init(settings) {
  var uiContainer = document.getElementById(settings.uiId);
  var projTypeLabel = document.createElement('span');
  projTypeLabel.textContent = 'projection type:';
  var projTypeDropdown = document.createElement('select');
  var projections = ['equirectangular', 'azimuthal-90', 'azimuthal-180'];
  var i = 0;
  projections.forEach(function(proj) {
    var opt = document.createElement('option');
    opt.value = i;
    opt.textContent = proj;
    projTypeDropdown.appendChild(opt);
    i++;
  });
  projTypeDropdown.addEventListener('change', function(event) {
    mediaContainer.projectionType = event.target.value;
    console.log("proj type", mediaContainer.projectionType);
  });

  uiContainer.appendChild(projTypeLabel);
  uiContainer.appendChild(projTypeDropdown);
  uiContainer.appendChild(document.createElement('hr'));
  paramManager.getParams().forEach(function(param) {
    for (var i  = 0; i < param['value'].length; i++) {
      var labelElement = document.createElement('span');
      labelElement.textContent = param['label'][i];
      var numberInput = document.createElement('input');
      numberInput.type = 'number';
      numberInput.id = param['name'] + param['suffix'][i] + "-input";
      // numberInput.min = param['min'][i];
      numberInput.value = param['value'][i];
      // numberInput.max = param['max'][i];
      // numberInput.size = '4';
      numberInput.className = 'number-input';

      var rangeInput = document.createElement('input');
      rangeInput.type = 'range';
      rangeInput.id = param['name'] + param['suffix'][i] + "-slider";
      if (param['step'] !== undefined) {
        rangeInput.step = param['step'][i];
      }
      rangeInput.min = parseFloat(param['min'][i]);
      rangeInput.value = parseFloat(param['value'][i]);
      rangeInput.max = parseFloat(param['max'][i]);

      rangeInput.className = 'full-width';

      rangeInput.addEventListener('input', function(otherInput, param, index, event) {
        // console.log(event, otherInput, param, index);
        event.preventDefault();
        param['value'][index] = event.target.value;
        otherInput.value = event.target.value;
      }.bind(null, numberInput, param, i));
      numberInput.addEventListener('input', function(otherInput, param, index, event) {
        // console.log(event, otherInput, param, index);
        event.preventDefault();
        param['value'][index] = event.target.value;
        otherInput.value = event.target.value;
      }.bind(null, rangeInput, param, i));

      uiContainer.appendChild(labelElement);
      uiContainer.appendChild(numberInput);
      uiContainer.appendChild(rangeInput);
      // console.log(labelElement);
      // console.log(numberInput);
      // console.log(rangeInput);
    }
  });
  var showGridLabel = document.createElement('span');
  showGridLabel.textContent = "show grid";
  var showGridCheckBox = document.createElement('input');
  showGridCheckBox.type = "checkbox";
  showGridCheckBox.addEventListener('change', function(event) {
    showGrid = (showGrid + 1) % 2;
    console.log("chkbox", event.target.value, this.value);
  });
  uiContainer.appendChild(showGridLabel);
  uiContainer.appendChild(showGridCheckBox);
  console.log(showGridLabel, showGridCheckBox);
}

function initGUIElement(id, paramName, startingValue) {
  var startingValue = params[paramName];
  document.getElementById(id + "-slider").addEventListener('input',
    function(event) {
      document.getElementById(id+"-input").value = event.target.value;
      params[paramName] = event.target.value;
  });
  document.getElementById(id + "-input").addEventListener('input',
    function(event) {
      document.getElementById(id+"-slider").value = event.target.value;
      params[paramName] = event.target.value;
  });
  document.getElementById(id+"-slider").value = startingValue;
  document.getElementById(id+"-input").value = startingValue;
}

module.exports = {
  init : init
}
