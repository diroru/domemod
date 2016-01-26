precision highp float;
precision highp int;

attribute highp vec3 aVertexPosition;
attribute highp vec2 aTextureCoord;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = vec4(aVertexPosition, 1.0);
  //TODO: remove this
  vTextureCoord = aTextureCoord;
}
