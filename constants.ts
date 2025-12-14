import { AnimationRow } from './types';

export const DEFAULT_ROWS: AnimationRow[] = [
  { id: 1, name: 'Idle / Breathing' },
  { id: 2, name: 'Running' },
  { id: 3, name: 'Jumping' },
  { id: 4, name: 'Attacking (Melee)' },
  { id: 5, name: 'Taking Damage / Hurt' },
  { id: 6, name: 'Dying / Fallen' },
  { id: 7, name: 'Casting / Magic' },
  { id: 8, name: 'Victory Pose' },
];

export const ART_STYLES = [
  "Pixel Art (16-bit)",
  "Pixel Art (8-bit)",
  "Vector Flat",
  "Hand Drawn Sketch",
  "Chibi Anime",
  "Realistic Digital Painting"
];

export const FACING_DIRECTIONS = [
  "Side View (Right)",
  "Side View (Left)",
  "Front View",
  "Isometric"
];

export const PREVIEW_SPEEDS = [
  { label: 'Slow', fps: 8 },
  { label: 'Normal', fps: 12 },
  { label: 'Fast', fps: 24 },
  { label: 'Turbo', fps: 60 },
];