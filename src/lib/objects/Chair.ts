import * as THREE from 'three';
import { CHAIR_CONFIG } from '@constants/scene';

export class Chair {
  group: THREE.Group;
  
  // Materials
  frameMaterial: THREE.MeshStandardMaterial;
  upholsteryMaterial: THREE.MeshStandardMaterial;
  chromeMaterial: THREE.MeshStandardMaterial;
  casterMaterial: THREE.MeshStandardMaterial;

  constructor(parent: THREE.Object3D) {
    this.group = new THREE.Group();
    parent.add(this.group);

    // Materials
    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: CHAIR_CONFIG.COLORS.FRAME,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.upholsteryMaterial = new THREE.MeshStandardMaterial({
      color: CHAIR_CONFIG.COLORS.UPHOLSTERY,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.2,
      metalness: 0.8,
    });

    this.casterMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.9,
      metalness: 0.0,
    });

    this.createChair();
  }

  createChair() {
    // 1. Five-Star Base
    this.createBase();

    // 2. Gas Lift Column
    this.createGasLift();

    // 3. Seat
    this.createSeat();

    // 4. Backrest & Frame (Integrated Armrests)
    this.createBackrestAndFrame();
    
    // 5. Height Lever
    this.createLever();
  }

  createBase() {
    const baseGroup = new THREE.Group();
    baseGroup.position.y = CHAIR_CONFIG.DIMENSIONS.BASE_HEIGHT;
    this.group.add(baseGroup);

    // Central Hub
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16),
      this.frameMaterial
    );
    hub.receiveShadow = true;
    hub.castShadow = true;
    baseGroup.add(hub);

    // 5 Spokes
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spokeLength = CHAIR_CONFIG.DIMENSIONS.BASE_RADIUS;
      
      const spokeGroup = new THREE.Group();
      spokeGroup.rotation.y = angle;
      baseGroup.add(spokeGroup);

      // Spoke Arm
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.03, spokeLength),
        this.frameMaterial
      );
      spoke.position.z = spokeLength / 2;
      spoke.castShadow = true;
      spoke.receiveShadow = true;
      spokeGroup.add(spoke);

      // Caster (Wheel) at end
      const casterGroup = new THREE.Group();
      casterGroup.position.z = spokeLength;
      casterGroup.position.y = -CHAIR_CONFIG.DIMENSIONS.BASE_HEIGHT + 0.03; // Touch floor
      spokeGroup.add(casterGroup);

      // Caster Stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.05),
        this.chromeMaterial
      );
      stem.position.y = 0.04;
      casterGroup.add(stem);

      // Wheel (simplified)
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16),
        this.casterMaterial
      );
      wheel.rotation.z = Math.PI / 2; // Roll orientation
      wheel.position.y = 0.03;
      wheel.castShadow = true;
      casterGroup.add(wheel);
    }
  }

  createGasLift() {
    const liftHeight = CHAIR_CONFIG.DIMENSIONS.SEAT_HEIGHT - CHAIR_CONFIG.DIMENSIONS.BASE_HEIGHT - 0.05;
    const lift = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, liftHeight, 16),
      this.frameMaterial // Black/Dark Grey
    );
    lift.position.y = CHAIR_CONFIG.DIMENSIONS.BASE_HEIGHT + (liftHeight / 2);
    lift.castShadow = true;
    lift.receiveShadow = true;
    this.group.add(lift);
  }

  createSeat() {
    const { SEAT_WIDTH, SEAT_DEPTH, SEAT_THICKNESS, SEAT_HEIGHT } = CHAIR_CONFIG.DIMENSIONS;
    
    const seatGroup = new THREE.Group();
    seatGroup.position.y = SEAT_HEIGHT;
    this.group.add(seatGroup);

    // Main Seat Cushion
    // Use a slightly rounded box or scaled cylinder for contour
    // Simplified: Box for now
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(SEAT_WIDTH, SEAT_THICKNESS, SEAT_DEPTH),
      this.upholsteryMaterial
    );
    seat.castShadow = true;
    seat.receiveShadow = true;
    seatGroup.add(seat);

    // Seat Mechanism (Underneath)
    const mechanism = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 0.2),
      this.frameMaterial
    );
    mechanism.position.y = -(SEAT_THICKNESS / 2) - 0.025;
    mechanism.castShadow = true;
    seatGroup.add(mechanism);
  }

  createBackrestAndFrame() {
    const { SEAT_WIDTH, SEAT_DEPTH, SEAT_HEIGHT, BACK_HEIGHT } = CHAIR_CONFIG.DIMENSIONS;
    
    const frameGroup = new THREE.Group();
    frameGroup.position.y = SEAT_HEIGHT;
    this.group.add(frameGroup);

    // --- Backrest ---
    const backFrameThickness = 0.05;
    const backZ = (SEAT_DEPTH / 2) + (backFrameThickness / 2) - 0.02; // Slightly tucked in

    // Upholstered Back Panel
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(SEAT_WIDTH * 0.9, BACK_HEIGHT, backFrameThickness),
      this.upholsteryMaterial
    );
    backPanel.position.set(0, BACK_HEIGHT / 2 + 0.05, backZ);
    backPanel.castShadow = true;
    backPanel.receiveShadow = true;
    frameGroup.add(backPanel);

    // Horizontal Slats/Ribs on Back (Visual detail)
    const slatGeo = new THREE.BoxGeometry(SEAT_WIDTH * 0.8, 0.02, 0.015);
    
    const slat1 = new THREE.Mesh(slatGeo, this.frameMaterial);
    slat1.position.set(0, BACK_HEIGHT * 0.4, backZ + (backFrameThickness/2) + 0.005);
    frameGroup.add(slat1);

    const slat2 = new THREE.Mesh(slatGeo, this.frameMaterial);
    slat2.position.set(0, BACK_HEIGHT * 0.7, backZ + (backFrameThickness/2) + 0.005);
    frameGroup.add(slat2);

    // --- Continuous Tube Frame (Armrests) ---
    // Replaces the blocky armrests with sleek curved tubes
    const tubeRadius = 0.015; 
    const armHeight = 0.25; 
    const armFrontZ = -(SEAT_DEPTH / 2) + 0.1; // Start near front
    const armSideX = (SEAT_WIDTH / 2) + 0.02; 

    const createArmTube = (isLeft: boolean) => {
      const sideMult = isLeft ? -1 : 1;
      const xPos = armSideX * sideMult;

      // Define points for the continuous frame
      // Path: Start under seat -> Up -> Curve Back -> In to Backrest
      const points = [
        new THREE.Vector3(xPos, -0.1, armFrontZ + 0.1), // Start: Under seat
        new THREE.Vector3(xPos, armHeight, armFrontZ),  // Top-Front: Armrest start
        new THREE.Vector3(xPos, armHeight, backZ - 0.05),      // Top-Back: Armrest end
        new THREE.Vector3(xPos * 0.9, BACK_HEIGHT * 0.5, backZ) // End: Connect to backrest
      ];

      const curve = new THREE.CatmullRomCurve3(points);
      // tube segments: 24 for smoothness, radius: 0.015, radial segments: 8, closed: false
      const geometry = new THREE.TubeGeometry(curve, 24, tubeRadius, 8, false);
      const mesh = new THREE.Mesh(geometry, this.frameMaterial);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    frameGroup.add(createArmTube(true));  // Left Arm
    frameGroup.add(createArmTube(false)); // Right Arm
  }

  createLever() {
    const { SEAT_HEIGHT, SEAT_THICKNESS, SEAT_WIDTH } = CHAIR_CONFIG.DIMENSIONS;
    
    const leverGroup = new THREE.Group();
    leverGroup.position.set(
      (SEAT_WIDTH / 2) - 0.05, // Right side (if facing front)
      SEAT_HEIGHT - SEAT_THICKNESS - 0.05, // Under seat
      0.1 // Slightly forward
    );
    this.group.add(leverGroup);

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.1),
      this.chromeMaterial
    );
    rod.rotation.z = Math.PI / 2;
    leverGroup.add(rod);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.01, 0.02),
      this.frameMaterial // Black plastic handle
    );
    handle.position.x = 0.05; // End of rod
    leverGroup.add(handle);
  }
}
