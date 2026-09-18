import { useEffect, useRef } from "react";

export interface KeyState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fast: boolean;
}

const CODE_MAP: Record<string, keyof KeyState> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "up",
  ControlLeft: "down",
  ControlRight: "down",
  ShiftLeft: "fast",
  ShiftRight: "fast",
};

export function useKeyboardControls() {
  const state = useRef<KeyState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
    fast: false,
  });

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = CODE_MAP[e.code];
      if (key) {
        state.current[key] = true;
        if (key === "up" || key === "down") e.preventDefault();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      const key = CODE_MAP[e.code];
      if (key) state.current[key] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return state;
}
