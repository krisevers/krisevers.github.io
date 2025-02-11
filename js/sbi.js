// import * as THREE from  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Basic Threejs variables
var scene;
var camera;
var renderer;

// Lorenz Attractor variables
let x = 0.1, y = 0, z = 0;
const a = 10, b = 28, c = 8 / 3;
const dt = 0.01;

var point;

var geometry;
var material;

var height = 300;

function init()
{
    const canvas = document.querySelector('#component');

    const gl = canvas.getContext('webgl2');

    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, canvas.width, height);

    scene = new THREE.Scene();
    
    // ---------------- RENDERER ----------------

    renderer = new THREE.WebGLRenderer( { 
        antialias : true,
        alpha: true
        } );

    renderer.setPixelRatio( window.devicePixelRatio  );
    renderer.setSize( canvas.width, height );

    document.body.appendChild( renderer.domElement );
    
    // ---------------- CAMERA ----------------
    
    camera = new THREE.PerspectiveCamera( 40, canvas.width / height, 1, 10000 );
    camera.position.set( -500, 400, -500 );
    camera.lookAt(new THREE.Vector3(0,0,0));
    scene.add( camera );
    
    // ---------------- LIGHTS ----------------
    
    var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.2 );
    scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
scene.add(directionalLight);

// ---------------- GEOMETRY ----------------
const pointGeometry = new THREE.SphereGeometry(10, 32, 32);
const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
point = new THREE.Mesh(pointGeometry, pointMaterial);
scene.add(point);

// ---------------- STARTING THE RENDER LOOP ----------------
render();

}

function lorenz(x, y, z, a, b, c, dt) {
    var dx = (a * (y - x)) * dt;
    var dy = (x * (b - z) - y) * dt;
    var dz = (x * y - c * z) * dt;
    return [x + dx, y + dy, z + dz];
}

function render() {
  // Update point position based on Lorenz system
  [x, y, z] = lorenz(x, y, z, a, b, c, dt);
  point.position.set(x, y, z);

  renderer.render(scene, camera); // We are rendering the 3D world
  requestAnimationFrame(render);  // we are calling render() again, to loop
}

init();