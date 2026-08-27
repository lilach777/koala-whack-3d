/*
 * Field Day Scrappy Charm reminder: the koala is the star of the field.
 * Keep the silhouette upright, camera-facing, and physically tucked inside its
 * own hole. Only the dedicated visible-koala collider may register a hit.
 */

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";

export type TargetPhase = "hidden" | "rising" | "visible" | "hit" | "retreating";

export interface TargetOptions {
  x: number;
  z: number;
  id: number;
  groundY: number;
  textureUrl: string;
}

export interface TargetUpdateResult {
  expired: boolean;
  hitFinished: boolean;
}

export class KoalaTarget {
  readonly id: number;
  readonly mesh: Mesh;
  readonly hitCollider: Mesh;
  readonly x: number;
  readonly z: number;
  readonly groundY: number;
  readonly hiddenY: number;
  readonly visibleY: number;
  phase: TargetPhase = "hidden";
  private phaseTime = 0;
  private visibleDuration = 1.3;
  private handled = false;
  private wasHit = false;
  private readonly baseScale = 1;
  private readonly baseScaleY = -1;

  constructor(scene: Scene, options: TargetOptions) {
    this.id = options.id;
    this.x = options.x;
    this.z = options.z;
    this.groundY = options.groundY;
    // The full cutout is 2.8 units high. Start below the surface so the head,
    // face, torso, and feet reveal in order as the plane rises.
    this.hiddenY = options.groundY - 1.1;
    this.visibleY = options.groundY + 1.46;

    this.mesh = MeshBuilder.CreatePlane(`koala-target-${options.id}`, {
      width: 2.15,
      height: 2.8,
    }, scene);
    this.mesh.position.set(this.x, this.hiddenY, this.z);
    this.mesh.rotation.y = Math.PI;
    this.mesh.scaling.y = this.baseScaleY;
    this.mesh.billboardMode = Mesh.BILLBOARDMODE_Y;
    this.mesh.isPickable = false;
    this.mesh.metadata = { koalaTarget: this };

    const material = new StandardMaterial(`koala-material-${options.id}`, scene);
    const texture = new Texture(options.textureUrl, scene, true, false);
    texture.hasAlpha = true;
    material.diffuseTexture = texture;
    material.useAlphaFromDiffuseTexture = true;
    material.backFaceCulling = false;
    material.specularColor = Color3.Black();
    material.emissiveColor = new Color3(0.08, 0.07, 0.05);
    this.mesh.material = material;

    // A separate, invisible box is the only pickable surface for this target.
    // It is narrower than the hole opening and sits inside the visible koala.
    this.hitCollider = MeshBuilder.CreateBox(`koala-hit-collider-${options.id}`, {
      width: 1.5,
      height: 2.18,
      depth: 0.62,
    }, scene);
    this.hitCollider.parent = this.mesh;
    this.hitCollider.position.y = 0.03;
    this.hitCollider.isPickable = false;
    this.hitCollider.metadata = { koalaHitCollider: this, koalaTarget: this };
    const hitMaterial = new StandardMaterial(`koala-hit-material-${options.id}`, scene);
    hitMaterial.alpha = 0;
    hitMaterial.disableLighting = true;
    hitMaterial.backFaceCulling = false;
    this.hitCollider.material = hitMaterial;
  }

  spawn(visibleDuration: number) {
    this.visibleDuration = visibleDuration;
    this.phase = "rising";
    this.phaseTime = 0;
    this.handled = false;
    this.wasHit = false;
    this.mesh.visibility = 1;
    this.mesh.position.y = this.hiddenY;
    this.mesh.scaling.set(this.baseScale, this.baseScaleY, this.baseScale);
    this.hitCollider.isPickable = false;
  }

  update(deltaSeconds: number): TargetUpdateResult {
    if (this.phase === "hidden") return { expired: false, hitFinished: false };

    this.phaseTime += deltaSeconds;
    if (this.phase === "rising") {
      const duration = 0.38;
      const t = Math.min(1, this.phaseTime / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const overshoot = Math.sin(t * Math.PI) * 0.08;
      this.mesh.position.y = this.hiddenY + (this.visibleY - this.hiddenY) * eased + overshoot;
      this.mesh.scaling.y = -(0.96 + eased * 0.04);
      if (t >= 1) {
        this.phase = "visible";
        this.phaseTime = 0;
        this.mesh.position.y = this.visibleY;
        this.hitCollider.isPickable = true;
      }
    } else if (this.phase === "visible") {
      const breathe = Math.sin(this.phaseTime * 5.2) * 0.025;
      this.mesh.position.y = this.visibleY + breathe;
      this.mesh.scaling.x = 1 + Math.sin(this.phaseTime * 4.4) * 0.012;
      if (this.phaseTime >= this.visibleDuration) {
        this.beginRetreat(false);
        return { expired: true, hitFinished: false };
      }
    } else if (this.phase === "hit") {
      const t = Math.min(1, this.phaseTime / 0.16);
      this.mesh.scaling.x = this.baseScale + Math.sin(t * Math.PI) * 0.12;
      this.mesh.scaling.y = -(this.baseScale - Math.sin(t * Math.PI) * 0.11);
      this.mesh.position.z = this.z - Math.sin(t * Math.PI) * 0.18;
      if (t >= 1) this.beginRetreat(true);
    } else if (this.phase === "retreating") {
      const duration = this.wasHit ? 0.24 : 0.22;
      const t = Math.min(1, this.phaseTime / duration);
      const eased = t * t;
      this.mesh.position.y = this.visibleY + (this.hiddenY - this.visibleY) * eased;
      this.mesh.visibility = 1 - t * 0.18;
      if (t >= 1) {
        this.phase = "hidden";
        this.phaseTime = 0;
        this.hitCollider.isPickable = false;
        this.mesh.visibility = 0;
        this.mesh.position.set(this.x, this.hiddenY, this.z);
        this.mesh.scaling.set(this.baseScale, this.baseScaleY, this.baseScale);
        return { expired: false, hitFinished: this.wasHit };
      }
    }

    return { expired: false, hitFinished: false };
  }

  hit() {
    if (this.phase !== "visible" || this.handled) return false;
    this.handled = true;
    this.wasHit = true;
    this.hitCollider.isPickable = false;
    this.phase = "hit";
    this.phaseTime = 0;
    return true;
  }

  forceHide() {
    this.phase = "hidden";
    this.phaseTime = 0;
    this.handled = true;
    this.hitCollider.isPickable = false;
    this.mesh.visibility = 0;
    this.mesh.position.set(this.x, this.hiddenY, this.z);
    this.mesh.scaling.set(this.baseScale, this.baseScaleY, this.baseScale);
  }

  isActive() {
    return this.phase !== "hidden";
  }

  isHittable() {
    return this.phase === "visible" && !this.handled && this.hitCollider.isPickable;
  }

  dispose() {
    this.hitCollider.dispose(false, true);
    this.mesh.dispose(false, true);
  }

  private beginRetreat(fromHit: boolean) {
    this.phase = "retreating";
    this.phaseTime = 0;
    this.wasHit = fromHit;
    this.hitCollider.isPickable = false;
    this.mesh.position.z = this.z;
  }
}
