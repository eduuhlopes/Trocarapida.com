export interface ImageFile {
  file: File;
  preview: string;
  base64: string;
}

export interface ClothingInfo {
  name: string;
  description: string;
  occasions: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClothingPart {
  name: string;
  boundingBox: BoundingBox;
}

export interface GeneratedImage {
  url: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
