import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { COMPUTER_CONFIG } from '@constants/scene';
import { MonitorScreen } from './MonitorScreen';
import { CameraKey } from '@/models/three';

export class Computer {
  model: THREE.Group | null = null;
  group: THREE.Group;
  monitorScreen: MonitorScreen | null = null;
  hasScreen: boolean;
  pendingHoverListener: ((hovering: boolean) => void) | null = null;
  private _currentOpacity: number = 0;

  constructor(parent: THREE.Object3D, hasScreen: boolean = false) {
    this.group = new THREE.Group();
    this.hasScreen = hasScreen;
    parent.add(this.group);
    this.load();
  }

  setViewMode(cameraKey: CameraKey) {
    if (this.monitorScreen) {
      this.monitorScreen.setViewMode(cameraKey);
    }
  }

  setScreenOpacity(opacity: number) {
    this._currentOpacity = opacity;
    this.monitorScreen?.setScreenOpacity(opacity);
  }

  setMonitorInteractivity(enabled: boolean) {
    this.monitorScreen?.setInteractionEnabled(enabled);
  }

  setMonitorHoverListener(handler: ((hovering: boolean) => void) | null) {
    this.pendingHoverListener = handler;
    this.monitorScreen?.setHoverListener(handler);
  }

  async load() {
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    try {
      const texture = await textureLoader.loadAsync('/models/baked_computer.jpg');
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      const gltf = await loader.loadAsync('/models/computer_setup.glb');
      this.model = gltf.scene;
      
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshBasicMaterial({ map: texture });
        }
      });

      this.model.scale.set(
        COMPUTER_CONFIG.SCALE,
        COMPUTER_CONFIG.SCALE,
        COMPUTER_CONFIG.SCALE
      );
      this.model.position.set(
        COMPUTER_CONFIG.POSITION.X,
        COMPUTER_CONFIG.POSITION.Y,
        COMPUTER_CONFIG.POSITION.Z
      );
      this.model.rotation.y = 3 * Math.PI / 2;
      
      this.group.add(this.model);

      // Initialize MonitorScreen or Static Placeholder
      if (this.hasScreen) {
        // Interactive Screen (Iframe)
        this.monitorScreen = new MonitorScreen(this.model);
        this.monitorScreen.setScreenOpacity(this._currentOpacity);
        if (this.pendingHoverListener) {
          this.monitorScreen.setHoverListener(this.pendingHoverListener);
        }
      } else {
        // Static Placeholder (Lumon Logo)
        this.createStaticScreen();
      }
      
    } catch (error) {
      console.error('Error loading computer model:', error);
    }
  }

  async createStaticScreen() {
    if (!this.model) return;

    // Match MonitorScreen constants
    const width = 650;
    const height = 530;
    const position = new THREE.Vector3(0, 1, 0);
    const scale = 0.0022;

    const textureLoader = new THREE.TextureLoader();
    
    try {
      const texture = await textureLoader.loadAsync('/models/wallpaper.jpg');
      texture.colorSpace = THREE.SRGBColorSpace;

      // Create Mesh
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.PlaneGeometry(width, height);
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(position);
      mesh.scale.set(scale, scale, scale);
      
      this.model.add(mesh);
    } catch (error) {
      console.error('Error loading wallpaper texture:', error);
    }
  }
}
