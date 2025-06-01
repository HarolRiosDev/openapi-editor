// src/app/tags/add-tag-dialog.component.ts

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule para *ngIf

// Define la interfaz para los tags que se pasarán al diálogo
interface TagData {
  name: string;
  description?: string;
}

@Component({
  selector: 'app-add-tag-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    CommonModule // Necesario para *ngIf en el template para mostrar el mensaje de error
  ],
  template: `
    <h3 mat-dialog-title>Añadir Tag</h3>
    <mat-dialog-content>
      <form #addTagForm="ngForm" (ngSubmit)="addTag(addTagForm)">
        <mat-form-field appearance="outline" class="tag-field">
          <mat-label>Nombre</mat-label>
          <input matInput [(ngModel)]="tag.name" name="name" placeholder="Nombre" required />
        </mat-form-field>
        <mat-form-field appearance="outline" class="tag-field">
          <mat-label>Descripción</mat-label>
          <input matInput [(ngModel)]="tag.description" name="description" placeholder="Descripción" />
        </mat-form-field>

        <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" (click)="addTag(addTagForm)" [disabled]="!addTagForm.valid">Añadir</button>
      <button mat-button type="button" (click)="cancel()">Cancelar</button>
    </mat-dialog-actions>
  `,
  styleUrl: './add-tag-dialog.component.scss'
})
export class AddTagDialogComponent {
  tag = { name: '', description: '' };
  errorMessage: string | null = null; // Variable para el mensaje de error

  constructor(
    public dialogRef: MatDialogRef<AddTagDialogComponent>,
    // Inyectamos MAT_DIALOG_DATA para recibir los tags existentes
    @Inject(MAT_DIALOG_DATA) public data: { existingTags: TagData[] } // Asegúrate de que TagData[] coincida con tu tipo de tag
  ) {}

  addTag(form: NgForm) {
    if (form.valid && this.tag.name.trim()) {
      const newTagName = this.tag.name.trim();

      // Validar si el nuevo tag ya existe en la lista de tags existentes
      const isDuplicate = this.data.existingTags.some(
        (existingTag: TagData) => existingTag.name.toLowerCase() === newTagName.toLowerCase()
      );

      if (isDuplicate) {
        this.errorMessage = 'Ya existe un tag con ese nombre.'; // Establece el mensaje de error
        return; // No cierra el diálogo, permite al usuario corregir
      }

      // Si no es duplicado, cierra el diálogo y devuelve el nuevo tag
      this.errorMessage = null; // Limpia cualquier mensaje de error anterior
      this.dialogRef.close({ name: newTagName, description: this.tag.description });
    }
  }

  cancel() {
    this.dialogRef.close(null); // Cierra el diálogo sin devolver datos (cancelación)
  }
}