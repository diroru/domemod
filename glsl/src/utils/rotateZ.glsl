// #pragma glslify: import("consants.glsl")
// const float PI = 3.14159265359;

vec3 rotateZ(vec3 v, float theta) {
  float z = v.z;
  float y = v.y * cos(theta) - v.x * sin(theta);
  float x = v.y * sin(theta) + v.x * cos(theta);
  return vec3(x,y,z);
}

#pragma glslify: export(rotateZ)
