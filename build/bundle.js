(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


var canvas;
var gl;
var intervalID;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;

/* textures */
var sourceTexture;

var shaderProgram;
//attribute locations
var vertexPositionAttribute;
var textureCoordAttribute;
//uniform locations
var uSizeLoc,
    uSrcTexLoc,
    uShowGridLoc,
    uSrcTexProjTypeLoc;

var mediaContainer,
    mediaElement;

/*parameter*/
var params;

var screenWidth, screenHeight, showGrid = 0;

var currentURL;

var srcTexInfo = {
  shouldUpdate : false,
  type: undefined,
  //0 – equirectangular
  //1 - azimuthal 180°
  //2 - azimuthal 360 °
  projection_type: 0
};

window.onload = start;


//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  console.log("start called");
  // fitCanvas();
  // window.addEventListener('resize', fitCanvas, false);
  screenWidth = screen.width;
  screenHeight = screen.height;
  console.log("screen dimensions: ", screenWidth, "x", screenHeight);
  setupFileHandling();
  canvas = document.getElementById("glcanvas");

  setupParams();
  // loadDefaultImage('./assets/images/Equirectangular_projection_SW.jpg');
  initGUI();
  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    fitCanvas();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    /*
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    */
    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

    initBuffers();

    // Next, load and set up the textures we'll be using.

    initTextures();
    initInput();
    // activateVideoListeners(videoElement);
  }

  /*
  FileReader reader = new FileReader();
  reader.onload = function(theFile) {
      initImage(theFile);
  };
  */
}

//see:
//http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
//http://stackoverflow.com/questions/11819768/webgl-gl-viewport-change
//http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

function loadDefaultImage(path) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function(){
  if(xmlhttp.status == 200 && xmlhttp.readyState == 4){
    var data = xmlhttp.responseText;
    initImage(new File([data], path));
  }
  };
  xmlhttp.open("GET",path,true);
  xmlhttp.send();
}

function fitCanvas() {
  var width = gl.canvas.clientWidth;
  var height = gl.canvas.clientHeight;
  var pr = window.devicePixelRatio;
  //TODO!
  // pr = 1.0;
  if (gl.canvas.width != width || gl.canvas.height != height) {
     gl.canvas.width = width * pr;
     gl.canvas.height = height * pr;
     if (gl) {
         gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
     }
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }

  // If we don't have a GL context, give up now

  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVerticesBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  cubeVerticesTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

  var textureCoordinates = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeVerticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3    // front
  ]

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  sourceTexture = gl.createTexture();
}

function initTexture(img, url, npot) {
  var tex = gl.createTexture();
  img = new Image();
  img.onload = function() { handleTextureLoaded(tex, img, npot); }
  img.src = url;
  console.log("init", img);
  return tex;
}

function handleTextureLoaded(texture, image, npot) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (npot) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  console.log("loaded", image);
}

//
// updateTexture
//
// Update the texture to contain the latest frame from
// our video.
//
function updateTexture() {
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
        gl.UNSIGNED_BYTE, mediaElement);
  /*for NPOT textures, see as well: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences*/
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  /*for pot textures*/
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  // gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  // console.log("media element", mediaElement);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  if (srcTexInfo.shouldUpdate) {
    updateTexture();
  }
  fitCanvas();
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  //setting uniforms
  params.forEach(function(param) {
    switch(param['type']) {
      case 'float':
        switch(param['value'].length) {
          case 1:
            gl.uniform1f(param['uloc'], param['value'][0]);
          break;
          case 2:
            gl.uniform2f(param['uloc'], param['value'][0], param['value'][1]);
          break;
          case 3:
            gl.uniform3f(param['uloc'], param['value'][0], param['value'][1], param['value'][2]);
          break;
        }
        break;
      case 'int':
        switch(param['value'].length) {
          case 1:
            gl.uniform1i(param['uloc'], param['value'][0]);
          break;
          case 2:
            gl.uniform2i(param['uloc'], param['value'][0], param['value'][1]);
          break;
          case 3:
            gl.uniform3i(param['uloc'], param['value'][0], param['value'][1], param['value'][2]);
          break;
        }
        break;
    }
  });


  gl.uniform2f(uSizeLoc, gl.canvas.width, gl.canvas.height);

  gl.uniform1i(uShowGridLoc, showGrid);
  gl.uniform1i(uSrcTexProjTypeLoc, srcTexInfo.projection_type);
  // Specify the texture to map onto the faces.

  var unitNo = 0;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(uSrcTexLoc, unitNo);
  unitNo++;

  // Draw the quad.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  /*
  loadFiles(['./glsl/domeviewer.vert', './glsl/domeviewer.frag'], function (shaderText) {
  */
  var shaderText = [];
  shaderText.push("#define GLSLIFY 1\nprecision highp float;\nprecision highp int;\n\nattribute highp vec3 aVertexPosition;\nattribute highp vec2 aTextureCoord;\n\nvarying highp vec2 vTextureCoord;\n\nvoid main(void) {\n  gl_Position = vec4(aVertexPosition, 1.0);\n  //TODO: remove this\n  vTextureCoord = aTextureCoord;\n}\n");
  shaderText.push("#define GLSLIFY 1\nprecision highp float;\nprecision highp int;\n\n// #pragma glslify: import(\"./src/utils/constants.glsl\")\nconst float PI_2 = 3.14159265359;\n\nfloat deg2Rad(float d) {\n  return d * PI_2 / 180.0;\n}\n\nvec2 deg2Rad(vec2 d) {\n  return vec2(deg2Rad(d.x), deg2Rad(d.y));\n}\n\nvec3 deg2Rad(vec3 d) {\n  return vec3(deg2Rad(d.x), deg2Rad(d.y), deg2Rad(d.z));\n}\n\nconst float PI_3 = 3.14159265359;\n\nfloat rad2Deg(float r) {\n  return r * 180.0 / PI_3;\n}\n\nvec2 rad2Deg(vec2 r) {\n  return vec2(rad2Deg(r.x), rad2Deg(r.y));\n}\n\nvec3 rad2Deg(vec3 r) {\n  return vec3(rad2Deg(r.x), rad2Deg(r.y), rad2Deg(r.z));\n}\n\n// #pragma glslify: import(\"consants.glsl\")\n// const float PI = 3.14159265359;\n\nvec3 rotateX(vec3 v, float theta) {\n  float x = v.x;\n  float y = v.y * cos(theta) - v.z * sin(theta);\n  float z = v.y * sin(theta) + v.z * cos(theta);\n  return vec3(x,y,z);\n}\n\n// #pragma glslify: import(\"consants.glsl\")\n// const float PI = 3.14159265359;\n\nvec3 rotateY(vec3 v, float theta) {\n  float y = v.y;\n  float x = v.x * cos(theta) - v.z * sin(theta);\n  float z = v.x * sin(theta) + v.z * cos(theta);\n  return vec3(x,y,z);\n}\n\n// #pragma glslify: import(\"consants.glsl\")\n// const float PI = 3.14159265359;\n\nvec3 rotateZ(vec3 v, float theta) {\n  float z = v.z;\n  float y = v.y * cos(theta) - v.x * sin(theta);\n  float x = v.y * sin(theta) + v.x * cos(theta);\n  return vec3(x,y,z);\n}\n\nvec3 quadraticEquationSolution(float a, float b, float c) {\n\tfloat d = b * b - 4.0 * a * c;\n\tvec3 result0 = vec3(-1.0);\n\tvec3 result1 = vec3((-b - sqrt(d)) / (a * 2.0), (-b + sqrt(d)) / (a * 2.0), 1.0);\n\n\t//we will check the third element of the vector, to see if we have a valid solution\n\tif (d < 0.0) {\n\t\treturn result0;\n\t} else {\n\t\treturn result1;\n\t}\n\n\t//return mix(result1,result0,step(d,0.0));\n}\n\n//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle\n//the result is normalized\n//TODO: calculate focalLength on CPU and make it uniform\nvec3 getRectiliniearRay(vec2 screenCoordNorm, float horizontalFOV) {\n\tfloat focalLength = 0.5 / (tan(horizontalFOV * 0.5));\n\t//rectilinear\n\t//TODO: offset\n\tfloat x = -screenCoordNorm.x * 0.5;\n\tfloat y = -screenCoordNorm.y * 0.5;\n\tfloat z = focalLength;\n\n\treturn normalize(vec3(x,y,z));\n}\n\n// #pragma glslify: import(\"../constants.glsl\")\n\nconst float PI_0 = 3.14159265359;\n\n//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle\n//the result is normalized\nvec3 getFisheyeRay(vec2 screenCoordNorm, vec2 fieldOfView, vec2 rotation) {\n\n\tfloat theta = atan(screenCoordNorm.y, -screenCoordNorm.x);\n\tfloat rho = length(screenCoordNorm * 0.5) * fieldOfView.x;\n\n\t//fisheye\n\tfloat x = cos(theta) * sin(rho);\n\tfloat y = cos(rho);\n\tfloat z = sin(theta) * sin(rho);\n\n\tvec3 result = vec3(x,y,z);\n\t//TODO: check if this goes to the rectilinear camera\n\tresult = rotateX(result, PI_0 * 0.5);\n\tresult = rotateX(result, rotation.y);\n\tresult = rotateY(result, rotation.x);\n\n\treturn result;\n}\n\nvec3 getOrthogonalRay(vec2 screenCoordNorm, vec2 rotation) {\n\n\tvec3 result = vec3(0.0, 0.0, 1.0);\n\t//result = rotateX(result-offset, rotation.y) + offset;\n\t//result = rotateY(result-offset, rotation.x) + offset;\n\n\treturn normalize(result - vec3(screenCoordNorm, 0.0));\n\t//return normalize(result - getOrthogonalScreenOffset(screenCoordNorm));\n}\n\nconst float PI_1 = 3.14159265359;\n\n//TODO: gratGlobalOffset maybe?\n//\nvec3 getLatitudeGrid(vec2 longLat, float gratOffset, float gratWidth, vec3 gratColour) {\n\tfloat aa = 0.1;\n\tfloat gr = mod(rad2Deg(longLat.y) + gratWidth * 0.5, gratOffset) - gratWidth * 0.5;\n\t// return mix(gratColour, vec3(0.0), smoothstep(gratWidth*0.5 - aa, gratWidth*0.5 + aa, abs(gr)));\n\treturn mix(gratColour, vec3(0.0), step(gratWidth, abs(gr)));\n}\n\nvec3 getLongtitudeGrid(vec2 longLat, float gratOffset, float gratWidth, vec3 gratColour) {\n\tfloat aa = 0.1;\n\tfloat alpha_threshold = asin(gratOffset / gratWidth );\n\tfloat longDeg = rad2Deg(longLat.x);\n\tfloat latDeg = rad2Deg(longLat.y);\n\tif (longLat.y < alpha_threshold || longLat.y > (PI_1 * 0.5 - alpha_threshold)) {\n\t\treturn gratColour;\n\t} else {\n\t\tfloat go = gratWidth / sin(longLat.y);\n\t\tfloat gr = mod(longDeg + go * 0.5, gratOffset) - go * 0.5;\n\t\t// return mix(gratColour, vec3(0.0), smoothstep(go*0.5 - aa, go*0.5 + aa, abs(gr)));\n\t\treturn mix(gratColour, vec3(0.0), step(go, abs(gr)));\n\t}\n}\n\nvec3 getGrid(vec2 longLat, vec3 colour) {\n\tvec3 longGrid_0 = getLongtitudeGrid(longLat, 45.0, 0.6, colour);\n\tvec3 longGrid_1 = getLongtitudeGrid(longLat, 15.0, 0.2, colour);\n\tvec3 latGrid_0 = getLatitudeGrid(longLat, 45.0, 0.6, colour);\n\tvec3 latGrid_1 = getLatitudeGrid(longLat, 15.0, 0.2, colour);\n\tvec3 grid_rgb = longGrid_0 + longGrid_1 + latGrid_0 + latGrid_1;\n\t//TODO eg. vec3(0.0) as const\n\treturn clamp(grid_rgb, vec3(0.0), vec3(1.0));\n}\n\nconst float PI = 3.14159265359;\n\n//TODO: naming …\nuniform float uHorizontalFOV; //horizontal\n//all of the below are (should be!) normalized\n//the eyePos is treated as an origin!\nuniform vec2 uSize;\nuniform sampler2D uSrcTex;\n\nuniform vec3 uSpherePosition;\nuniform vec2 uSphereOrientation;\nuniform float uSphereRadius;\nuniform float uSphereLatitude;\n\nuniform vec2 uCameraOrientation;\nuniform vec3 uCameraPosition;\n\nuniform bool uShowGrid;\nuniform int uSrcTexProjType;\n// uniform float uNearPlane;\n\nuniform float frMix;\nuniform float ofrMix;\n\n// const float PI = 3.1415926535897932384626433832;\n\n//this takes latitude and longitude coordinates (possibly of the [[0,TWO_PI],[0,PI]] range)\n//and maps them to [[0,1],[0,1]]\nvec2 mapFromLatLongToPanoramicTexel(vec2 theLongLat) {\n\treturn vec2(mod(theLongLat.x / PI * 0.5 + 1.0, 1.0), mod(theLongLat.y / PI + 1.0, 1.0));\n}\n\nvec3 getOrthogonalScreenOffset(vec2 screenCoordNorm) {\n\tvec3 d = vec3(screenCoordNorm * 0.5, 0.0); //distance to origin, needed for the orthographic camera\n\treturn normalize(d);\n}\n\nvec3 updatespherePositionitionOrtho(vec3 spherePosition, vec3 orthoOffset) {\n\treturn spherePosition - orthoOffset;\n}\n\n//this takes latitude and longitude coordinates (possibly of the [[0,TWO_PI],[0,PI]] range)\n//converts them to polar coordinates and maps them to [[0,1],[0,1]]\n//NB: the radius is passed as a third parameter so that clipping for \"less than 360°\" asimuthal panoramas may be done\nvec3 mapFromLatLongToAzimuthalTexel(vec2 theLongLat, float verticalFOV) {\n\t//the radius should be in the range [0,0.5]\n\tfloat radius = mod(theLongLat.y + PI, PI) * (0.5 / verticalFOV);\n\tfloat s = 0.5 + cos(theLongLat.x) * radius;\n\tfloat t = 0.5 + sin(theLongLat.x) * radius;\n\treturn vec3(s,t,radius);\n}\n\nvec2 getLongLat(vec3 intersection, vec3 spherePosition, vec2 rotation) {\n\tvec3 sphereVec = normalize(intersection - spherePosition);\n\tvec3 v = sphereVec;\n\tv = rotateX(v, rotation.y + PI*0.5);\n\tv = rotateY(v, rotation.x);\n\tfloat lambda = atan(v.z, v.x);\n\tfloat mu = PI * 0.5 - atan(v.y, length(vec2(v.x,v.z)));\n\treturn vec2(lambda, mu);\n}\n\nbool isInsideInterval(vec2 source, vec2 intervalLow, vec2 intervalHigh) {\n\treturn all(greaterThanEqual(source,intervalLow)) && all(lessThanEqual(source,intervalHigh));\n}\n\nbool isInsideInterval(vec2 source) {\n\treturn isInsideInterval(source, vec2(0.0), vec2(1.0));\n}\n\nstruct VectorPair {\n\tvec4 minor;\n\tvec4 major;\n\tbool isReal;\n};\n\n//sphereData contains position (xyz) and radius (w)\nVectorPair getEyeSphereIntersection (vec3 eyeVec, vec3 offsetVec, vec4 sphereData) {\n\n\t//with orthographic rotation we ignore camera rotation, translation should be used instead\n\t//q = rotateX(q - d, cameraRotation.y) + d;\n\t//q = rotateY(q - d, cameraRotation.x) + d;\n\tvec3 q = eyeVec;\n\tvec3 p = sphereData.xyz + offsetVec;\n\tfloat r = sphereData.w;\n\n\tfloat a = dot(q, q);\n\tfloat b = - dot(q, p) * 2.0;\n\tfloat c = dot(p, p) -  r * r;\n\n\tvec3 kappa = quadraticEquationSolution(a, b, c);\n\t// vec4 color0 = vec4(1.0,1.0,0.0,0.5);\n\t// vec4 color1 = vec4(kappa.x * eyeVec, 1.0);\n\n\tvec4 result0 = vec4(offsetVec + eyeVec * kappa.x, 1.0);\n\tvec4 result1 = vec4(offsetVec + eyeVec * kappa.y, 1.0);\n\n\tbool isReal = true;\n\n\tif (kappa.z < 0.0) {\n\t\tisReal = false;\n\t}\n\n\treturn VectorPair(result0, result1, isReal);\n}\n\nvoid main() {\n\tvec2 aspectRatio = uSize / uSize.xx;\n\t//normalizing and mapping to the [-1.0,1.0] range\n\t//TODO: check for bugs!\n\t vec2 normCoord = (gl_FragCoord.xy / uSize - vec2(0.5)) * aspectRatio * 2.0;\n\t//  normCoord.x = - normCoord.x;\n\n\tvec3 transformedSpherePosition = vec3(0.0);\n\n\ttransformedSpherePosition = transformedSpherePosition + uSpherePosition - uCameraPosition;\n\n\ttransformedSpherePosition = rotateX(transformedSpherePosition, deg2Rad(uCameraOrientation.y));\n\ttransformedSpherePosition = rotateY(transformedSpherePosition, deg2Rad(uCameraOrientation.x));\n\n\t// transformedSpherePosition = transformedSpherePosition - vec3(0.0, 0.0, 10.0);\n\n\t// transformedSpherePosition = transformedSpherePosition + uSpherePosition - uCameraPosition - vec3(0.0, 0.0, 10.0);\n\n\tvec4 sphereData = vec4(transformedSpherePosition, uSphereRadius);\n\n\tvec3 rectiliniearRay = getRectiliniearRay(normCoord, deg2Rad(uHorizontalFOV));\n\n\t// rectiliniearRay = rotateX(rectiliniearRay, deg2Rad(uCameraOrientation.y));\n\t// rectiliniearRay = rotateY(rectiliniearRay, deg2Rad(uCameraOrientation.x));\n\n\tvec3 rectiliniearOffset = vec3(0.0);\n\n\t/*\n\tvec3 fisheyeRay = normalize(getFisheyeRay(normCoord, fieldOfView, deg2Rad(uCameraOrientation)));\n\tvec3 fisheyeOffset = vec3(0.0);\n\n\tvec3 orthographicRay = vec3(0.0, 0.0, 1.0);\n\tvec3 orthographicOffset = vec3(normCoord * 0.5, 0.0);\n\t*/\n\t//w is sphere radius\n\n\t/*\n\tvec3 mixedRay = normalize(mix(mix(fisheyeRay, rectiliniearRay , frMix), orthographicRay, ofrMix));\n\tvec3 mixedOffset = mix(mix(fisheyeOffset, rectiliniearOffset, frMix), orthographicOffset, ofrMix);\n\tVectorPair sphereIntersections = getEyeSphereIntersection(mixedRay, mixedOffset, sphereData);\n\t*/\n\tVectorPair sphereIntersections = getEyeSphereIntersection(rectiliniearRay, rectiliniearOffset, sphereData);\n\n\t//for performance use this:\n\t/*\n\tif (!sphereIntersections.isReal) {\n\t\tdiscard;\n\t}*/\n\n\t//this should be a uniform\n\tfloat latLimit = deg2Rad(uSphereLatitude);\n\t//setting ray to intersection point\n\t// vec2 longLat0 = mod(getLongLat(ray * kappa.x, p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\t// vec2 longLat1 = mod(getLongLat(ray * kappa.y, p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\t// vec2 longLat0 = mod(getLongLat(sphereIntersection[0], p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\t// vec2 longLat1 = mod(getLongLat(sphereIntersection[1], p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\tvec2 longLat0 = mod(getLongLat(sphereIntersections.minor.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\tvec2 longLat1 = mod(getLongLat(sphereIntersections.major.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));\n\n\tfloat uNearPlane = 0.05 ;\n\tvec2 longLat = longLat0;\n\n\t//TODO: comments\n\tif (sphereIntersections.major.z < -uNearPlane || !sphereIntersections.isReal ) {\n\t\tgl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);\n\t} else {\n\t\tif (sphereIntersections.minor.z < uNearPlane || longLat.y >= latLimit) {\n\t\t\tif (longLat1.y >= latLimit) {\n\t\t\t\tdiscard;\n\t\t\t}\n\t\t\t//gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);\n\t\t\tif (uSrcTexProjType == 0) {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, mapFromLatLongToPanoramicTexel(longLat1));\n\t\t\t} else if (uSrcTexProjType == 1) {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, \tmapFromLatLongToAzimuthalTexel(longLat1, PI * 0.5).st);\n\t\t\t} else {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, \tmapFromLatLongToAzimuthalTexel(longLat1, PI).st);\n\t\t\t}\n\t\t\tif (uShowGrid) {\n\t\t\t\tvec3 gridColour = getGrid(longLat1, vec3(1.0, 1.0, 0.0));\n\t\t\t\tgl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.2;\n\t\t\t}\n\t\t\t// gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat1, latLimit\t).st);\n\t\t  // gl_FragColor = texture2D(uSrcTex, src_coord / uSize);\n\t\t} else {\n\t\t\tif (longLat.y >= latLimit) {\n\t\t\t\tdiscard;\n\t\t\t}\n\t\t\t//gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);\n\t\t\tif (uSrcTexProjType == 0) {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, mapFromLatLongToPanoramicTexel(longLat));\n\t\t\t} else if (uSrcTexProjType == 1) {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, \tmapFromLatLongToAzimuthalTexel(longLat, PI * 0.5).st);\n\t\t\t} else {\n\t\t\t\tgl_FragColor = texture2D(uSrcTex, \tmapFromLatLongToAzimuthalTexel(longLat, PI).st);\n\t\t\t}\n\t\t\t gl_FragColor = mix(gl_FragColor, vec4(0.2,0.2,0.2,1.0), 0.6);\n\t\t\t if (uShowGrid) {\n\t\t\t\t vec3 gridColour = getGrid(longLat, vec3(1.0, 1.0, 0.0));\n\t\t\t \t gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.35;\n\t\t \t }\n \t\t// \t gl_FragColor = mix(texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st), vec4(0.2,0.2,0.2,1.0), 0.6);\n\t\t  // gl_FragColor = texture2D(uSrcTex, src_coord / uSize);\n\t\t}\n\t}\n\t// gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n}\n");
  console.log(shaderText[1]);
      var vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, shaderText[0]);
      gl.compileShader(vertexShader);

      var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, shaderText[1]);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(vertexShader));
        return null;
      }
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(fragmentShader));
        return null;
      }
      // Create the shader program
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      // If creating the shader program failed, alert

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
      }

      gl.useProgram(shaderProgram);

      vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
      gl.enableVertexAttribArray(vertexPositionAttribute);

      textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
      gl.enableVertexAttribArray(textureCoordAttribute);

      //getting uniform locations
      uSrcTexLoc = gl.getUniformLocation(shaderProgram, "uSrcTex");
      uSizeLoc = gl.getUniformLocation(shaderProgram, "uSize");
      uShowGridLoc = gl.getUniformLocation(shaderProgram, "uShowGrid");
      uSrcTexProjTypeLoc = gl.getUniformLocation(shaderProgram, "uSrcTexProjType");
      /*
      domeRadiusULoc = gl.getUniformLocation(shaderProgram, "sphereRadius");
      domePositionULoc = gl.getUniformLocation(shaderProgram, "spherePosition");
      domeOrientationULoc = gl.getUniformLocation(shaderProgram, "sphereOrientation");
      domeLatitudeULoc = gl.getUniformLocation(shaderProgram, "sphereLatitude");
      */
      params.forEach(function(param) {
        param["uloc"] = gl.getUniformLocation(shaderProgram, param["name"]);
      });
/*
  }, function (url) {
      alert('Failed to download "' + url + '"');
  });
  */
}

var panTiltOn = true;
var dollyOn = false;
var zoomOn = false;
var activePointerCount = 0;
var mainPointerId = -1;
var panTiltFactor = 0.1;
var dollyFactor = 0.1;
var zoomFactor = 0.1;

function initInput() {
  var pointerSensitiveElement = document.getElementById('glcanvas');
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

function handlePointerMoved(event) {
  event.preventDefault();
  var dx = event.movementX;
  var dy = event.movementY;
  if (event.altKey) {
    var newValueY = getParam('uHorizontalFOV', 0) + dy * zoomFactor;
    triggerEvent('uHorizontalFOV-input', newValueY);
    setParam('uHorizontalFOV', newValueY, 0);
  } else if (event.shiftKey) {
    var newValueX = getParam('uCameraPosition', 0) + dx * panTiltFactor;
    var newValueY = getParam('uCameraPosition', 2) + dy * panTiltFactor;
    triggerEvent('uCameraPosition-X-input', newValueX);
    triggerEvent('uCameraPosition-Z-input', newValueY);
    setParam('uCameraPosition', newValueX, 0);
    setParam('uCameraPosition', newValueY, 2);
    // console.log(dx, dy, newValueX, newValueY);
  } else {
    var newValueX = getParam('uCameraOrientation', 0) - dx * panTiltFactor;
    var newValueY = getParam('uCameraOrientation', 1) + dy * panTiltFactor;
    triggerEvent('uCameraOrientation-X-input', newValueX);
    triggerEvent('uCameraOrientation-Y-input', newValueY);
    setParam('uCameraOrientation', newValueX, 0);
    setParam('uCameraOrientation', newValueY, 1);
    // console.log(dx, dy, newValueX, newValueY);
  }
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

function handlePointerStart(event) {

}

function handlePointerEnd(event) {

}


//source:
//http://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
function loadFile(url, data, callback, errorCallback) {
    // Set up an asynchronous request
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    // Hook the event that gets called as the request progresses
    request.onreadystatechange = function () {
        // If the request is "DONE" (completed or failed)
        if (request.readyState == 4) {
            // If we got HTTP status 200 (OK)
            if (request.status == 200) {
                callback(request.responseText, data)
            } else { // Failed
                errorCallback(url);
            }
        }
    };

    request.send(null);
}

function loadFiles(urls, callback, errorCallback) {
    var numUrls = urls.length;
    var numComplete = 0;
    var result = [];

    // Callback for a single file
    function partialCallback(text, urlIndex) {
        result[urlIndex] = text;
        numComplete++;

        // When all files have downloaded
        if (numComplete == numUrls) {
            callback(result);
        }
    }

    for (var i = 0; i < numUrls; i++) {
        loadFile(urls[i], i, partialCallback, errorCallback);
    }
}

function setupFileHandling() {
  //source: http://codepen.io/SpencerCooley/pen/JtiFL/
  //check if browser supports file api and filereader features
  mediaContainer = document.getElementById("media-container");
  if (window.File && window.FileReader && window.FileList && window.Blob) {

    //console.log(document);
    document.getElementById("the-video-file-field").addEventListener('change', function(event) {
  		//grab the first image in the fileList
  		//in this example we are only loading one file.
      console.log("file field event", event, event.files);
      var file = this.files[0];
      if (file !== undefined) {
        console.log("file size:", file.size);
        console.log("file type:", file.type);
        //TODO: decide media type here?
        if(file.type.match(/video\/*/)){
    		  initVideo(this.files[0]);
        } else if (file.type.match(/image\/*/)) {
          //TODO:
          initImage(this.files[0]);
        } else {
          console.log("Couldn't interpret image/video file: ", this.files[0]);
        }
      } else {
        console.log("probably cancelled.");
      }
  	}, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function clearVideo() {
  try {
    videoDone();
    var videoElement = mediaContainer.getElementsByTagName("video")[0];
    videoElement.pause();
    videoElement.setAttribute("src", "");
    //videoElement.removeAttribute("src");
    videoElement.load();
    videoElement.removeEventListener("canplaythrough", startVideo, true);
    videoElement.removeEventListener("ended", videoDone, true);
    mediaContainer.removeChild(videoElement);
    // window.URL.revokeObjectURL(currentURL);
  } catch (e) {
    console.error(e);
  }
}

//this is not completely neccesary, just a nice function I found to make the file size format friendlier
//http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
function humanFileSize(bytes, si) {
   var thresh = si ? 1000 : 1024;
   if(bytes < thresh) return bytes + ' B';
   var units = si ? ['kB','MB','GB','TB','PB','EB','ZB','YB'] : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
   var u = -1;
   do {
       bytes /= thresh;
       ++u;
   } while(bytes >= thresh);
   return bytes.toFixed(1)+' '+units[u];
}

function initImage(file){
   currentURL = URL.createObjectURL(file);
   //TODO: check and stop existing media!
   //TODO: on cancel?
   srcTexInfo.shouldUpdate = false;

   if (srcTexInfo.type === 'video') {
     clearVideo();
   }
   if (srcTexInfo.type === 'image') {
     clearImage();
   }

   var imageElement = document.createElement("img");

   imageElement.addEventListener('load', loadImageCallback, true);

   imageElement.setAttribute('src', currentURL);
   mediaContainer.appendChild(imageElement);
   mediaElement = imageElement;
   //DEBUGGING

   srcTexInfo.type = 'image';
   srcTexInfo.shouldUpdate = true;
   console.log("init image called", mediaElement);
}

function initVideo(file){
   currentURL = URL.createObjectURL(file);
   //TODO: check and stop existing media!
   //TODO: on cancel?
   srcTexInfo.shouldUpdate = false;

   if (srcTexInfo.type === 'video') {
     clearVideo();
   }
   if (srcTexInfo.type === 'image') {
     clearImage();
   }

   //of course using a template library like handlebars.js is a better solution than just inserting a string
   var videoElement = document.createElement("video");
   videoElement.addEventListener("canplaythrough", startVideo.bind(videoElement), true);
   videoElement.addEventListener("ended", videoDone, true);
   videoElement.setAttribute('src', currentURL);
   videoElement.setAttribute('autoplay', '');
   // videoElement.setAttribute('muted', '');
   videoElement.setAttribute('loop', '');
   videoElement.setAttribute('type', file.type);
   mediaContainer.appendChild(videoElement);
   mediaElement = videoElement;
}

function clearImage() {
  try {
    clearInterval(intervalID);
    var imageElement = mediaContainer.getElementsByTagName("img")[0];
    imageElement.setAttribute("src", "");
    //videoElement.removeAttribute("src");
    imageElement.removeEventListener("load", loadImageCallback, true);
    mediaContainer.removeChild(imageElement);
    // window.URL.revokeObjectURL(currentURL);
  } catch (e) {
    console.error(e);
  }
}

function loadImageCallback() {
  srcTexInfo.type = 'image';
  srcTexInfo.shouldUpdate = true;
  intervalID = setInterval(drawScene, 120);
  console.log("load image callback triggered.");
}

//
// startVideo
//
// Starts playing the video, so that it will start being used
// as our texture.
//
function startVideo() {
  this.play();
  this.muted = true;
  intervalID = setInterval(drawScene, 30);
  srcTexInfo.type = 'video';
  srcTexInfo.shouldUpdate = true;
  //console.log("start video", doUpdateTexture);
}

//
// videoDone
//
// Called when the video is done playing; this will terminate
// the animation.
//
function videoDone() {
  clearInterval(intervalID);
  console.log("video done called");
}

function initGUI() {
  var uiContainer = document.getElementById('ui');
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
    srcTexInfo.projection_type = event.target.value;
    console.log("proj type", srcTexInfo.projection_type);
  });

  uiContainer.appendChild(projTypeLabel);
  uiContainer.appendChild(projTypeDropdown);
  params.forEach(function(param) {
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

function deg2Rad(d) {
  return d * Math.PI / 180;
}

function rad2Deg(r) {
  return r * 180 / Math.PI;
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

function setupParams() {
  params = [];
  params.push({
    name: "uHorizontalFOV",
    label: ["horizontal fov: "],
    suffix: [""],
    value: [120],
    type: "float",
    min: [5],
    max: [170]
  });
  params.push({
    name: "uCameraPosition",
    label: ["camera position x: ", "camera position y: ", "camera position z: "],
    suffix: ["-X", "-Y", "-Z"],
    value: [0, 0, -70],
    type: "float",
    min: [-100, -100, -100],
    max: [100, 100, 100]
  });
  params.push({
    name: "uCameraOrientation",
    label: ["camera orientation x: ", "camera orientation y: "],
    suffix: ["-X", "-Y"],
    value: [0, 0],
    type: "float",
    min: [-180, -180],
    max: [180, 180]
  });
  params.push({
    name: "uSphereRadius",
    label: ["dome radius: "],
    suffix: [""],
    value: [50],
    type: "float",
    min: [1],
    max: [100]
  });
  params.push({
    name: "uSphereOrientation",
    label: ["dome orientation x: ", "dome orientation y: "],
    suffix: ["-X", "-Y"],
    value: [0, 0],
    type: "float",
    min: [-180, -180],
    max: [180, 180]
  });
  params.push({
    name: "uSphereLatitude",
    label: ["dome latitude: "],
    suffix: [""],
    value: [90],
    type: "float",
    min: [0],
    max: [180]
  });
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
}

},{}]},{},[1]);
