//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle
//the result is normalized
vec3 getFisheyeRay(vec2 screenCoordNorm, vec2 fieldOfView, vec2 rotation) {

	float theta = atan(screenCoordNorm.y, -screenCoordNorm.x);
	float rho = length(screenCoordNorm * 0.5) * fieldOfView.x;

	//fisheye
	float x = cos(theta) * sin(rho);
	float y = cos(rho);
	float z = sin(theta) * sin(rho);

	vec3 result = vec3(x,y,z);
	//TODO: check if this goes to the rectilinear camera
	result = rotateX(result, PI * 0.5);
	result = rotateX(result, rotation.y);
	result = rotateY(result, rotation.x);

	return result;
}

#pragma glslify: export(getFisheyeRay)
