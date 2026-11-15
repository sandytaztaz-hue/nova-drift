// Keyboard and mouse state for NOVA DRIFT. The game reads this one object each
// step; the screenshot autopilot writes into it the same way a player would,
// so a staged scene is a real game, not a mock.
export class NovaInput {
  constructor(canvas) {
    this.canvas = canvas;
    /** Keys currently held, by KeyboardEvent.code. */
    this.keys = new Set();
    /** Keys pressed since the last step consumed them (edge-triggered actions). */
    this.pressed = new Set();
    /** Mouse position in logical arena coordinates. */
    this.mouse = { x: 640, y: 360, down: false };
    /** Whether the mouse button was pressed since the last step. */
    this.clicked = false;
    this._attach();
  }

  _attach() {
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
    });
    this.canvas.addEventListener('mousemove', (event) => {
      const point = this._toLogical(event);
      this.mouse.x = point.x;
      this.mouse.y = point.y;
    });
    this.canvas.addEventListener('mousedown', (event) => {
      const point = this._toLogical(event);
      this.mouse.x = point.x;
      this.mouse.y = point.y;
      this.mouse.down = true;
      this.clicked = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
  }

  /** A DOM event's client position converted to logical arena coordinates. */
  _toLogical(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  /** True while any of the codes is held. */
  anyHeld(codes) {
    for (const code of codes) if (this.keys.has(code)) return true;
    return false;
  }

  /** True only on the step right after the key went down. */
  wasPressed(code) {
    return this.pressed.has(code);
  }

  /** Movement intent this step: -1, 0 or 1 on each axis, from WASD or arrows. */
  moveVector() {
    const x = (this.anyHeld(['KeyD', 'ArrowRight']) ? 1 : 0) - (this.anyHeld(['KeyA', 'ArrowLeft']) ? 1 : 0);
    const y = (this.anyHeld(['KeyS', 'ArrowDown']) ? 1 : 0) - (this.anyHeld(['KeyW', 'ArrowUp']) ? 1 : 0);
    return { x, y };
  }

  /** Whether the ship should be firing: mouse held or Space held. */
  firing() {
    return this.mouse.down || this.keys.has('Space');
  }

  /** Clear the edge-triggered sets after a step has read them. */
  endStep() {
    this.pressed.clear();
    this.clicked = false;
  }

  /** Drive the input from code (the screenshot autopilot and the test probe). */
  setKey(code, down) {
    if (down) {
      this.keys.add(code);
      this.pressed.add(code);
    } else {
      this.keys.delete(code);
    }
  }

  setMouse(x, y, down) {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.down = down;
    if (down) this.clicked = true;
  }

  releaseAll() {
    this.keys.clear();
    this.mouse.down = false;
  }
}
