precision highp float;
precision highp int;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

const float PI = 3.14159265359;

//TODO: better naming
uniform highp vec2 size;
uniform sampler2D src_tex;
uniform sampler2D cell_tex_01;
uniform sampler2D cell_tex_02;
uniform sampler2D cell_tex_03;

uniform highp vec2 cell_size;
uniform highp vec2 cell_tex_size;
//uniform float scale;
uniform highp float pixelSize;
// uniform float lineShift;
uniform highp float rotation;
// uniform vec2 global_offset;

uniform vec3 zoom;
uniform int patternType;

void main() {
 	vec2 src_coord = gl_FragCoord.xy; //in pixels, flipping because
	gl_FragColor = texture2D(src_tex, src_coord / size);
  //gl_FragColor = vec4(src_coord / size, 0.0, 1.0);
  //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
