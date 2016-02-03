vec2 getBothFOV(float theuHorizontalFOV, float theAspectRatio) {
	float vertFOV = atan(tan(theuHorizontalFOV * 0.5)/theAspectRatio) * 2.0;
	return vec2(theuHorizontalFOV, vertFOV);
}
