import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { artifactSearchParamsSchema, insertArtifactSchema, insertArtifactImageSchema, insertTagSchema } from "@shared/schema";
import { Client } from "@elastic/elasticsearch";
import { z } from "zod";

// Initialize Elasticsearch client if available
let esClient: Client | null = null;
if (process.env.ELASTICSEARCH_URL) {
  esClient = new Client({
    node: process.env.ELASTICSEARCH_URL
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Artifacts API
  
  // Get all artifacts with pagination
  app.get("/api/artifacts", async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string) || 12;
      const page = parseInt(req.query.page as string) || 1;
      const offset = (page - 1) * limit;
      const sortBy = req.query.sortBy as string || "id";
      const sortDir = req.query.sortDir as 'asc' | 'desc' || "desc";
      
      const artifacts = await storage.listArtifacts({
        limit,
        offset,
        sortBy,
        sortDir
      });
      
      // Get total count for pagination
      const total = artifacts.length > 0 ? Math.max(...artifacts.map(a => a.id)) : 0;
      
      res.json({
        artifacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Get a specific artifact by ID
  app.get("/api/artifacts/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const artifact = await storage.getArtifact(id);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      // Get artifact images
      const images = await storage.getArtifactImages(id);
      
      // Get artifact tags
      const tags = await storage.getTagsByArtifactId(id);
      
      res.json({ artifact, images, tags });
    } catch (err) {
      next(err);
    }
  });
  
  // Create artifact (authenticated users)
  app.post("/api/artifacts", async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const artifactData = insertArtifactSchema.parse(req.body);
      const artifact = await storage.createArtifact(artifactData);
      
      res.status(201).json(artifact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid artifact data", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  // Create artifact (curator role required) - legacy endpoint
  app.post("/api/curator/artifacts", async (req, res, next) => {
    try {
      // Check if user is authenticated and has curator role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (req.user.role !== 'curator' && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Curator role required" });
      }
      
      const artifactData = insertArtifactSchema.parse(req.body);
      const artifact = await storage.createArtifact(artifactData);
      
      res.status(201).json(artifact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid artifact data", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  // Update artifact (curator role required)
  app.put("/api/curator/artifacts/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const artifact = await storage.getArtifact(id);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      const artifactData = insertArtifactSchema.partial().parse(req.body);
      const updatedArtifact = await storage.updateArtifact(id, artifactData);
      
      res.json(updatedArtifact);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid artifact data", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  // Delete artifact (admin role required)
  app.delete("/api/admin/artifacts/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const deleted = await storage.deleteArtifact(id);
      if (!deleted) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });
  
  // Artifact images API
  
  // Get images for an artifact
  app.get("/api/artifacts/:id/images", async (req, res, next) => {
    try {
      const artifactId = parseInt(req.params.id);
      if (isNaN(artifactId)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const images = await storage.getArtifactImages(artifactId);
      res.json(images);
    } catch (err) {
      next(err);
    }
  });
  
  // Add image to artifact (curator role required)
  app.post("/api/curator/artifacts/:id/images", async (req, res, next) => {
    try {
      const artifactId = parseInt(req.params.id);
      if (isNaN(artifactId)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const artifact = await storage.getArtifact(artifactId);
      if (!artifact) {
        return res.status(404).json({ message: "Artifact not found" });
      }
      
      const imageData = insertArtifactImageSchema.parse({
        ...req.body,
        artifact_id: artifactId
      });
      
      const image = await storage.addArtifactImage(imageData);
      
      // If this is the first image or marked as primary, set it as primary
      if (imageData.is_primary) {
        await storage.setPrimaryImage(image.id);
      }
      
      res.status(201).json(image);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid image data", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  // Set primary image (curator role required)
  app.put("/api/curator/images/:id/primary", async (req, res, next) => {
    try {
      const imageId = parseInt(req.params.id);
      if (isNaN(imageId)) {
        return res.status(400).json({ message: "Invalid image ID" });
      }
      
      const updatedImage = await storage.setPrimaryImage(imageId);
      if (!updatedImage) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(updatedImage);
    } catch (err) {
      next(err);
    }
  });
  
  // Tags API
  
  // Get all tags
  app.get("/api/tags", async (req, res, next) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (err) {
      next(err);
    }
  });
  
  // Create tag (curator role required)
  app.post("/api/curator/tags", async (req, res, next) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      
      res.status(201).json(tag);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid tag data", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  // Get tags for an artifact
  app.get("/api/artifacts/:id/tags", async (req, res, next) => {
    try {
      const artifactId = parseInt(req.params.id);
      if (isNaN(artifactId)) {
        return res.status(400).json({ message: "Invalid artifact ID" });
      }
      
      const tags = await storage.getTagsByArtifactId(artifactId);
      res.json(tags);
    } catch (err) {
      next(err);
    }
  });
  
  // Add tag to artifact (curator role required)
  app.post("/api/curator/artifacts/:artifactId/tags/:tagId", async (req, res, next) => {
    try {
      const artifactId = parseInt(req.params.artifactId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(artifactId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid artifact or tag ID" });
      }
      
      const artifactTag = await storage.addTagToArtifact(artifactId, tagId);
      res.status(201).json(artifactTag);
    } catch (err) {
      next(err);
    }
  });
  
  // Remove tag from artifact (curator role required)
  app.delete("/api/curator/artifacts/:artifactId/tags/:tagId", async (req, res, next) => {
    try {
      const artifactId = parseInt(req.params.artifactId);
      const tagId = parseInt(req.params.tagId);
      
      if (isNaN(artifactId) || isNaN(tagId)) {
        return res.status(400).json({ message: "Invalid artifact or tag ID" });
      }
      
      const removed = await storage.removeTagFromArtifact(artifactId, tagId);
      if (!removed) {
        return res.status(404).json({ message: "Tag not found on artifact" });
      }
      
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });
  
  // Metadata API
  
  // Get unique materials
  app.get("/api/materials", async (req, res, next) => {
    try {
      const materials = await storage.getDistinctMaterials();
      res.json(materials);
    } catch (err) {
      next(err);
    }
  });
  
  // Get unique cultures
  app.get("/api/cultures", async (req, res, next) => {
    try {
      const cultures = await storage.getDistinctCultures();
      res.json(cultures);
    } catch (err) {
      next(err);
    }
  });
  
  // Get unique periods
  app.get("/api/periods", async (req, res, next) => {
    try {
      const periods = await storage.getDistinctPeriods();
      res.json(periods);
    } catch (err) {
      next(err);
    }
  });
  
  // Search API (using Elasticsearch if available)
  app.get("/api/search", async (req, res, next) => {
    try {
      // Parse and validate search parameters
      const searchParams = artifactSearchParamsSchema.parse({
        query: req.query.query,
        cultures: req.query.cultures,
        materials: req.query.materials,
        dateStart: req.query.dateStart ? parseInt(req.query.dateStart as string) : undefined,
        dateEnd: req.query.dateEnd ? parseInt(req.query.dateEnd as string) : undefined,
        tags: req.query.tags,
        site: req.query.site,
        has3dModel: req.query.has3dModel === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
        sort: req.query.sort as any || 'relevance',
      });
      
      if (esClient) {
        // Use Elasticsearch for search
        const { body } = await esClient.search({
          index: 'artifacts',
          from: (searchParams.page - 1) * searchParams.limit,
          size: searchParams.limit,
          body: buildElasticsearchQuery(searchParams)
        });
        
        const results = body.hits.hits.map((hit: any) => hit._source);
        const total = body.hits.total.value;
        
        res.json({
          artifacts: results,
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total,
            totalPages: Math.ceil(total / searchParams.limit)
          }
        });
      } else {
        // Fallback to basic database search if Elasticsearch is not available
        const artifacts = await storage.listArtifacts({
          limit: searchParams.limit,
          offset: (searchParams.page - 1) * searchParams.limit,
          sortBy: getSortFieldFromSearchParams(searchParams.sort),
          sortDir: getSortDirectionFromSearchParams(searchParams.sort)
        });
        
        res.json({
          artifacts,
          pagination: {
            page: searchParams.page,
            limit: searchParams.limit,
            total: artifacts.length,
            totalPages: Math.ceil(artifacts.length / searchParams.limit)
          }
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: err.errors
        });
      }
      next(err);
    }
  });
  
  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to build Elasticsearch query
function buildElasticsearchQuery(params: z.infer<typeof artifactSearchParamsSchema>) {
  const query: any = {
    bool: {
      must: [],
      filter: []
    }
  };
  
  // Full-text search
  if (params.query) {
    query.bool.must.push({
      multi_match: {
        query: params.query,
        fields: ['title^3', 'description^2', 'culture', 'period', 'materials', 'site', 'tags'],
        fuzziness: 'AUTO'
      }
    });
  }
  
  // Filters
  if (params.cultures) {
    const cultures = Array.isArray(params.cultures) ? params.cultures : [params.cultures];
    if (cultures.length > 0) {
      query.bool.filter.push({
        terms: { culture: cultures }
      });
    }
  }
  
  if (params.materials) {
    const materials = Array.isArray(params.materials) ? params.materials : [params.materials];
    if (materials.length > 0) {
      query.bool.filter.push({
        terms: { materials: materials }
      });
    }
  }
  
  if (params.tags) {
    const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
    if (tags.length > 0) {
      query.bool.filter.push({
        terms: { tags: tags }
      });
    }
  }
  
  if (params.site) {
    query.bool.filter.push({
      term: { site: params.site }
    });
  }
  
  if (params.has3dModel) {
    query.bool.filter.push({
      term: { has_3d_model: true }
    });
  }
  
  // Date range filter
  if (params.dateStart !== undefined || params.dateEnd !== undefined) {
    const rangeFilter: any = { range: { date_start: {} } };
    
    if (params.dateStart !== undefined) {
      rangeFilter.range.date_start.gte = params.dateStart;
    }
    
    if (params.dateEnd !== undefined) {
      rangeFilter.range.date_end = { lte: params.dateEnd };
    }
    
    query.bool.filter.push(rangeFilter);
  }
  
  // Sort
  const sort = [];
  
  switch (params.sort) {
    case 'date_asc':
      sort.push({ date_start: { order: 'asc' } });
      break;
    case 'date_desc':
      sort.push({ date_start: { order: 'desc' } });
      break;
    case 'az':
      sort.push({ title: { order: 'asc' } });
      break;
    case 'relevance':
    default:
      if (!params.query) {
        // If no query, sort by ID
        sort.push({ id: { order: 'desc' } });
      }
      // Otherwise use relevance scoring
      break;
  }
  
  return {
    query,
    sort: sort.length > 0 ? sort : undefined
  };
}

// Helper functions for sorting when Elasticsearch is not available
function getSortFieldFromSearchParams(sort: string): string {
  switch (sort) {
    case 'date_asc':
    case 'date_desc':
      return 'date_start';
    case 'az':
      return 'title';
    case 'relevance':
    default:
      return 'id';
  }
}

function getSortDirectionFromSearchParams(sort: string): 'asc' | 'desc' {
  switch (sort) {
    case 'date_asc':
    case 'az':
      return 'asc';
    case 'date_desc':
    case 'relevance':
    default:
      return 'desc';
  }
}
