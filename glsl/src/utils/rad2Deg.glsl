const float PI = 3.14159265359;

float rad2Deg(float r) {
  return r * 180.0 / PI;
}

vec2 rad2Deg(vec2 r) {
  return vec2(rad2Deg(r.x), rad2Deg(r.y));
}

vec3 rad2Deg(vec3 r) {
  return vec3(rad2Deg(r.x), rad2Deg(r.y), rad2Deg(r.z));
}

#pragma glslify: export(rad2Deg)
