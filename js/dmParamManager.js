var params = [
  {
    name: "uHorizontalFOV",
    label: ["horizontal fov: "],
    suffix: [""],
    value: [120],
    type: "float",
    min: [5],
    max: [170]
  },
  {
    name: "uCameraPosition",
    label: ["camera position x: ", "camera position y: ", "camera position z: "],
    suffix: ["-X", "-Y", "-Z"],
    value: [0, -10, 80],
    type: "float",
    min: [-100, -100, -100],
    max: [100, 100, 100]
  },
  {
    name: "uCameraOrientation",
    label: ["camera orientation x: ", "camera orientation y: "],
    suffix: ["-X", "-Y"],
    value: [0, 0],
    type: "float",
    min: [-180, -180],
    max: [180, 180]
  },
  {
    name: "uSphereRadius",
    label: ["dome radius: "],
    suffix: [""],
    value: [60],
    type: "float",
    min: [1],
    max: [100]
  },
  {
    name: "uSphereOrientation",
    label: ["dome orientation x: ", "dome orientation y: "],
    suffix: ["-X", "-Y"],
    value: [0, 0],
    type: "float",
    min: [-180, -180],
    max: [180, 180]
  },
  {
    name: "uSphereLatitude",
    label: ["dome latitude: "],
    suffix: [""],
    value: [90],
    type: "float",
    min: [0],
    max: [180]
  }
  /*
  params.push({
    name: "uSpherePosition",
    label: ["dome position x: ", "dome position y: ", "dome position z: "],
    suffix: ["-X", "-Y", "-Z"],
    value: [0, 0, 0],
    type: "float",
    min: [-100, -100, -100],
    max: [100, 100, 100]
  });
  */
  /*
  params.push({
    name: "uNearPlane",
    label: ["near plane: "],
    suffix: [""],
    value: [0.05],
    type: "float",
    min: [-1.0],
    max: [1.0],
    step: [0.005]
  });
  */
];

function getParams() {
  return params;
}

function setParam(name, value, compIndex) {
  var paramIndex = getParamIndex(name);
  if (compIndex === undefined) {
    params[paramIndex].value[0] = value;
  } else {
    params[paramIndex].value[compIndex] = value;
  }
}

function getParam(name, compIndex) {
  var paramIndex = getParamIndex(name);
  if (compIndex === undefined) {
    return parseFloat(params[paramIndex].value[0] || '0.0');
  } else {
    return parseFloat(params[paramIndex].value[compIndex] || '0.0');
  }
}

function getParamIndex(name) {
  return params.findIndex(function (elem) {
    return elem.name === name;
  });
}

module.exports = {
  getParams: getParams,
  setParam: setParam,
  getParam: getParam
}
