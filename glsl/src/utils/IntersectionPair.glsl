//we will calculate a ray-sphere intersection using a quadratic equation
//quadratic equation have at most two solutions, which can either both be real or complex numbers
struct IntersectionPair {
	vec4 minor;
	vec4 major;
	bool isReal;
};

#pragma glslify: export(IntersectionPair)
