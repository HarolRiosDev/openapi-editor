// src/app/app.component.ts
import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as yaml from 'js-yaml';
import { saveAs } from 'file-saver';
import { Openapi } from './core/models/openapi.model'; // Asegúrate de que Openapi esté importado
import { OpenapiService } from './core/services/openapi.service';
import { ConfirmDialogComponent } from './shared/components/modal/confirm-dialog.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, MatToolbarModule, MatIconModule, MatSnackBarModule, MatDialogModule, MatSidenavModule, MatButtonModule, MatTooltipModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'openapi-editor';
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(private openapiService: OpenapiService, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit() {
    // Preguntar si cargar datos guardados
    this.checkForSavedData();
  }

  /**
   * Verifica si hay datos guardados y ofrece cargarlos
   */
  private checkForSavedData() {
    if (this.openapiService.hasSavedData()) {
      const lastSave = this.openapiService.getLastSaveTime();
      const message = lastSave 
        ? `Hay datos guardados desde ${new Date(lastSave).toLocaleString()}. ¿Deseas cargarlos?`
        : '¿Deseas cargar los datos guardados?';
      
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: { message },
        disableClose: false
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.loadSavedData();
        }
      });
    }
  }

  /**
   * Carga los datos guardados en localStorage
   */
  loadSavedData() {
    const saved = this.openapiService.loadFromLocalStorage();
    if (saved) {
      this.openapiService.setOpenapi(saved);
      this.snackBar.open('Datos guardados cargados correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
    } else {
      this.snackBar.open('No hay datos guardados para cargar', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
    }
  }

  /**
   * Limpia los datos guardados en localStorage
   */
  clearSavedData() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { message: '¿Estás seguro de que deseas eliminar todos los datos guardados?' },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.openapiService.clearLocalStorage()) {
          this.snackBar.open('Datos guardados eliminados', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
        } else {
          this.snackBar.open('Error al eliminar datos guardados', 'Cerrar', { duration: 3000, panelClass: 'snackbar-error' });
        }
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      let data: any;
      try {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'json') {
          data = JSON.parse(e.target.result);
        } else if (ext === 'yml' || ext === 'yaml') {
          data = yaml.load(e.target.result);
        } else {
          throw new Error('Formato de archivo no soportado. Usa .yml, .yaml o .json');
        }
        this.openapiService.setOpenapi(data as Openapi);
        this.snackBar.open('Archivo importado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      } catch (err) {
        this.snackBar.open('Error al leer el archivo: ' + err, 'Cerrar', { duration: 4000, panelClass: 'snackbar-error' });
      }
      input.value = '';
      if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
    };
    reader.readAsText(file);
  }

  async nuevaApi() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { message: '¿Deseas crear una nueva API? Se borrarán todos los datos actuales.' },
      disableClose: false
    });
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.openapiService.setOpenapi({
        openapi: '3.0.0', // Añadir la versión de OpenAPI si no existe
        info: {
          title: 'New API Title',
          description: 'A brief description of your new API.',
          version: '1.0.0'
        },
        paths: {},
        tags: [],
        servers: [{ url: 'http://localhost:8080', description: 'Local Development Server' }],
        components: {
          schemas: {
            Error: {
              type: 'object',
              description: 'Data structure containing the details for errors',
              properties: {
                timestamp: { type: 'string', format: 'date-time', example: '2021-03-20T10:00:00Z' },
                status: { type: 'integer', example: 400 },
                error: { type: 'string', example: 'Bad Request' },
                message: { type: 'string', example: 'Invalid parameters' },
                path: { type: 'string', example: '/api/auth/register' },
                validationErrors: {
                  type: 'array',
                  items: { // 'items' ahora es válido
                    type: 'object',
                    properties: {
                      field: { type: 'string', example: 'email' },
                      message: { type: 'string', example: 'Invalid email format' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            Created: { description: 'Created' },
            NoContent: { description: 'No content' },
            BadRequest: {
              description: 'Bad Request',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            Forbidden: {
              description: 'Forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            Unauthorized: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            NotFound: {
              description: 'Not Found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            InternalServerError: {
              description: 'Internal Server Error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            ServiceUnavailable: {
              description: 'Service Unavailable',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            Timeout: {
              description: 'Timeout',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
            UnsupportedMediaType: {
              description: 'Unsupported Media Type',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' }
                }
              }
            },
          },
          parameters: {},
          requestBodies: {}
        }
      });
      this.snackBar.open('Nueva API iniciada. Los datos anteriores han sido borrados.', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
    }
  }
  exportToYAML() {
    try {
      const openapi = this.openapiService.getOpenapi();
      if (!openapi) {
        this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
        return;
      }
      const yamlContent = yaml.dump(openapi, { lineWidth: -1 });
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${openapi.info?.title?.replace(/\s+/g, '-') || 'api'}-${timestamp}.yaml`;
      saveAs(new Blob([yamlContent], { type: 'application/yaml' }), fileName);
      this.snackBar.open('Archivo YAML exportado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
    } catch (err) {
      this.snackBar.open('Error al exportar a YAML: ' + err, 'Cerrar', { duration: 4000, panelClass: 'snackbar-error' });
    }
  }

  exportToJSON() {
    try {
      const openapi = this.openapiService.getOpenapi();
      if (!openapi) {
        this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
        return;
      }
      const jsonContent = JSON.stringify(openapi, null, 2);
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${openapi.info?.title?.replace(/\s+/g, '-') || 'api'}-${timestamp}.json`;
      saveAs(new Blob([jsonContent], { type: 'application/json' }), fileName);
      this.snackBar.open('Archivo JSON exportado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
    } catch (err) {
      this.snackBar.open('Error al exportar a JSON: ' + err, 'Cerrar', { duration: 4000, panelClass: 'snackbar-error' });
    }
  }}