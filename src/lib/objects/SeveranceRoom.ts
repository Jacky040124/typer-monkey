import * as THREE from 'three';
import { SEVERANCE_ROOM_CONFIG } from '@constants/scene';

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
    
    const wallColor = new THREE.Color(COLORS.WALLS);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.25,
      metalness: 0.0,
      emissive: wallColor.clone(),
      emissiveIntensity: 0.08,
      side: THREE.FrontSide,
    });
    
    const baseboardMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.BASEBOARD,
      roughness: 0.8,
    });

    const seamMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.WALL_SEAMS,
      roughness: 0.4,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    // 1. Back Wall (North)
    this.createWallSide({
      start: new THREE.Vector3(-halfWidth, 0, -halfDepth),
      end: new THREE.Vector3(halfWidth, 0, -halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      seamMaterial,
      normal: new THREE.Vector3(0, 0, 1)
    });

    // 2. Front Wall (South)
    this.createWallSide({
      start: new THREE.Vector3(halfWidth, 0, halfDepth),
      end: new THREE.Vector3(-halfWidth, 0, halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      seamMaterial,
      normal: new THREE.Vector3(0, 0, -1)
    });

    // 3. Left Wall (West)
    this.createWallSide({
      start: new THREE.Vector3(-halfWidth, 0, halfDepth),
      end: new THREE.Vector3(-halfWidth, 0, -halfDepth),
      height,
      material: wallMaterial,
      baseboardMaterial,
      seamMaterial,
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
      seamMaterial,
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
    hasClock?: boolean;
    seamMaterial: THREE.Material;
    normal: THREE.Vector3;
  }) {
    const vector = new THREE.Vector3().subVectors(config.end, config.start);
    const length = vector.length();
    const direction = vector.clone().normalize();
    
    // Standard Wall
    this.createWallSegment({
      start: config.start,
      width: length,
      height: config.height,
      direction,
      material: config.material,
      baseboardMaterial: config.baseboardMaterial,
      seamMaterial: config.seamMaterial,
      normal: config.normal
    });
    
    if (config.hasClock) {
       const midPoint = new THREE.Vector3().copy(config.start).add(direction.clone().multiplyScalar(length / 2));
       midPoint.y = 3.5;
       midPoint.add(config.normal.clone().multiplyScalar(0.1));
       this.createClock(midPoint, config.normal);
    }

    // Continuous Ventilation Strip
    this.createVentilationStrip(config.start, config.end, config.height, config.normal);
  }

  createWallSegment(params: {
    start: THREE.Vector3;
    width: number;
    height: number;
    direction: THREE.Vector3;
    material: THREE.Material;
    baseboardMaterial: THREE.Material | null;
    seamMaterial?: THREE.Material;
    normal: THREE.Vector3;
  }) {
    const panelWidth = 2.5;
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

    if (params.seamMaterial) {
      const seamWidth = 0.04;
      const seamDepth = thickness + 0.04;
      const seamGeo = new THREE.BoxGeometry(seamWidth, params.height, seamDepth);

      for (let i = 0; i <= numPanels; i++) {
        const seam = new THREE.Mesh(seamGeo, params.seamMaterial);
        const boundaryDist = i * actualPanelWidth;
        const seamPos = new THREE.Vector3().copy(params.start).add(params.direction.clone().multiplyScalar(boundaryDist));
        seamPos.y = params.start.y + params.height / 2;
        seamPos.add(params.normal.clone().multiplyScalar(-thickness/2));
        seamPos.add(params.normal.clone().multiplyScalar(0.015));

        seam.position.copy(seamPos);
        seam.lookAt(seamPos.clone().add(params.normal));
        seam.castShadow = false;
        seam.receiveShadow = false;
        this.group.add(seam);
      }
    }
  }

  createVentilationStrip(start: THREE.Vector3, end: THREE.Vector3, wallHeight: number, normal: THREE.Vector3) {
    const vector = new THREE.Vector3().subVectors(end, start);
    const length = vector.length();
    const center = new THREE.Vector3().copy(start).add(vector.multiplyScalar(0.5));
    
    // Strip Configuration
    const stripHeight = 0.15; // Thinner continuous strip
    
    // Position closer to the ceiling, slight offset to stand proud of surface
    center.y = wallHeight - 0.22; 
    center.add(normal.clone().multiplyScalar(0.02));

    const group = new THREE.Group();
    group.position.copy(center);
    group.lookAt(center.clone().add(normal));

    // 1. Backing (Dark recess)
    const backingGeo = new THREE.BoxGeometry(length, stripHeight, 0.01);
    const backingMat = new THREE.MeshStandardMaterial({ 
        color: 0x59606a,
        roughness: 0.7,
        metalness: 0.2
    });
    const backing = new THREE.Mesh(backingGeo, backingMat);
    group.add(backing);

    // 2. Slats (Continuous horizontal lines)
    const numSlats = 5;
    const slatThickness = 0.008;
    const slatDepth = 0.02;
    const slatGeo = new THREE.BoxGeometry(length, slatThickness, slatDepth);
    const slatMat = new THREE.MeshStandardMaterial({ 
        color: 0xaeb6c2, // Lighter anodized aluminum
        roughness: 0.3,
        metalness: 0.6
    });

    // Distribute slats
    for (let i = 0; i < numSlats; i++) {
        const slat = new THREE.Mesh(slatGeo, slatMat);
        // Map i from 0..n-1 to -H/2..H/2 range, with padding
        const t = i / (numSlats - 1);
        const y = -stripHeight/2 * 0.7 + t * stripHeight * 0.7;
        
        slat.position.set(0, y, 0.015);
        group.add(slat);
    }
    
    // 3. Thin Frame (Top/Bottom only to maintain continuous horizontal look)
    const rimHeight = 0.01;
    const rimGeo = new THREE.BoxGeometry(length, rimHeight, 0.025);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.3 });
    
    const topRim = new THREE.Mesh(rimGeo, rimMat);
    topRim.position.set(0, stripHeight/2, 0.012);
    group.add(topRim);
    
    const bottomRim = new THREE.Mesh(rimGeo, rimMat);
    bottomRim.position.set(0, -stripHeight/2, 0.012);
    group.add(bottomRim);

    this.group.add(group);
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
