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

// --- Interfaz principal de OpenAPI usando las interfaces más específicas ---
export interface Openapi {
  openapi?: string;
  info: OpenApiInfo;
  paths?: Record<string, OpenApiPathItemObject>; // Usamos OpenApiPathItemObject aquí
  tags?: Array<{ name: string; description?: string }>;
  servers?: Array<{ url: string; description?: string }>;
  components?: {
    schemas?: Record<string, OpenApiSchemaObject>; // Usamos OpenApiSchemaObject
    responses?: Record<string, OpenApiResponseObject>; // Usamos OpenApiResponseObject
    parameters?: Record<string, any>;
    requestBodies?: Record<string, OpenApiRequestBodyObject>; // Usamos OpenApiRequestBodyObject
    [key: string]: any; // Permite otras propiedades custom en components
  };
  // ... cualquier otra propiedad root de OpenAPI
}


// Define la estructura de una operación HTTP (GET, POST, etc.)
export interface OpenApiOperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: any[]; // Puedes detallar esto con una interfaz ParameterObject si es necesario
  requestBody?: {
    description?: string;
    required?: boolean;
    content?: {
      [mediaType: string]: {
        schema: {
          $ref?: string;
        };
      };
    };
    // También puede ser una referencia directa a un RequestBody Object
    $ref?: string; // Si se usa directamente una referencia global a un requestBody
  }
  // responses es un mapa de códigos de estado a Response Objects o referencias
  responses?: {
    [statusCode: string]: {
      description: string;
      // Puede incluir content para esquemas detallados
      content?: {
        [mediaType: string]: {
          schema: {
            $ref?: string;
          };
        };
      };
      // O puede ser una referencia a un Response Object global
      $ref?: string;
    } | { $ref: string }; // Una respuesta puede ser una referencia directa
  };
  security?: any[]; // Puedes detallar esto con una interfaz SecurityRequirementObject si es necesario
  // ... otras propiedades de una operación OpenAPI
}

// Define la estructura de un Path (ej. /api/users) que contiene múltiples operaciones
export interface OpenApiPathItemObject {
  get?: OpenApiOperationObject;
  post?: OpenApiOperationObject;
  put?: OpenApiOperationObject;
  delete?: OpenApiOperationObject;
  patch?: OpenApiOperationObject;
  head?: OpenApiOperationObject;
  options?: OpenApiOperationObject;
  trace?: OpenApiOperationObject;
  // ... otras propiedades como parameters a nivel de path
}


// --- Interfaces para los componentes (opcional, pero buena práctica) ---

// Interfaz para la definición de un Schema (por ejemplo, un modelo de datos)
export interface OpenApiSchemaObject {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string; // 'date-time', 'email', 'int32', etc.
  properties?: { [key: string]: OpenApiSchemaObject | { $ref: string } };
  required?: string[];
  example?: any; // Valor de ejemplo para el schema
  items?: OpenApiSchemaObject | { $ref: string }; // Para esquemas de tipo 'array'
  enum?: any[]; // Para enumeraciones
  default?: any; // Valor por defecto
  description?: string; // Descripción del esquema
  nullable?: boolean; // OpenAPI 3.0.0+
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: any; // XML Object
  externalDocs?: any; // External Documentation Object
  deprecated?: boolean;
}


// Interfaz para una definición de Request Body
export interface OpenApiRequestBodyObject {
  description?: string;
  required?: boolean;
  content: { [mediaType: string]: { schema: OpenApiSchemaObject | { $ref: string } } };
}

// Interfaz para una definición de Respuesta
export interface OpenApiResponseObject {
  description: string;
  headers?: Record<string, any>; // Headers Object
  content?: { [mediaType: string]: { schema: OpenApiSchemaObject | { $ref: string } } };
  links?: Record<string, any>; // Links Object
}