export class InputHandler {
    constructor() {
        this.keys = {};
        this.boundKeyDown = this.onKeyDown.bind(this);
        this.boundKeyUp = this.onKeyUp.bind(this);
        window.addEventListener('keydown', this.boundKeyDown);
        window.addEventListener('keyup', this.boundKeyUp);
    }

    onKeyDown(event) {
        // Use event.code for layout-independent keys (WASD, Arrows)
        // This is not affected by Caps Lock or Shift.
        this.keys[event.code] = true;
        
        // Prevent browser default actions for keys we use
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
            event.preventDefault();
        }
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    dispose() {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
    }
}