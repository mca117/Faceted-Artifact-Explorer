import { Artifact, ArtifactImage, Tag } from "@shared/schema";

/**
 * Search result type for artifacts
 */
export interface ArtifactSearchResult {
  artifacts: Artifact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Artifact detail type with related data
 */
export interface ArtifactDetail {
  artifact: Artifact;
  images: ArtifactImage[];
  tags: Tag[];
}

/**
 * Available region for filtering
 */
export interface Region {
  value: string;
  label: string;
  count: number;
}

/**
 * Map bounding box for geographic filtering
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * 3D model information
 */
export interface ModelInfo {
  type: 'gltf' | 'glb' | 'obj' | 'unity';
  url: string;
  thumbnail?: string;
  title?: string;
}

/**
 * User roles in the system
 */
export type UserRole = 'viewer' | 'curator' | 'admin';
