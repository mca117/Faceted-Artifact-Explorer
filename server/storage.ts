import { users, artifacts, artifactImages, tags, artifactTags, type User, type InsertUser, type Artifact, type InsertArtifact, type ArtifactImage, type InsertArtifactImage, type Tag, type InsertTag, type ArtifactTag, type InsertArtifactTag } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, inArray, desc, asc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Artifact methods
  getArtifact(id: number): Promise<Artifact | undefined>;
  getArtifactByIdNumber(idNumber: string): Promise<Artifact | undefined>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: number, artifact: Partial<InsertArtifact>): Promise<Artifact | undefined>;
  deleteArtifact(id: number): Promise<boolean>;
  listArtifacts(options: { limit?: number; offset?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }): Promise<Artifact[]>;
  
  // Artifact Image methods
  getArtifactImages(artifactId: number): Promise<ArtifactImage[]>;
  addArtifactImage(image: InsertArtifactImage): Promise<ArtifactImage>;
  setPrimaryImage(imageId: number): Promise<ArtifactImage | undefined>;
  
  // Tag methods
  getAllTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getTagsByArtifactId(artifactId: number): Promise<Tag[]>;
  addTagToArtifact(artifactId: number, tagId: number): Promise<ArtifactTag>;
  removeTagFromArtifact(artifactId: number, tagId: number): Promise<boolean>;
  
  // Material and Culture methods
  getDistinctMaterials(): Promise<string[]>;
  getDistinctCultures(): Promise<string[]>;
  getDistinctPeriods(): Promise<string[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Artifact methods
  async getArtifact(id: number): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, id));
    return artifact;
  }

  async getArtifactByIdNumber(idNumber: string): Promise<Artifact | undefined> {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id_number, idNumber));
    return artifact;
  }

  async createArtifact(artifact: InsertArtifact): Promise<Artifact> {
    const [newArtifact] = await db
      .insert(artifacts)
      .values(artifact)
      .returning();
    return newArtifact;
  }

  async updateArtifact(id: number, artifact: Partial<InsertArtifact>): Promise<Artifact | undefined> {
    const [updatedArtifact] = await db
      .update(artifacts)
      .set(artifact)
      .where(eq(artifacts.id, id))
      .returning();
    return updatedArtifact;
  }

  async deleteArtifact(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(artifacts)
      .where(eq(artifacts.id, id))
      .returning({ id: artifacts.id });
    return !!deleted;
  }

  async listArtifacts(options: { limit?: number; offset?: number; sortBy?: string; sortDir?: 'asc' | 'desc' } = {}): Promise<Artifact[]> {
    const { limit = 12, offset = 0, sortBy = 'id', sortDir = 'desc' } = options;
    
    let query = db.select().from(artifacts);
    
    if (sortDir === 'asc') {
      query = query.orderBy(asc(artifacts[sortBy as keyof typeof artifacts]));
    } else {
      query = query.orderBy(desc(artifacts[sortBy as keyof typeof artifacts]));
    }
    
    query = query.limit(limit).offset(offset);
    
    return await query;
  }

  // Artifact Image methods
  async getArtifactImages(artifactId: number): Promise<ArtifactImage[]> {
    return await db
      .select()
      .from(artifactImages)
      .where(eq(artifactImages.artifact_id, artifactId))
      .orderBy(asc(artifactImages.sort_order));
  }

  async addArtifactImage(image: InsertArtifactImage): Promise<ArtifactImage> {
    const [newImage] = await db
      .insert(artifactImages)
      .values(image)
      .returning();
    return newImage;
  }

  async setPrimaryImage(imageId: number): Promise<ArtifactImage | undefined> {
    const [image] = await db
      .select()
      .from(artifactImages)
      .where(eq(artifactImages.id, imageId));
    
    if (!image) return undefined;
    
    // Reset primary status on all images for this artifact
    await db
      .update(artifactImages)
      .set({ is_primary: false })
      .where(eq(artifactImages.artifact_id, image.artifact_id));
    
    // Set new primary image
    const [updatedImage] = await db
      .update(artifactImages)
      .set({ is_primary: true })
      .where(eq(artifactImages.id, imageId))
      .returning();
    
    return updatedImage;
  }

  // Tag methods
  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(asc(tags.name));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db
      .insert(tags)
      .values(tag)
      .returning();
    return newTag;
  }

  async getTagsByArtifactId(artifactId: number): Promise<Tag[]> {
    return await db
      .select({
        id: tags.id,
        name: tags.name
      })
      .from(tags)
      .innerJoin(artifactTags, eq(tags.id, artifactTags.tag_id))
      .where(eq(artifactTags.artifact_id, artifactId))
      .orderBy(asc(tags.name));
  }

  async addTagToArtifact(artifactId: number, tagId: number): Promise<ArtifactTag> {
    const [newArtifactTag] = await db
      .insert(artifactTags)
      .values({ artifact_id: artifactId, tag_id: tagId })
      .returning();
    return newArtifactTag;
  }

  async removeTagFromArtifact(artifactId: number, tagId: number): Promise<boolean> {
    const [deleted] = await db
      .delete(artifactTags)
      .where(
        and(
          eq(artifactTags.artifact_id, artifactId),
          eq(artifactTags.tag_id, tagId)
        )
      )
      .returning({ id: artifactTags.id });
    return !!deleted;
  }

  // Material and Culture methods
  async getDistinctMaterials(): Promise<string[]> {
    const result = await db.execute(
      sql`SELECT DISTINCT unnest(materials) as material FROM ${artifacts} ORDER BY material`
    );
    return result.rows.map(row => row.material);
  }

  async getDistinctCultures(): Promise<string[]> {
    const result = await db.execute(
      sql`SELECT DISTINCT culture FROM ${artifacts} WHERE culture IS NOT NULL ORDER BY culture`
    );
    return result.rows.map(row => row.culture);
  }

  async getDistinctPeriods(): Promise<string[]> {
    const result = await db.execute(
      sql`SELECT DISTINCT period FROM ${artifacts} WHERE period IS NOT NULL ORDER BY period`
    );
    return result.rows.map(row => row.period);
  }
}

export const storage = new DatabaseStorage();
