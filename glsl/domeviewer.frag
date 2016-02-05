precision highp float;
precision highp int;

#pragma glslify: import("./src/constants.glsl")
#pragma glslify: deg2Rad = require('./src/utils/deg2Rad.glsl')
#pragma glslify: rad2Deg = require('./src/utils/rad2Deg.glsl')
#pragma glslify: rotateX = require('./src/utils/rotateX.glsl')
#pragma glslify: rotateY = require('./src/utils/rotateY.glsl')
#pragma glslify: rotateZ = require('./src/utils/rotateZ.glsl')
#pragma glslify: getrectilinearRay = require('./src/utils/getrectilinearRay.glsl')
#pragma glslify: getFisheyeRay = require('./src/utils/getFisheyeRay.glsl')
#pragma glslify: getOrthogonalRay = require('./src/utils/getOrthogonalRay.glsl')
#pragma glslify: getGrid = require('./src/utils/getGrid.glsl')
#pragma glslify: IntersectionPair = require('./src/utils/IntersectionPair.glsl')
#pragma glslify: getEyeSphereIntersection = require('./src/utils/getEyeSphereIntersection.glsl')
#pragma glslify: getLongLat = require('./src/utils/getLongLat.glsl')

// const float PI = 3.14159265359;

//TODO: naming …
uniform float uHorizontalFOV; //horizontal
//all of the below are (should be!) normalized
//the eyePos is treated as an origin!
uniform vec2 uSize;
uniform sampler2D uSrcTex;

// uniform vec3 uSpherePosition;
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
vec2 mapFromLatLongToEquirectangularTexel(vec2 theLongLat) {
	return vec2(mod(theLongLat.x / PI * 0.5 + 1.0, 1.0), mod((PI - theLongLat.y) / PI + 1.0, 1.0));
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

void main() {
	vec2 aspectRatio = uSize / uSize.xx;
	//normalizing and mapping to the [-1.0,1.0] range
	//TODO: check for bugs!
	 vec2 normCoord = (gl_FragCoord.xy / uSize - vec2(0.5)) * aspectRatio * 2.0;
	//  normCoord.x = - normCoord.x;

	vec3 transformedSpherePosition = vec3(0.0);

	transformedSpherePosition = transformedSpherePosition - uCameraPosition;

	transformedSpherePosition = rotateX(transformedSpherePosition, deg2Rad(-uCameraOrientation.y));
	transformedSpherePosition = rotateY(transformedSpherePosition, deg2Rad(-uCameraOrientation.x));

	//
	// transformedSpherePosition = transformedSpherePosition + uSpherePosition;

	// transformedSpherePosition = transformedSpherePosition - vec3(0.0, 0.0, 10.0);

	// transformedSpherePosition = transformedSpherePosition + uSpherePosition - uCameraPosition - vec3(0.0, 0.0, 10.0);


	vec4 sphereData = vec4(transformedSpherePosition, uSphereRadius);

	vec3 rectilinearRay = getrectilinearRay(normCoord, deg2Rad(uHorizontalFOV));

	// rectilinearRay = rotateX(rectilinearRay, deg2Rad(uCameraOrientation.y));
	// rectilinearRay = rotateY(rectilinearRay, deg2Rad(uCameraOrientation.x));

	/*
	vec3 fisheyeRay = normalize(getFisheyeRay(normCoord, fieldOfView, deg2Rad(uCameraOrientation)));
	vec3 fisheyeOffset = vec3(0.0);

	vec3 orthographicRay = vec3(0.0, 0.0, 1.0);
	vec3 orthographicOffset = vec3(normCoord * 0.5, 0.0);
	*/
	//w is sphere radius

	/*
	vec3 mixedRay = normalize(mix(mix(fisheyeRay, rectilinearRay , frMix), orthographicRay, ofrMix));
	vec3 mixedOffset = mix(mix(fisheyeOffset, rectiliniearOffset, frMix), orthographicOffset, ofrMix);
	VectorPair sphereIntersections = getEyeSphereIntersection(mixedRay, mixedOffset, sphereData);
	*/

	vec3 rectiliniearOffset = vec3(0.0);
	IntersectionPair sphereIntersections = getEyeSphereIntersection(rectilinearRay, rectiliniearOffset, sphereData);

	//for best performance use this:
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
	vec2 longLatMinor = mod(getLongLat(sphereIntersections.minor.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLatMajor = mod(getLongLat(sphereIntersections.major.xyz, sphereData.xyz, deg2Rad(uSphereOrientation + uCameraOrientation)) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));

	float uNearPlane = -0.05 ;
	// vec2 longLat = longLat0;

	//We need to consider several, nested cases
	//remember, Z points toward us in GLSL world, so the further we look into the screen, the lower it gets

	//1. CASE: CLIPPING
	//if
	//a) there is no intersection or
	//b) the minor (farther) intersection point is in front of the near plane
	//then we fill with the background colour
	if (!sphereIntersections.isReal || sphereIntersections.minor.z > uNearPlane) {
		gl_FragColor = GREY;
	} else {
		vec2 longLatVisible;
		bool fromOutside;
		//2. CASE: "(peeking) inside the dome"
		//if
		//a) the closer point is in front of the near plane or
		//b) the closer point is outside of the dome latitude (it is on the sphere the dome is part of)
		//so we can see INSIDE of the dome (we use (if at all) the farther intersection point)
		if (sphereIntersections.major.z > uNearPlane || longLatMajor.y >= latLimit) {
			//2.1. the farther point is also outside of the dome latitude range
			if (longLatMinor.y >= latLimit) {
				discard;
			}
			//2.2. the farther point is on the dome
			//equirectangular projection
			longLatVisible = longLatMinor;
			fromOutside = false;
		} else {
			//3. CASE: looking at the dome from the outside
			//3.1. CASE: since we already made sure we are not interested in the farther point,
			//if we don't have the dome at the closer point, we can discard the pixel
			if (longLatMajor.y >= latLimit) {
				discard;
			}
			//3.2. the closer point is on the dome
			longLatVisible = longLatMajor;
			fromOutside = true;
		}
		//let's sample!
		//equirectangular projection
		if (uSrcTexProjType == 0) {
			gl_FragColor = texture2D(uSrcTex, mapFromLatLongToEquirectangularTexel(longLatVisible));
		//azimuthal projection, latitude 90°
		} else if (uSrcTexProjType == 1) {
			gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLatVisible, PI * 0.5).st);
		//azimuthal projection, latitude 180°
		} else {
			gl_FragColor = texture2D(uSrcTex, mapFromLatLongToAzimuthalTexel(longLatVisible, PI).st);
		}
		if (fromOutside) {
			gl_FragColor = mix(gl_FragColor, GREY, 0.6);
		}
		if (uShowGrid) {
			vec3 gridColour = getGrid(longLatVisible, vec3(1.0, 1.0, 0.0));
			gl_FragColor = gl_FragColor + vec4(gridColour, 1.0) * 0.2;
		}
	}
}
