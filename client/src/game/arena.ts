/*
 * Field Day Scrappy Charm reminder: the arena is a tactile framed diorama.
 * Holes need clear openings, visible depth, warm rims, and enough spacing to
 * make the koala the obvious tap target.
 */

import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export interface HoleAnchor {
  id: number;
  x: number;
  z: number;
}

export interface Arena {
  holes: HoleAnchor[];
  dispose(): void;
}

const TEAL = Color3.FromHexString("#153F48");
const DEEP_TEAL = Color3.FromHexString("#0D2F36");
const OLIVE = Color3.FromHexString("#52634A");
const CLAY = Color3.FromHexString("#49372C");
const CLAY_LIGHT = Color3.FromHexString("#604635");
const SOIL = Color3.FromHexString("#241E25");
const CREAM = Color3.FromHexString("#F6E9D3");

function material(scene: Scene, name: string, color: Color3, roughness = 0.9) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = color;
  mat.specularColor = Color3.Black();
  mat.roughness = roughness;
  return mat;
}

export function createArena(scene: Scene, groundTextureUrl: string): Arena {
  scene.clearColor = new Color4(0.05, 0.15, 0.18, 1);

  const sky = MeshBuilder.CreatePlane("sky-backdrop", { width: 26, height: 14 }, scene);
  sky.position.set(0, 5.2, 4.8);
  const skyMat = material(scene, "sky-material", TEAL);
  sky.material = skyMat;

  const sun = MeshBuilder.CreateDisc("sun-disc", { radius: 1.15, tessellation: 32 }, scene);
  sun.position.set(6.1, 6.9, 4.65);
  const sunMat = material(scene, "sun-material", Color3.FromHexString("#E9B56E"));
  sunMat.emissiveColor = Color3.FromHexString("#E9B56E").scale(0.35);
  sun.material = sunMat;

  const ground = MeshBuilder.CreateGround("grove-ground", {
    width: 15.5,
    height: 11.8,
    subdivisions: 2,
  }, scene);
  ground.position.y = 0;
  const groundMat = new StandardMaterial("grove-ground-material", scene);
  const texture = new Texture(groundTextureUrl, scene, true, false);
  texture.uScale = 3.4;
  texture.vScale = 2.4;
  groundMat.diffuseTexture = texture;
  groundMat.diffuseColor = Color3.White();
  groundMat.specularColor = Color3.Black();
  groundMat.roughness = 1;
  ground.material = groundMat;

  const backFence = MeshBuilder.CreateBox("back-fence", { width: 15.5, height: 0.42, depth: 0.28 }, scene);
  backFence.position.set(0, 0.2, 3.35);
  backFence.material = material(scene, "back-fence-material", DEEP_TEAL);

  const sidePosts = [-7.35, 7.35].map((x, index) => {
    const post = MeshBuilder.CreateCylinder(`fence-post-${index}`, { diameter: 0.24, height: 2.1, tessellation: 10 }, scene);
    post.position.set(x, 0.95, 3.32);
    post.material = material(scene, `fence-post-material-${index}`, CLAY);
    return post;
  });

  const holes: HoleAnchor[] = [];
  const xs = [-3.7, 0, 3.7];
  const zs = [1.85, -0.55, -2.95];
  let id = 0;
  for (const z of zs) {
    for (const x of xs) {
      const inner = MeshBuilder.CreateCylinder(`hole-interior-${id}`, {
        diameter: 2.1,
        height: 0.42,
        tessellation: 32,
      }, scene);
      inner.position.set(x, -0.13, z);
      inner.material = material(scene, `hole-soil-${id}`, SOIL);

      const voidDisc = MeshBuilder.CreateDisc(`hole-void-${id}`, { radius: 1.05, tessellation: 32 }, scene);
      voidDisc.position.set(x, 0.095, z);
      voidDisc.rotation.x = Math.PI / 2;
      const voidMat = material(scene, `hole-void-material-${id}`, Color3.FromHexString("#151319"));
      voidMat.emissiveColor = Color3.FromHexString("#08070A");
      voidDisc.material = voidMat;

      // A solid, low-poly clay collar reads as a physical hole rather than a
      // portal or spawn indicator. The dark inset cap leaves a broad earthy rim.
      const rim = MeshBuilder.CreateCylinder(`hole-rim-${id}`, {
        diameter: 2.62,
        height: 0.38,
        tessellation: 8,
      }, scene);
      rim.position.set(x, 0.18, z);
      rim.material = material(scene, `hole-rim-material-${id}`, CLAY_LIGHT);

      const rimTop = MeshBuilder.CreateCylinder(`hole-rim-top-${id}`, {
        diameter: 2.2,
        height: 0.08,
        tessellation: 8,
      }, scene);
      rimTop.position.set(x, 0.39, z);
      rimTop.material = material(scene, `hole-rim-top-material-${id}`, CLAY);

      const opening = MeshBuilder.CreateCylinder(`hole-opening-${id}`, {
        diameter: 1.92,
        height: 0.06,
        tessellation: 8,
      }, scene);
      opening.position.set(x, 0.405, z);
      opening.material = material(scene, `hole-opening-material-${id}`, Color3.FromHexString("#17151A"));

      // Opaque foreground lip guarantees depth-test occlusion for the alpha
      // cutout, making the koala read as seated inside the same physical hole.
      const frontLip = MeshBuilder.CreateBox(`hole-front-lip-${id}`, {
        width: 2.0,
        height: 0.52,
        depth: 0.34,
      }, scene);
      frontLip.position.set(x, 0.58, z - 0.98);
      frontLip.material = material(scene, `hole-front-lip-material-${id}`, CLAY_LIGHT);

      holes.push({ id, x, z });
      id += 1;
    }
  }

  // A few intentionally sparse foliage accents keep the grove from feeling flat.
  const foliage = [
    [-6.2, 0.38, 2.9, 0.92],
    [6.1, 0.42, 2.8, 0.78],
    [-6.7, 0.28, -3.8, 0.62],
    [6.7, 0.31, -3.9, 0.7],
  ] as const;
  foliage.forEach(([x, y, z, scale], index) => {
    const trunk = MeshBuilder.CreateCylinder(`foliage-trunk-${index}`, { diameter: 0.15, height: 1.1, tessellation: 8 }, scene);
    trunk.position.set(x, y + 0.45, z);
    trunk.material = material(scene, `foliage-trunk-material-${index}`, CLAY);
    const canopy = MeshBuilder.CreateIcoSphere(`foliage-canopy-${index}`, { radius: 0.9, subdivisions: 1 }, scene);
    canopy.position.set(x, y + 1.05, z);
    canopy.scaling.set(scale, scale * 0.82, scale * 0.74);
    canopy.material = material(scene, `foliage-canopy-material-${index}`, index % 2 ? Color3.FromHexString("#7C8B5E") : OLIVE);
  });

  return {
    holes,
    dispose() {
      void sky;
      void sun;
      void ground;
      void backFence;
      void sidePosts;
      // Scene disposal owns the generated meshes/materials/textures.
    },
  };
}

export { Vector3 };
