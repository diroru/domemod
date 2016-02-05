#pragma glslify: IntersectionPair = require('./IntersectionPair.glsl');
#pragma glslify: quadraticEquationSolution = require('./quadraticEquationSolution.glsl')

//sphereData contains position (xyz) and radius (w)
IntersectionPair getEyeSphereIntersection (vec3 eyeVec, vec3 offsetVec, vec4 sphereData) {

	//with orthographic rotation we ignore camera rotation, translation should be used instead
	//q = rotateX(q - d, cameraRotation.y) + d;
	//q = rotateY(q - d, cameraRotation.x) + d;
	vec3 q = eyeVec;
	vec3 p = sphereData.xyz + offsetVec;
	float r = sphereData.w;

	float a = dot(q, q);
	float b = - dot(q, p) * 2.0;
	float c = dot(p, p) -  r * r;

	vec3 kappa = quadraticEquationSolution(a, b, c);
	// vec4 color0 = vec4(1.0,1.0,0.0,0.5);
	// vec4 color1 = vec4(kappa.x * eyeVec, 1.0);

	//the minor result has a potentially lower Z-coord, so it should be further away from us
	//the major result has a potentially higher Z-coord, so it should be closer to us
	//BUT! since the eye vector has already a negative z component,
	//we have to switch the quadratic equation roots (so minor gets the bigger root and vice versa)
	vec4 resultMinor = vec4(offsetVec + eyeVec * kappa.y, 1.0);
	vec4 resultMajor = vec4(offsetVec + eyeVec * kappa.x, 1.0);

	bool isReal = true;

	if (kappa.z < 0.0) {
		isReal = false;
	}

	return IntersectionPair(resultMinor, resultMajor, isReal);
}

#pragma glslify: export(getEyeSphereIntersection)
