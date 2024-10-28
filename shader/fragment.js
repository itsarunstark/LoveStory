const fragmentShader = `
uniform float uTime;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform float interpol;
varying vec2 vUv;

void main() {
    vec4 uv1 = texture2D(tCurrent, vUv);
    vec4 uv2 = texture2D(tNext, vUv);
    float alpha = fract(interpol);
    vec4 px = uv1*(1.0-alpha) + uv2*alpha;
    if (px.a < 0.04) discard;
    gl_FragColor = px;
}`;

export default fragmentShader;