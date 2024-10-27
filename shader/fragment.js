const fragmentShader = `
uniform float uTime;
uniform sampler2D t;
varying vec2 vUv;
varying vec3 vPosition;
void main() {
    vec4 uv = texture2D(t, vUv);
    if (uv.a < 0.2) discard;
    gl_FragColor = uv;
}`;

export default fragmentShader;