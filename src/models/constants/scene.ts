export const DESK_DIMENSIONS = {
  WIDTH: 3.5,
  HEIGHT: 0.15,
  DEPTH: 2,
};

export const DESK_POSITION = {
  X: 0,
  Y: 0.75,
  Z: 1.2,
};

// Calculate desk surface Y position (0.75 + 0.075 = 0.825)
export const DESK_SURFACE_Y = DESK_POSITION.Y + DESK_DIMENSIONS.HEIGHT / 2;

export const COMPUTER_CONFIG = {
  SCALE: 0.35,
  POSITION: {
    X: 0,
    Y: 1.05, // Adjusted to clear keyboard
    Z: 1.6,
  },
};

export const MONKEY_CONFIG = {
  CHAIR_POSITION: {
    X: 0,
    Y: 0.4,
    Z: -0.2,
  },
  BODY_POSITION: {
    X: 0,
    Y: 0.45,
    Z: 0,
  },
  HEAD_POSITION: {
    X: 0,
    Y: 1.65,
    Z: 0,
  },
  ARMS_BASE_ROTATION: {
    X: -0.5, // Less steep, reaching forward
    Y_OFFSET: 0.5, // Rotate inward to form V-shape
    Z_OFFSET: 0.0, // Remove outward spread
  },
  HAND_CONFIG: {
    SCALE: { X: 1.0, Y: 0.4, Z: 1.2 }, // Flattened palms
    OFFSET: { Y: -0.1 }, // Adjustment relative to arm end
  }
};

// --- LIGHTING CONFIGURATION ---
export const LIGHTING_CONFIG = {
  // 1. BASE FILL (The "Minimum Brightness")
  // This lifts the darkness of every shadow.
  // If this is too low -> shadows are black. If too high -> scene looks flat/2D.
  AMBIENT: {
    COLOR: 0xffffff,
    INTENSITY: 2.5, // High intensity for a bright, clinical office
  },

  // 2. SKY BOUNCE (The "Atmosphere")
  // Simulates light bouncing from a white ceiling (SKY) and dark floor (GROUND).
  // Essential for making vertical objects (like walls/pillars) look 3D.
  HEMISPHERE: {
    SKY_COLOR: 0xffffff,
    GROUND_COLOR: 0x444444, 
    INTENSITY: 0.6,
  },

  // 3. THE SUN (Main Shadow Caster)
  // Strong directional light creating the main shadows on the floor.
  // Coming from high up (Y=20) to simulate overhead office lighting banks.
  DIRECTIONAL_MAIN: {
    COLOR: 0xffffff,
    INTENSITY: 2,
    POSITION: { X: 10, Y: 20, Z: 10 },
  },

  // 4. RIM/FILL LIGHT (The "Beauty" Light)
  // A softer, cool-blue light from the opposite side.
  // It hits the dark side of objects to prevent them from disappearing into shadow.
  DIRECTIONAL_FILL: {
    COLOR: 0xb0c4de, // Cool Steel Blue
    INTENSITY: 0,
    POSITION: { X: -10, Y: 10, Z: -10 },
  },

  // 5. DESK FOCUS (The "Key" Light)
  // A spotlight pointing STRAIGHT DOWN at the desk center.
  // Fixes the "grey vertical face" issue by blasting the pillar with direct light from above.
  TOP_DOWN: {
    COLOR: 0xffffff,
    INTENSITY: 0,
    POSITION: { X: 0, Y: 15, Z: 0 },
  }
};

// --- SEVERANCE DESK CONFIGURATION ---
export const SEVERANCE_DESK_CONFIG = {
  DIMENSIONS: {
    TOTAL_WIDTH: 4.2,  // Large footprint for 4 people
    DESK_HEIGHT: 0.74, // Standard ergonomic height
    SURFACE_THICKNESS: 0.08, // Thick, substantial top
    DIVIDER_HEIGHT: 0.45, // Privacy height above desk
    DIVIDER_THICKNESS: 0.06,
    CORNER_RADIUS: 0.4, // Soft rounded corners
  },
  // Central Spine (Hub) Config
  HUB: {
    HEIGHT: 1.2,  // Floor to top of dividers
    WIDTH: 0.4,   // 40cm wide core
    SLOT_DEPTH: 0.02,
    SLOT_WIDTH: 0.08,
    CHROME_CAP_HEIGHT: 0.02,
  },
  COLORS: {
    SURFACE: 0xffffff, // Pure Lumon White
    DIVIDER: 0x1f3a2d, // Severance Green
    BASE: 0xcdcdcd,    // Metallic/Grey base
    TRIM: 0x888888,    // Chrome/Silver accents
    SLOTS: 0x111111,   // Dark recessed areas
  },
  POSITION: {
    Y: 0, // Base sits on floor
  }
};

// --- CHAIR CONFIGURATION ---
export const CHAIR_CONFIG = {
  DIMENSIONS: {
    SEAT_WIDTH: 0.5,
    SEAT_DEPTH: 0.5,
    SEAT_THICKNESS: 0.08,
    SEAT_HEIGHT: 0.45, // Standard office chair height
    BACK_HEIGHT: 0.4,  // Low back
    BASE_RADIUS: 0.35,
    BASE_HEIGHT: 0.1,
  },
  COLORS: {
    FRAME: 0x1a1a1a,      // Black plastic/metal frame
    UPHOLSTERY: 0x2a2a2a, // Dark grey fabric
  },
  POSITION_OFFSET: {
    // Relative to desk leaf center/edge
    Z: 0.6, // Distance from desk edge
  }
};

// --- SEVERANCE ROOM CONFIGURATION ---
export const SEVERANCE_ROOM_CONFIG = {
  DIMENSIONS: {
    WIDTH: 30,
    DEPTH: 30,
    HEIGHT: 5,
  },
  COLORS: {
    CARPET: 0x2d4635, // Iconic dark green carpet
    WALLS: 0xf4f4f0,  // Off-white clinical walls
    CEILING: 0xffffff, // Pure white ceiling
    BASEBOARD: 0x1a1a1a, // Dark trim
  },
  CEILING: {
    GRID_SIZE: 3.6, // Increased from 1.2 to make blocks bigger
    LIGHT_PANEL_RATIO: 0.85, // Ratio of panel that is the light vs frame
    BEAM_THICKNESS: 0.15, // Width of the separator beams
    BEAM_DEPTH: 0.2, // Depth/Height of the separator beams
    EMISSIVE_INTENSITY: 1.0,
  }
};
