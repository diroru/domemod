// #pragma glslify: import("consants.glsl")
// const float PI = 3.14159265359;

vec3 rotateY(vec3 v, float theta) {
  float y = v.y;
  float x = v.x * cos(theta) - v.z * sin(theta);
  float z = v.x * sin(theta) + v.z * cos(theta);
  return vec3(x,y,z);
}

#pragma glslify: export(rotateY)
