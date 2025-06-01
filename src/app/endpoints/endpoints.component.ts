import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenapiService } from '../core/services/openapi.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';

import { EditEndpointDialogComponent } from '../shared/components/edit-endpoint-dialog/edit-endpoint-dialog.component';
import { ConfirmDialogComponent } from '../shared/components/modal/confirm-dialog.component';

import {
  Openapi,
  OpenApiOperationObject,
  OpenApiPathItemObject,
  OpenApiReferenceObject,
  OpenApiParameterObject,
  OpenApiSchemaObject,
  EndpointDisplayItem,
  OpenApiInfo // Importado para dashboard.component.ts compatibilidad
} from '../core/models/openapi.model';
import * as yaml from 'js-yaml';
import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatCardModule,
    MatSnackBarModule,
    MatExpansionModule,
  ],
})
export class EndpointsComponent implements OnInit, OnDestroy {
  endpoints: EndpointDisplayItem[] = [];
  private sub?: Subscription;
  openapi: Openapi | null = null;

  constructor(private openapiService: OpenapiService, private dialog: MatDialog, private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.sub = this.openapiService.openapi$.subscribe((openapi: Openapi | null) => {
      this.openapi = openapi;
      this.loadEndpoints();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadEndpoints(): void {
    this.endpoints = [];
    if (this.openapi?.paths) {
      for (const path in this.openapi.paths) {
        const pathObject = this.openapi.paths[path];
        const httpMethods: (keyof OpenApiPathItemObject)[] = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];

        for (const method of httpMethods) {
          const operation = pathObject[method];

          if (operation && typeof operation === 'object' && !Array.isArray(operation) && ('summary' in operation || 'description' in operation || 'tags' in operation || 'operationId' in operation || 'responses' in operation || 'parameters' in operation || 'requestBody' in operation)) {
            const opDetails = operation as OpenApiOperationObject;

            const requestBodyRef = opDetails.requestBody && this.isReferenceObject(opDetails.requestBody) ? opDetails.requestBody.$ref : undefined;

            const responsesArray: { statusCode: string; description?: string; ref?: string }[] = [];
            if (opDetails.responses) {
              for (const statusCode in opDetails.responses) {
                const response = opDetails.responses[statusCode];

                if (response && typeof response === 'object') {
                  if (this.isReferenceObject(response)) {
                    responsesArray.push({
                      statusCode: statusCode || '',
                      description: 'Referencia a ' + response.$ref.split('/').pop(),
                      ref: response.$ref || ''
                    });
                  } else if ('description' in response) {
                    responsesArray.push({
                      statusCode: statusCode || '',
                      description: response.description || 'No description provided',
                      ref: (response.content?.['application/json']?.schema && this.isReferenceObject(response.content['application/json'].schema)) ? response.content['application/json'].schema.$ref : undefined
                    });
                  }
                }
              }
            }

            const parametersArray: OpenApiParameterObject[] = [];
            const allParams: (OpenApiParameterObject | OpenApiReferenceObject)[] = [];

            if (opDetails.parameters) {
                allParams.push(...opDetails.parameters);
            }
            if (pathObject.parameters) {
                allParams.push(...pathObject.parameters);
            }

            allParams.forEach(p => {
                let resolvedParam: OpenApiParameterObject | undefined;
                if (this.isReferenceObject(p)) {
                    resolvedParam = this.resolveParameterReference(p);
                } else {
                    resolvedParam = p;
                }

                if (resolvedParam) {
                    const isAlreadyAdded = parametersArray.some(existingP => existingP.name === resolvedParam!.name && existingP.in === resolvedParam!.in);
                    if (!isAlreadyAdded) {
                        if (!resolvedParam.schema) {
                            resolvedParam.schema = { type: 'string' };
                        } else if (this.isSchemaObject(resolvedParam.schema) && !resolvedParam.schema.type) {
                            resolvedParam.schema.type = 'string';
                        }
                        parametersArray.push(resolvedParam);
                    }
                }
            });

            this.endpoints.push({
              path: path,
              method: method,
              details: {
                ...opDetails,
                requestBodyRef: requestBodyRef,
                responsesArray: responsesArray,
                parametersArray: parametersArray,
                parameters: undefined
              }
            });
          }
        }
      }
    }
  }

  public isReferenceObject(obj: any): obj is OpenApiReferenceObject { // <-- Público
    return obj && typeof obj === 'object' && '$ref' in obj;
  }

  public isSchemaObject(obj: any): obj is OpenApiSchemaObject { // <-- Público
      return obj && typeof obj === 'object' && !('$ref' in obj);
  }

  private resolveParameterReference(refObj: OpenApiReferenceObject): OpenApiParameterObject | undefined {
    if (!this.openapi?.components?.parameters) return undefined;

    const refPath = refObj.$ref;
    const parts = refPath.split('/');
    const name = parts[parts.length - 1];

    const globalParam = this.openapi.components.parameters[name];
    if (globalParam && !this.isReferenceObject(globalParam)) {
      const resolvedParam = globalParam as OpenApiParameterObject;
      if (!resolvedParam.schema) {
          resolvedParam.schema = { type: 'string' };
      } else if (this.isSchemaObject(resolvedParam.schema) && !resolvedParam.schema.type) {
          resolvedParam.schema.type = 'string';
      }
      return resolvedParam;
    }
    return undefined;
  }

  // CAMBIO: Hacer público para el template
  public getHttpMethod(endpointItem: EndpointDisplayItem): string {
    return endpointItem.method;
  }

  // CAMBIO: Hacer público para el template y eliminar la duplicidad al final
  public getHttpMethodClass(method: string): string {
    return `${method.toLowerCase()}-method`;
  }

  openAddEndpointDialog(): void {
    const dialogRef = this.dialog.open(EditEndpointDialogComponent, {
      width: '800px',
      data: {
        path: '/',
        method: 'post',
        details: {
          summary: '',
          description: '',
          operationId: '',
          tags: [],
          responses: {},
          responsesArray: [{ statusCode: '200', description: 'Successful operation', ref: '' }],
          parametersArray: []
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateOpenapiSpec(result.path, result.method, result.details);
        this.snackBar.open('Endpoint añadido correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  openEditEndpointDialog(endpointToEdit: EndpointDisplayItem): void {
    const dialogRef = this.dialog.open(EditEndpointDialogComponent, {
      width: '800px',
      data: JSON.parse(JSON.stringify(endpointToEdit))
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateOpenapiSpec(result.path, result.method, result.details);
        this.snackBar.open('Endpoint actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  async deleteEndpoint(index: number): Promise<void> {
    const endpointToDelete = this.endpoints[index];

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { message: `¿Estás seguro de que quieres eliminar el endpoint ${endpointToDelete.method.toUpperCase()} ${endpointToDelete.path}?` }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();

    if (confirmed) {
      if (this.openapi && this.openapi.paths && this.openapi.paths[endpointToDelete.path]) {
        const pathItem = this.openapi.paths[endpointToDelete.path];
        if (pathItem && pathItem[endpointToDelete.method as keyof OpenApiPathItemObject]) {
          delete pathItem[endpointToDelete.method as keyof OpenApiPathItemObject];
        }

        if (Object.keys(pathItem).length === 0) {
          delete this.openapi.paths[endpointToDelete.path];
        }
        this.openapiService.setOpenapi({ ...this.openapi });
        this.snackBar.open('Endpoint eliminado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    }
  }

  updateOpenapiSpec(path: string, method: string, details: EndpointDisplayItem['details']): void {
    if (!this.openapi) return;

    if (!this.openapi.paths) {
      this.openapi.paths = {};
    }

    if (!this.openapi.paths[path]) {
      this.openapi.paths[path] = {};
    }

    const currentPathItem = this.openapi.paths[path] as OpenApiPathItemObject;

    const newOperation: OpenApiOperationObject = {
        responses: {}
    };

    if (details.summary) newOperation.summary = details.summary;
    if (details.description) newOperation.description = details.description;
    if (details.operationId) newOperation.operationId = details.operationId;
    if (details.tags && details.tags.length > 0) newOperation.tags = details.tags;

    if (details.requestBodyRef) {
      newOperation.requestBody = { $ref: details.requestBodyRef };
    } else {
      newOperation.requestBody = undefined;
    }

    const newResponses: OpenApiOperationObject['responses'] = {};
    details.responsesArray?.forEach(resp => {
      if (resp.statusCode) {
        if (resp.ref?.startsWith('#/components/responses/') || resp.ref?.startsWith('#/components/schemas/')) {
          newResponses[resp.statusCode] = { $ref: resp.ref };
        } else {
          const description = resp.description || 'No description provided';
          const responseContent: any = {};
          if (resp.ref) {
            responseContent['application/json'] = {
              schema: { $ref: resp.ref }
            };
          }
          newResponses[resp.statusCode] = {
            description: description,
            ...(Object.keys(responseContent).length > 0 && { content: responseContent })
          };
        }
      }
    });
    if (Object.keys(newResponses).length > 0) {
      newOperation.responses = newResponses;
    } else {
      newOperation.responses = undefined;
    }

    const finalParameters: OpenApiParameterObject[] = [];
    details.parametersArray?.forEach(param => {
        if (param.name && param.in && param.schema && this.isSchemaObject(param.schema) && param.schema.type) {
            const newParam: OpenApiParameterObject = {
                name: param.name,
                in: param.in,
                required: param.required || false,
                schema: { type: param.schema.type }
            };
            if (param.description) {
                newParam.description = param.description;
            }
            finalParameters.push(newParam);
        }
    });

    if (finalParameters.length > 0) {
        newOperation.parameters = finalParameters;
    } else {
        newOperation.parameters = undefined;
    }

    if (!newOperation.summary?.trim()) newOperation.summary = undefined;
    if (!newOperation.description?.trim()) newOperation.description = undefined;
    if (!newOperation.operationId?.trim()) newOperation.operationId = undefined;
    if (newOperation.tags && newOperation.tags.length === 0) newOperation.tags = undefined;


    // CAMBIO: Asignación explícita para evitar problemas de tipado
    (currentPathItem as any)[method] = newOperation; // Usar 'any' para forzar la asignación si TypeScript sigue quejándose

    this.openapiService.setOpenapi({ ...this.openapi });
  }
}