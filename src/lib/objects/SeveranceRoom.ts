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
    
    const material = new THREE.MeshStandardMaterial({
      color: COLORS.WALLS,
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide, // Visible from inside
    });
    
    const baseboardMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.BASEBOARD,
      roughness: 0.8,
    });
    
    const wallPositions = [
      { pos: [0, height/2, -halfDepth], rot: [0, 0, 0], size: [DIMENSIONS.WIDTH, height] }, // Back
      { pos: [0, height/2, halfDepth], rot: [0, Math.PI, 0], size: [DIMENSIONS.WIDTH, height] }, // Front
      { pos: [-halfWidth, height/2, 0], rot: [0, Math.PI/2, 0], size: [DIMENSIONS.DEPTH, height] }, // Left
      { pos: [halfWidth, height/2, 0], rot: [0, -Math.PI/2, 0], size: [DIMENSIONS.DEPTH, height] }, // Right
    ];
    
    wallPositions.forEach(({ pos, rot, size }) => {
      // Main Wall
      const geometry = new THREE.PlaneGeometry(size[0], size[1]);
      const wall = new THREE.Mesh(geometry, material);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.rotation.set(rot[0], rot[1], rot[2]);
      wall.receiveShadow = true;
      wall.castShadow = false; // Walls usually don't cast shadows on floor in this setup
      this.group.add(wall);
      
      // Baseboard
      const baseHeight = 0.15;
      const baseDepth = 0.02;
      const baseGeo = new THREE.BoxGeometry(size[0], baseHeight, baseDepth);
      const baseboard = new THREE.Mesh(baseGeo, baseboardMaterial);
      
      // Position relative to the wall position but slightly offset inward
      baseboard.position.copy(wall.position);
      baseboard.position.y = baseHeight / 2;
      baseboard.rotation.copy(wall.rotation);
      
      // Move slightly inward based on rotation to sit on surface
      const inwardOffset = baseDepth / 2;
      const forward = new THREE.Vector3(0, 0, 1).applyEuler(wall.rotation);
      baseboard.position.add(forward.multiplyScalar(inwardOffset));
      
      baseboard.castShadow = true;
      baseboard.receiveShadow = true;
      this.group.add(baseboard);
    });
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
    
    // Calculate grid dimensions
    const cols = Math.floor(DIMENSIONS.WIDTH / gridSize);
    const rows = Math.floor(DIMENSIONS.DEPTH / gridSize);
    
    // Create Beams Material
    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd, // Slightly darker than white for contrast
      roughness: 0.5,
      metalness: 0.1,
    });

    // Create Beams
    // We create long beams running X and Z directions
    // X-direction beams (running along width)
    // Actually, let's do individual cell frames or intersecting beams. 
    // Intersecting beams is efficient.
    
    // Beams running along Z axis (spaced along X)
    const beamGeoZ = new THREE.BoxGeometry(beamThickness, beamDepth, DIMENSIONS.DEPTH);

    // Let's build the grid centered.
    const fullWidth = cols * gridSize;
    const fullDepth = rows * gridSize;
    const startX = -fullWidth / 2;
    const startZ = -fullDepth / 2;

    // Vertical beams (along Z axis)
    for (let i = 0; i <= cols; i++) {
      const beam = new THREE.Mesh(beamGeoZ, beamMaterial);
      beam.position.set(startX + i * gridSize, -beamDepth/2, 0);
      ceilingGroup.add(beam);
    }

    // Horizontal beams (along X axis)
    const beamGeoX = new THREE.BoxGeometry(DIMENSIONS.WIDTH, beamDepth, beamThickness);
    for (let j = 0; j <= rows; j++) {
      const beam = new THREE.Mesh(beamGeoX, beamMaterial);
      beam.position.set(0, -beamDepth/2, startZ + j * gridSize);
      ceilingGroup.add(beam);
    }

    // Create Light Panels
    // They sit inside the grid cells, slightly recessed up
    const panelSize = gridSize - beamThickness;
    const panelGeo = new THREE.PlaneGeometry(panelSize, panelSize);
    
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    // Fill the grid cells
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const panel = new THREE.Mesh(panelGeo, lightMaterial);
        
        const centerX = startX + (i * gridSize) + (gridSize / 2);
        const centerZ = startZ + (j * gridSize) + (gridSize / 2);
        
        // Recessed slightly higher than the bottom of beams
        // Beams go from 0 to -beamDepth
        // Panels should be at -beamDepth + epsilon (so they are "above" the bottom of the beam, looking up)
        // Wait, usually dropped ceilings have the grid lower than the actual ceiling slab.
        // The lights are panels *in* the grid.
        // If beams are at y=0 to y=-0.15 relative to ceiling group:
        // Panels should be flush with the beams or slightly recessed up.
        // Let's put them at -beamDepth/2 (middle of beam vertical) or flush with top (0).
        // If we put them at 0 (top of beam), they might be hidden if viewed from side? No, we view from below.
        // Let's put them slightly recessed from the bottom face of the beam.
        // Bottom of beam is -beamDepth. Let's put panel at -beamDepth + 0.05
        
        panel.rotation.x = Math.PI / 2;
        panel.position.set(centerX, -beamDepth + 0.2, centerZ);
        
        // Add a subtle inner frame or black gap? 
        // For now just the panel.
        ceilingGroup.add(panel);
      }
    }
    
    // Add a backing plate above everything to prevent light leaks or seeing void
    const backingGeo = new THREE.PlaneGeometry(DIMENSIONS.WIDTH, DIMENSIONS.DEPTH);
    const backing = new THREE.Mesh(backingGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    backing.rotation.x = Math.PI / 2;
    backing.position.y = 0.01; // Just above
    ceilingGroup.add(backing);
  }
}
