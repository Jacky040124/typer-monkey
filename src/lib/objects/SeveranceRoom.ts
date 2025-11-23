import * as THREE from 'three';
import { SEVERANCE_ROOM_CONFIG } from '@/models/constants/scene';

export class SeveranceRoom {
  group: THREE.Group;
  
  constructor(parent: THREE.Object3D) {
    this.group = new THREE.Group();
    parent.add(this.group);
    
    // Create the iconic green carpet
    this.createFloor();
    // Build the surrounding walls with baseboards
    this.createWalls();
    // Add the grid ceiling with panel lights
    this.createCeiling();
  }

  /**
   * Generates a procedural noise texture for the carpet
   */
  private generateCarpetTexture(): THREE.CanvasTexture {
    const width = 512;
    const height = 512;
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.CanvasTexture(canvas);
    
    context.fillStyle = '#808080';
    context.fillRect(0, 0, width, height);
    
    const imgData = context.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    
    context.putImageData(imgData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10); // Repeat across the floor
    
    return texture;
  }

  /**
   * Creates the floor using the specific dark green carpet color (0x2d4635)
   * iconic to the MDR room. Using high roughness to simulate fabric texture.
   */
  createFloor() {
    const { DIMENSIONS, COLORS } = SEVERANCE_ROOM_CONFIG;
    
    const bumpMap = this.generateCarpetTexture();
    bumpMap.repeat.set(
      DIMENSIONS.WIDTH / 2.4,
      DIMENSIONS.DEPTH / 2.4
    );
    
    // High roughness carpet material
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.CARPET,
      roughness: 1.0,
      metalness: 0.0,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      side: THREE.FrontSide,
    });
    
    const geometry = new THREE.PlaneGeometry(DIMENSIONS.WIDTH, DIMENSIONS.DEPTH);
    const floor = new THREE.Mesh(geometry, material);
    
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    
    this.group.add(floor);
  }

  createWalls() {
    const { DIMENSIONS, COLORS } = SEVERANCE_ROOM_CONFIG;
    const halfWidth = DIMENSIONS.WIDTH / 2;
    const halfDepth = DIMENSIONS.DEPTH / 2;
    const height = DIMENSIONS.HEIGHT;
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.WALLS,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.FrontSide,
    });
    
    const baseboardMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.BASEBOARD,
      roughness: 0.8,
    });

    // 1. Back Wall (North) - Has Door
    this.createWallSide({
      start: new THREE.Vector3(-halfWidth, 0, -halfDepth),
      end: new THREE.Vector3(halfWidth, 0, -halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      hasDoor: true,
      normal: new THREE.Vector3(0, 0, 1)
    });

    // 2. Front Wall (South)
    this.createWallSide({
      start: new THREE.Vector3(halfWidth, 0, halfDepth),
      end: new THREE.Vector3(-halfWidth, 0, halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      normal: new THREE.Vector3(0, 0, -1)
    });

    // 3. Left Wall (West)
    this.createWallSide({
      start: new THREE.Vector3(-halfWidth, 0, halfDepth),
      end: new THREE.Vector3(-halfWidth, 0, -halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      normal: new THREE.Vector3(1, 0, 0)
    });

    // 4. Right Wall (East) - Has Clock
    this.createWallSide({
      start: new THREE.Vector3(halfWidth, 0, -halfDepth),
      end: new THREE.Vector3(halfWidth, 0, halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      hasClock: true,
      normal: new THREE.Vector3(-1, 0, 0)
    });

    // Add Columns at corners
    this.createColumn(new THREE.Vector3(-halfWidth, 0, -halfDepth));
    this.createColumn(new THREE.Vector3(halfWidth, 0, -halfDepth));
    this.createColumn(new THREE.Vector3(-halfWidth, 0, halfDepth));
    this.createColumn(new THREE.Vector3(halfWidth, 0, halfDepth));
  }

  createWallSide(config: {
    start: THREE.Vector3;
    end: THREE.Vector3;
    height: number;
    material: THREE.Material;
    baseboardMaterial: THREE.Material;
    hasDoor?: boolean;
    hasClock?: boolean;
    normal: THREE.Vector3;
  }) {
    const vector = new THREE.Vector3().subVectors(config.end, config.start);
    const length = vector.length();
    const direction = vector.clone().normalize();
    
    if (config.hasDoor) {
      const doorWidth = 2.2;
      const doorHeight = 2.4;
      const sideWidth = (length - doorWidth) / 2;
      
      // Left Segment
      this.createWallSegment({
        start: config.start,
        width: sideWidth,
        height: config.height,
        direction,
        material: config.material,
        baseboardMaterial: config.baseboardMaterial,
        normal: config.normal
      });
      
      const doorPos = new THREE.Vector3().copy(config.start).add(direction.clone().multiplyScalar(sideWidth));
      
      // Door Header
      const headerHeight = config.height - doorHeight;
      this.createWallSegment({
        start: new THREE.Vector3(doorPos.x, doorHeight, doorPos.z),
        width: doorWidth,
        height: headerHeight,
        direction,
        material: config.material,
        baseboardMaterial: null,
        normal: config.normal
      });
      
      // Create Door
      this.createDoor(doorPos, doorWidth, doorHeight, direction, config.normal);
      
      // Right Segment
      const rightStart = new THREE.Vector3().copy(doorPos).add(direction.clone().multiplyScalar(doorWidth));
      this.createWallSegment({
        start: rightStart,
        width: sideWidth,
        height: config.height,
        direction,
        material: config.material,
        baseboardMaterial: config.baseboardMaterial,
        normal: config.normal
      });
      
    } else {
      // Standard Wall
      this.createWallSegment({
        start: config.start,
        width: length,
        height: config.height,
        direction,
        material: config.material,
        baseboardMaterial: config.baseboardMaterial,
        normal: config.normal
      });
      
      if (config.hasClock) {
         const midPoint = new THREE.Vector3().copy(config.start).add(direction.clone().multiplyScalar(length / 2));
         midPoint.y = 3.5;
         midPoint.add(config.normal.clone().multiplyScalar(0.1));
         this.createClock(midPoint, config.normal);
      }
    }
  }

  createWallSegment(params: {
    start: THREE.Vector3;
    width: number;
    height: number;
    direction: THREE.Vector3;
    material: THREE.Material;
    baseboardMaterial: THREE.Material | null;
    normal: THREE.Vector3;
  }) {
    const panelWidth = 1.2;
    const numPanels = Math.ceil(params.width / panelWidth);
    const actualPanelWidth = params.width / numPanels;
    const thickness = 0.1;
    
    for (let i = 0; i < numPanels; i++) {
      const panelGeo = new THREE.BoxGeometry(actualPanelWidth - 0.02, params.height, thickness);
      const panel = new THREE.Mesh(panelGeo, params.material);
      
      const dist = (i * actualPanelWidth) + (actualPanelWidth / 2);
      const pos = new THREE.Vector3().copy(params.start).add(params.direction.clone().multiplyScalar(dist));
      
      pos.y = params.start.y + params.height / 2;
      pos.add(params.normal.clone().multiplyScalar(-thickness/2));
      
      panel.position.copy(pos);
      panel.lookAt(pos.clone().add(params.normal));
      
      panel.receiveShadow = true;
      panel.castShadow = false;
      this.group.add(panel);
      
      // Baseboard
      if (params.baseboardMaterial && params.start.y < 0.1) {
        const baseHeight = 0.20;
        const baseDepth = 0.04;
        const baseGeo = new THREE.BoxGeometry(actualPanelWidth, baseHeight, baseDepth);
        const baseboard = new THREE.Mesh(baseGeo, params.baseboardMaterial);
        
        baseboard.position.copy(pos);
        baseboard.position.y = baseHeight / 2;
        baseboard.position.add(params.normal.clone().multiplyScalar(thickness/2 + baseDepth/2));
        
        baseboard.rotation.copy(panel.rotation);
        baseboard.receiveShadow = true;
        baseboard.castShadow = true;
        this.group.add(baseboard);
      }
    }
  }

  createColumn(position: THREE.Vector3) {
    const width = 0.6;
    const depth = 0.6;
    const height = SEVERANCE_ROOM_CONFIG.DIMENSIONS.HEIGHT;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: SEVERANCE_ROOM_CONFIG.COLORS.WALLS,
      roughness: 0.6,
    });
    
    const column = new THREE.Mesh(geometry, material);
    column.position.copy(position);
    column.position.y = height / 2;
    
    column.castShadow = true;
    column.receiveShadow = true;
    this.group.add(column);
  }

  createDoor(position: THREE.Vector3, width: number, height: number, wallDir: THREE.Vector3, normal: THREE.Vector3) {
    const frameDepth = 0.2;
    const frameThickness = 0.1;
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    
    // Top Frame
    const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(width, frameThickness, frameDepth),
        frameMaterial
    );
    // Position center: start + width/2
    const frameCenter = position.clone().add(wallDir.clone().multiplyScalar(width/2));
    
    topFrame.position.copy(frameCenter);
    topFrame.position.y = height - frameThickness/2;
    topFrame.lookAt(topFrame.position.clone().add(normal));
    this.group.add(topFrame);
    
    // Side Frames
    const sideGeo = new THREE.BoxGeometry(frameThickness, height, frameDepth);
    
    const leftFrame = new THREE.Mesh(sideGeo, frameMaterial);
    leftFrame.position.copy(position).add(wallDir.clone().multiplyScalar(frameThickness/2));
    leftFrame.position.y = height/2;
    leftFrame.lookAt(leftFrame.position.clone().add(normal));
    this.group.add(leftFrame);
    
    const rightFrame = new THREE.Mesh(sideGeo, frameMaterial);
    rightFrame.position.copy(position).add(wallDir.clone().multiplyScalar(width - frameThickness/2));
    rightFrame.position.y = height/2;
    rightFrame.lookAt(rightFrame.position.clone().add(normal));
    this.group.add(rightFrame);
    
    // Door Leaf
    const doorGeo = new THREE.BoxGeometry(width - 2*frameThickness, height - frameThickness, 0.05);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.2 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    
    door.position.copy(frameCenter);
    door.position.y = (height - frameThickness) / 2;
    door.position.add(normal.clone().multiplyScalar(-0.05));
    
    door.lookAt(door.position.clone().add(normal));
    this.group.add(door);
    
    // Handle
    const handleGeo = new THREE.BoxGeometry(0.05, 0.15, 0.08);
    const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 }));
    
    const handleOffset = (width/2) - 0.25;
    handle.position.copy(frameCenter).add(wallDir.clone().multiplyScalar(handleOffset));
    handle.position.y = 1.0;
    handle.position.add(normal.clone().multiplyScalar(0.05));
    handle.lookAt(handle.position.clone().add(normal));
    
    this.group.add(handle);
    
    this.createSwitches(frameCenter, wallDir, normal);
  }

  createSwitches(doorCenter: THREE.Vector3, wallDir: THREE.Vector3, normal: THREE.Vector3) {
     const switchGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
     const switchMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
     
     const sw = new THREE.Mesh(switchGeo, switchMat);
     const offset = 1.5; 
     sw.position.copy(doorCenter).add(wallDir.clone().multiplyScalar(offset));
     sw.position.y = 1.1;
     sw.position.add(normal.clone().multiplyScalar(0.06));
     
     sw.lookAt(sw.position.clone().add(normal));
     this.group.add(sw);
  }

  createClock(position: THREE.Vector3, normal: THREE.Vector3) {
    const radius = 0.3;
    const thickness = 0.05;
    const segments = 32;
    
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, thickness, segments);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const clock = new THREE.Mesh(bodyGeo, bodyMat);
    
    clock.position.copy(position);
    
    // Align Y axis of cylinder with normal
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    clock.setRotationFromQuaternion(quaternion);
    
    this.group.add(clock);
    
    // Face
    const faceGeo = new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.01, segments);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, thickness/2 + 0.001, 0);
    clock.add(face);
    
    // Hands
    const handMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const hourGeo = new THREE.BoxGeometry(0.04, radius * 0.5, 0.01);
    hourGeo.translate(0, radius * 0.25, 0);
    const hourHand = new THREE.Mesh(hourGeo, handMat);
    hourHand.position.set(0, thickness/2 + 0.02, 0);
    hourHand.rotation.z = -Math.PI / 3; 
    clock.add(hourHand);
    
    const minGeo = new THREE.BoxGeometry(0.02, radius * 0.8, 0.01);
    minGeo.translate(0, radius * 0.4, 0);
    const minHand = new THREE.Mesh(minGeo, handMat);
    minHand.position.set(0, thickness/2 + 0.02, 0);
    minHand.rotation.z = Math.PI / 6;
    clock.add(minHand);
  }

  createCeiling() {
    const { DIMENSIONS, CEILING } = SEVERANCE_ROOM_CONFIG;
    const height = DIMENSIONS.HEIGHT;
    
    const ceilingGroup = new THREE.Group();
    ceilingGroup.position.y = height;
    this.group.add(ceilingGroup);
    
    const gridSize = CEILING.GRID_SIZE;
    const beamThickness = CEILING.BEAM_THICKNESS;
    const beamDepth = CEILING.BEAM_DEPTH;
    
    const cols = Math.floor(DIMENSIONS.WIDTH / gridSize);
    const rows = Math.floor(DIMENSIONS.DEPTH / gridSize);
    
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      roughness: 0.5,
      metalness: 0.1,
    });

    const beamGeoZ = new THREE.BoxGeometry(beamThickness, beamDepth, DIMENSIONS.DEPTH);
    const fullWidth = cols * gridSize;
    const fullDepth = rows * gridSize;
    const startX = -fullWidth / 2;
    const startZ = -fullDepth / 2;

    for (let i = 0; i <= cols; i++) {
      const beam = new THREE.Mesh(beamGeoZ, beamMaterial);
      beam.position.set(startX + i * gridSize, -beamDepth/2, 0);
      ceilingGroup.add(beam);
    }

    const beamGeoX = new THREE.BoxGeometry(DIMENSIONS.WIDTH, beamDepth, beamThickness);
    for (let j = 0; j <= rows; j++) {
      const beam = new THREE.Mesh(beamGeoX, beamMaterial);
      beam.position.set(0, -beamDepth/2, startZ + j * gridSize);
      ceilingGroup.add(beam);
    }

    const panelSize = gridSize - beamThickness;
    const panelGeo = new THREE.PlaneGeometry(panelSize, panelSize);
    
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const panel = new THREE.Mesh(panelGeo, lightMaterial);
        
        const centerX = startX + (i * gridSize) + (gridSize / 2);
        const centerZ = startZ + (j * gridSize) + (gridSize / 2);
        
        panel.rotation.x = Math.PI / 2;
        panel.position.set(centerX, -beamDepth + 0.2, centerZ);
        
        ceilingGroup.add(panel);
      }
    }
    
    const backingGeo = new THREE.PlaneGeometry(DIMENSIONS.WIDTH, DIMENSIONS.DEPTH);
    const backing = new THREE.Mesh(backingGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    backing.rotation.x = Math.PI / 2;
    backing.position.y = 0.01;
    ceilingGroup.add(backing);
  }
}
