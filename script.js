import * as Three from 'three';
import fragmentShader from './shader/fragment.js';
import vertexShader from './shader/vertex.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import vertex from "./shader/vertex.glsl";
console.log(Three.REVISION);
console.log(Three.sRGBEncoding);

async function preloadVideo(src) {
    const res = await fetch(src);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

class RenderObject{
    constructor(options) {
        this.scene = new Three.Scene();
        this.container = options.dom;
        this.currentIndex = 0;
        this.width = this.container.width = window.innerWidth;
        this.height = this.container.height = window.innerHeight;
        this.queueVideoLoader = document.createElement('video');
        this.queueVideoLoader.preload = 'auto';
        this.exposureFunc = (x)=>(4*x*(1-x)+1);
        this.outVideo = ["./src/out3.mp4", "./src/out2.mp4", "./src/out1.mp4", "./src/out4.mp4"];
        this.allMessages = [
            "I met her in full bloomed autumn and\nmy life has begun to change",
            "She walked into my life as the leaves fell, and suddenly\n,everything felt like it was falling together.",
            "If I had a flower for every time I thought of you\n, I could walk through my garden forever",
            "They call me crazy, but Everyday I smile because of you",
            "Everyday I think about you, and every night I dream about you",
            "I am working hard because you are watching",
            "Every hour , every minute , every second with you is worth living.",
            "Those moments with you , I can't define how happy I was",
            "It was alright, because of you.",
            "Thankyou\nfor being in my Life",
        ]

        this.msgIndex = -1;
        
        this.imgString = [
            {
                start: "./src/out3_start.png",
                end: "./src/out3_end.png"
            },
            {
                start: "./src/out2_start.png",
                end: "./src/out2_end.png"
            },
            {
                start: "./src/out1_start.png",
                end: "./src/out1_end.png"
            },
            {
                start: "./src/out4_start.png",
                end: "./src/out4_end.png"
            }
        ]
        this.imgObjs = [];
        this.imgString.forEach((value)=>{
            this.imgObjs.push(
                {
                    start: new Three.TextureLoader().load(value.start, (texture)=>{
                        texture.encoding = Three.sRGBEncoding;
                    }),
                    end: new Three.TextureLoader().load(value.end, (texture)=>{
                        texture.encoding = Three.sRGBEncoding;
                    })
                }
            );
        })
        console.log("encoding::", Three.sRGBEncoding);

        

        this.renderer = new Three.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.physicallyCorrectLights = true;
        this.textWidget = document.querySelector('#center-text-message');
        this.renderer.outputEncoding = Three.sRGBEncoding;
        this.renderer.toneMapping = Three.ReinhardToneMapping; // Disable tone mapping
        this.renderer.toneMappingExposure = 1;
        this.transitionCounter = 0;
        this.textStateChanged = 0;
        this.textDisplayDuration = 2.0;
        this.displayFunction = (x)=>(1-Math.max(
                Math.min(
                    Math.abs(
                        x%(2*this.textDisplayDuration+2) - this.textDisplayDuration - 1
                    )-this.textDisplayDuration,
                    1
                ),
                0
            )
        )
        
        this.camera = new Three.PerspectiveCamera(45.0, this.width/this.height, 0.1, 5000);
        this.camera.position.z = 600;
        this.controls = new OrbitControls(this.camera, this.container);
        // this.axesHelper = new Three.AxesHelper(1);
        // this.scene.add(this.axesHelper);
        this.counter = 0;
        this.ready = false;
        this.uniform_object_index = 1000;
        this.boxData = {
            geometry: new Three.PlaneGeometry(500, 500, 500, 500),
            material: new Three.MeshBasicMaterial({color: 0x800000, wireframe: false}),
            mesh: null
        }
        // console.log(this.boxData.geometry);
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
                    tCurrent: {
                        type: 't',
                        value: this.imgObjs[this.currentIndex].end
                    },
                    tNext: {
                        type: 't',
                        value: this.imgObjs[this.currentIndex+1].start
                    },
                    interpol: {
                        type: 'f',
                        value: 0.0
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
		this.bloomPass.threshold = 0.05;
		this.bloomPass.strength = 0.5;
	    this.bloomPass.radius = 0.5;
        this.displayCounter = 0.0;
        
		this.composer = new EffectComposer( this.renderer );
		this.composer.addPass( this.renderScene );
		this.composer.addPass( this.bloomPass );
        this.loadedURLS = [];
        this.tmp = 
        this.bloomFunction = (x)=>(30.0*Math.pow(Math.E, -(4*x-2)*(4*x-2))+0.3);

        this.fadeTimeOut = 1.0;
        this.playbackRate = 4.0;
        this.videoPlayer = document.getElementById('video-anim1');
        this.videoPlayer.playbackRate = this.playbackRate;
        this.displayAll = false;
        this.videoPlayer.onended = ()=>{
            this.videoPlayer.style.transition = undefined;
            this.onVideoFinished()
        }
        // this.videoPlayer.addEventListener('play', ()=>{
        //     console.log('video started playing.');)
        this.videoPlayer.addEventListener('load', ()=>{
            this.container.style.opacity = 1.0;
        })

        this.animation = {
            start: false,
            progress: 0.0,
            duration: 1.0,
            maxlim: 2.0
        }
    }

    async startVideoQueue(){
        this.videoPlayer.src = await preloadVideo(this.outVideo[this.currentIndex]);
        this.loadedURLS.push(this.videoPlayer.src);
        this.videoPlayer.playbackRate = this.playbackRate;
        // console.log("playback rate: ", this.playbackRate, this.videoPlayer.playbackRate);
        // this.videoPlayer.play();
        this.queueNextVideo();

    }

    async queueNextVideo(){
        this.next_video = await preloadVideo(this.outVideo[(this.currentIndex+1)%(this.outVideo.length)]);
        this.queueVideoLoader.src = this.next_video;
        this.loadedURLS.push(this.next_video);
        this.queueVideoLoader.preload = 'auto';
        this.queueVideoLoader.load();
        // console.log('loading video.');
    }

   onVideoFinished(){
    this.animation.start = true;
    this.shaderMaterial.uniforms.tCurrent.value = this.imgObjs[this.currentIndex].end;
    this.shaderMaterial.uniforms.tNext.value = this.imgObjs[(this.currentIndex+1)%this.outVideo.length].start;
        // }
    this.videoPlayer.style.opacity = "0";
   }
   resizeRenderObject(event){
        this.videoPlayer.playbackRate = this.playbackRate;
        this.width = this.container.width = window.innerWidth;
        this.height = this.container.height = window.innerHeight;
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(this.width, this.height);   
   }

    renderLoop(){
        requestAnimationFrame(()=>this.renderLoop());
        this.counter += 0.01;
        // console.log(this.displayFunction(this.counter), this.counter);
        if(this.displayAll){
            this.controls.update();
            this.composer.render();
            this.shaderMaterial.uniforms.uTime.value += 0.01
            this.animationLoop(0.01);
        }else{
            this.videoPlayer.style.opacity = 0;
        }
        // console.log(Math.floor(this.counter/this.textDisplayDuration)%2);
        if(Math.floor(this.counter/this.textDisplayDuration)%2 != this.textStateChanged){
            this.textStateChanged = Math.floor(this.counter/this.textDisplayDuration)%2;
            this.textWidget.style.opacity = this.textStateChanged;
            if (this.textStateChanged) {
                this.msgIndex = (this.msgIndex + 1)%this.allMessages.length;
                this.textWidget.innerHTML = this.allMessages[this.msgIndex];
            }
            else if (!this.animation.start) {
                // this.animation.start = true;
                this.displayAll = true;
                this.videoPlayer.play();
                this.videoPlayer.style.opacity = 1;
            }
        }
        // console.log("working")
    }
   animationLoop(dt){
    if (this.animation.start){
        this.animation.progress += dt;
        this.bloomPass.strength = this.bloomFunction(this.animation.progress);
        this.renderer.toneMappingExposure = Math.pow(this.exposureFunc(this.animation.progress), 4);
        this.shaderMaterial.uniforms.interpol.value = this.animation.progress;
        if (this.animation.progress>1.0) {
            this.animation.start = false;
            this.currentIndex = (this.currentIndex + 1)%this.imgObjs.length;
            this.shaderMaterial.uniforms.tCurrent.value = this.imgObjs[this.currentIndex].start;
            this.shaderMaterial.uniforms.tNext.value = this.imgObjs[this.currentIndex].end;
            this.videoPlayer.src = this.queueVideoLoader.src;
            this.videoPlayer.play();
            this.videoPlayer.style.opacity = "1";
            this.videoPlayer.playbackRate = this.playbackRate;
            // this.videoPlayer.playBackRate = this.playBackRate;
            // console.log("image index:: ", this.currentIndex);.
            if (this.outVideo.length > this.loadedURLS.length) {this.queueNextVideo();}
            else {
                this.next_video = this.loadedURLS[(this.currentIndex+1)%(this.outVideo.length)];
                this.queueVideoLoader.src = this.next_video;
            }
            this.animation.progress = 0.0;
            // this.bloomPass.strength = 0.5;
        }
    }
    
   }
}
const canvas = document.querySelector("canvas.webgl");

const renderer = new RenderObject({
    dom: canvas
})
window.addEventListener('load', ()=>renderer.startVideoQueue());
renderer.renderLoop()

