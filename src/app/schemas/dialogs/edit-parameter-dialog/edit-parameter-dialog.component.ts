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

@Component({
  selector: 'app-edit-parameter-dialog',
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
  templateUrl: './edit-parameter-dialog.component.html',
  styleUrl: './edit-parameter-dialog.component.scss'
})
export class EditParameterDialogComponent {
parameter: OpenApiParameterObject;
key: string = ''; // Variable para la clave del parámetro
errorMessage: string | null = null; // Variable para el mensaje de error
  constructor(
    public dialogRef: MatDialogRef<EditParameterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { key: string ,parameter: OpenApiParameterObject, existingParameter:OpenApiParameterObject[],  isEdit: boolean; }
  ) {
    console.log('Datos recibidos en el diálogo:', data);
    this.parameter = { ...data.parameter }; // Hacer copia para no modificar directamente
    this.key = data.key; // Asignar la clave del parámetro
    console.log('Parámetro inicial:', this.parameter);
    console.log('Parámetro inicial:', this.parameter.key);
  }

  save(form: NgForm): void {
    if (form.valid && this.parameter.name.trim()) {
      const newParameterName = this.parameter.name.trim();
      const newParameterkey = this.parameter.key.trim();

      const isDuplicate = this.data.existingParameter.some(
        (existingParameter: OpenApiParameterObject) => existingParameter.name.toLowerCase() === newParameterName.toLowerCase()
      );

      const isDuplicateKey = this.data.existingParameter.some(
        (existingParameter: OpenApiParameterObject) => existingParameter.key.toLowerCase() === newParameterkey.toLowerCase()
      );

      if (isDuplicate) {
        this.errorMessage = 'Ya existe un parametro con ese nombre.'; // Establece el mensaje de error
        return; // No cierra el diálogo, permite al usuario corregir
      }
      if ( isDuplicateKey) {
        this.errorMessage = 'Ya existe un parametro con esa clave referencia.'; // Establece el mensaje de error
        return; // No cierra el diálogo, permite al usuario corregir
      }

      // Si no es duplicado, cierra el diálogo y devuelve el nuevo tag
      this.errorMessage = null; // Limpia cualquier mensaje de error anterior
      this.dialogRef.close(this.parameter);
    }
    
  }

  public isSchemaObject(schema: OpenApiSchemaObject | OpenApiReferenceObject | undefined): schema is OpenApiSchemaObject {
  return !!schema && !('$ref' in schema);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
