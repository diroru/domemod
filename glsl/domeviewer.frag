precision highp float;
precision highp int;

/*
varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

const float PI = 3.14159265359;

//TODO: better naming
uniform highp vec2 size;
uniform sampler2D cell_tex_01;
uniform sampler2D cell_tex_02;
uniform sampler2D cell_tex_03;

uniform highp vec2 cell_size;
uniform highp vec2 cell_tex_size;
//uniform float scale;
uniform highp float pixelSize;
// uniform float lineShift;
uniform highp float rotation;
// uniform vec2 global_offset;

uniform vec3 zoom;
uniform int patternType;
*/

uniform float horizontalFOV; //horizontal
//all of the below are (should be!) normalized
//the eyePos is treated as an origin!
uniform vec2 size;
uniform sampler2D panoramicTexture;
uniform sampler2D src_tex;

uniform vec3 spherePosition;
uniform vec2 sphereRotation;
uniform float sphereRadius;

uniform vec2 cameraRotation;

uniform float frMix;
uniform float ofrMix;

const float PI = 3.1415926535897932384626433832;

vec3 quadraticEquationSolution(float a, float b, float c) {
	float d = b * b - 4.0 * a * c;
	vec3 result0 = vec3(-1.0);
	vec3 result1 = vec3( (-b - sqrt(d)) / (a * 2.0), (-b + sqrt(d)) / (a * 2.0), 1.0);

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

vec2 getBothFOV(float theHorizontalFOV, float theAspectRatio) {
	float vertFOV = atan(tan(theHorizontalFOV * 0.5)/theAspectRatio) * 2.0;
	return vec2(theHorizontalFOV, vertFOV);
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
vec3 getRectiliniearRay(vec2 screenCoordNorm, vec2 fieldOfView, vec2 rotation) {
	float focalLength = 0.5 / (tan(fieldOfView.x * 0.5));

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

void main() {
	vec2 aspectRatio = size / size.xx;
	vec2 fieldOfView = getBothFOV(horizontalFOV, aspectRatio.y);
	//vec2 fieldOfView = vec2(1.0, 1.0);
	//normalizing and mapping to the [-1.0,1.0] range
	//TODO: check for bugs!
	 vec2 normCoord = (gl_FragCoord.xy / size - vec2(0.5)) * aspectRatio * 2.0;
	 normCoord.x = - normCoord.x;

	//already normalized?!
	vec3 rectiliniearRay = normalize(getRectiliniearRay(normCoord, fieldOfView, cameraRotation));
	vec3 rectiliniearOffset = vec3(0.0);

	vec3 fisheyeRay = normalize(getFisheyeRay(normCoord, fieldOfView, cameraRotation));
	vec3 fisheyeOffset = vec3(0.0);

	vec3 orthographicRay = vec3(0.0, 0.0, 1.0);
	vec3 orthographicOffset = vec3(normCoord * 0.5, 0.0);

	//w is sphere radius
	vec4 sphereData = vec4(spherePosition, sphereRadius);
	vec3 mixedRay = normalize(mix(mix(fisheyeRay, rectiliniearRay , frMix), orthographicRay, ofrMix));
	vec3 mixedOffset = mix(mix(fisheyeOffset, rectiliniearOffset, frMix), orthographicOffset, ofrMix);
	VectorPair sphereIntersections = getEyeSphereIntersection(mixedRay, mixedOffset, sphereData);
//	vec4 sphereIntersection =  getEyeSphereIntersection(rectiliniearRay, rectiliniearOffset, sphereData);
	//vec4 sphereIntersection[2] = vec4[](sphereIntersections.minor, sphereIntersections.major);

	if (!sphereIntersections.isReal) {
		discard;
	}



	//this should be a uniform
	float latLimit = PI;
	//setting ray to intersection point
	// vec2 longLat0 = mod(getLongLat(ray * kappa.x, p, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat1 = mod(getLongLat(ray * kappa.y, p, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat0 = mod(getLongLat(sphereIntersection[0], p, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	// vec2 longLat1 = mod(getLongLat(sphereIntersection[1], p, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLat0 = mod(getLongLat(sphereIntersections.minor.xyz, sphereData.xyz, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));
	vec2 longLat1 = mod(getLongLat(sphereIntersections.major.xyz, sphereData.xyz, sphereRotation) + vec2(PI*2.0, PI), vec2(PI*2.0, PI));

	vec2 longLat = longLat0;

	float nearPlane = 0.05;

	if (sphereIntersections.major.z < -nearPlane ) {
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	} else {
		if (sphereIntersections.minor.z < nearPlane ) {
			longLat = longLat1;
		}
		//gl_FragColor = texture2D(myTexture, mapFromLatLongToAzimuthalTexel(longLat, latLimit).st);
		gl_FragColor = texture2D(src_tex, mapFromLatLongToPanoramicTexel(longLat));
	  // gl_FragColor = texture2D(src_tex, src_coord / size);
	}
}
