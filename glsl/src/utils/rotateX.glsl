// #pragma glslify: import("consants.glsl")
// const float PI = 3.14159265359;

vec3 rotateX(vec3 v, float theta) {
  float x = v.x;
  float y = v.y * cos(theta) - v.z * sin(theta);
  float z = v.y * sin(theta) + v.z * cos(theta);
  return vec3(x,y,z);
}

#pragma glslify: export(rotateX)
