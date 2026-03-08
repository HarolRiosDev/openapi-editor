import { Component, Inject, OnInit } from '@angular/core';
import { OpenApiResponseObject, OpenApiReferenceObject } from '../../../core/models/openapi.model';
import { OpenapiService } from '../../../core/services/openapi.service';
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
@Component({
  selector: 'app-edit-response-dialog',
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
  ],
  templateUrl: './edit-response-dialog.component.html',
  styleUrl: './edit-response-dialog.component.scss'
})
export class EditResponseDialogComponent {
  // Status code (clave del response)
  statusCode: string = '';
  // Objeto response editable
  response: OpenApiResponseObject = { description: '' };
  // Media type y schema seleccionados
  mediaType: string = '';
  schema: string = '';
  // Opciones
  mediaTypeOptions: string[] = [
    'application/json',
    'application/xml',
    'text/plain',
    'text/html'
  ];
  schemaNames: string[] = [];
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditResponseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      key: string,
      response: OpenApiResponseObject | OpenApiReferenceObject,
      existingResponse: Record<string, OpenApiResponseObject | OpenApiReferenceObject>,
      isEdit: boolean,
    }
  ) {
    // Si es $ref, no se edita aquí
    if ('$ref' in data.response) {
      this.response = { description: '' };
    } else {
      this.response = { ...data.response };
      // Carga mediaType y schema si existen
      if (this.response.content) {
        const types = Object.keys(this.response.content);
        if (types.length > 0) {
          this.mediaType = types[0];
          const schemaObj = this.response.content[this.mediaType]?.schema;
          if (schemaObj && '$ref' in schemaObj) {
            this.schema = schemaObj.$ref.replace('#/components/schemas/', '');
          }
        }
      }
    }
  }

   save(form: NgForm): void {
    if (form.valid) {

      this.errorMessage = null;
      // Actualiza descripción y content
      this.response.description = this.response.description || '';
      this.response.content = {
        [this.mediaType]: {
          schema: { $ref: `#/components/schemas/${this.schema}` }
        }
      };
      this.dialogRef.close({
        response: this.response
      });
    }
  }

}
