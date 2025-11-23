import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import { ThreeRendererManager } from '@/lib/ThreeRenderer';
import { MonkeyScene } from '@/lib/MainScene';
import { 
  CameraKey, 
  CameraKeyframeInstance,
  FrontKeyframe,
  BackWideKeyframe,
  BackCloseKeyframe
} from '@/models/three';

const CAMERA_UP = new THREE.Vector3(0, 1, 0);

export class ThreeSceneManager {
  rendererManager: ThreeRendererManager;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  cssScene: THREE.Scene;
  controls: OrbitControls;
  
  monkeyScene: MonkeyScene;
  
  currentKeyframe: CameraKey | undefined = CameraKey.FRONT;
  targetKeyframe: CameraKey | undefined = undefined;
  keyframeInstances: { [key in CameraKey]: CameraKeyframeInstance };
  cameraPosition: THREE.Vector3;
  cameraFocalPoint: THREE.Vector3;
  cameraOrientation: THREE.Quaternion;
  keyframeOrientations: { [key in CameraKey]: THREE.Quaternion };
  lookAtMatrix: THREE.Matrix4 = new THREE.Matrix4();
  
  currentMonitorOpacity: number = 0;

  devMode: boolean = false;
  pressedKeys: Set<string> = new Set();
  cameraMoveSpeed: number = 0.1;
  
  // Auto-spin state
  isAutoSpinning: boolean = true;
  autoSpinSpeed: number = 0.2; // Radians per second

  isRunning: boolean = false;
  clock: THREE.Clock;
  animationFrameId: number | null = null;
  
  debugOverlay: HTMLElement;
  monitorHintOverlay: HTMLElement;
  clickToBeginOverlay: HTMLElement;
  hasInteracted: boolean = false;
  monitorInteractive: boolean = false;
  monitorHovered: boolean = false;
  monitorHoverTimeout: number | null = null;

  constructor(
    container: HTMLElement, 
    cssContainer: HTMLElement
  ) {
    this.rendererManager = new ThreeRendererManager(container, cssContainer);
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f7f7f5');
    this.cssScene = new THREE.Scene();
    
    // Create Debug Overlay
    this.debugOverlay = document.createElement('div');
    Object.assign(this.debugOverlay.style, {
      position: 'fixed',
      top: '12px',
      left: '12px',
      padding: '10px 12px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      color: '#00ff88',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.4',
      pointerEvents: 'none',
      borderRadius: '6px',
      whiteSpace: 'pre',
      zIndex: '9999',
    });
    document.body.appendChild(this.debugOverlay);

    // Escape hint overlay (hidden by default)
    this.monitorHintOverlay = document.createElement('div');
    Object.assign(this.monitorHintOverlay.style, {
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      border: '1px solid rgba(137, 196, 255, 0.6)',
      color: '#8bd0ff',
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '14px',
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      background: 'rgba(10, 22, 40, 0.75)',
      boxShadow: '0 0 20px rgba(137, 196, 255, 0.35)',
      borderRadius: '4px',
      opacity: '0',
      transition: 'opacity 200ms ease',
      pointerEvents: 'none',
      zIndex: '9998',
    });
    this.monitorHintOverlay.textContent = 'PRESS ESC TO RETURN';
    document.body.appendChild(this.monitorHintOverlay);

    // Click to begin overlay
    this.clickToBeginOverlay = document.createElement('div');
    Object.assign(this.clickToBeginOverlay.style, {
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      border: '1px solid rgba(137, 196, 255, 0.6)',
      color: '#8bd0ff',
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '14px',
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      background: 'rgba(10, 22, 40, 0.75)',
      boxShadow: '0 0 20px rgba(137, 196, 255, 0.35)',
      borderRadius: '4px',
      opacity: '1',
      transition: 'opacity 500ms ease',
      pointerEvents: 'none',
      zIndex: '9998',
    });
    this.clickToBeginOverlay.textContent = 'CLICK ANYWHERE TO BEGIN';
    document.body.appendChild(this.clickToBeginOverlay);
    
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
    this.camera.up.copy(CAMERA_UP);
    
    this.keyframeInstances = {
      [CameraKey.FRONT]: new FrontKeyframe(),
      [CameraKey.BACK_WIDE]: new BackWideKeyframe(),
      [CameraKey.BACK_CLOSE]: new BackCloseKeyframe(),
    };

    this.keyframeOrientations = {
      [CameraKey.FRONT]: new THREE.Quaternion(),
      [CameraKey.BACK_WIDE]: new THREE.Quaternion(),
      [CameraKey.BACK_CLOSE]: new THREE.Quaternion(),
    };
    (Object.values(CameraKey) as CameraKey[]).forEach((key) => this.updateKeyframeOrientation(key));
    
    this.cameraPosition = this.keyframeInstances[CameraKey.FRONT].position.clone();
    this.cameraFocalPoint = this.keyframeInstances[CameraKey.FRONT].focalPoint.clone();
    this.cameraOrientation = this.keyframeOrientations[CameraKey.FRONT].clone();
    
    this.camera.position.copy(this.cameraPosition);
    this.camera.quaternion.copy(this.cameraOrientation);

    this.controls = new OrbitControls(this.camera, this.rendererManager.webglRenderer.domElement);
    this.controls.enabled = this.devMode;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    if (this.devMode) {
      this.controls.target.copy(this.cameraFocalPoint);
      this.controls.update();
    }
    
    this.setupLights();
    
    this.monkeyScene = new MonkeyScene(this.scene);
    this.monkeyScene.setViewMode(this.currentKeyframe || CameraKey.FRONT);
    this.monkeyScene.setMonitorOpacity(0);
    this.setMonitorInteractivity(false);
    this.monkeyScene.setMonitorHoverListener(this.handleMonitorHover);
    
    this.setupEventListeners(container);
    
    this.clock = new THREE.Clock();

    // Initialize auto-spin based on dev mode
    this.isAutoSpinning = !this.devMode;
    if (this.isAutoSpinning) {
      this.currentKeyframe = undefined;
    }

    this.start();
    
    window.addEventListener('resize', this.handleResize);
  }
  
  setupEventListeners(_container: HTMLElement) {
    const handleClick = (event: MouseEvent) => {
      // Handle first click to start
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        this.clickToBeginOverlay.style.opacity = '0';
        setTimeout(() => {
          if (this.clickToBeginOverlay.parentNode) {
            this.clickToBeginOverlay.parentNode.removeChild(this.clickToBeginOverlay);
          }
        }, 500);
      }

      const target = event.target as HTMLElement;
      if (target.closest('#root')) {
        return;
      }
      
      if (this.devMode) {
        return;
      }

      if (this.isAutoSpinning) {
        console.log('Click detected, stopping auto-spin and transitioning to FRONT');
        this.transitionFromSpinToFront();
        return;
      }

      if (this.monitorInteractive && target.closest('#three-css')) {
        return;
      }
      
      event.preventDefault();
      console.log('Click detected, cycling view');
      this.cycleView();
    };
    
    document.addEventListener('mousedown', handleClick);
    this.handleClick = handleClick;
    this.setupEscapeListener();
    this.setupKeyboardControls();
  }
  
  private handleClick?: (e: MouseEvent) => void;
  private handleEscapeKey?: (e: KeyboardEvent) => void;

  setupEscapeListener() {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (this.devMode) return;
      
      const activeKeyframe = this.targetKeyframe || this.currentKeyframe;
      if (activeKeyframe === CameraKey.BACK_WIDE) {
        event.preventDefault();
        this.transitionTo(CameraKey.FRONT);
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    this.handleEscapeKey = handleEscapeKey;
  }

  
  setupKeyboardControls() {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!this.devMode || this.monitorInteractive) return;
      
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
      if (keys.includes(event.key)) {
        event.preventDefault();
        this.pressedKeys.add(event.key.toLowerCase());
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!this.devMode || this.monitorInteractive) return;
      
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
      if (keys.includes(event.key)) {
        event.preventDefault();
        this.pressedKeys.delete(event.key.toLowerCase());
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    this.handleKeyDown = handleKeyDown;
    this.handleKeyUp = handleKeyUp;
  }
  
  private handleKeyDown?: (e: KeyboardEvent) => void;
  private handleKeyUp?: (e: KeyboardEvent) => void;
  
  updateCameraMovement() {
    if (!this.devMode) return;
    
    const moveVector = new THREE.Vector3();
    const speed = this.cameraMoveSpeed;
    
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    
    if (this.pressedKeys.has('arrowup') || this.pressedKeys.has('w')) {
      moveVector.add(forward.clone().multiplyScalar(speed));
    }
    if (this.pressedKeys.has('arrowdown') || this.pressedKeys.has('s')) {
      moveVector.add(forward.clone().multiplyScalar(-speed));
    }
    if (this.pressedKeys.has('arrowleft') || this.pressedKeys.has('a')) {
      moveVector.add(right.clone().multiplyScalar(-speed));
    }
    if (this.pressedKeys.has('arrowright') || this.pressedKeys.has('d')) {
      moveVector.add(right.clone().multiplyScalar(speed));
    }
    
    if (moveVector.length() > 0) {
      this.camera.position.add(moveVector);
      this.controls.target.add(moveVector);
      this.controls.update();
    }
  }

  setupLights() {
    // 1. High Ambient Light for Clinical/Fluorescent look (minimizes dark shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    // 2. Main Overhead Light (Soft directional shadows)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 12, 5); // High up, slightly angled
    dirLight.castShadow = true;
    
    // Improve shadow quality
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    
    // Soften the area covered
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    
    this.scene.add(dirLight);

    // 3. Cool Fill Light (Reflecting off white walls)
    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.5);
    fillLight.position.set(-8, 10, -8);
    this.scene.add(fillLight);
  }

  private updateKeyframeOrientation(key: CameraKey) {
    const instance = this.keyframeInstances[key];
    const orientation = this.keyframeOrientations[key];
    this.lookAtMatrix.lookAt(instance.position, instance.focalPoint, CAMERA_UP);
    orientation.setFromRotationMatrix(this.lookAtMatrix);
  }

  transitionFromSpinToFront(duration: number = 2000) {
    if (!this.isAutoSpinning) return;
    
    this.isAutoSpinning = false;
    this.targetKeyframe = CameraKey.FRONT;
    this.currentKeyframe = undefined;

    const targetKeyframe = this.keyframeInstances[CameraKey.FRONT];
    const focalPoint = targetKeyframe.focalPoint;
    
    // Calculate current angle and radius
    const dx = this.cameraPosition.x - focalPoint.x;
    const dz = this.cameraPosition.z - focalPoint.z;
    const currentAngle = Math.atan2(dx, dz);
    const radius = Math.sqrt(dx * dx + dz * dz);
    
    // Calculate target angle
    const targetDx = targetKeyframe.position.x - focalPoint.x;
    const targetDz = targetKeyframe.position.z - focalPoint.z;
    let targetAngle = Math.atan2(targetDx, targetDz);
    
    // Ensure we spin in the same direction (positive rotation)
    // Make sure targetAngle is greater than currentAngle
    while (targetAngle <= currentAngle) {
      targetAngle += Math.PI * 2;
    }

    console.log(`[SPIN TRANSITION] Current Angle: ${currentAngle}, Target Angle: ${targetAngle}`);

    // Animate angle
    const animState = { angle: currentAngle };
    const spinTween = new TWEEN.Tween(animState)
      .to({ angle: targetAngle }, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        // Update position based on new angle
        this.cameraPosition.x = focalPoint.x + radius * Math.sin(animState.angle);
        this.cameraPosition.z = focalPoint.z + radius * Math.cos(animState.angle);
        
        // Update orientation to look at focal point
        this.lookAtMatrix.lookAt(this.cameraPosition, focalPoint, CAMERA_UP);
        this.cameraOrientation.setFromRotationMatrix(this.lookAtMatrix);
      })
      .onComplete(() => {
        console.log('[SPIN TRANSITION] Complete');
        this.currentKeyframe = CameraKey.FRONT;
        this.targetKeyframe = undefined;
        
        // Ensure exact final position/orientation
        this.cameraPosition.copy(targetKeyframe.position);
        this.cameraOrientation.copy(this.keyframeOrientations[CameraKey.FRONT]);
      });

    spinTween.start();
  }

  transitionTo(key: CameraKey, duration: number = 1500) {
    if (this.currentKeyframe === key) {
      console.log(`Already at ${key}, skipping transition`);
      return;
    }
    
    const targetKeyframe = this.keyframeInstances[key];
    
    console.log(`[TRANSITION] Starting: ${this.currentKeyframe} → ${key}`);
    console.log(`[TRANSITION] Current pos:`, this.cameraPosition.toArray());
    console.log(`[TRANSITION] Target pos:`, targetKeyframe.position.toArray());
    
    if (this.targetKeyframe) {
      TWEEN.removeAll();
    }
    
    this.currentKeyframe = undefined;
    this.targetKeyframe = key;

    const startOrientation = this.cameraOrientation.clone();
    const targetOrientation = this.keyframeOrientations[key].clone();
    const orientationState = { t: 0 };
    
    // Monitor opacity transition
    const targetShowMonitor = key === CameraKey.BACK_WIDE || key === CameraKey.BACK_CLOSE;
    const targetOpacity = targetShowMonitor ? 1 : 0;
    const opacityState = { t: this.currentMonitorOpacity };
    
    const opacityTween = new TWEEN.Tween(opacityState)
      .to({ t: targetOpacity }, duration)
      .easing(TWEEN.Easing.Cubic.InOut) // Cubic for slightly softer transition than Quintic
      .onUpdate(() => {
        this.monkeyScene.setMonitorOpacity(opacityState.t);
        this.currentMonitorOpacity = opacityState.t;
      });
    
    const posTween = new TWEEN.Tween(this.cameraPosition)
      .to(targetKeyframe.position, duration)
      .easing(TWEEN.Easing.Quintic.InOut)
      .onComplete(() => {
        console.log(`[TRANSITION] Complete! Now at ${key}`);
        this.currentKeyframe = key;
        this.targetKeyframe = undefined;
        this.monkeyScene.setViewMode(key);
        this.updateMonitorForCamera(key);
      });
    
    const focTween = new TWEEN.Tween(this.cameraFocalPoint)
      .to(targetKeyframe.focalPoint, duration)
      .easing(TWEEN.Easing.Quintic.InOut);

    const orientationTween = new TWEEN.Tween(orientationState)
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Quintic.InOut)
      .onUpdate(() => {
        this.cameraOrientation.copy(startOrientation).slerp(targetOrientation, orientationState.t);
      })
      .onComplete(() => {
        this.cameraOrientation.copy(targetOrientation);
      });
      
    posTween.start();
    focTween.start();
    orientationTween.start();
    opacityTween.start();
      
    console.log('[TRANSITION] Tweens started:', posTween, focTween, orientationTween, opacityTween);
  }
  
  cycleView() {
    if (this.devMode) {
      return;
    }
    
    const keyframeToUse = this.targetKeyframe || this.currentKeyframe || CameraKey.FRONT;
    
    const viewCycle = [CameraKey.FRONT, CameraKey.BACK_WIDE, CameraKey.BACK_CLOSE];
    const currentIndex = viewCycle.indexOf(keyframeToUse);
    const nextIndex = (currentIndex + 1) % viewCycle.length;
    console.log(`Camera transitioning: ${keyframeToUse} → ${viewCycle[nextIndex]}`);
    this.transitionTo(viewCycle[nextIndex]);
  }
  
  setDevMode(enabled: boolean) {
    this.devMode = enabled;
    this.controls.enabled = enabled;
    this.isAutoSpinning = false; // Always disable auto-spin when toggling dev mode
    
    if (enabled) {
      this.controls.target.copy(this.cameraFocalPoint);
      this.controls.update();
      console.log('Dev mode enabled - free camera control (Arrow keys/WASD to move)');
    } else {
      this.pressedKeys.clear();
      
      if (this.currentKeyframe) {
        this.cameraPosition.copy(this.keyframeInstances[this.currentKeyframe].position);
        this.cameraFocalPoint.copy(this.keyframeInstances[this.currentKeyframe].focalPoint);
        this.cameraOrientation.copy(this.keyframeOrientations[this.currentKeyframe]);
        this.camera.position.copy(this.cameraPosition);
        this.camera.quaternion.copy(this.cameraOrientation);
      }
      console.log('Dev mode disabled - keyframe control restored');
    }
  }

  private updateMonitorForCamera(key: CameraKey) {
    const shouldEnable = key === CameraKey.BACK_WIDE || key === CameraKey.BACK_CLOSE;
    this.setMonitorInteractivity(shouldEnable);
    if (this.devMode) {
      this.hideMonitorHint();
    } else if (key === CameraKey.BACK_WIDE && shouldEnable) {
      this.showMonitorHint();
    } else {
      this.hideMonitorHint();
    }
  }

  private setMonitorInteractivity(enabled: boolean) {
    if (this.monitorInteractive === enabled) return;
    this.monitorInteractive = enabled;
    this.rendererManager.setCSSInteractivity(enabled);
    this.monkeyScene.setMonitorInteractivity(enabled);
    if (!enabled) {
      this.clearHoverState();
      this.hideMonitorHint();
    }
  }

  private handleMonitorHover = (hovering: boolean) => {
    if (this.devMode) return;
    this.monitorHovered = hovering;
    console.log('[SceneManager] monitor hover event:', hovering, 'current=', this.currentKeyframe, 'target=', this.targetKeyframe);

    if (!hovering) {
      this.clearHoverTimeout();
      if (this.currentKeyframe === CameraKey.BACK_CLOSE) {
        console.log('[SceneManager] hover ended while BACK_CLOSE, returning to BACK_WIDE');
        this.transitionTo(CameraKey.BACK_WIDE);
      }
      return;
    }

    if (this.currentKeyframe === CameraKey.BACK_WIDE || this.targetKeyframe === CameraKey.BACK_WIDE) {
      console.log('[SceneManager] hover while BACK_WIDE, starting timeout');
      this.startHoverTimeout();
    }
  };

  private startHoverTimeout() {
    if (this.monitorHoverTimeout) return;
    console.log('[SceneManager] scheduling hover timeout to go BACK_CLOSE');
    this.monitorHoverTimeout = window.setTimeout(() => {
      this.monitorHoverTimeout = null;
      const canTransition =
        this.monitorHovered &&
        (this.currentKeyframe === CameraKey.BACK_WIDE || this.targetKeyframe === CameraKey.BACK_WIDE);
      console.log('[SceneManager] hover timeout fired, canTransition=', canTransition, 'current=', this.currentKeyframe, 'target=', this.targetKeyframe);
      if (canTransition) {
        this.transitionTo(CameraKey.BACK_CLOSE);
      }
    }, 500);
  }

  private clearHoverTimeout() {
    if (this.monitorHoverTimeout) {
      console.log('[SceneManager] clearing hover timeout');
      clearTimeout(this.monitorHoverTimeout);
      this.monitorHoverTimeout = null;
    }
  }

  private clearHoverState() {
    this.monitorHovered = false;
    this.clearHoverTimeout();
  }

  private showMonitorHint() {
    this.monitorHintOverlay.style.opacity = '1';
    this.monitorHintOverlay.style.visibility = 'visible';
  }

  private hideMonitorHint() {
    this.monitorHintOverlay.style.opacity = '0';
    this.monitorHintOverlay.style.visibility = 'hidden';
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate = () => {
    if (!this.isRunning) {
      console.error('Animation loop stopped!');
      return;
    }

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    TWEEN.update();
    
    if (this.targetKeyframe && Math.random() < 0.05) {
      console.log('[ANIMATE] Transitioning to:', this.targetKeyframe);
      console.log('[ANIMATE] Camera pos:', this.cameraPosition.toArray());
    }

    for (const key in this.keyframeInstances) {
      const _key = key as CameraKey;
      this.keyframeInstances[_key].update(deltaTime);
      this.updateKeyframeOrientation(_key);
    }

    if (this.currentKeyframe) {
      this.cameraPosition.copy(this.keyframeInstances[this.currentKeyframe].position);
      this.cameraFocalPoint.copy(this.keyframeInstances[this.currentKeyframe].focalPoint);
      this.cameraOrientation.copy(this.keyframeOrientations[this.currentKeyframe]);
    }

    // Handle Auto-Spin
    if (this.isAutoSpinning && !this.devMode) {
      const spinAmount = this.autoSpinSpeed * deltaTime;
      const focalPoint = this.keyframeInstances[CameraKey.FRONT].focalPoint;
      
      // Rotate camera position around focal point
      const dx = this.cameraPosition.x - focalPoint.x;
      const dz = this.cameraPosition.z - focalPoint.z;
      
      const currentAngle = Math.atan2(dx, dz);
      const newAngle = currentAngle + spinAmount;
      const radius = Math.sqrt(dx * dx + dz * dz);
      
      this.cameraPosition.x = focalPoint.x + radius * Math.sin(newAngle);
      this.cameraPosition.z = focalPoint.z + radius * Math.cos(newAngle);
      
      // Update orientation to look at focal point
      this.lookAtMatrix.lookAt(this.cameraPosition, focalPoint, CAMERA_UP);
      this.cameraOrientation.setFromRotationMatrix(this.lookAtMatrix);
    }

    this.monkeyScene.update(elapsedTime);
    
    if (this.devMode) {
      this.updateCameraMovement();
      this.controls.update();
    } else {
      this.camera.position.copy(this.cameraPosition);
      this.camera.quaternion.copy(this.cameraOrientation);
      this.camera.up.copy(CAMERA_UP);
    }
    
    // Update Debug Overlay
    this.updateDebugOverlay();
    
    if (this.targetKeyframe && Math.random() < 0.05) {
      console.log('[ANIMATE] Camera actual pos:', this.camera.position.toArray());
    }

    // Pass main scene to CSS renderer as well so hierarchical CSS3DObjects are rendered
    this.rendererManager.render(this.scene, this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private updateDebugOverlay() {
    if (!this.debugOverlay) return;

    // Only show debug overlay when dev mode is enabled
    if (!this.devMode) {
      this.debugOverlay.style.display = 'none';
      return;
    }

    this.debugOverlay.style.display = 'block';
    const pos = this.camera.position;
    const rot = this.camera.rotation;
    const target = this.controls?.target ?? new THREE.Vector3();
    const lines = [
      `Camera Pos : [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`,
      `Camera Rot : [${rot.x.toFixed(2)}, ${rot.y.toFixed(2)}, ${rot.z.toFixed(2)}]`,
      `Camera Aim : [${target.x.toFixed(2)}, ${target.y.toFixed(2)}, ${target.z.toFixed(2)}]`,
      `Mode       : ${this.devMode ? 'DEV (Free)' : 'Keyframe'}`,
      `Keyframe   : ${this.currentKeyframe || 'Transitioning'}`
    ];

    this.debugOverlay.textContent = lines.join('\n');
  }

  handleResize = () => {
    if (!this.rendererManager.webglRenderer.domElement.parentElement) return;
    
    const container = this.rendererManager.webglRenderer.domElement.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.rendererManager.resize(width, height);
  };

  dispose() {
    console.log('Disposing ThreeSceneManager...');
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    
    if (this.handleClick) {
      document.removeEventListener('mousedown', this.handleClick);
    }
    if (this.handleEscapeKey) {
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
    if (this.handleKeyDown) {
      document.removeEventListener('keydown', this.handleKeyDown);
    }
    if (this.handleKeyUp) {
      document.removeEventListener('keyup', this.handleKeyUp);
    }
    
    if (this.debugOverlay && this.debugOverlay.parentNode) {
      this.debugOverlay.parentNode.removeChild(this.debugOverlay);
    }
    if (this.clickToBeginOverlay && this.clickToBeginOverlay.parentNode) {
      this.clickToBeginOverlay.parentNode.removeChild(this.clickToBeginOverlay);
    }
    
    this.controls.dispose();
    this.rendererManager.dispose();
    TWEEN.removeAll();
    
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
    console.log('ThreeSceneManager disposed');
  }
}
