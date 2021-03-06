var paramManager = require('./dmParamManager.js');

//TODO:
var panTiltOn = true;
var dollyOn = false;
var zoomOn = false;
var activePointerCount = 0;
var mainPointerId = -1;
var panTiltFactor = 0.1;
var domeOrientationFactor = 0.1;
var dollyFactor = 0.1;
var zoomFactor = 0.1;

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
    var newValueX = paramManager.getParam('uHorizontalFOV', 0) + dx * zoomFactor;
    var newValueY = paramManager.getParam('uSphereLatitude', 0) + dy * zoomFactor;
    triggerEvent('uHorizontalFOV-input', newValueX);
    triggerEvent('uSphereLatitude-input', newValueY);
    paramManager.setParam('uHorizontalFOV', newValueX, 0);
    paramManager.setParam('uuSphereLatitude', newValueY, 0);
  } else if (event.shiftKey) {
    var newValueX = paramManager.getParam('uCameraPosition', 0) + dx * panTiltFactor;
    var newValueY = paramManager.getParam('uCameraPosition', 2) + dy * panTiltFactor;
    triggerEvent('uCameraPosition-X-input', newValueX);
    triggerEvent('uCameraPosition-Z-input', newValueY);
    paramManager.setParam('uCameraPosition', newValueX, 0);
    paramManager.setParam('uCameraPosition', newValueY, 2);
    // console.log(dx, dy, newValueX, newValueY);
  } else if (event.metaKey){
    var newValueX = paramManager.getParam('uSphereOrientation', 0) - dx * domeOrientationFactor;
    var newValueY = paramManager.getParam('uSphereOrientation', 1) + dy * domeOrientationFactor;
    triggerEvent('uSphereOrientation-X-input', newValueX);
    triggerEvent('uSphereOrientation-Y-input', newValueY);
    paramManager.setParam('uSphereOrientation', newValueX, 0);
    paramManager.setParam('uSphereOrientation', newValueY, 1);
    // console.log(dx, dy, newValueX, newValueY);
  } else {
    var newValueX = paramManager.getParam('uCameraOrientation', 0) + dx * panTiltFactor;
    var newValueY = paramManager.getParam('uCameraOrientation', 1) + dy * panTiltFactor;
    triggerEvent('uCameraOrientation-X-input', newValueX);
    triggerEvent('uCameraOrientation-Y-input', newValueY);
    paramManager.setParam('uCameraOrientation', newValueX, 0);
    paramManager.setParam('uCameraOrientation', newValueY, 1);
  }
}

function handlePointerStart(event) {

}

function handlePointerEnd(event) {

}

function handleKeys(event) {
  if (event.defaultPrevented) {
    return; // Do nothing if the event was already processed
  }

  switch (event.key) {
    case "PageDown":
      // Do something for "down arrow" key press.
      console.log("page down");
      break;
    case "PageUp":
      console.log("page up");
      // Do something for "up arrow" key press.
      break;
    default:
      return; // Quit when this doesn't handle the key event.
  }

  // Cancel the default action to avoid it being handled twice
  event.preventDefault();
}

function handleWheel(event) {
  event.preventDefault();
  // if (event.defaultPrevented) {
  //   return; // Do nothing if the event was already processed
  // }
  var dx = event.deltaX;
  var dy = event.deltaY;
  console.log(dx, dy);
  if (Math.abs(dx) > Math.abs(dy)) {
    dy = 0.0;
  } else {
    dx = 0.0;
  }
  var newValueX = paramManager.getParam('uCameraPosition', 0) + dx * panTiltFactor;
  var newValueY = paramManager.getParam('uCameraPosition', 2) + dy * panTiltFactor;
  triggerEvent('uCameraPosition-X-input', newValueX);
  triggerEvent('uCameraPosition-Z-input', newValueY);
  paramManager.setParam('uCameraPosition', newValueX, 0);
  paramManager.setParam('uCameraPosition', newValueY, 2);

  // Cancel the default action to avoid it being handled twice
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
  //source: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
  window.addEventListener("keydown", handleKeys, true);
  window.addEventListener("wheel", handleWheel, true);

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
