precision highp float;
precision highp int;

attribute highp vec3 aVertexPosition;

void main(void) {
  gl_Position = vec4(aVertexPosition, 1.0);
  //TODO: remove this
}
