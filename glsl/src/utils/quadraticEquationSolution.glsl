vec3 quadraticEquationSolution(float a, float b, float c) {
	float d = b * b - 4.0 * a * c;
	vec3 result0 = vec3(-1.0);
	vec3 result1 = vec3((-b - sqrt(d)) / (a * 2.0), (-b + sqrt(d)) / (a * 2.0), 1.0);

	//we will check the third element of the vector, to see if we have a valid solution
	if (d < 0.0) {
		return result0;
	} else {
		return result1;
	}

	//return mix(result1,result0,step(d,0.0));
}

#pragma glslify: export(quadraticEquationSolution)
