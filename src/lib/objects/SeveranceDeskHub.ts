import * as THREE from 'three';
import { SEVERANCE_DESK_CONFIG } from '@constants/scene';
import { Chair } from '@/lib/objects/Chair';
import { Computer } from '@/lib/objects/Computer';
import { CameraKey } from '@/models/three';

export class SeveranceDeskHub {
  group: THREE.Group;
  
  material: THREE.MeshStandardMaterial;
  darkMaterial: THREE.MeshStandardMaterial;
  dividerMaterial: THREE.MeshStandardMaterial;
  
  mainComputer: Computer | null = null;

  constructor(parent: THREE.Object3D) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this.material = new THREE.MeshStandardMaterial({
      color: SEVERANCE_DESK_CONFIG.COLORS.SURFACE, 
      roughness: 0.25,
      metalness: 0.1,
    });

    this.darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.8,
    });

    this.dividerMaterial = new THREE.MeshStandardMaterial({
      color: SEVERANCE_DESK_CONFIG.COLORS.DIVIDER,
      roughness: 0.9, 
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    this.createHub();
    this.createDividers();
    this.createWorkSurfaces();
  }

  setViewMode(cameraKey: CameraKey) {
    if (this.mainComputer) {
      this.mainComputer.setViewMode(cameraKey);
    }
  }

  setScreenOpacity(opacity: number) {
    this.mainComputer?.setScreenOpacity(opacity);
  }

  setMonitorInteractivity(enabled: boolean) {
    this.mainComputer?.setMonitorInteractivity(enabled);
  }

  setMonitorHoverListener(handler: ((hovering: boolean) => void) | null) {
    this.mainComputer?.setMonitorHoverListener(handler);
  }

  createHub() {
    const { HUB } = SEVERANCE_DESK_CONFIG;
    const HUB_HEIGHT = HUB.HEIGHT;
    const HUB_WIDTH = HUB.WIDTH;
    const SLOT_DEPTH = HUB.SLOT_DEPTH;
    const SLOT_WIDTH = HUB.SLOT_WIDTH;

    const shape = new THREE.Shape();
    const s = HUB_WIDTH / 2;
    const n = SLOT_WIDTH / 2;
    const d = SLOT_DEPTH;

    shape.moveTo(-n, s);
    shape.lineTo(-n, s - d); shape.lineTo(n, s - d); shape.lineTo(n, s);
    shape.lineTo(s, s);
    shape.lineTo(s, n); shape.lineTo(s - d, n); shape.lineTo(s - d, -n); shape.lineTo(s, -n);
    shape.lineTo(s, -s);
    shape.lineTo(n, -s); shape.lineTo(n, -s + d); shape.lineTo(-n, -s + d); shape.lineTo(-n, -s);
    shape.lineTo(-s, -s);
    shape.lineTo(-s, -n); shape.lineTo(-s + d, -n); shape.lineTo(-s + d, n); shape.lineTo(-s, n);
    shape.lineTo(-s, s);
    shape.lineTo(-n, s);

    const extrudeSettings = {
      steps: 1,
      depth: HUB_HEIGHT,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 3,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.rotateX(-Math.PI / 2);
    const hub = new THREE.Mesh(geometry, this.material);
    hub.castShadow = true;
    hub.receiveShadow = true;
    this.group.add(hub);

    const capGeo = new THREE.BoxGeometry(HUB_WIDTH + 0.02, 0.02, HUB_WIDTH + 0.02);
    const cap = new THREE.Mesh(capGeo, this.material);
    cap.position.y = HUB_HEIGHT + 0.01;
    this.group.add(cap);
  }

  createDividers() {
    const { DIMENSIONS, HUB } = SEVERANCE_DESK_CONFIG;
    
    const dividerLength = (DIMENSIONS.TOTAL_WIDTH / 2) - (HUB.WIDTH / 2); 
    const dividerHeight = DIMENSIONS.DIVIDER_HEIGHT * 1.8;
    const dividerThickness = DIMENSIONS.DIVIDER_THICKNESS;
    const startHeight = DIMENSIONS.DESK_HEIGHT;
    const frameLip = 0.025;

    const topBottomRailGeo = new THREE.BoxGeometry(dividerThickness, frameLip, dividerLength);
    const verticalRailGeo = new THREE.BoxGeometry(dividerThickness, dividerHeight, frameLip);
    const panelThickness = dividerThickness * 0.4;
    const panelGeo = new THREE.BoxGeometry(
      panelThickness,
      dividerHeight - frameLip * 2,
      dividerLength - frameLip * 2
    );

    const dividerGroup = new THREE.Group();
    dividerGroup.position.y = startHeight + (dividerHeight / 2) - 0.1;
    this.group.add(dividerGroup);

    for (let i = 0; i < 4; i++) {
      const armGroup = new THREE.Group();
      armGroup.rotation.y = (Math.PI / 2) * i;
      
      const frameGroup = new THREE.Group();

      const topRail = new THREE.Mesh(topBottomRailGeo, this.material);
      topRail.position.y = (dividerHeight - frameLip) / 2;
      topRail.castShadow = true;
      topRail.receiveShadow = true;
      frameGroup.add(topRail);

      const bottomRail = topRail.clone();
      bottomRail.position.y = -topRail.position.y;
      frameGroup.add(bottomRail);

      const innerRail = new THREE.Mesh(verticalRailGeo, this.material);
      innerRail.position.z = -(dividerLength / 2) + frameLip / 2;
      innerRail.castShadow = true;
      innerRail.receiveShadow = true;
      frameGroup.add(innerRail);

      const outerRail = innerRail.clone();
      outerRail.position.z = (dividerLength / 2) - frameLip / 2;
      frameGroup.add(outerRail);

      const panel = new THREE.Mesh(panelGeo, this.dividerMaterial);
      panel.castShadow = true;
      panel.receiveShadow = true;
      frameGroup.add(panel);

      const offset_x = (HUB.WIDTH / 2) - (DIMENSIONS.DIVIDER_THICKNESS / 2);
      frameGroup.position.x = offset_x;

      const offset_z = (HUB.WIDTH / 2) + (dividerLength / 2) - 0.02;
      frameGroup.position.z = offset_z;
      
      armGroup.add(frameGroup);

      dividerGroup.add(armGroup);
    }
  }

  createDrawerUnit(group: THREE.Group, x: number, y: number, z: number, width: number, depth: number, height: number) {
    const drawerUnitGroup = new THREE.Group();
    drawerUnitGroup.position.set(x, y, z);

    // Dimensions
    const topHeight = height * 0.25;
    const gapHeight = 0.02; 
    const bottomHeight = height - topHeight - gapHeight;
    const radius = 0.02;

    // Shapes
    const mainShape = this.createRoundedRectShape(width, depth, radius);
    // Recess the gap layer slightly to create the "handle" look
    const gapShape = this.createRoundedRectShape(width * 0.95, depth * 0.95, radius);

    // 1. Bottom Drawer
    const bottomGeo = new THREE.ExtrudeGeometry(mainShape, {
      depth: bottomHeight,
      steps: 1,
      bevelEnabled: false
    });
    bottomGeo.rotateX(-Math.PI / 2);
    
    const bottomMesh = new THREE.Mesh(bottomGeo, this.material);
    bottomMesh.position.y = -height / 2; 
    bottomMesh.castShadow = true;
    bottomMesh.receiveShadow = true;
    drawerUnitGroup.add(bottomMesh);

    // 2. Gap (Handle)
    const gapGeo = new THREE.ExtrudeGeometry(gapShape, {
      depth: gapHeight,
      steps: 1,
      bevelEnabled: false
    });
    gapGeo.rotateX(-Math.PI / 2);
    const gapMesh = new THREE.Mesh(gapGeo, this.darkMaterial);
    gapMesh.position.y = -height / 2 + bottomHeight;
    drawerUnitGroup.add(gapMesh);

    // 3. Top Drawer
    const topGeo = new THREE.ExtrudeGeometry(mainShape, {
      depth: topHeight,
      steps: 1,
      bevelEnabled: false
    });
    topGeo.rotateX(-Math.PI / 2);
    const topMesh = new THREE.Mesh(topGeo, this.material);
    topMesh.position.y = -height / 2 + bottomHeight + gapHeight;
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    drawerUnitGroup.add(topMesh);

    group.add(drawerUnitGroup);
  }

  createRoundedRectShape(width: number, height: number, radius: number) {
    const shape = new THREE.Shape();
    const w = width;
    const h = height;
    const r = radius;

    shape.moveTo(-w/2, -h/2 + r);
    shape.lineTo(-w/2, h/2 - r);
    shape.quadraticCurveTo(-w/2, h/2, -w/2 + r, h/2);
    shape.lineTo(w/2 - r, h/2);
    shape.quadraticCurveTo(w/2, h/2, w/2, h/2 - r);
    shape.lineTo(w/2, -h/2 + r);
    shape.quadraticCurveTo(w/2, -h/2, w/2 - r, -h/2);
    shape.lineTo(-w/2 + r, -h/2);
    shape.quadraticCurveTo(-w/2, -h/2, -w/2, -h/2 + r);

    return shape;
  }

  createWorkSurfaces() {
    const { DIMENSIONS, HUB } = SEVERANCE_DESK_CONFIG;

    const startX = -DIMENSIONS.DIVIDER_THICKNESS / 2 + 0.15;
    const startZ = HUB.WIDTH / 2;
    const deskLength = (DIMENSIONS.TOTAL_WIDTH / 2) - startZ;
    const deskWidth = 1.2;
    
    const endX = startX - deskWidth;
    const endZ = startZ + deskLength;

    const shape = new THREE.Shape();
    shape.moveTo(startX, startZ);
    shape.lineTo(startX, endZ);
    shape.lineTo(endX, endZ);
    shape.lineTo(endX, startZ);
    shape.lineTo(startX, startZ);

    const extrudeSettings = {
      steps: 1,
      depth: DIMENSIONS.SURFACE_THICKNESS,
      bevelEnabled: false,
    };

    const flatGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    flatGeometry.rotateX(Math.PI / 2); 

    const pedWidth = 0.45;
    const pedDepth = 0.7;
    const pedHeight = 0.45;

    for (let i = 0; i < 4; i++) {
      const leafGroup = new THREE.Group();
      leafGroup.rotation.y = (Math.PI / 2) * i;
      this.group.add(leafGroup);

      const desk = new THREE.Mesh(flatGeometry, this.material);
      desk.position.y = DIMENSIONS.DESK_HEIGHT;
      desk.castShadow = true;
      desk.receiveShadow = true;
      leafGroup.add(desk);

      const pedX = startX - (pedWidth / 2) - 0.75;
      const pedZ = endZ - (pedDepth / 2);
      const pedY = DIMENSIONS.DESK_HEIGHT - DIMENSIONS.SURFACE_THICKNESS - (pedHeight / 2);
      
      this.createDrawerUnit(leafGroup, pedX, pedY, pedZ, pedWidth, pedDepth, pedHeight);

      const chair = new Chair(leafGroup);
      const chairX = endX - 0.5;
      const legRoomStart = pedZ + (pedDepth / 2);
      const legRoomEnd = endZ;
      const chairZ = (legRoomStart + legRoomEnd) / 2 - 1.25;
      
      chair.group.position.set(chairX, 0, chairZ);
      chair.group.rotation.y = -Math.PI / 2;

      // Add computer to desk
      // Only add screen to the first desk
      const computer = new Computer(leafGroup, i === 0);
      const computerX = startX - (deskWidth / 2);
      const computerZ = startZ + (deskLength * 0.65) - 2; // Place it towards the back of desk
      const computerY = DIMENSIONS.DESK_HEIGHT + DIMENSIONS.SURFACE_THICKNESS - 0.8;
      
      computer.group.position.set(computerX, computerY, computerZ);
      computer.group.scale.setScalar(0.85); // Scale down to 85% of original size
      
      // Store reference to the main computer (first one with screen)
      if (i === 0) {
        this.mainComputer = computer;
      }
    }
  }
}
