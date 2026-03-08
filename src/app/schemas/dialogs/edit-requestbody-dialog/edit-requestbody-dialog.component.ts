import { Component, Inject } from '@angular/core';
import { OpenApiParameterObject } from '../../../core/models/openapi.model';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule para *ngIf
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { OpenApiSchemaObject } from '../../../core/models/openapi.model';
import { OpenApiReferenceObject } from '../../../core/models/openapi.model';
import { OpenApiRequestBodyObject } from '../../../core/models/openapi.model';
import { OpenapiService } from '../../../core/services/openapi.service';

@Component({
  selector: 'app-edit-requestbody-dialog',
  imports: [
    MatDialogModule,
    FormsModule,
    CommonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatAutocompleteModule,
    MatTooltipModule,
    MatCheckboxModule,
    ReactiveFormsModule,
  ],
  templateUrl: './edit-requestbody-dialog.component.html',
  styleUrl: './edit-requestbody-dialog.component.scss'
})
export class EditRequestbodyDialogComponent {
 requestBody: OpenApiRequestBodyObject ;
 key: string = ''; // Variable para la clave del parámetro
 errorMessage: string | null = null; // Variable para el mensaje de error
 objectKeys = Object.keys;

  // Para edición en línea
  mediaTypeEdit: { [mediaType: string]: string } = {};
  schemaEdit: { [mediaType: string]: string } = {};
  // Para añadir nuevo media type
  newMediaType = '';
  newSchema = '';
  schemaNames: string[] = []; 
  mediaTypeOptions: string[] = [
  'application/json',
  'application/xml',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'text/html'
  ];

 constructor(
    public dialogRef: MatDialogRef<EditRequestbodyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { key: string ,requestBody: OpenApiRequestBodyObject, existingRequestBody:OpenApiRequestBodyObject [],  isEdit: boolean; },
    private openapiService: OpenapiService
  ) {
    this.requestBody = { ...data.requestBody }; // Hacer copia para no modificar directamente
    this.key = data.key; // Asignar la clave del parámetro
    if (this.requestBody.content) {
      for (const key of Object.keys(this.requestBody.content)) {
        this.mediaTypeEdit[key] = key;
        // Si el schema es un $ref, extrae el nombre, si no, serializa el objeto
        const schema = this.requestBody.content[key].schema;
        if (schema && '$ref' in schema) {
          const ref = (schema as OpenApiReferenceObject).$ref;
          this.schemaEdit[key] = ref.replace('#/components/schemas/', '');
        } else {
          this.schemaEdit[key] = JSON.stringify(schema || {}, null, 2);
        }
      }
    }
    if (!this.requestBody.content) {
      this.requestBody.content = {};
    }
    this.loadSchemas();
  }

  private loadSchemas() {
    const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.schemas) {
      this.schemaNames = Object.keys(openapi.components.schemas);
    } else {
      this.schemaNames = [];
    }
  }

    save(form: NgForm): void {
    if (form.valid) {
      const newParameterkey = this.requestBody.key.trim();

      const isDuplicateKey = this.data.existingRequestBody.some(
        (existingRequestBody: OpenApiRequestBodyObject) => 
          existingRequestBody.key.toLowerCase() === newParameterkey.toLowerCase() &&
        existingRequestBody !== this.data.requestBody // Ignora el propio objeto
      );
      if ( isDuplicateKey) {
        this.errorMessage = 'Ya existe un requestBody con esa clave referencia.'; // Establece el mensaje de error
        return; // No cierra el diálogo, permite al usuario corregir
      }

      // OPCIONAL: Actualiza el modelo global si quieres persistencia inmediata
      // const openapi = this.openapiService.getOpenapi();
      // openapi.paths[...][...].requestBody = this.requestBody;
      // this.openapiService.setOpenapi(openapi);
      // Si no es duplicado, cierra el diálogo y devuelve el nuevo tag
      this.errorMessage = null; // Limpia cualquier mensaje de error anterior
      this.dialogRef.close(this.requestBody);
    } 
  }

  public isSchemaObject(schema: OpenApiSchemaObject | OpenApiReferenceObject | undefined): schema is OpenApiSchemaObject {
    return !!schema && !('$ref' in schema);
  }

  cancel(): void {
    this.dialogRef.close();
  }

   renameMediaType(oldType: string) {
    const newType = this.mediaTypeEdit[oldType].trim();
    if (newType && newType !== oldType) {
      this.requestBody.content[newType] = this.requestBody.content[oldType];
      delete this.requestBody.content[oldType];
      this.mediaTypeEdit[newType] = newType;
      this.schemaEdit[newType] = this.schemaEdit[oldType];
      delete this.mediaTypeEdit[oldType];
      delete this.schemaEdit[oldType];
    }
  }

  updateSchema(mediaType: string) {
    try {
      const schemaObj = JSON.parse(this.schemaEdit[mediaType]);
      this.requestBody.content[mediaType].schema = schemaObj;
    } catch {
      // Maneja error de JSON inválido si quieres
    }
  }
    // Cuando se selecciona un schema del desplegable:
    updateSchemaFromSelect(mediaType: string) {
      const schemaName = this.schemaEdit[mediaType];
      // Referencia al esquema usando $ref
      this.requestBody.content[mediaType].schema = { $ref: `#/components/schemas/${schemaName}` };
    }

  addMediaType() {
    const type = this.newMediaType.trim();
    if (type && !this.requestBody.content[type]) {
      let schemaObj = {};
      try {
        schemaObj = JSON.parse(this.newSchema);
      } catch {
        // Maneja error de JSON inválido si quieres
      }
      this.requestBody.content[type] = { schema: schemaObj };
      this.mediaTypeEdit[type] = type;
      this.schemaEdit[type] = JSON.stringify(schemaObj, null, 2);
      this.newMediaType = '';
      this.newSchema = '';
    }
  }

}
