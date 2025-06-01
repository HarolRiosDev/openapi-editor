import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenapiService } from '../core/services/openapi.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';

// Importa el nuevo componente de diálogo
import { EditEndpointDialogComponent, EndpointDisplayItem as DialogEndpointDisplayItem } from '../shared/components/edit-endpoint-dialog/edit-endpoint-dialog.component';

// === IMPORTA TUS INTERFACES DEL MODELO ===
import { Openapi, OpenApiOperationObject, OpenApiPathItemObject } from '../core/models/openapi.model';


// Interfaz para la representación interna del endpoint en el componente principal
// DEBE COINCIDIR CON LA INTERFAZ EndpointDisplayItem DEL DIALOGO
export interface EndpointDisplayItem {
  path: string;
  method: string;
  details: OpenApiOperationObject & {
    requestBodyRef?: string;
    responsesArray?: { statusCode: string; description: string; ref?: string }[];
  };
}

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
  ],
})
export class EndpointsComponent implements OnDestroy {
  endpoints: EndpointDisplayItem[] = [];
  private sub?: Subscription;

  constructor(private openapiService: OpenapiService, private dialog: MatDialog) {
    this.sub = this.openapiService.openapi$.subscribe((openapi: Openapi | null) => {
      if (openapi?.paths) {
        this.endpoints = Object.keys(openapi.paths).flatMap(path => {
          const pathObject: OpenApiPathItemObject = openapi.paths![path];
          return Object.keys(pathObject).map(method => {
            const details: OpenApiOperationObject = pathObject[method as keyof OpenApiPathItemObject]!;

            const responsesArray: { statusCode: string; description: string; ref?: string }[] = [];
            if (details.responses) {
              for (const statusCode in details.responses) {
                const response = details.responses[statusCode];

                // CORRECCIÓN CLAVE: Verificar si la respuesta es un objeto con 'description' y 'content'
                // O solo una referencia '$ref'.
                if (response && typeof response === 'object' && 'description' in response) {
                  // Si tiene descripción, es el objeto completo o al menos parte de él
                  responsesArray.push({
                    statusCode: statusCode,
                    description: response.description || 'No description provided',
                    ref: (response.content?.['application/json']?.schema?.$ref || (response as { $ref?: string }).$ref)
                  });
                } else if (response && typeof response === 'object' && '$ref' in response) {
                  // Si solo tiene '$ref', asignamos una descripción por defecto
                  responsesArray.push({
                    statusCode: statusCode,
                    description: 'See reference for details', // O alguna descripción por defecto
                    ref: response.$ref
                  });
                }
                // Si la respuesta es de otro tipo inesperado, se omite.
              }
            }

            return {
              path,
              method,
              details: {
                ...details,
                tags: details.tags || [],
                requestBodyRef: (details.requestBody as { $ref: string })?.$ref,
                responsesArray: responsesArray,
              }
            };
          });
        });
      } else {
        this.endpoints = [];
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  getHttpMethod(endpointItem: EndpointDisplayItem): string {
    return endpointItem.method;
  }

  getHttpMethodClass(method: string): string {
    return `${method.toLowerCase()}-method`;
  }

  getEndpointDisplayDetails(endpointItem: EndpointDisplayItem): EndpointDisplayItem['details'] {
    return endpointItem.details;
  }

  openEditEndpointDialog(endpointToEdit: EndpointDisplayItem) {
    const dialogRef = this.dialog.open(EditEndpointDialogComponent, {
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      data: JSON.parse(JSON.stringify(endpointToEdit)),
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: DialogEndpointDisplayItem | null) => {
      if (result) {
        const path = result.path;
        const method = result.method;
        const updatedDetails = result.details;

        const currentOpenapi: Openapi | null = this.openapiService.getOpenapi();

        if (!currentOpenapi) {
          console.error('No OpenAPI specification loaded. Cannot save endpoint.');
          return;
        }

        if (!currentOpenapi.paths) {
          currentOpenapi.paths = {};
        }

        const originalPath = endpointToEdit.path;
        const originalMethod = endpointToEdit.method;

        if (originalPath !== path || originalMethod !== method) {
          if (currentOpenapi.paths[originalPath]) {
            if ((currentOpenapi.paths[originalPath] as OpenApiPathItemObject)[originalMethod as keyof OpenApiPathItemObject]) {
              delete (currentOpenapi.paths[originalPath] as OpenApiPathItemObject)[originalMethod as keyof OpenApiPathItemObject];
            }
            if (Object.keys(currentOpenapi.paths[originalPath]).length === 0) {
              delete currentOpenapi.paths[originalPath];
            }
          }
        }

        if (!currentOpenapi.paths[path]) {
          currentOpenapi.paths[path] = {};
        }

        (currentOpenapi.paths[path] as OpenApiPathItemObject)[method as keyof OpenApiPathItemObject] = updatedDetails;

        this.openapiService.setOpenapi(currentOpenapi);
      }
    });
  }

  deleteEndpoint(index: number, event?: Event) {
    event?.stopPropagation();
    if (confirm('¿Estás seguro de que quieres eliminar este endpoint?')) {
      const endpointToDelete = this.endpoints[index];
      const currentOpenapi: Openapi | null = this.openapiService.getOpenapi();

      if (!currentOpenapi) {
        console.error('No OpenAPI specification loaded. Cannot delete endpoint.');
        return;
      }

      if (currentOpenapi.paths && currentOpenapi.paths[endpointToDelete.path]) {
        if ((currentOpenapi.paths[endpointToDelete.path] as OpenApiPathItemObject)[endpointToDelete.method as keyof OpenApiPathItemObject]) {
          delete (currentOpenapi.paths[endpointToDelete.path] as OpenApiPathItemObject)[endpointToDelete.method as keyof OpenApiPathItemObject];
        }

        if (Object.keys(currentOpenapi.paths[endpointToDelete.path]).length === 0) {
          delete currentOpenapi.paths[endpointToDelete.path];
        }
        this.openapiService.setOpenapi(currentOpenapi);
      }
    }
  }

  openAddEndpointDialog() {
    const newEndpoint: DialogEndpointDisplayItem = {
      path: '/new-path',
      method: 'post',
      details: {
        summary: 'New endpoint',
        description: '',
        operationId: '',
        tags: [],
        responses: {},
        responsesArray: [{ statusCode: '200', ref: '#/components/responses/DefaultResponse' }]
      }
    };

    const dialogRef = this.dialog.open(EditEndpointDialogComponent, {
      width: '80vw',
      maxWidth: '1200px',
      height: '80vh',
      data: newEndpoint,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result: DialogEndpointDisplayItem | null) => {
      if (result) {
        const path = result.path;
        const method = result.method;
        const newDetails = result.details;

        const currentOpenapi: Openapi | null = this.openapiService.getOpenapi();

        if (!currentOpenapi) {
          console.error('No OpenAPI specification loaded. Cannot add endpoint.');
          return;
        }
        if (!currentOpenapi.paths) {
          currentOpenapi.paths = {};
        }
        if (!currentOpenapi.paths[path]) {
          currentOpenapi.paths[path] = {};
        }

        (currentOpenapi.paths[path] as OpenApiPathItemObject)[method as keyof OpenApiPathItemObject] = newDetails;
        this.openapiService.setOpenapi(currentOpenapi);
      }
    });
  }
}