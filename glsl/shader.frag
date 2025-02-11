precision mediump float;
uniform vec4 uColor;
uniform float uResolution;
uniform float uGrainAmount;
uniform float uFX;
uniform float uTime;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

vec4 grain(vec4 fragColor, vec2 uv) {
    vec4 color = fragColor;
    float diff = (rand(uv) - 0) * uGrainAmount;
    color.r += diff;
    color.g += diff;
    color.b += diff;
    return color;
}

void main() {
    
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec4 _grain = grain(uColor, uv);
    gl_FragColor = mix(uColor, _grain, uFX);
}