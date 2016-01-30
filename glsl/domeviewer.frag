precision highp float;
precision highp int;

const float PI = 3.14159265359;

//TODO: naming …
uniform float uHorizontalFOV; //horizontal
//all of the below are (should be!) normalized
//the eyePos is treated as an origin!
uniform vec2 size;
uniform sampler2D panoramicTexture;
uniform sampler2D src_tex;

uniform vec3 uSpherePosition;
uniform vec2 uSphereOrientation;
uniform float uSphereRadius;
uniform float uSphereLatitude;

uniform vec2 uCameraOrientation;
uniform vec3 uCameraPosition;

uniform bool uShowGrid;

uniform float frMix;
uniform float ofrMix;

// const float PI = 3.1415926535897932384626433832;

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

vec3 rotateX(vec3 v, float theta) {
  float x = v.x;
  float y = v.y * cos(theta) - v.z * sin(theta);
  float z = v.y * sin(theta) + v.z * cos(theta);
  return vec3(x,y,z);
}

vec3 rotateY(vec3 v, float theta) {
  float y = v.y;
  float x = v.x * cos(theta) - v.z * sin(theta);
  float z = v.x * sin(theta) + v.z * cos(theta);
  return vec3(x,y,z);
}

vec3 rotateZ(vec3 v, float theta) {
  float z = v.z;
  float y = v.y * cos(theta) - v.x * sin(theta);
  float x = v.y * sin(theta) + v.x * cos(theta);
  return vec3(x,y,z);
}

vec2 getBothFOV(float theuHorizontalFOV, float theAspectRatio) {
	float vertFOV = atan(tan(theuHorizontalFOV * 0.5)/theAspectRatio) * 2.0;
	return vec2(theuHorizontalFOV, vertFOV);
}

float deg2Rad(float d) {
  return d * PI / 180.0;
}

vec2 deg2Rad(vec2 d) {
  return vec2(deg2Rad(d.x), deg2Rad(d.y));
}

vec3 deg2Rad(vec3 d) {
  return vec3(deg2Rad(d.x), deg2Rad(d.y), deg2Rad(d.z));
}

float rad2Deg(float r) {
  return r * 180.0 / PI;
}

//this takes latitude and longitude coordinates (possibly of the [[0,TWO_PI],[0,PI]] range)
//and maps them to [[0,1],[0,1]]
vec2 mapFromLatLongToPanoramicTexel(vec2 theLongLat) {
	return vec2(mod(theLongLat.x / PI * 0.5 + 1.0, 1.0), mod(theLongLat.y / PI + 1.0, 1.0));
}

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

//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle
//the result is normalized
//TODO: implement offset
/*
vec3 getRectiliniearRay(vec2 screenCoordNorm, float horizontalFOV, vec2 rotation) {
	float focalLength = 0.5 / (tan(horizontalFOV * 0.5));

	//rectilinear
	//TODO: offset
	float x = -screenCoordNorm.x * 0.5;
	float y = -screenCoordNorm.y * 0.5;
	float z = focalLength;

	vec3 result = normalize(vec3(x,y,z));
	result = rotateX(result, rotation.y);
	result = rotateY(result, rotation.x);

	return result;
}
*/
//we presume that the screen coordinates are normalized to [-1,1], where [0,0] is the middle
//the result is normalized
//TODO: calculate focalLength on CPU and make it uniform
vec3 getRectiliniearRay(vec2 screenCoordNorm, float horizontalFOV) {
	float focalLength = 0.5 / (tan(horizontalFOV * 0.5));
	//rectilinear
	//TODO: offset
	float x = -screenCoordNorm.x * 0.5;
	float y = -screenCoordNorm.y * 0.5;
	float z = focalLength;

	return normalize(vec3(x,y,z));
}


vec3 getOrthogonalScreenOffset(vec2 screenCoordNorm) {
	vec3 d = vec3(screenCoordNorm * 0.5, 0.0); //distance to origin, needed for the orthographic camera
	return normalize(d);
}


vec3 getOrthogonalRay(vec2 screenCoordNorm, vec2 rotation) {

	vec3 result = vec3(0.0, 0.0, 1.0);
	//result = rotateX(result-offset, rotation.y) + offset;
	//result = rotateY(result-offset, rotation.x) + offset;

	return normalize(result - vec3(screenCoordNorm, 0.0));
	//return normalize(result - getOrthogonalScreenOffset(screenCoordNorm));
}

vec3 updatespherePositionitionOrtho(vec3 spherePosition, vec3 orthoOffset) {
	return spherePosition - orthoOffset;
}

//this takes latitude and longitude coordinates (possibly of the [[0,TWO_PI],[0,PI]] range)
//converts them to polar coordinates and maps them to [[0,1],[0,1]]
//NB: the radius is passed as a third parameter so that clipping for "less than 360°" asimuthal panoramas may be done
vec3 mapFromLatLongToAzimuthalTexel(vec2 theLongLat, float verticalFOV) {
	//the radius should be in the range [0,0.5]
	float radius = mod(theLongLat.y + PI, PI) * (0.5 / verticalFOV);
	float s = 0.5 + cos(theLongLat.x) * radius;
	float t = 0.5 + sin(theLongLat.x) * radius;
	return vec3(s,t,radius);
}

vec2 getLongLat(vec3 intersection, vec3 spherePosition, vec2 rotation) {
	vec3 sphereVec = normalize(intersection - spherePosition);
	vec3 v = sphereVec;
	v = rotateX(v, rotation.y + PI*0.5);
	v = rotateY(v, rotation.x);
	float lambda = atan(v.z, v.x);
	float mu = PI * 0.5 - atan(v.y, length(vec2(v.x,v.z)));
	return vec2(lambda, mu);
}

bool isInsideInterval(vec2 source, vec2 intervalLow, vec2 intervalHigh) {
	return all(greaterThanEqual(source,intervalLow)) && all(lessThanEqual(source,intervalHigh));
}

bool isInsideInterval(vec2 source) {
	return isInsideInterval(source, vec2(0.0), vec2(1.0));
}

struct VectorPair {
	vec4 minor;
	vec4 major;
	bool isReal;
};

//sphereData contains position (xyz) and radius (w)
VectorPair getEyeSphereIntersection (vec3 eyeVec, vec3 offsetVec, vec4 sphereData) {

	//with orthographic rotation we ignore camera rotation, translation should be used instead
	//q = rotateX(q - d, cameraRotation.y) + d;
	//q = rotateY(q - d, cameraRotation.x) + d;
	vec3 q = eyeVec;
	vec3 p = sphereData.xyz - offsetVec;
	float r = sphereData.w;

	float a = dot(q, q);
	float b = - dot(q, p) * 2.0;
	float c = dot(p, p) -  r * r;

	vec3 kappa = quadraticEquationSolution(a, b, c);
	vec4 color0 = vec4(1.0,1.0,0.0,0.5);
	vec4 color1 = vec4(kappa.x * eyeVec, 1.0);

	vec4 result0 = vec4(offsetVec + eyeVec * kappa.x, 1.0);
	vec4 result1 = vec4(offsetVec + eyeVec * kappa.y, 1.0);

	bool isReal = true;

	if (kappa.z < 0.0) {
		isReal = false;
	}

	return VectorPair(result0, result1, isReal);
}

//TODO: gratGlobalOffset maybe?
//
vec3 getLatitudeGrid(vec2 longLat, float gratOffset, float gratWidth, vec3 gratColour) {
	float aa = 0.1;
	float gr = mod(rad2Deg(longLat.y) + gratWidth * 0.5, gratOffset) - gratWidth * 0.5;
	return mix(gratColour, vec3(0.0), smoothstep(gratWidth*0.5 - aa, gratWidth*0.5 + aa, abs(gr)));
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
		return mix(gratColour, vec3(0.0), smoothstep(go*0.5 - aa, go*0.5 + aa, abs(gr)));
	}
	/*

	float go = gratOffset * abs(sin(deg2Rad(longLat.y)));
	float gr = mod(rad2Deg(longLat.x + gratWidth * 0.5), gratOffset);
	//float go = gratOffset * (1.0 - abs(longLat.y - 90.0) / 90.0);

	return mix(gratColour, vec4(0.0), step(go, gr));
	*/
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

void main() {
	vec2 aspectRatio = size / size.xx;
	//normalizing and mapping to the [-1.0,1.0] range
	//TODO: check for bugs!
	 vec2 normCoord = (gl_FragCoord.xy / size - vec2(0.5)) * aspectRatio * 2.0;
	//  normCoord.x = - normCoord.x;

	vec3 transformedSpherePosition = uSpherePosition - uCameraPosition;
	transformedSpherePosition = rotateX(transformedSpherePosition, deg2Rad(uCameraOrientation.y));
	transformedSpherePosition = rotateY(transformedSpherePosition, deg2Rad(uCameraOrientation.x));
	vec4 sphereData = vec4(transformedSpherePosition, uSphereRadius);

	//already normalized?!
	vec3 rectiliniearRay = getRectiliniearRay(normCoord, deg2Rad(uHorizontalFOV));
	vec3 rectiliniearOffset = vec3(0.0);

	/*
	vec3 fisheyeRay = normalize(getFisheyeRay(normCoord, fieldOfView, deg2Rad(uCameraOrientation)));
	vec3 fisheyeOffset = vec3(0.0);

	vec3 orthographicRay = vec3(0.0, 0.0, 1.0);
	vec3 orthographicOffset = vec3(normCoord * 0.5, 0.0);
	*/
	//w is sphere radius

	/*
	vec3 mixedRay = normalize(mix(mix(fisheyeRay, rectiliniearRay , frMix), orthographicRay, ofrMix));
	vec3 mixedOffset = mix(mix(fisheyeOffset, rectiliniearOffset, frMix), orthographicOffset, ofrMix);
	VectorPair sphereIntersections = getEyeSphereIntersection(mixedRay, mixedOffset, sphereData);
	*/
	VectorPair sphereIntersections = getEyeSphereIntersection(rectiliniearRay, rectiliniearOffset, sphereData);


//	vec4 sphereIntersection =  getEyeSphereIntersection(rectiliniearRay, rectiliniearOffset, sphereData);
	//vec4 sphereIntersection[2] = vec4[](sphereIntersections.minor, sphereIntersections.major);

	//for performance use this:
	/*
	if (!sphereIntersections.isReal) {
		discard;
	}*/



	//this should be a uniform
	float latLimit = deg2Rad(uSphereLatitude);
	//setting ray to intersection point
	// vec2 longLat0 = mod(getLongLat(ray * kappa.x, p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat1 = mod(getLongLat(ray * kappa.y, p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat0 = mod(getLongLat(sphereIntersection[0], p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat1 = mod(getLongLat(sphereIntersection[1], p, sphereOrientation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLat0 = mod(getLongLat(sphereIntersections.minor.xyz, sphereData.xyz, deg2Rad(uSphereOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLat1 = mod(getLongLat(sphereIntersections.major.xyz, sphereData.xyz, deg2Rad(uSphereOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));

	vec2 longLat = longLat0;

	float nearPlane = 0.01;

	if (sphereIntersections.major.z < -nearPlane || !sphereIntersections.isReal ) {
		gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
	} else {
		if (sphereIntersections.minor.z < nearPlane || longLat.y >= latLimit) {
			if (longLat1.y >= latLimit) {
				discard;
			}
			//gl_FragColor = texture2D(src_tex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);
			gl_FragColor = texture2D(src_tex, mapFromLatLongToPanoramicTexel(longLat1));
			if (uShowGrid) {
				vec3 gridColour = getGrid(longLat1, vec3(1.0, 1.0, 0.0));
				gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.2;
			}
			// gl_FragColor = texture2D(src_tex, mapFromLatLongToAzimuthalTexel(longLat1, latLimit	).st);
		  // gl_FragColor = texture2D(src_tex, src_coord / size);
		} else {
			if (longLat.y >= latLimit) {
				discard;
			}
			//gl_FragColor = texture2D(src_tex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);
			 gl_FragColor = mix(texture2D(src_tex, mapFromLatLongToPanoramicTexel(longLat)), vec4(0.2,0.2,0.2,1.0), 0.6);
			 if (uShowGrid) {
				 vec3 gridColour = getGrid(longLat, vec3(1.0, 1.0, 0.0));
			 	 gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.35;
		 	 }
 		// 	 gl_FragColor = mix(texture2D(src_tex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st), vec4(0.2,0.2,0.2,1.0), 0.6);
		  // gl_FragColor = texture2D(src_tex, src_coord / size);
		}
	}
}
