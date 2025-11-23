import { ThreeSceneManager } from '@/lib/SceneManager';

export class ThreeApp {
  sceneManager: ThreeSceneManager | null = null;
  
  constructor() {
    this.init();
  }
  
  init() {
    const webglContainer = document.getElementById('three-webgl');
    const cssContainer = document.getElementById('three-css');
    
    if (!webglContainer || !cssContainer) {
      throw new Error('Element not found');
    }
    
    this.sceneManager = new ThreeSceneManager(
      webglContainer,
      cssContainer
    );
  }
  
  toggleDevMode() {
    if (this.sceneManager) {
      this.sceneManager.setDevMode(!this.sceneManager.devMode);
      return this.sceneManager.devMode;
    }
    return false;
  }
  
  getDevMode() {
    return this.sceneManager?.devMode ?? false;
  }
  
  destroy() {
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
  }
}

let threeAppInstance: ThreeApp | null = null;

export function getThreeApp(): ThreeApp {
  if (!threeAppInstance) {
    threeAppInstance = new ThreeApp();
  }
  return threeAppInstance;
}

