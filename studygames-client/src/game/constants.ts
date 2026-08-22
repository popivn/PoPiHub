// Central tuning constants. No magic numbers scattered through the engine.

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

// World grid size (tiles per side).
export const WORLD_SIZE = 9;

// Slime physics (units are tiles/second).
export const SLIME_MAX_SPEED = 4.2;
export const SLIME_ACCELERATION = 18.0;
export const SLIME_DECELERATION = 22.0;
export const SLIME_FRICTION = 0.86; // applied per frame at 60fps baseline, scaled by dt
export const SLIME_STOP_THRESHOLD = 0.05;

// State machine thresholds.
export const ACCEL_TO_MOVING_SPEED = 0.6;
export const MOVING_TO_DECEL_SPEED = 0.4;

// Vertical bounce / jump feel (in tiles, z axis).
export const SLIME_BOUNCE_AMPLITUDE = 0.12;
export const SLIME_BOUNCE_FREQUENCY = 2.4; // Hz while idle
export const SLIME_STEP_BOUNCE_FREQUENCY = 3.2; // Hz while moving
export const SLIME_STEP_BOUNCE_AMPLITUDE = 0.18;

// Jump physics (tiles/second).
export const GRAVITY = 20.0; // tiles/s² downward
export const JUMP_VELOCITY = 8.0; // initial upward velocity
export const STEP_THRESHOLD = 0.3; // can step up this much without jumping
export const AIR_CONTROL = 0.5; // horizontal acceleration multiplier in air
export const JUMP_STRETCH = 0.28; // max vertical stretch while airborne
export const GROUND_SNAP_EPSILON = 0.01; // z tolerance for "on ground"
export const SLEEP_DELAY = 3.0; // seconds of idle before sleeping

// Squash & stretch amounts (relative scale).
export const SQUASH_IDLE = 0.04;
export const SQUASH_MOVING_BASE = 0.08;
export const SQUASH_SPEED_FACTOR = 0.06; // extra squash per unit speed
export const SQUASH_MAX = 0.32;
export const LANDING_SQUASH = 0.28;
export const LANDING_DECAY = 6.0; // how fast landing squash recovers (1/s)

// Lean (rotation) in degrees, scaled by speed.
export const LEAN_MAX_DEG = 14;
export const LEAN_SPEED_REF = 3.0; // speed at which lean reaches max

// Eye pupil tracking (px offset within eye).
export const EYE_TRACK_MAX = 2.4;

// Camera.
export const CAMERA_SMOOTHING = 4.5; // higher = snappier
export const CAMERA_LOOKAHEAD = 1.2; // tiles ahead in movement direction

// Shadow.
export const SHADOW_BASE_SCALE = 1.0;
export const SHADOW_LIFT_SHRINK = 0.5; // shadow scale when slime is at max lift
export const SHADOW_OPACITY_BASE = 0.32;
export const SHADOW_OPACITY_LIFTED = 0.12;

// Depth sorting.
export const DEPTH_SCALE = 100; // zIndex granularity

// Input.
export const JOYSTICK_DEADZONE = 0.18;
export const JOYSTICK_MAX_RADIUS = 56; // px

// Rendering.
export const TARGET_FPS = 60;
