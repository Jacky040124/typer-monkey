import * as THREE from 'three';
import { CameraKey } from '@/models/three';
import { MONKEY_CONFIG } from '@constants/scene';

export class Monkey {
  isTyping: boolean = false;

  leftArm: THREE.Group | null = null;
  rightArm: THREE.Group | null = null;
  head: THREE.Group | null = null;
  propeller: THREE.Group | null = null;
  eyes: THREE.Group | null = null;
  bodyGroup: THREE.Group | null = null;
  leftUpperArm?: THREE.Mesh;
  leftForearm?: THREE.Mesh;
  leftHandMesh?: THREE.Mesh;
  rightUpperArm?: THREE.Mesh;
  rightForearm?: THREE.Mesh;
  rightHandMesh?: THREE.Mesh;

  leftLeg: THREE.Group | null = null;
  rightLeg: THREE.Group | null = null;

  group: THREE.Group;

  constructor(parent: THREE.Object3D) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.createMonkey();
  }

  createMonkey() {
    const colors = {
      fur: 0xe0ac69,
      skin: 0xf3d5b2,
      shirt: 0x1a1a1a,
      hatMain: 0x4287f5,
      hatBrim: 0x4caf50,
      hatTop: 0xff4444,
      propeller: 0xffd700
    };

    const materialProps = { roughness: 0.7, metalness: 0.1 };

    this.createLegs(colors, materialProps);

    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(
      MONKEY_CONFIG.BODY_POSITION.X,
      MONKEY_CONFIG.BODY_POSITION.Y,
      MONKEY_CONFIG.BODY_POSITION.Z
    );
    this.group.add(bodyGroup);
    this.bodyGroup = bodyGroup;

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.5, 1.0, 32),
      new THREE.MeshStandardMaterial({ color: colors.shirt, ...materialProps })
    );
    torso.position.set(0, 0.4, 0);
    torso.castShadow = true;
    torso.receiveShadow = true;
    bodyGroup.add(torso);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.08, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, ...materialProps })
    );
    collar.position.set(0, 0.85, 0);
    collar.rotation.x = Math.PI / 2;
    collar.castShadow = true;
    bodyGroup.add(collar);

    this.head = new THREE.Group();
    this.head.position.set(
      MONKEY_CONFIG.HEAD_POSITION.X,
      MONKEY_CONFIG.HEAD_POSITION.Y,
      MONKEY_CONFIG.HEAD_POSITION.Z
    );
    this.group.add(this.head);

    const headShape = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 32, 32),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    headShape.scale.set(1, 1.15, 1);
    headShape.castShadow = true;
    headShape.receiveShadow = true;
    this.head.add(headShape);

    const jaw = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 32, 32),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    jaw.position.set(0, -0.15, 0.1);
    jaw.scale.set(1, 0.8, 1);
    jaw.castShadow = true;
    jaw.receiveShadow = true;
    this.head.add(jaw);

    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, -0.05, 0.35);
    this.head.add(faceGroup);

    const muzzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 32, 32),
      new THREE.MeshStandardMaterial({ color: colors.skin, ...materialProps })
    );
    muzzle.scale.set(1.3, 1, 0.8);
    muzzle.castShadow = true;
    muzzle.receiveShadow = true;
    faceGroup.add(muzzle);

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.02, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x5a3a2a, ...materialProps })
    );
    mouth.position.set(0, -0.1, 0.22);
    mouth.castShadow = true;
    faceGroup.add(mouth);

    const noseLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.03),
      new THREE.MeshStandardMaterial({ color: 0x333333, ...materialProps })
    );
    noseLeft.position.set(-0.06, 0.05, 0.22);
    noseLeft.scale.set(1, 0.5, 1);
    noseLeft.castShadow = true;
    faceGroup.add(noseLeft);

    const noseRight = noseLeft.clone();
    noseRight.position.set(0.06, 0.05, 0.22);
    faceGroup.add(noseRight);

    this.eyes = new THREE.Group();
    this.eyes.position.set(0, 0.15, 0.32);
    this.head.add(this.eyes);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.11, 32, 32);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, ...materialProps });
    
    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.14, 0, 0);
    leftEye.castShadow = true;
    this.eyes.add(leftEye);

    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.14, 0, 0);
    rightEye.castShadow = true;
    this.eyes.add(rightEye);

    const pupilGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000, ...materialProps });

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.14, 0, 0.1);
    this.eyes.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.14, 0, 0.1);
    this.eyes.add(rightPupil);

    const eyelidGroup = new THREE.Group();
    eyelidGroup.position.set(0, 0.15, 0.32);
    this.head.add(eyelidGroup);

    const eyelidGeo = new THREE.SphereGeometry(0.115, 32, 32, 0, Math.PI);
    const eyelidMat = new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps, side: THREE.DoubleSide });

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(-0.14, 0.05, 0);
    leftEyelid.rotation.x = 0.2;
    leftEyelid.castShadow = true;
    eyelidGroup.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(0.14, 0.05, 0);
    rightEyelid.rotation.x = 0.2;
    rightEyelid.castShadow = true;
    eyelidGroup.add(rightEyelid);

    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.35, 0);
    hatGroup.rotation.x = -0.2;
    this.head.add(hatGroup);

    const hatBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 32, 32, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: colors.hatMain, ...materialProps })
    );
    hatBase.scale.set(1, 0.8, 1);
    hatBase.castShadow = true;
    hatGroup.add(hatBase);

    const hatBack = new THREE.Mesh(
      new THREE.SphereGeometry(0.43, 32, 32, Math.PI, Math.PI),
      new THREE.MeshStandardMaterial({ color: colors.hatBrim, ...materialProps })
    );
    hatBack.scale.set(1, 0.8, 1);
    hatBack.castShadow = true;
    hatGroup.add(hatBack);

    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 32),
      new THREE.MeshStandardMaterial({ color: 0x333333, ...materialProps })
    );
    brim.position.set(0, -0.1, 0.25);
    brim.rotation.x = 0.2;
    brim.scale.set(1, 1, 0.6);
    brim.castShadow = true;
    hatGroup.add(brim);

    this.propeller = new THREE.Group();
    this.propeller.position.set(0, 0.4, 0);
    hatGroup.add(this.propeller);

    const propStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    propStick.castShadow = true;
    this.propeller.add(propStick);

    const propBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 0.08),
      new THREE.MeshStandardMaterial({ color: colors.propeller, ...materialProps })
    );
    propBlade.position.y = 0.05;
    propBlade.castShadow = true;
    this.propeller.add(propBlade);

    const propTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.04),
      new THREE.MeshStandardMaterial({ color: colors.hatTop, ...materialProps })
    );
    propTop.position.y = 0.06;
    propTop.castShadow = true;
    this.propeller.add(propTop);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.55, 1.35, 0);
    this.leftArm.rotation.set(
      MONKEY_CONFIG.ARMS_BASE_ROTATION.X,
      -MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET,
      -MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET
    );
    this.group.add(this.leftArm);

    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.6),
      new THREE.MeshStandardMaterial({ color: colors.shirt, ...materialProps })
    );
    leftUpperArm.position.y = -0.3;
    leftUpperArm.castShadow = true;
    this.leftArm.add(leftUpperArm);
    this.leftUpperArm = leftUpperArm;

    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.6),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    leftForearm.position.set(0, -0.8, 0.1);
    leftForearm.rotation.x = 0.3;
    leftForearm.castShadow = true;
    this.leftArm.add(leftForearm);
    this.leftForearm = leftForearm;

    const leftHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.14),
      new THREE.MeshStandardMaterial({ color: colors.skin, ...materialProps })
    );
    leftHand.position.set(0, -1.1 + (MONKEY_CONFIG.HAND_CONFIG.OFFSET.Y || 0), 0.2);
    leftHand.scale.set(
      MONKEY_CONFIG.HAND_CONFIG.SCALE.X,
      MONKEY_CONFIG.HAND_CONFIG.SCALE.Y,
      MONKEY_CONFIG.HAND_CONFIG.SCALE.Z
    );
    leftHand.castShadow = true;
    this.leftArm.add(leftHand);
    this.leftHandMesh = leftHand;

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.55, 1.35, 0);
    this.rightArm.position.y = 1.35; 
    this.rightArm.rotation.set(
      MONKEY_CONFIG.ARMS_BASE_ROTATION.X,
      MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET,
      MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET
    );
    this.group.add(this.rightArm);

    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.15, 0.6),
      new THREE.MeshStandardMaterial({ color: colors.shirt, ...materialProps })
    );
    rightUpperArm.position.y = -0.3;
    rightUpperArm.castShadow = true;
    this.rightArm.add(rightUpperArm);
    this.rightUpperArm = rightUpperArm;

    const rightForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.12, 0.6),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    rightForearm.position.set(0, -0.8, 0.1);
    rightForearm.rotation.x = 0.3;
    rightForearm.castShadow = true;
    this.rightArm.add(rightForearm);
    this.rightForearm = rightForearm;

    const rightHand = new THREE.Mesh(
      new THREE.SphereGeometry(0.14),
      new THREE.MeshStandardMaterial({ color: colors.skin, ...materialProps })
    );
    rightHand.position.set(0, -1.1 + (MONKEY_CONFIG.HAND_CONFIG.OFFSET.Y || 0), 0.2);
    rightHand.scale.set(
      MONKEY_CONFIG.HAND_CONFIG.SCALE.X,
      MONKEY_CONFIG.HAND_CONFIG.SCALE.Y,
      MONKEY_CONFIG.HAND_CONFIG.SCALE.Z
    );
    rightHand.castShadow = true;
    this.rightArm.add(rightHand);
    this.rightHandMesh = rightHand;
  }

  createLegs(colors: any, materialProps: any) {
    const legGroupY = 0.45;

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.25, legGroupY, 0);
    this.group.add(this.leftLeg);

    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.5),
      new THREE.MeshStandardMaterial({ color: colors.shirt, ...materialProps })
    );
    leftThigh.position.set(0, 0, 0.25);
    leftThigh.rotation.x = Math.PI / 2;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    const leftShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    leftShin.position.set(0, -0.25, 0.5);
    leftShin.castShadow = true;
    this.leftLeg.add(leftShin);

    const leftFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.13),
      new THREE.MeshStandardMaterial({ color: colors.skin, ...materialProps })
    );
    leftFoot.position.set(0, -0.5, 0.55);
    leftFoot.scale.set(1, 0.6, 1.4);
    leftFoot.castShadow = true;
    this.leftLeg.add(leftFoot);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.25, legGroupY, 0);
    this.group.add(this.rightLeg);

    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.5),
      new THREE.MeshStandardMaterial({ color: colors.shirt, ...materialProps })
    );
    rightThigh.position.set(0, 0, 0.25);
    rightThigh.rotation.x = Math.PI / 2;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    const rightShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: colors.fur, ...materialProps })
    );
    rightShin.position.set(0, -0.25, 0.5);
    rightShin.castShadow = true;
    this.rightLeg.add(rightShin);

    const rightFoot = new THREE.Mesh(
      new THREE.SphereGeometry(0.13),
      new THREE.MeshStandardMaterial({ color: colors.skin, ...materialProps })
    );
    rightFoot.position.set(0, -0.5, 0.55);
    rightFoot.scale.set(1, 0.6, 1.4);
    rightFoot.castShadow = true;
    this.rightLeg.add(rightFoot);
  }

  setViewMode(cameraKey: CameraKey) {
    const isFront = cameraKey === CameraKey.FRONT;
    const isBackClose = cameraKey === CameraKey.BACK_CLOSE;

    if (this.head) {
      this.head.visible = isFront;
    }
    if (this.propeller) {
      this.propeller.visible = isFront;
    }
    if (this.eyes) {
      this.eyes.visible = isFront;
    }
    if (this.bodyGroup) {
      this.bodyGroup.visible = isFront;
    }
    if (this.leftLeg) this.leftLeg.visible = isFront;
    if (this.rightLeg) this.rightLeg.visible = isFront;

    const showUpperArms = !isBackClose;
    const showForearms = !isBackClose;
    const showHands = true;

    this.setArmSegmentVisibility('left', showUpperArms, showForearms, showHands);
    this.setArmSegmentVisibility('right', showUpperArms, showForearms, showHands);
  }

  private setArmSegmentVisibility(
    side: 'left' | 'right',
    showUpper: boolean,
    showForearm: boolean,
    showHand: boolean
  ) {
    if (side === 'left') {
      if (this.leftUpperArm) this.leftUpperArm.visible = showUpper;
      if (this.leftForearm) this.leftForearm.visible = showForearm;
      if (this.leftHandMesh) this.leftHandMesh.visible = showHand;
    } else {
      if (this.rightUpperArm) this.rightUpperArm.visible = showUpper;
      if (this.rightForearm) this.rightForearm.visible = showForearm;
      if (this.rightHandMesh) this.rightHandMesh.visible = showHand;
    }
  }

  setIsTyping(isTyping: boolean) {
    this.isTyping = isTyping;
  }

  update(elapsedTime: number) {
    if (this.isTyping) {
      if (this.leftArm) {
        this.leftArm.rotation.x = MONKEY_CONFIG.ARMS_BASE_ROTATION.X + Math.sin(elapsedTime * 20) * 0.15;
        this.leftArm.rotation.y = -MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET + Math.cos(elapsedTime * 5) * 0.05;
        this.leftArm.rotation.z = -MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET + Math.cos(elapsedTime * 15) * 0.05;
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = MONKEY_CONFIG.ARMS_BASE_ROTATION.X + Math.cos(elapsedTime * 20 + 2) * 0.15;
        this.rightArm.rotation.y = MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET + Math.sin(elapsedTime * 5) * 0.05;
        this.rightArm.rotation.z = MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET + Math.sin(elapsedTime * 15) * 0.05;
      }
      
      if (this.head) {
        this.head.rotation.x = Math.sin(elapsedTime * 10) * 0.02;
        this.head.position.y = 1.55 + Math.abs(Math.sin(elapsedTime * 8)) * 0.01;
      }

      if (this.propeller) {
        this.propeller.rotation.y += 0.15;
      }

    } else {
      const breathe = Math.sin(elapsedTime * 2) * 0.02;
      
      if (this.leftArm) {
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, MONKEY_CONFIG.ARMS_BASE_ROTATION.X, 0.1);
        this.leftArm.rotation.y = THREE.MathUtils.lerp(this.leftArm.rotation.y, -MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET, 0.1);
        this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, -MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET, 0.1);
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, MONKEY_CONFIG.ARMS_BASE_ROTATION.X, 0.1);
        this.rightArm.rotation.y = THREE.MathUtils.lerp(this.rightArm.rotation.y, MONKEY_CONFIG.ARMS_BASE_ROTATION.Y_OFFSET, 0.1);
        this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, MONKEY_CONFIG.ARMS_BASE_ROTATION.Z_OFFSET, 0.1);
      }
      if (this.head) {
        this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0, 0.1);
        this.head.position.y = 1.55 + breathe;
      }
      if (this.propeller) {
        this.propeller.rotation.y += 0.02;
      }
    }

    if (this.eyes) {
      const shouldBlink = Math.random() > 0.995;
      if (shouldBlink) {
        this.eyes.scale.y = 0.1;
      } else {
        this.eyes.scale.y = THREE.MathUtils.lerp(this.eyes.scale.y, 1, 0.2);
      }
    }
  }
}

