import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import cubeFragment from './shaders/cube/fragment.glsl'
import cubeVertex from './shaders/cube/vertex.glsl'
import Stats from 'stats.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

/**
 * Base
 */

// Constants
const MOUSE = new THREE.Vector2()
const MAX_ROTATION = Math.PI * 2 / 10 // 36
const FRICTION = 0.05
let rotation = new THREE.Vector2(), 
    targetRotation = new THREE.Vector2()
// Grid 6x6
const GRID_SIZE = 6
const PARRELLELEPIPEDS = [
  {
    x: 0,
    y: 0,
    width: 2,
    height: 2
  },
  {
    x: 2,
    y: 0,
    width: 2,
    height: 1
  },
  {
    x: 4,
    y: 0,
    width: 1,
    height: 3
  },
  {
    x: 5,
    y: 0,
    width: 1,
    height: 1
  },
  {
    x: 5,
    y: 1,
    width: 1,
    height: 1
  },
  {
    x: 0,
    y: 2,
    width: 2,
    height: 3
  },
  {
    x: 2,
    y: 1,
    width: 2,
    height: 2
  },
  {
    x: 5,
    y: 2,
    width: 1,
    height: 2
  },
  {
    x: 0,
    y: 5,
    width: 3,
    height: 1
  },
  {
    x: 2,
    y: 3,
    width: 1,
    height: 2
  },
  {
    x: 3,
    y: 3,
    width: 2,
    height: 3
  },
  {
    x: 5,
    y: 4,
    width: 1,
    height: 2
  }
]


// Debug
const params = {
  gridDimensionX: 1.56,
  gridDimensionY: 1.8,
  gridDimensionZ: 0.25
}

// Stats
const stats = new Stats()
document.body.appendChild(stats.dom)

// canvas
const canvas = document.querySelector('canvas.webgl')

// Scenes
const scene = new THREE.Scene()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

/**
 * Render target
 */


/**
 * Camera
 */
// Base camera
const { width, height } = sizes
const camera = new THREE.PerspectiveCamera(75, width / height, .1, 10)
camera.position.set(0, 0, 2)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0, 0)
// controls.enableDamping = true
// controls.autoRotateSpeed = 0.5
// controls.autoRotate = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  background: 0xff0000
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

function onResize() {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

window.addEventListener('resize', onResize)

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

let group, img1Texture, img2Texture, edgeTexture, edgeMaterial
const loader1 = new THREE.TextureLoader(),
      loader2 = new THREE.TextureLoader(),
      loader3 = new THREE.TextureLoader()

const addParrallelepipeds = () => {
  if (!group) {
    group = new THREE.Group()
    scene.add(group)
  } else {
    for (let i = group.children.length; i >= 0; i--) {
      group.remove(group.children[i])
    }
  }

  const { gridDimensionX, gridDimensionY, gridDimensionZ } = params

  const halfDimension = new THREE.Vector2(
    gridDimensionX / 2,
    gridDimensionY / 2
  )

  img1Texture = img1Texture || loader1.load('/man.jpg')
  img2Texture = img2Texture || loader2.load('/woman.jpg')
  edgeTexture = edgeTexture || loader3.load('/edge.jpg')

  PARRELLELEPIPEDS.forEach(({ x, y, width, height }) => {
    const meshWidth = (width / GRID_SIZE) * gridDimensionX
    const meshHeight = (height / GRID_SIZE) * gridDimensionY

    const geometry = new THREE.BoxGeometry(meshWidth, meshHeight, gridDimensionZ)
    // const color = new THREE.Color(Math.random() * 0xffffff)
    // const material = new THREE.MeshBasicMaterial({ color })

    const faceMaterial = new THREE.ShaderMaterial({
      fragmentShader: cubeFragment,
      vertexShader: cubeVertex,
      uniforms: {
        uImg1Texture: { value: img1Texture },
        uPosition: { value: new THREE.Vector2(x / GRID_SIZE, y / GRID_SIZE) },
        uSize: { value: new THREE.Vector2(width / GRID_SIZE, height / GRID_SIZE) }
      },
    })

    const backMaterial = new THREE.ShaderMaterial({
      fragmentShader: cubeFragment,
      vertexShader: cubeVertex,
      uniforms: {
        uImg1Texture: { value: img2Texture },
        uPosition: { value: new THREE.Vector2(x / GRID_SIZE, y / GRID_SIZE) },
        uSize: { value: new THREE.Vector2(width / GRID_SIZE, height / GRID_SIZE) }
      },
    })

    edgeMaterial = edgeMaterial || new THREE.MeshBasicMaterial({ map: edgeTexture })

    edgeMaterial.map.minFilter = THREE.NearestFilter
    edgeMaterial.map.magFilter = THREE.NearestFilter

    const cubeMaterial = [
      edgeMaterial, // right
      edgeMaterial,  // left
      edgeMaterial, // top
      edgeMaterial, // bottom
      faceMaterial, // front
      backMaterial, // back
    ]

    const mesh = new THREE.Mesh(geometry, cubeMaterial)

    const meshX = (x / GRID_SIZE) * gridDimensionX - halfDimension.x + meshWidth / 2
    const meshY = (y / GRID_SIZE) * gridDimensionY - halfDimension.y + meshHeight / 2

    mesh.position.set(meshX, meshY, 0)
    group.add(mesh)
  })
}

const tick = () => {
  stats.begin()

  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Rotation
  rotation.x += (targetRotation.x - rotation.x) * FRICTION
  rotation.y += (targetRotation.y - rotation.y) * FRICTION

  group.rotation.x = rotation.x
  group.rotation.y = rotation.y

  // Update controls
  // controls.update(elapsedTime)

  renderer.render(scene, camera)

  stats.end()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

let gui

const addGUI = () => {
  gui = new dat.GUI()
  gui.add(params, 'gridDimensionX', 1, 2, .01).onChange(addParrallelepipeds)
  gui.add(params, 'gridDimensionY', 1, 2, .01).onChange(addParrallelepipeds)
  gui.add(params, 'gridDimensionZ', .1, .5, .01).onChange(addParrallelepipeds)
}

// const timeline = new gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: .5 })
let currentSide = 'man'

const turnParrallelepideds = side => {
  // const duration = .7
  const ease = 'Power1'

  group.children.forEach((child, index) => {
    const delay = index * .06
    const duration = .6
    const returnDelay = delay + duration + 0
    const offsetZ = .2

    gsap.to(
      child.position, {
        z: offsetZ,
        duration,
        ease: ease + '.easeOut',
        delay
    })

    gsap.to(
      child.rotation, {
        y: side === 'woman' ? Math.PI : 0,
        duration: duration + .2,
        ease: ease + '.easeOut',
        delay
    })

    gsap.to(
      child.position, {
        z: 0,
        duration: duration - 0.2,
        ease: ease + '.easeIn',
        delay: returnDelay
    })
  })
}

const addEvents = () => {
  window.addEventListener('mousemove', e => {
    MOUSE.x = e.clientX - sizes.width / 2
    MOUSE.y = - e.clientY + sizes.height / 2

    targetRotation.y = (MOUSE.x / (sizes.width / 2)) * MAX_ROTATION
    targetRotation.x = (MOUSE.y / (sizes.height / 2)) * MAX_ROTATION
  })

  window.addEventListener('click', () => {
    currentSide = currentSide === 'man'
      ? 'woman'
      : 'man'

    turnParrallelepideds(currentSide)
  })
}

addEvents()
addParrallelepipeds()
addGUI()
tick()
