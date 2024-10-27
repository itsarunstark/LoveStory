import * as Three from 'three';
import { OrbitControls, Wireframe } from 'three/examples/jsm/Addons.js';
import fragmentShader from './shader/fragment.js'
import vertexShader from './shader/vertex.js';
import t from './src/out2_start.png'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// import vertex from "./shader/vertex.glsl";

class RenderObject{
    constructor(options) {
        this.scene = new Three.Scene();
        this.container = options.dom;
        this.width = canvas.width = window.innerWidth;
        this.height = canvas.height = window.innerHeight;
        this.renderer = new Three.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000);
        this.renderer.physicallyCorrectLights = true;
        // this.renderer.toneMapping = Three.ReinhardToneMapping
        this.camera = new Three.PerspectiveCamera(45.0, this.width/this.height, 0.1, 5000);
        this.camera.position.z = 700;
        this.controls = new OrbitControls(this.camera, this.container);
        this.axesHelper = new Three.AxesHelper(1);
        this.scene.add(this.axesHelper);
        this.boxData = {
            geometry: new Three.PlaneGeometry(500, 500, 300, 300),
            material: new Three.MeshBasicMaterial({color: 0x800000, wireframe: false}),
            mesh: null
        }
        console.log(this.boxData.geometry);
        this.boxData.mesh = new Three.Points(this.boxData.geometry, this.boxData.material);
        this.scene.add(this.boxData.mesh);
        this.shaderMaterial = new Three.ShaderMaterial(
            {
                extensions : {
                    derivatives: "#extension GL_OES_standard_derivatives : enable"
                },
                side: Three.DoubleSide,
                uniforms: {
                    uTime: {
                        type: 'f',
                        value: 0
                    },
                    uResolution: {
                        type: 'v4',
                        value: new Three.Vector4()
                    },
                    t: {
                        type: 't',
                        value: new Three.TextureLoader().load(t)
                    }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                depthTest: false,
                depthWrite: false,
                transparent:true
            }
        )
        this.boxData.mesh.material = this.shaderMaterial;
        window.addEventListener('resize', (event)=>this.resizeRenderObject(event));

        this.renderScene = new RenderPass( this.scene, this.camera );
        this.bloomPass = new UnrealBloomPass( new Three.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
		this.bloomPass.threshold = 0.0;
		this.bloomPass.strength = -2.0;
	    this.bloomPass.radius = 0.5;

		this.outputPass = new OutputPass();

		this.composer = new EffectComposer( this.renderer );
		this.composer.addPass( this.renderScene );
		this.composer.addPass( this.bloomPass );
		this.composer.addPass( this.outputPass );
        this.renderer.toneMappingExposure = Math.pow(1.0, 4);
        // this.boxData.geometry.setAttribute('position', new Three.BufferAttribute(this.positionData, 3));
   }

   resizeRenderObject(event){
        console.log("Resize accepted");
        this.width = this.container.width = window.innerWidth;
        this.height = this.container.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(this.width, this.height);
   }

    renderLoop(){
        requestAnimationFrame(()=>this.renderLoop());
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
        this.composer.render();
        this.shaderMaterial.uniforms.uTime.value += 0.01
        // console.log("working")
   }
}
const canvas = document.querySelector("canvas.webgl");

const renderer = new RenderObject({
    dom: canvas
})

renderer.renderLoop()

