import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OpenapiService } from '../core/services/openapi.service';
import { Subscription } from 'rxjs';
import { AddTagDialogComponent } from './add-tag-dialog.component';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatListModule, AddTagDialogComponent, MatTooltipModule],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss'
})
export class TagsComponent implements OnDestroy {
  tags: Array<{ name: string; description?: string }> = [];
  newTag = { name: '', description: '' };
  editTag: { name: string; description?: string } = { name: '', description: '' };
  editIndexMap: { [key: number]: boolean } = {};
  private sub?: Subscription;
  showAddTagDialog = false;

  constructor(private openapiService: OpenapiService) {
    this.sub = this.openapiService.openapi$.subscribe(openapi => {
      this.tags = openapi?.tags ? openapi.tags.map(tag => ({ ...tag })) : [];
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  addTag() {
    if (this.newTag.name.trim()) {
      this.tags = [
        ...this.tags,
        { name: this.newTag.name.trim(), description: this.newTag.description }
      ];
      this.newTag = { name: '', description: '' };
      this.saveTags();
    }
  }

  deleteTag(i: number) {
    this.tags = this.tags.filter((_, idx) => idx !== i);
    this.saveTags();
  }

  startEdit(i: number) {
    this.editIndexMap[i] = true;
    this.editTag = { ...this.tags[i] };
  }

  saveEdit(i: number) {
    this.tags = this.tags.map((tag, idx) => idx === i ? { ...this.editTag } : tag);
    this.editIndexMap[i] = false;
    this.editTag = { name: '', description: '' };
    this.saveTags();
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
    this.showAddTagDialog = true;
  }

  addTagFromDialog(tag: { name: string; description?: string }) {
    this.tags = [
      ...this.tags,
      { name: tag.name.trim(), description: tag.description }
    ];
    this.saveTags();
    this.showAddTagDialog = false;
  }
}
