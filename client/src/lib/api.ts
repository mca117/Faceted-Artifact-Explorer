import { ArtifactSearchParams } from "@shared/schema";

/**
 * Builds a query string from search parameters
 */
export function buildSearchQueryString(params: Partial<ArtifactSearchParams>): string {
  const queryParams = new URLSearchParams();
  
  if (params.query) queryParams.append("query", params.query);
  
  if (params.cultures) {
    if (Array.isArray(params.cultures)) {
      queryParams.append("cultures", params.cultures.join(","));
    } else {
      queryParams.append("cultures", params.cultures);
    }
  }
  
  if (params.materials) {
    if (Array.isArray(params.materials)) {
      queryParams.append("materials", params.materials.join(","));
    } else {
      queryParams.append("materials", params.materials);
    }
  }
  
  if (params.dateStart !== undefined) queryParams.append("dateStart", params.dateStart.toString());
  if (params.dateEnd !== undefined) queryParams.append("dateEnd", params.dateEnd.toString());
  
  if (params.tags) {
    if (Array.isArray(params.tags)) {
      queryParams.append("tags", params.tags.join(","));
    } else {
      queryParams.append("tags", params.tags);
    }
  }
  
  if (params.site) queryParams.append("site", params.site);
  if (params.has3dModel !== undefined) queryParams.append("has3dModel", params.has3dModel.toString());
  if (params.page !== undefined) queryParams.append("page", params.page.toString());
  if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
  if (params.sort !== undefined) queryParams.append("sort", params.sort);
  
  return queryParams.toString();
}

/**
 * Parse a URL search string into search parameters
 */
export function parseSearchParams(search: string): Partial<ArtifactSearchParams> {
  const params = new URLSearchParams(search);
  const result: Partial<ArtifactSearchParams> = {};
  
  if (params.has("query")) result.query = params.get("query") || undefined;
  
  if (params.has("cultures")) {
    const cultures = params.get("cultures");
    result.cultures = cultures ? cultures.split(",") : undefined;
  }
  
  if (params.has("materials")) {
    const materials = params.get("materials");
    result.materials = materials ? materials.split(",") : undefined;
  }
  
  if (params.has("dateStart")) {
    const dateStart = params.get("dateStart");
    result.dateStart = dateStart ? parseInt(dateStart) : undefined;
  }
  
  if (params.has("dateEnd")) {
    const dateEnd = params.get("dateEnd");
    result.dateEnd = dateEnd ? parseInt(dateEnd) : undefined;
  }
  
  if (params.has("tags")) {
    const tags = params.get("tags");
    result.tags = tags ? tags.split(",") : undefined;
  }
  
  if (params.has("site")) result.site = params.get("site") || undefined;
  
  if (params.has("has3dModel")) {
    const has3dModel = params.get("has3dModel");
    result.has3dModel = has3dModel === "true";
  }
  
  if (params.has("page")) {
    const page = params.get("page");
    result.page = page ? parseInt(page) : undefined;
  }
  
  if (params.has("limit")) {
    const limit = params.get("limit");
    result.limit = limit ? parseInt(limit) : undefined;
  }
  
  if (params.has("sort")) {
    const sort = params.get("sort");
    if (sort) {
      result.sort = sort as ArtifactSearchParams["sort"];
    }
  }
  
  return result;
}

/**
 * Format a date for display, handling BCE/CE
 */
export function formatDate(year: number | null | undefined): string {
  if (year === null || year === undefined) return "Unknown";
  
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  } else if (year > 0) {
    return `${year} CE`;
  }
  return "0";
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  startYear: number | null | undefined, 
  endYear: number | null | undefined,
  period?: string | null
): string {
  if (!startYear && !endYear) return period || "Unknown";
  
  const formattedStart = startYear ? formatDate(startYear) : "?";
  const formattedEnd = endYear ? formatDate(endYear) : "?";
  
  if (startYear === endYear) {
    return period ? `${formattedStart} (${period})` : formattedStart;
  }
  
  const dateRange = `${formattedStart} - ${formattedEnd}`;
  return period ? `${dateRange} (${period})` : dateRange;
}
