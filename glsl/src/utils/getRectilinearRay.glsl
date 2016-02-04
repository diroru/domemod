//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle
//the result is normalized
//TODO: calculate focalLength on CPU and make it uniform
vec3 getRectilinearRay(vec2 screenCoordNorm, float horizontalFOV) {
	float focalLength = 0.5 / (tan(horizontalFOV * 0.5));
	//rectilinear
	//TODO: offset
	float x = screenCoordNorm.x * 0.5;
	float y = screenCoordNorm.y * 0.5;
	float z = -focalLength;

	return normalize(vec3(x,y,z));
}

#pragma glslify: export(getRectilinearRay)
