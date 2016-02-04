//TODO: gratGlobalOffset maybe?
//
vec3 getLatitudeGrid(vec2 longLat, float gratOffset, float gratWidth, vec3 gratColour) {
	float aa = 0.1;
	float gr = mod(rad2Deg(longLat.y) + gratWidth * 0.5, gratOffset) - gratWidth * 0.5;
	// return mix(gratColour, vec3(0.0), smoothstep(gratWidth*0.5 - aa, gratWidth*0.5 + aa, abs(gr)));
	return mix(gratColour, vec3(0.0), step(gratWidth, abs(gr)));
}

vec3 getLongtitudeGrid(vec2 longLat, float gratOffset, float gratWidth, vec3 gratColour) {
	float aa = 0.1;
	float alpha_threshold = asin(gratOffset / gratWidth );
	float longDeg = rad2Deg(longLat.x);
	float latDeg = rad2Deg(longLat.y);
	if (longLat.y < alpha_threshold || longLat.y > (PI * 0.5 - alpha_threshold)) {
		return gratColour;
	} else {
		float go = gratWidth / sin(longLat.y);
		float gr = mod(longDeg + go * 0.5, gratOffset) - go * 0.5;
		// return mix(gratColour, vec3(0.0), smoothstep(go*0.5 - aa, go*0.5 + aa, abs(gr)));
		return mix(gratColour, vec3(0.0), step(go, abs(gr)));
	}
}


vec3 getGrid(vec2 longLat, vec3 colour) {
	vec3 longGrid_0 = getLongtitudeGrid(longLat, 45.0, 0.6, colour);
	vec3 longGrid_1 = getLongtitudeGrid(longLat, 15.0, 0.2, colour);
	vec3 latGrid_0 = getLatitudeGrid(longLat, 45.0, 0.6, colour);
	vec3 latGrid_1 = getLatitudeGrid(longLat, 15.0, 0.2, colour);
	vec3 grid_rgb = longGrid_0 + longGrid_1 + latGrid_0 + latGrid_1;
	//TODO eg. vec3(0.0) as const
	return clamp(grid_rgb, vec3(0.0), vec3(1.0));
}

#pragma glslify: export(getGrid)
