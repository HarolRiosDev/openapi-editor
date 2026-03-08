import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';



@Component({
  selector: 'app-edit-schema-dialog',
  templateUrl: './edit-schema-dialog.component.html',
  styleUrl: './edit-schema-dialog.component.scss',
  standalone: true,
  imports: [
     CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule
  ],
})
export class EditSchemaDialogComponent implements OnInit {
  schemaName: string = '';
  schema: any = {
    type: 'object',
    description: '',
    properties: {}
  };
  propertyNames: string[] = [];
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditSchemaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.schemaName) {
      this.schemaName = data.schemaName;
    }
    if (data && data.schema) {
      this.schema = JSON.parse(JSON.stringify(data.schema)); // Deep copy
    }
  }

  ngOnInit() {
    if (this.schema.type === 'object' && this.schema.properties) {
      this.propertyNames = Object.keys(this.schema.properties);
    }
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  addProperty() {
    const newProp = this.generateUniquePropertyName();
    this.schema.properties[newProp] = { type: 'string' };
    this.propertyNames.push(newProp);
  }

  removeProperty(propName: string) {
    delete this.schema.properties[propName];
    this.propertyNames = this.propertyNames.filter(p => p !== propName);
  }

  generateUniquePropertyName(): string {
    let base = 'prop';
    let i = 1;
    while (this.schema.properties[`${base}${i}`]) {
      i++;
    }
    return `${base}${i}`;
  }

  save(form: any) {
    if (!this.schemaName.trim()) {
      this.errorMessage = 'El nombre del esquema es obligatorio.';
      return;
    }
    if (this.schema.type === 'object' && (!this.schema.properties || Object.keys(this.schema.properties).length === 0)) {
      this.errorMessage = 'El objeto debe tener al menos una propiedad.';
      return;
    }
    this.errorMessage = null;
    this.dialogRef.close({
      schemaName: this.schemaName,
      schema: this.schema
    });
  }
}