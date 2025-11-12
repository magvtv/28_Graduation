// ========================================
// DYNAMIC NAVIGATION UPDATE
// ========================================

function updateNavigation() {
    const currentPath = window.location.pathname;
    const navLink = document.getElementById('navLink');
    
    if (!navLink) return; // Exit if nav link doesn't exist
    
    // Determine current page
    const isHomePage = currentPath === '/' || currentPath === '/page.html' || currentPath.endsWith('page.html');
    const isEventPage = currentPath === '/event.html' || currentPath.endsWith('event.html');
    
    if (isHomePage) {
        // On home page, show "Event Details" link
        navLink.textContent = 'Event Details';
        navLink.href = '/event.html';
    } else if (isEventPage) {
        // On event page, show "Home" link
        navLink.textContent = 'Home';
        navLink.href = '/page.html';
    }
}

// Update navigation on page load
updateNavigation();

// ========================================
// THREE.JS GLASS EFFECT
// ========================================

import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders';

const config = {
    lerpFactor: 0.035,
    parallaxStrength: 0.1,
    distortionMultiplier: 10,
    glassStrength: 2.0,
    glassSmoothness: 0.0001,
    stripesFrequency: 30.0,
    edgePadding: 0.1,
};

const container = document.querySelector(".hero");
const imageElement = document.getElementById("glassTexture");

const scene = new  THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const mouse = {
    x: 0.5,
    y: 0.5,
}

const targetMouse = {
    x: 0.5,
    y: 0.5,
}

const lerp = (start, end, factor) => {
    start + (end - start) * factor;
}

const textureSize = {
    x: 1,
    y: 1,
}

const material = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { 
            value: null 
        },
        uResolution: { 
            value: new THREE.Vector2(window.innerWidth, window.innerHeight) 
        },
        uTextureSize: { 
            value: new THREE.Vector2(textureSize.x, textureSize.y) 
        },
        uMouse: { 
            value: new THREE.Vector2(mouse.x, mouse.y) 
        },
        uParallaxStrength: { 
            value: config.parallaxStrength 
        },
        uDistortionMultiplier: { 
            value: config.distortionMultiplier 
        },
        uGlassStrength: { 
            value: config.glassStrength 
        },
        ustripesFrequency: { 
            value: config.stripesFrequency
        },
        uglassSmoothness: { 
            value: config.glassSmoothness 
        },
        uEdgePadding: { 
            value: config.edgePadding
        },
    },
    vertexShader,
    fragmentShader
}); 

const geometry = new THREE.PlaneGeometry(2, 2);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function loadImage () {
    if (!imageElement.complete) {
        imageElement.onload = loadImage
        return;
    }

    const texture = new THREE.Texture(imageElement);
    textureSize.x = imageElement.naturalWidth || imageElement.width;
    textureSize.y = imageElement.naturalHeight || imageElement.height;
    texture.needsUpdate = true;
    material.uniforms.uTexture.value = texture;
    material.uniforms.uTextureSize.value.set(textureSize.x, textureSize.y);
}

if (imageElement.complete) {
    loadImage();
} else {
    imageElement.onload = loadImage;
}

window.addEventListener('mousemove', (event) => {
    targetMouse.x = event.clientX / window.innerWidth;
    targetMouse.y = 1.0 - event.clientY / window.innerHeight;
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);

    mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor);
    mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor);
    material.uniforms.uMouse.value.set(mouse.x, mouse.y);

    renderer.render(scene, camera);
}

animate();