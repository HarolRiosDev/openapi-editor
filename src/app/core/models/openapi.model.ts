// src/app/core/models/openapi.model.ts

export interface OpenApiInfo {
  title: string;
  description?: string;
  contact?: {
    name?: string;
    url?: string;
    email?: string;
  };
  license?: {
    name?: string;
    url?: string;
  };
  version: string;
}

// Interfaces auxiliares que pueden ser referenciadas o definidas inline
export interface OpenApiReferenceObject {
  $ref: string;
}

export interface OpenApiSchemaObject {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  properties?: { [key: string]: OpenApiSchemaObject | OpenApiReferenceObject };
  required?: string[];
  example?: any;
  items?: OpenApiSchemaObject | OpenApiReferenceObject;
  enum?: any[];
  default?: any;
  description?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: OpenApiXMLObject;
  externalDocs?: OpenApiExternalDocumentationObject;
  deprecated?: boolean;
  // Mantenemos esto si necesitas propiedades adicionales arbitrarias
  [key: string]: any;
}

export interface OpenApiXMLObject {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface OpenApiExternalDocumentationObject {
  description?: string;
  url: string;
}

export interface OpenApiExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface OpenApiMediaTypeObject {
  schema?: OpenApiSchemaObject | OpenApiReferenceObject;
  examples?: { [name: string]: OpenApiExampleObject | OpenApiReferenceObject };
  example?: any;
  encoding?: { [property: string]: OpenApiEncodingObject };
}

export interface OpenApiEncodingObject {
  contentType?: string;
  headers?: { [header: string]: OpenApiHeaderObject | OpenApiReferenceObject };
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenApiHeaderObject extends Omit<OpenApiParameterObject, 'name' | 'in'> {
  // Omitimos 'name' y 'in' ya que para un Header son fijos.
}

export interface OpenApiRequestBodyObject {
  description?: string;
  content: { [mediaType: string]: OpenApiMediaTypeObject };
  required?: boolean;
}

export interface OpenApiResponseObject {
  description: string;
  headers?: { [name: string]: OpenApiHeaderObject | OpenApiReferenceObject };
  content?: { [mediaType: string]: OpenApiMediaTypeObject };
  links?: { [name: string]: OpenApiLinkObject | OpenApiReferenceObject };
}

export interface OpenApiLinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: { [parameter: string]: any; };
  requestBody?: any;
  description?: string;
  server?: OpenApiServerObject;
}

export interface OpenApiServerObject {
  url: string;
  description?: string;
  variables?: {
    [variable: string]: {
      enum?: string[];
      default: string;
      description?: string;
    };
  };
}

export interface OpenApiSecurityRequirementObject {
  [name: string]: string[];
}

export interface OpenApiTagObject {
  name: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentationObject;
}

export interface OpenApiCallbackObject {
  [expression: string]: OpenApiPathItemObject | OpenApiReferenceObject;
}


// --- Main OpenAPI Interface ---
export interface Openapi {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServerObject[]; // <-- AÑADIDO: 'servers' a nivel raíz de Openapi
  paths: {
    [path: string]: OpenApiPathItemObject;
  };
  components?: {
    schemas?: Record<string, OpenApiSchemaObject | OpenApiReferenceObject>;
    responses?: Record<string, OpenApiResponseObject | OpenApiReferenceObject>;
    parameters?: Record<string, OpenApiParameterObject | OpenApiReferenceObject>;
    examples?: Record<string, OpenApiExampleObject | OpenApiReferenceObject>;
    requestBodies?: Record<string, OpenApiRequestBodyObject | OpenApiReferenceObject>;
    headers?: Record<string, OpenApiHeaderObject | OpenApiReferenceObject>;
    securitySchemes?: Record<string, any>;
    links?: Record<string, OpenApiLinkObject | OpenApiReferenceObject>;
    callbacks?: Record<string, OpenApiCallbackObject | OpenApiReferenceObject>;
  };
  security?: OpenApiSecurityRequirementObject[];
  tags?: OpenApiTagObject[];
  externalDocs?: OpenApiExternalDocumentationObject;
}

export interface OpenApiPathItemObject {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: OpenApiOperationObject;
  put?: OpenApiOperationObject;
  post?: OpenApiOperationObject;
  delete?: OpenApiOperationObject;
  options?: OpenApiOperationObject;
  head?: OpenApiOperationObject;
  patch?: OpenApiOperationObject;
  trace?: OpenApiOperationObject;
  servers?: OpenApiServerObject[];
  parameters?: (OpenApiParameterObject | OpenApiReferenceObject)[];
}

export interface OpenApiOperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenApiExternalDocumentationObject;
  operationId?: string;
  parameters?: (OpenApiParameterObject | OpenApiReferenceObject)[];
  requestBody?: OpenApiRequestBodyObject | OpenApiReferenceObject;
  responses?: { // Sigue siendo opcional
    [statusCode: string]: OpenApiResponseObject | OpenApiReferenceObject;
  };
  callbacks?: { [callback: string]: OpenApiCallbackObject | OpenApiReferenceObject; };
  deprecated?: boolean;
  security?: OpenApiSecurityRequirementObject[];
  servers?: OpenApiServerObject[];
}


export interface OpenApiParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: OpenApiSchemaObject | OpenApiReferenceObject;
  examples?: { [name: string]: OpenApiExampleObject | OpenApiReferenceObject };
  content?: { [mediaType: string]: OpenApiMediaTypeObject };
  [key: string]: any;
}


// Interfaz de Display para el componente (se usa en el archivo del diálogo y en endpoints.component.ts)
export interface EndpointDisplayItem {
  path: string;
  method: string;
  details: OpenApiOperationObject & {
    requestBodyRef?: string;
    responsesArray?: { statusCode: string; description?: string; ref?: string }[];
    parametersArray?: OpenApiParameterObject[];
  };
}