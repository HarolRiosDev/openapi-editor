import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-tag-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  template: `
    <div class="add-tag-dialog-backdrop">
      <div class="add-tag-dialog">
        <h3>Añadir Tag</h3>
        <form (ngSubmit)="addTag()">
          <mat-form-field appearance="outline" class="tag-field">
            <input matInput [(ngModel)]="tag.name" name="name" placeholder="Nombre" required />
          </mat-form-field>
          <mat-form-field appearance="outline" class="tag-field">
            <input matInput [(ngModel)]="tag.description" name="description" placeholder="Descripción" />
          </mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit">Añadir</button>
            <button mat-button type="button" (click)="close()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './add-tag-dialog.component.scss'
})
export class AddTagDialogComponent {
  @Output() tagAdded = new EventEmitter<{ name: string; description?: string }>();
  @Output() closed = new EventEmitter<void>();
  tag = { name: '', description: '' };

  addTag() {
    if (this.tag.name.trim()) {
      this.tagAdded.emit({ name: this.tag.name.trim(), description: this.tag.description });
      this.close();
    }
  }

  close() {
    this.closed.emit();
  }
}
