import { Component, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import * as yaml from 'js-yaml';
import { Openapi } from './core/models/openapi.model';
import { OpenapiService } from './core/services/openapi.service';
import { ConfirmDialogComponent } from './shared/components/modal/confirm-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, MatToolbarModule, MatIconModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'openapi-editor';
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(private openapiService: OpenapiService, private snackBar: MatSnackBar, private dialog: MatDialog) {}

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
      // Limpia el input file tras importar
      input.value = '';
      if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
    };
    reader.readAsText(file);
  }

  async nuevaApi() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      disableClose: true
    });
    const confirmed = await dialogRef.afterClosed().toPromise();
    if (confirmed) {
      this.openapiService.setOpenapi({
        info: {
          title: '',
          description: '',
          contact: { email: '' },
          license: { name: '', url: '' },
          version: ''
        },
        paths: {},
        tags: [],
        servers: [],
        components: { schemas: {}, responses: {}, parameters: {}, requestBodies: {} }
      });
      this.snackBar.open('Nueva API iniciada. Los datos anteriores han sido borrados.', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      // Limpia el input file tras resetear
      if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
    }
  }
}
