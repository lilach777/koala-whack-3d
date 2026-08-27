/*
 * Field Day Scrappy Charm reminder: the canvas is the warm 3D diorama frame.
 * Keep this bridge lifecycle-safe; React provides the frame while Babylon owns
 * the scene and arcade loop.
 */

import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";

interface GameCanvasProps {
  onReady?: (handle: GameHandle | null) => void;
}

export default function GameCanvas({ onReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    let handle: GameHandle | null = null;
    createGameScene(engine, canvas).then((nextHandle) => {
      if (cancelled) {
        nextHandle.dispose();
        return;
      }
      handle = nextHandle;
      onReady?.(nextHandle);
      engine.runRenderLoop(() => nextHandle.scene.render());
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      onReady?.(null);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, [onReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Koala Whack 3D game board"
      className="game-canvas fixed inset-0 h-full w-full outline-none"
      style={{ touchAction: "none" }}
    />
  );
}
