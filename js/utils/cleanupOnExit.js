//cleanupOnExit takes five params:
//1: the context
//2: an array of used textures
//3: an array of used buffers
//4: an array of used renderbuffers
//5: an array of used framebuffers

function cleanupOnExit (gl, textureArray, bufferArray, renderbufferArray, framebufferArray) {
  window.addEventListener('beforeunload', handleUnload.bind(null, gl, textureArray, bufferArray, renderbufferArray, framebufferArray));
}

//source: http://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use
function handleUnload(gl, textureArray, bufferArray, renderbufferArray, framebufferArray, event) {
  console.log("unload called.");
  var numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  for (var unit = 0; unit < numTextureUnits; ++unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // Delete all your resources

  try {
    textureArray.forEach(function (texture) {
      gl.deleteTexture(texture);
    });
    bufferArray.forEach(function (buffer) {
      gl.deleteBuffer(buffer);
    });
    renderbufferArray.forEach(function (buffer) {
      gl.deleteRenderbuffer(buffer);
    });
    framebufferArray.forEach(function (buffer) {
      gl.deleteFramebuffer(buffer);
    });
  } catch (e) {
    console.error(e);
  }
}

module.exports = cleanupOnExit;
