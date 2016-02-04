precision highp float;
precision highp int;

// #pragma glslify: import("./src/utils/constants.glsl")
#pragma glslify: deg2Rad = require('./src/utils/deg2Rad.glsl')
#pragma glslify: rad2Deg = require('./src/utils/rad2Deg.glsl')
#pragma glslify: rotateX = require('./src/utils/rotateX.glsl')
#pragma glslify: rotateY = require('./src/utils/rotateY.glsl')
#pragma glslify: rotateZ = require('./src/utils/rotateZ.glsl')
#pragma glslify: quadraticEquationSolution = require('./src/utils/quadraticEquationSolution.glsl')
#pragma glslify: getRectiliniearRay = require('./src/utils/getRectiliniearRay.glsl')
#pragma glslify: getFisheyeRay = require('./src/utils/getFisheyeRay.glsl')
#pragma glslify: getOrthogonalRay = require('./src/utils/getOrthogonalRay.glsl')
#pragma glslify: getGrid = require('./src/utils/getGrid.glsl')



const float PI = 3.14159265359;

//TODO: naming …
uniform float uHorizontalFOV; //horizontal
//all of the below are (should be!) normalized
//the eyePos is treated as an origin!
uniform vec2 uSize;
uniform sampler2D uSrcTex;

uniform vec3 uSpherePosition;
uniform vec2 uSphereOrientation;
uniform float uSphereRadius;
uniform float uSphereLatitude;

uniform vec2 uCameraOrientation;
uniform vec3 uCameraPosition;

uniform bool uShowGrid;
uniform int uSrcTexProjType;
// uniform float uNearPlane;

uniform float frMix;
uniform float ofrMix;

// const float PI = 3.1415926535897932384626433832;

//this takes latitude and longitude coordinates (possibly of the [[0,TWO_PI],[0,PI]] range)
//and maps them to [[0,1],[0,1]]
vec2 mapFromLatLongToPanoramicTexel(vec2 theLongLat) {
	return vec2(mod(theLongLat.x / PI * 0.5 + 1.0, 1.0), mod(theLongLat.y / PI + 1.0, 1.0));
}

vec3 getOrthogonalScreenOffset(vec2 screenCoordNorm) {
	vec3 d = vec3(screenCoordNorm * 0.5, 0.0); //distance to origin, needed for the orthographic camera
	return normalize(d);
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
	vec3 p = sphereData.xyz + offsetVec;
	float r = sphereData.w;

	float a = dot(q, q);
	float b = - dot(q, p) * 2.0;
	float c = dot(p, p) -  r * r;

	vec3 kappa = quadraticEquationSolution(a, b, c);
	// vec4 color0 = vec4(1.0,1.0,0.0,0.5);
	// vec4 color1 = vec4(kappa.x * eyeVec, 1.0);

	vec4 result0 = vec4(offsetVec + eyeVec * kappa.x, 1.0);
	vec4 result1 = vec4(offsetVec + eyeVec * kappa.y, 1.0);

	bool isReal = true;

	if (kappa.z < 0.0) {
		isReal = false;
	}

	return VectorPair(result0, result1, isReal);
}

void main() {
	vec2 aspectRatio = uSize / uSize.xx;
	//normalizing and mapping to the [-1.0,1.0] range
	//TODO: check for bugs!
	 vec2 normCoord = (gl_FragCoord.xy / uSize - vec2(0.5)) * aspectRatio * 2.0;
	//  normCoord.x = - normCoord.x;

	vec3 transformedSpherePosition = vec3(0.0);

	transformedSpherePosition = transformedSpherePosition + uSpherePosition - uCameraPosition;

	transformedSpherePosition = rotateX(transformedSpherePosition, deg2Rad(uCameraOrientation.y));
	transformedSpherePosition = rotateY(transformedSpherePosition, deg2Rad(uCameraOrientation.x));

	// transformedSpherePosition = transformedSpherePosition - vec3(0.0, 0.0, 10.0);

	// transformedSpherePosition = transformedSpherePosition + uSpherePosition - uCameraPosition - vec3(0.0, 0.0, 10.0);


	vec4 sphereData = vec4(transformedSpherePosition, uSphereRadius);

	vec3 rectiliniearRay = getRectiliniearRay(normCoord, deg2Rad(uHorizontalFOV));

	// rectiliniearRay = rotateX(rectiliniearRay, deg2Rad(uCameraOrientation.y));
	// rectiliniearRay = rotateY(rectiliniearRay, deg2Rad(uCameraOrientation.x));

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
	vec2 longLat0 = mod(getLongLat(sphereIntersections.minor.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLat1 = mod(getLongLat(sphereIntersections.major.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));

	float uNearPlane = 0.05 ;
	vec2 longLat = longLat0;

	//TODO: comments
	if (sphereIntersections.major.z < -uNearPlane || !sphereIntersections.isReal ) {
		gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
	} else {
		if (sphereIntersections.minor.z < uNearPlane || longLat.y >= latLimit) {
			if (longLat1.y >= latLimit) {
				discard;
			}
			//gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);
			if (uSrcTexProjType == 0) {
				gl_FragColor = texture2D(uSrcTex, mapFromLatLongToPanoramicTexel(longLat1));
			} else if (uSrcTexProjType == 1) {
				gl_FragColor = texture2D(uSrcTex, 	mapFromLatLongToAzimuthalTexel(longLat1, PI * 0.5).st);
			} else {
				gl_FragColor = texture2D(uSrcTex, 	mapFromLatLongToAzimuthalTexel(longLat1, PI).st);
			}
			if (uShowGrid) {
				vec3 gridColour = getGrid(longLat1, vec3(1.0, 1.0, 0.0));
				gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.2;
			}
			// gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat1, latLimit	).st);
		  // gl_FragColor = texture2D(uSrcTex, src_coord / uSize);
		} else {
			if (longLat.y >= latLimit) {
				discard;
			}
			//gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);
			if (uSrcTexProjType == 0) {
				gl_FragColor = texture2D(uSrcTex, mapFromLatLongToPanoramicTexel(longLat));
			} else if (uSrcTexProjType == 1) {
				gl_FragColor = texture2D(uSrcTex, 	mapFromLatLongToAzimuthalTexel(longLat, PI * 0.5).st);
			} else {
				gl_FragColor = texture2D(uSrcTex, 	mapFromLatLongToAzimuthalTexel(longLat, PI).st);
			}
			 gl_FragColor = mix(gl_FragColor, vec4(0.2,0.2,0.2,1.0), 0.6);
			 if (uShowGrid) {
				 vec3 gridColour = getGrid(longLat, vec3(1.0, 1.0, 0.0));
			 	 gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.35;
		 	 }
 		// 	 gl_FragColor = mix(texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st), vec4(0.2,0.2,0.2,1.0), 0.6);
		  // gl_FragColor = texture2D(uSrcTex, src_coord / uSize);
		}
	}
	// gl_FragColor = vec4(1.0,0.0,0.0,1.0);
}
