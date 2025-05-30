import fs from 'fs';
import path from 'path';

// Get data directory from environment variable or fallback to current working directory
const DATA_DIR = process.env.RAMDEUS_DATA_DIR || process.cwd();
const BATTLE_STATE_FILE = path.join(DATA_DIR, 'battleState.json');

// Ensure data directory exists
function ensureDataDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory: ${DATA_DIR}`);
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Default battle state
const DEFAULT_BATTLE_STATE = {
  health: 100,
  attackedBy: [], // Array of user IDs who have already attacked
  isDefeated: false,
  lastAttackTime: null
};

// Load battle state from file or create default
export function getBattleState() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(BATTLE_STATE_FILE)) {
      const data = fs.readFileSync(BATTLE_STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading battle state:', error);
  }
  
  // Return default state if file doesn't exist or error occurred
  return { ...DEFAULT_BATTLE_STATE };
}

// Save battle state to file
export function saveBattleState(state) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(BATTLE_STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`Battle state saved to: ${BATTLE_STATE_FILE}`);
  } catch (error) {
    console.error('Error saving battle state:', error);
  }
}

// Attack Ram Deus
export function attackRamDeus(userId) {
  const state = getBattleState();
  
  // Check if user has already attacked
  if (state.attackedBy.includes(userId)) {
    return {
      success: false,
      message: "You have already attacked Ram Deus and he has gained immunity to your attacks! 🛡️👹",
      health: state.health,
      isDefeated: state.health <= 0
    };
  }
  
  // Check if already defeated
  if (state.health <= 0) {
    return {
      success: false,
      message: "Ram Deus has already been defeated! The demon has been banished! 🙏✨",
      health: 0,
      isDefeated: true
    };
  }
  
  // Perform attack
  state.health = Math.max(0, state.health - 15);
  state.attackedBy.push(userId);
  state.lastAttackTime = new Date().toISOString();
  
  if (state.health <= 0) {
    state.isDefeated = true;
  }
  
  saveBattleState(state);
  
  return {
    success: true,
    message: state.health <= 0 ? 
      "🎉 VICTORY! Ram Deus has been freed from the demon's possession! The spiritual light returns! 🙏✨" :
      `💥 You struck Ram Deus for 15 damage! His health is now ${state.health}/100. You have gained immunity to his future attacks! 👹⚡`,
    health: state.health,
    isDefeated: state.health <= 0,
    attackersCount: state.attackedBy.length
  };
}

// Reset battle state (for debugging or restarting)
export function resetBattleState() {
  const newState = { ...DEFAULT_BATTLE_STATE };
  saveBattleState(newState);
  return newState;
}

// Get battle status for display
export function getBattleStatus() {
  const state = getBattleState();
  
  if (state.health <= 0) {
    return `🙏 Ram Deus has been freed! The demon has been banished by ${state.attackedBy.length} brave souls! ✨`;
  }
  
  return `👹 Ram Deus is possessed! Health: ${state.health}/100 | Attacked by: ${state.attackedBy.length} users | ${7 - state.attackedBy.length} more attacks needed to defeat him!`;
} 