var canvas;
var gl;
var intervalID;

var cubeVerticesBuffer;
var cubeVerticesTextureCoordBuffer;
var cubeVerticesIndexBuffer;
var cubeVerticesIndexBuffer;
var cubeRotation = 0.0;
var lastCubeUpdateTime = 0;

/* textures */
var sourceTexture;
var cellTex_01_tex;
var cellTex_01_img;
var cellTex_02_tex;
var cellTex_02_img;
var cellTex_03_tex;
var cellTex_03_img;

var mvMatrix;
var shaderProgram;
//attribute locations
var vertexPositionAttribute;
var textureCoordAttribute;
//uniform locations
var sizeULoc,
    srcTexULoc,
    cellTex_01_ULoc,
    cellTex_02_ULoc,
    cellTex_03_ULoc,
    cellSizeULoc,
    cellTexSizeULoc,
    pixelSizeULoc,
    rotationULoc,
    zoomULoc,
    patternTypeULoc,

    sphereRadiusULoc,
    spherePositionULoc,
    horizontalFOVULoc;

var videoElement;

/*parameter*/
var patternType = 0,
    pixelSize = 8,
    zoomFactor = 1.0,
    rotationFactor = 0.0,

    horizontalFOV;

var screenWidth, screenHeight;

//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  // fitCanvas();
  // window.addEventListener('resize', fitCanvas, false);
  screenWidth = screen.width;
  screenHeight = screen.height;
  horizontalFOV = 120;
  console.log("screen dimensions: ", screenWidth, "x", screenHeight);
  setupFileHandling();
  videoElement = document.getElementById("vid-source");
  canvas = document.getElementById("glcanvas");
  document.getElementById("fov-input").addEventListener('input',
    function(event) {
      horizontalFOV = event.target.value;
    });
  initWebGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working

  if (gl) {
    fitCanvas();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    //gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    //gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.

    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.

    initBuffers();

    // Next, load and set up the textures we'll be using.

    initTextures();

    // Start listening for the canplaythrough event, so we don't
    // start playing the video until we can do so without stuttering

    videoElement.addEventListener("canplaythrough", startVideo, true);

    // Start listening for the ended event, so we can stop the
    // animation when the video is finished playing.

    videoElement.addEventListener("ended", videoDone, true);
  }
}

//see:
//http://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
//http://stackoverflow.com/questions/11819768/webgl-gl-viewport-change
//http://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

function fitCanvas() {
  var width = gl.canvas.clientWidth;
  var height = gl.canvas.clientHeight;
  if (gl.canvas.width != width || gl.canvas.height != height) {
     gl.canvas.width = width;
     gl.canvas.height = height;
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
  /*
  cellTex_01_tex = initTexture(cellTex_01_img, './assets/tex/cell_tex_01.png');
  cellTex_02_tex = initTexture(cellTex_02_img, './assets/tex/cell_tex_02.png');
  cellTex_03_tex = initTexture(cellTex_03_img, './assets/tex/cell_tex_03.png');
  */
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
        gl.UNSIGNED_BYTE, videoElement);
  /*for NPOT textures, see as well: https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences*/
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  /*for pot textures*/
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  // gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

//
// startVideo
//
// Starts playing the video, so that it will start being used
// as our texture.
//
function startVideo() {
  videoElement.play();
  videoElement.muted = true;
  intervalID = setInterval(drawScene, 30);
}

//
// videoDone
//
// Called when the video is done playing; this will terminate
// the animation.
//
function videoDone() {
  clearInterval(intervalID);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  updateTexture();
  fitCanvas();
  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
  gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

  //setting uniforms
  gl.uniform2f(sizeULoc, gl.canvas.clientWidth, gl.canvas.clientHeight);
  // gl.uniform2f(sizeULoc, 1920.0, 1080.0);
  gl.uniform2f(cellSizeULoc, 4.0, 4.0); //once
  gl.uniform2f(cellTexSizeULoc, 1024, 1024); //once, FIX THIS
  gl.uniform1f(pixelSizeULoc, pixelSize); //make interactive
  gl.uniform3f(zoomULoc, 0, 0, zoomFactor); //make interactive
  gl.uniform1f(rotationULoc, Math.PI * rotationFactor / 180); //make interactive
  gl.uniform1i(patternTypeULoc, patternType);
  gl.uniform1f(sphereRadiusULoc, 2.0);
  gl.uniform3f(spherePositionULoc, 0.0, 0.0, 10.0);
  gl.uniform1f(horizontalFOVULoc, deg2Rad(horizontalFOV));

  // Specify the texture to map onto the faces.

  var unitNo = 0;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
  gl.uniform1i(srcTexULoc, unitNo);

  unitNo++;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, cellTex_01_tex);
  gl.uniform1i(cellTex_01_ULoc, unitNo);
  unitNo++;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, cellTex_02_tex);
  gl.uniform1i(cellTex_02_ULoc, unitNo);
  unitNo++;
  gl.activeTexture(gl.TEXTURE0 + unitNo);
  gl.bindTexture(gl.TEXTURE_2D, cellTex_03_tex);
  gl.uniform1i(cellTex_03_ULoc, unitNo);

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
  loadFiles(['./glsl/domeviewer.vert', './glsl/domeviewer.frag'], function (shaderText) {
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
      srcTexULoc = gl.getUniformLocation(shaderProgram, "src_tex");
      cellTex_01_ULoc = gl.getUniformLocation(shaderProgram, "cell_tex_01");
      cellTex_02_ULoc = gl.getUniformLocation(shaderProgram, "cell_tex_02");
      cellTex_03_ULoc = gl.getUniformLocation(shaderProgram, "cell_tex_03");
      sizeULoc = gl.getUniformLocation(shaderProgram, "size");
      cellSizeULoc = gl.getUniformLocation(shaderProgram, "cell_size");
      cellTexSizeULoc = gl.getUniformLocation(shaderProgram, "cell_tex_size");
      pixelSizeULoc = gl.getUniformLocation(shaderProgram, "pixelSize");
      rotationULoc = gl.getUniformLocation(shaderProgram, "rotation");
      zoomULoc = gl.getUniformLocation(shaderProgram, "zoom");
      patternTypeULoc = gl.getUniformLocation(shaderProgram, "patternType");
      sphereRadiusULoc = gl.getUniformLocation(shaderProgram, "sphereRadius");
      spherePositionULoc = gl.getUniformLocation(shaderProgram, "spherePosition");
      horizontalFOVULoc = gl.getUniformLocation(shaderProgram, "horizontalFOV");

      //TODO: set pattern textures, since they won't change

  }, function (url) {
      alert('Failed to download "' + url + '"');
  });

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

/* user interface callbacks*/
function setPatternType(event) {
  patternType = event.target.value;
}
function setPixelSize(event) {
  pixelSize = event.target.value;
}
function setZoom(event) {
  console.log(event.target.value);
  zoomFactor = 1.0 / event.target.value;
}
function setRotation(event) {
  rotationFactor = event.target.value;
}

function setupFileHandling() {
  //source: http://codepen.io/SpencerCooley/pen/JtiFL/
  //check if browser supports file api and filereader features
  if (window.File && window.FileReader && window.FileList && window.Blob) {

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


    //this function is called when the input loads an image
  	function renderImage(file){
  		var reader = new FileReader();
  		reader.onload = function(event){
  			the_url = event.target.result
        //of course using a template library like handlebars.js is a better solution than just inserting a string
  			$('#preview').html("<img src='"+the_url+"' />")
  			$('#name').html(file.name)
  			$('#size').html(humanFileSize(file.size, "MB"))
  			$('#type').html(file.type)
  		}

      //when the file is read it triggers the onload event above.
  		reader.readAsDataURL(file);
  	}


    //this function is called when the input loads a video
  	function renderVideo(file){
  		var reader = new FileReader();
  		reader.onload = function(event){
  			the_url = event.target.result
        //of course using a template library like handlebars.js is a better solution than just inserting a string
        document.getElementById("vid-source").setAttribute('src', the_url);
        // console.log("setting video source to", the_url);
        // $('#data-vid').html("<video autoplay muted loop><source id='vid-source' src='"+the_url+"' type='video/mp4'></video>")
        /*
        $('#name-vid').html(file.name)
  			$('#size-vid').html(humanFileSize(file.size, "MB"))
  			$('#type-vid').html(file.type)
        */
  		}

      //when the file is read it triggers the onload event above.
  		reader.readAsDataURL(file);
  	}


    /*
    //watch for change on the
  	$( "#the-photo-file-field" ).change(function() {
  		console.log("photo file has been chosen")
  		//grab the first image in the fileList
  		//in this example we are only loading one file.
  		console.log(this.files[0].size)
  		renderImage(this.files[0])

  	});
    */
    //console.log(document);
    document.getElementById("the-video-file-field").addEventListener('change', function() {
  		console.log("video file has been chosen")
  		//grab the first image in the fileList
  		//in this example we are only loading one file.
  		console.log(this.files[0].size)
  		renderVideo(this.files[0])
  	}, false);

  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}

function deg2Rad(d) {
  return d * Math.PI / 180;
}

function rad2Deg(r) {
  return r * 180 / Math.PI;
}
