import * as THREE from 'https://cdn.skypack.dev/three';
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat-gui';
import gsap from 'gsap';

const gui = new dat.GUI();
const datContainer = document.getElementById('dat-gui-container');
datContainer.appendChild(gui.domElement);

const world = {
  plane: {
    width: 100,
    height: 100,
    widthSegments: 50,
    heightSegments: 50
  },
  originalMeshColor: 0x03254C,
  hoverMeshColor: 0x2a9df4
}
gui.add(world.plane, 'width', 10, 150).name('Width').onChange(regenerateMesh);
gui.add(world.plane, 'height', 10, 150).name('Height').onChange(regenerateMesh);
gui.add(world.plane, 'widthSegments', 10, 150).name('Segment Wd').onChange(regenerateMesh);
gui.add(world.plane, 'heightSegments', 10, 150).name('Segment Ht').onChange(regenerateMesh);
gui.addColor(world, 'originalMeshColor').name('Mesh Color').onChange(setVertexColors)
gui.addColor(world, 'hoverMeshColor').name('Glow Color')


const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const planeGeometry = new THREE.PlaneGeometry(5, 5, 10, 10);
const material = new THREE.MeshPhongMaterial(
  { //color: 0x00FF00, 
    side: THREE.DoubleSide,
    flatShading: THREE.FlatShading,
    vertexColors: true
  }
);
const mesh = new THREE.Mesh(planeGeometry, material);

scene.add(mesh);

// add jaggedness to the mesh
regenerateMesh();
addLights();

camera.position.z = 20;

const controls = new OrbitControls(camera, renderer.domElement);
//controls.update();

const mouse = {
  x: undefined,
  y: undefined
}
let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);

  // This is for pulsating vertices
  frame += 0.01;
  const { array, originalPositions, randomValues } = mesh.geometry.attributes.position;
  for (let i = 0; i < array.length; i = i + 3) {
    array[i] = originalPositions[i] + Math.cos(frame) * randomValues[i] * 0.005;
    array[i + 1] = originalPositions[i + 1] + Math.sin(frame) * randomValues[i + 1] * 0.008;
    array[i + 2] = originalPositions[i + 2] + Math.cos(frame) * randomValues[i + 2] * 0.005;
  }
  mesh.geometry.attributes.position.needsUpdate = true;
  createGlowOnHover();
}

animate();

function regenerateMesh() {
  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments);

  const { array } = mesh.geometry.attributes.position;
  const randomValues = [];
  console.log("vertex Array length : " + array.length);
  for (let i = 0; i < array.length; i += 3) {
    const x = array[i];
    const y = array[i + 1];
    const z = array[i + 2];

    array[i + 2] = z + Math.random();
    randomValues.push(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
  }

  // Keep original position array for pulsating movement
  mesh.geometry.attributes.position.originalPositions = array;
  mesh.geometry.attributes.position.randomValues = randomValues;
  console.log(mesh.geometry.attributes.position);

  setVertexColors();

}

function setVertexColors() {
  // Set color on vertices
  const colors = [];
  const color = new THREE.Color(world.originalMeshColor);
  for (let index = 0; index < mesh.geometry.attributes.position.count; index++) {
    colors.push(color.r, color.g, color.b);

  }
  mesh.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

}

function addLights() {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(0, 1, 1);
  scene.add(light);

  const backLight = new THREE.DirectionalLight(0xffffff, 1);
  backLight.position.set(0, -1, -1);
  scene.add(backLight);
}

addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //console.log(mouse);
})

function createGlowOnHover() {

  const intersects = raycaster.intersectObject(mesh);
  //console.log(intersects);
  if (intersects.length > 0) {
    const { color } = intersects[0].object.geometry.attributes;

    const hoverColor = new THREE.Color(world.hoverMeshColor);
    const originalColor = new THREE.Color(world.originalMeshColor);

    const transientHover = {
      r: hoverColor.r,
      g: hoverColor.g,
      b: hoverColor.b
    }

    gsap.to(transientHover, {
      r: originalColor.r,
      g: originalColor.g,
      b: originalColor.b,
      onUpdate: () => {
        color.setXYZ(intersects[0].face.a, transientHover.r, transientHover.g, transientHover.b);
        color.setXYZ(intersects[0].face.b, transientHover.r, transientHover.g, transientHover.b);
        color.setXYZ(intersects[0].face.c, transientHover.r, transientHover.g, transientHover.b);
        color.needsUpdate = true;
      }
    })
  }
}
