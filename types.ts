export interface AnimationRow {
  id: number;
  name: string;
}

export interface SpriteSheetConfig {
  characterDescription: string;
  rows: AnimationRow[];
  style: string;
  facing: string;
}

export interface GeneratedSprite {
  imageUrl: string;
  base64: string;
}

export type SliceSettings = {
  rows: number;
  cols: number;
  paddingX: number;
  paddingY: number;
  offsetX: number;
  offsetY: number;
  removeBackground: boolean;
  backgroundColorToRemove: string; // hex
  tolerance: number; // 0-100
};