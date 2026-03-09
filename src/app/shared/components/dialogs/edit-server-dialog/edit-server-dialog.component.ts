import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { OpenApiServerObject } from '../../../../core/models/openapi.model';

@Component({
  selector: 'app-edit-server-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './edit-server-dialog.component.html',
  styleUrl: './edit-server-dialog.component.scss'
})
export class EditServerDialogComponent implements OnInit {
  server: OpenApiServerObject = { url: '' };
  variableNames: string[] = [];
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditServerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      server?: OpenApiServerObject,
      isEdit: boolean
    }
  ) {
    if (data.server) {
      this.server = { ...data.server };
      if (this.server.variables) {
        this.variableNames = Object.keys(this.server.variables);
      }
    } else {
      this.server = { url: '', variables: {} };
    }
  }

  ngOnInit() {
    if (!this.server.variables) {
      this.server.variables = {};
    }
  }

  save(form: NgForm): void {
    if (form.valid && this.server.url.trim()) {
      this.server.url = this.server.url.trim();
      this.errorMessage = null;
      this.dialogRef.close(this.server);
    } else {
      this.errorMessage = 'La URL del servidor es obligatoria.';
    }
  }

  addVariable() {
    const varName = `variable${this.variableNames.length + 1}`;
    this.server.variables![varName] = { default: '' };
    this.variableNames.push(varName);
  }

  removeVariable(varName: string) {
    delete this.server.variables![varName];
    this.variableNames = this.variableNames.filter(v => v !== varName);
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
