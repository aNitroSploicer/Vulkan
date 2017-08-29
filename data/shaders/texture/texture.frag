#version 450

#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable

layout (binding = 1) uniform sampler2D samplerColor;

layout (location = 0) in vec2 inUV;
layout (location = 1) in float inLodBias;
layout (location = 2) in vec3 inNormal;
layout (location = 3) in vec3 inViewVec;
layout (location = 4) in vec3 inLightVec;

layout (location = 0) out vec4 outFragColor;

int max_iterations = 40;
int max_magnitude = 5;

vec3 HSV2RGB (vec3 color)
{
	if (color[1] == 0.0) return vec3(0, 0, 0);

	int i = int(floor(color[0] * 6.0));

	float f = (color[0] * 6.0) - i;
	float p = color[2] * (1.0 - color[1]);
	float q = color[2] * (1.0 - color[1] * f);
	float t = color[2] * (1.0 - color[1] * (1.0 - f));
	float v = color[2];

	switch (i % 6) {
		case 0: return vec3(v, t, p);
		case 1: return vec3(q, v, p);
		case 2: return vec3(p, v, t);
		case 3: return vec3(p, q, v);
		case 4: return vec3(t, p, v);
		case 5: return vec3(v, p, q);
	}

	return vec3(0, 0, 0);
}

vec2 f(vec2 z)
{
	return vec2(z.x * z.x - z.y * z.y, 2.0 * (z.x * z.y)) + vec2(0.8, 0.156);
}


float magnitude(vec2 z)
{
	return sqrt(z.x * z.x + z.y * z.y);
}


int iterate(vec2 z)
{
	int n = 0;

	while (magnitude(z) < max_magnitude && n < max_iterations) {
		z = f(z);

		n++;
	}

	return n;
}

void main()
{
	//vec4 color = texture(samplerColor, inUV, inLodBias);

	float s = float(iterate(inUV)) / float(max_iterations);
	vec4 color = vec4(HSV2RGB(vec3(s, 0.9, 0.9)).rgb, 1.0);

	vec3 N = normalize(inNormal);
	vec3 L = normalize(inLightVec);
	vec3 V = normalize(inViewVec);
	vec3 R = reflect(-L, N);
	vec3 diffuse = max(dot(N, L), 0.0) * vec3(1.0);
	float specular = pow(max(dot(R, V), 0.0), 16.0) * color.a;

	outFragColor = vec4(diffuse * color.rgb + specular, 2.0);
}
