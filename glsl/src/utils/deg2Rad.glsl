const float PI = 3.14159265359;

float deg2Rad(float d) {
  return d * PI / 180.0;
}

vec2 deg2Rad(vec2 d) {
  return vec2(deg2Rad(d.x), deg2Rad(d.y));
}

vec3 deg2Rad(vec3 d) {
  return vec3(deg2Rad(d.x), deg2Rad(d.y), deg2Rad(d.z));
}

#pragma glslify: export(deg2Rad)
