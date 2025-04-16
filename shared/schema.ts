import { pgTable, text, serial, integer, numeric, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const artifacts = pgTable("artifacts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  culture: text("culture"),
  period: text("period"),
  date_start: integer("date_start"),
  date_end: integer("date_end"),
  materials: text("materials").array(),
  dimensions: text("dimensions"),
  provenance: text("provenance"),
  id_number: text("id_number").notNull().unique(),
  findspot_lat: numeric("findspot_lat"),
  findspot_lng: numeric("findspot_lng"),
  site: text("site"),
  has_3d_model: boolean("has_3d_model").default(false),
  model_url: text("model_url"),
  model_type: text("model_type"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  created_at: true,
});

export const artifactImages = pgTable("artifact_images", {
  id: serial("id").primaryKey(),
  artifact_id: integer("artifact_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  is_primary: boolean("is_primary").default(false),
  sort_order: integer("sort_order").default(0),
});

export const insertArtifactImageSchema = createInsertSchema(artifactImages).omit({
  id: true,
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
});

export const artifactTags = pgTable("artifact_tags", {
  id: serial("id").primaryKey(),
  artifact_id: integer("artifact_id").notNull(),
  tag_id: integer("tag_id").notNull(),
});

export const insertArtifactTagSchema = createInsertSchema(artifactTags).omit({
  id: true,
});

// Types for the Elasticsearch schema
export const artifactESSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  culture: z.string().optional(),
  period: z.string().optional(),
  date_start: z.number().optional(),
  date_end: z.number().optional(),
  materials: z.array(z.string()).optional(),
  id_number: z.string(),
  image_urls: z.array(z.string()).optional(),
  primary_image_url: z.string().optional(),
  has_3d_model: z.boolean().optional(),
  model_url: z.string().optional(),
  model_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).optional(),
  site: z.string().optional(),
});

// Types for API
export const artifactSearchParamsSchema = z.object({
  query: z.string().optional(),
  cultures: z.array(z.string()).or(z.string()).optional(),
  materials: z.array(z.string()).or(z.string()).optional(),
  dateStart: z.number().optional(),
  dateEnd: z.number().optional(),
  tags: z.array(z.string()).or(z.string()).optional(),
  site: z.string().optional(),
  has3dModel: z.boolean().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(12),
  sort: z.enum(['relevance', 'date_asc', 'date_desc', 'az']).optional().default('relevance'),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;
export type ArtifactImage = typeof artifactImages.$inferSelect;
export type InsertArtifactImage = z.infer<typeof insertArtifactImageSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type ArtifactTag = typeof artifactTags.$inferSelect;
export type InsertArtifactTag = z.infer<typeof insertArtifactTagSchema>;
export type ArtifactES = z.infer<typeof artifactESSchema>;
export type ArtifactSearchParams = z.infer<typeof artifactSearchParamsSchema>;
