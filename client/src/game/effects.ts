/*
 * Field Day Scrappy Charm reminder: effects are quick, physical, and coral-led.
 * Keep feedback readable over the playfield without flooding the screen.
 */

import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

interface Burst {
  mesh: Mesh;
  material: StandardMaterial;
  age: number;
  duration: number;
  originY: number;
}

export class EffectsManager {
  private readonly bursts: Burst[] = [];
  private readonly scene: Scene;
  private readonly coral: Color3;
  private readonly cream: Color3;

  constructor(scene: Scene) {
    this.scene = scene;
    this.coral = Color3.FromHexString("#F26B4F");
    this.cream = Color3.FromHexString("#F6E9D3");
  }

  impact(x: number, y: number, z: number) {
    const rays = 8;
    for (let i = 0; i < rays; i += 1) {
      const angle = (Math.PI * 2 * i) / rays;
      const inner = 0.12;
      const outer = i % 2 === 0 ? 0.42 : 0.3;
      const points = [
        new Vector3(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner, z - 0.32),
        new Vector3(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer, z - 0.32),
      ];
      const line = MeshBuilder.CreateLines(`impact-ray-${Date.now()}-${i}`, { points }, this.scene);
      line.color = i % 2 === 0 ? this.coral : this.cream;
      line.alpha = 1;
      this.bursts.push({
        mesh: line,
        material: new StandardMaterial(`impact-ray-material-${Date.now()}-${i}`, this.scene),
        age: 0,
        duration: 0.34,
        originY: y,
      });
    }

  }

  dust(x: number, z: number) {
    const puff = MeshBuilder.CreateDisc(`dust-${Date.now()}`, { radius: 0.2, tessellation: 16 }, this.scene);
    puff.rotation.x = Math.PI / 2;
    puff.position.set(x, 0.18, z);
    const material = new StandardMaterial(`dust-material-${Date.now()}`, this.scene);
    material.diffuseColor = this.cream;
    material.alpha = 0.8;
    material.emissiveColor = this.cream.scale(0.08);
    puff.material = material;
    this.bursts.push({ mesh: puff, material, age: 0, duration: 0.5, originY: 0.18 });
  }

  update(deltaSeconds: number) {
    for (let i = this.bursts.length - 1; i >= 0; i -= 1) {
      const burst = this.bursts[i];
      burst.age += deltaSeconds;
      const progress = Math.min(1, burst.age / burst.duration);
      burst.mesh.scaling.setAll(0.85 + progress * 1.35);
      burst.mesh.position.y = burst.originY + progress * 0.08;
      burst.mesh.visibility = 1 - progress;
      burst.material.alpha = 1 - progress;
      if (progress >= 1) {
        burst.mesh.dispose(false, true);
        burst.material.dispose();
        this.bursts.splice(i, 1);
      }
    }
  }
}

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
