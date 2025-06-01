// src/app/tags/tags.component.ts

import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Mantener MatSnackBar si lo usas para otras notificaciones

import { OpenapiService } from '../core/services/openapi.service';
import { Subscription } from 'rxjs';
import { AddTagDialogComponent } from './add-tag-dialog.component'; // Importa el componente del diálogo

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss'
})
export class TagsComponent implements OnDestroy {
  tags: Array<{ name: string; description?: string }> = [];
  editTag: { name: string; description?: string } = { name: '', description: '' };
  editIndexMap: { [key: number]: boolean } = {};
  private sub?: Subscription;

  constructor(private openapiService: OpenapiService, private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.sub = this.openapiService.openapi$.subscribe(openapi => {
      this.tags = openapi?.tags ? openapi.tags.map(tag => ({ ...tag })) : [];
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  deleteTag(i: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este tag?')) {
      this.tags = this.tags.filter((_, idx) => idx !== i);
      this.saveTags();
      this.snackBar.open('Tag eliminado', 'Cerrar', { duration: 3000 });
    }
  }

  startEdit(i: number) {
    this.editIndexMap = {};
    this.editIndexMap[i] = true;
    this.editTag = { ...this.tags[i] };
  }

  saveEdit(i: number) {
    if (!this.editTag.name.trim()) {
      this.snackBar.open('El nombre del tag no puede estar vacío.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      return;
    }

    const isDuplicate = this.tags.some((tag, idx) =>
      idx !== i && tag.name.toLowerCase() === this.editTag.name.trim().toLowerCase()
    );

    if (isDuplicate) {
      this.snackBar.open('Ya existe un tag con ese nombre.', 'Cerrar', { duration: 3000, panelClass: ['snackbar-error'] });
      return;
    }

    this.tags = this.tags.map((tag, idx) => idx === i ? { ...this.editTag } : tag);
    this.editIndexMap[i] = false;
    this.editTag = { name: '', description: '' };
    this.saveTags();
    this.snackBar.open('Tag guardado', 'Cerrar', { duration: 3000 });
  }

  cancelEdit(i: number) {
    this.editIndexMap[i] = false;
    this.editTag = { name: '', description: '' };
  }

  saveTags() {
    const openapi = this.openapiService.getOpenapi();
    if (openapi) {
      this.openapiService.setOpenapi({ ...openapi, tags: this.tags });
    }
  }

  openAddTagDialog() {
    const dialogRef = this.dialog.open(AddTagDialogComponent, {
      width: '400px',
      disableClose: true,
      // PASAR LA LISTA DE TAGS EXISTENTES AL DIÁLOGO
      data: { existingTags: this.tags }
    });

    dialogRef.afterClosed().subscribe((result: { name: string; description?: string } | null) => {
      if (result) {
        // El diálogo ya ha validado que el tag no es duplicado. Solo lo añadimos.
        this.tags = [
          ...this.tags,
          { name: result.name, description: result.description }
        ];
        this.saveTags();
        this.snackBar.open('Tag añadido', 'Cerrar', { duration: 3000 });
      }
      // Si result es null, el usuario canceló o el tag fue duplicado y el diálogo no se cerró.
      // En este caso, no hacemos nada aquí, ya que el diálogo maneja el mensaje de error.
    });
  }
}