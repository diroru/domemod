var paramManager = require('./dmParamManager.js');

function handlePointerMoved(event) {
  event.preventDefault();
  var dx = event.movementX;
  var dy = event.movementY;
  if (Math.abs(dx) > Math.abs(dy)) {
    dy = 0.0;
  } else {
    dx = 0.0;
  }
  if (event.altKey) {
    var newValueY = paramManager.getParam('uHorizontalFOV', 0) + dy * zoomFactor;
    triggerEvent('uHorizontalFOV-input', newValueY);
    paramManager.getParam('uHorizontalFOV', newValueY, 0);
  } else if (event.shiftKey) {
    var newValueX = paramManager.getParam('uCameraPosition', 0) + dx * panTiltFactor;
    var newValueY = paramManager.getParam('uCameraPosition', 2) + dy * panTiltFactor;
    triggerEvent('uCameraPosition-X-input', newValueX);
    triggerEvent('uCameraPosition-Z-input', newValueY);
    paramManager.setParam('uCameraPosition', newValueX, 0);
    paramManager.setParam('uCameraPosition', newValueY, 2);
    // console.log(dx, dy, newValueX, newValueY);
  } else {
    var newValueX = paramManager.getParam('uCameraOrientation', 0) - dx * panTiltFactor;
    var newValueY = paramManager.getParam('uCameraOrientation', 1) + dy * panTiltFactor;
    triggerEvent('uCameraOrientation-X-input', newValueX);
    triggerEvent('uCameraOrientation-Y-input', newValueY);
    paramManager.setParam('uCameraOrientation', newValueX, 0);
    paramManager.setParam('uCameraOrientation', newValueY, 1);
    // console.log(dx, dy, newValueX, newValueY);
  }
}

function handlePointerStart(event) {

}

function handlePointerEnd(event) {

}

//TODO
function init(settings) {
  var pointerSensitiveElement = document.getElementById(settings.glCanvasId);
  pointerSensitiveElement.addEventListener('mousedown', function(event) {
    event.preventDefault();
    // console.log('mouse down');
    pointerSensitiveElement.addEventListener('mousemove',handlePointerMoved,true);
  });
  pointerSensitiveElement.addEventListener('mouseup', function(event) {
    event.preventDefault();
    // sole.log('pointer up');
    pointerSensitiveElement.removeEventListener('mousemove',handlePointerMoved,true);
  });
  /*
  pointerSensitiveElement.addEventListener('keydown', function(event) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        panTiltOn = false;
        dollyOn = true;
        zoomOn = false;
      break;
      case 'AltLeft':
      case 'AltRight':
        panTiltOn = false;
        dollyOn = false;
        zoomOn = true;
      break;
    }
    console.log("dolly ", dollyOn, " zoom ", zoomOn);
  });
  pointerSensitiveElement.addEventListener('keyup', function(event) {
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
      case 'AltLeft':
      case 'AltRight':
        panTiltOn = true;
        dollyOn = false;
        zoomOn = false;
      break;
    }
    console.log("dolly ", dollyOn, " zoom ", zoomOn);
  });
  */
}

function triggerEvent(id, newValue) {
  var elem = document.getElementById(id);
  elem.value = newValue;
  var event = new Event('input', {
      target: elem,
      type: 'Event',
      bubbles: false,
      cancelable: false
  });
  elem.dispatchEvent(event);
}

module.exports = {
  init: init
}
