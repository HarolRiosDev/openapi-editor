export interface OpenApiInfo {
  title: string;
  description?: string;
  contact?: {
    email?: string;
  };
  license?: {
    name?: string;
    url?: string;
  };
  version: string;
}

export interface Openapi {
  info: OpenApiInfo;
  paths?: Record<string, any>; // Endpoints
  tags?: Array<{ name: string; description?: string }>;
  servers?: Array<{ url: string; description?: string }>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
    requestBodies?: Record<string, any>;
    [key: string]: any;
  };
}
