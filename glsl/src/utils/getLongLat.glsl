#pragma glslify: rotateX = require('./rotateX.glsl')
#pragma glslify: rotateY = require('./rotateY.glsl')

const float PI = 3.14159265359;

vec2 getLongLat(vec3 intersection, vec3 spherePosition, vec2 rotation) {
	vec3 sphereVec = normalize(intersection - spherePosition);
	vec3 v = sphereVec;
	v = rotateX(v, rotation.y);
	v = rotateY(v, rotation.x);
	float lambda = atan(v.z, v.x);
	float mu = PI * 0.5 - atan(v.y, length(vec2(v.x,v.z)));
	return vec2(lambda, mu);
}

#pragma glslify: export(getLongLat)
