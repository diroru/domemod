bool isInsideInterval(vec2 source, vec2 intervalLow, vec2 intervalHigh) {
	return all(greaterThanEqual(source,intervalLow)) && all(lessThanEqual(source,intervalHigh));
}

bool isInsideInterval(vec2 source) {
	return isInsideInterval(source, vec2(0.0), vec2(1.0));
}

#pragma glslify: export(isInsideInterval)
