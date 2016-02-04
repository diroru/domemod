vec3 getOrthogonalRay(vec2 screenCoordNorm, vec2 rotation) {

	vec3 result = vec3(0.0, 0.0, 1.0);
	//result = rotateX(result-offset, rotation.y) + offset;
	//result = rotateY(result-offset, rotation.x) + offset;

	return normalize(result - vec3(screenCoordNorm, 0.0));
	//return normalize(result - getOrthogonalScreenOffset(screenCoordNorm));
}

#pragma glslify: export(getOrthogonalRay)
