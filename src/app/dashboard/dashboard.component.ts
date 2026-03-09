import { Component, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenapiService } from '../core/services/openapi.service';
import { OpenApiInfo, OpenApiServerObject, OpenApiSecuritySchemeObject } from '../core/models/openapi.model';
import { Subscription } from 'rxjs';
import * as yaml from 'js-yaml';
import { RouterModule } from '@angular/router';
import { EditServerDialogComponent } from '../shared/components/dialogs/edit-server-dialog/edit-server-dialog.component';
import { EditSecurityDialogComponent } from '../shared/components/dialogs/edit-security-dialog/edit-security-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatSelectModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true
})
export class DashboardComponent implements OnDestroy {
  editInfo = false;
  info: OpenApiInfo = {
    title: '',
    description: '',
    contact: { email: '' },
    license: { name: '', url: '' },
    version: ''
  };

  licenseOptions = [
    { name: 'Apache 2.0', url: 'http://www.apache.org/licenses/LICENSE-2.0.html' },
    { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    { name: 'GPL 3.0', url: 'https://www.gnu.org/licenses/gpl-3.0.html' },
    { name: 'BSD 3-Clause', url: 'https://opensource.org/licenses/BSD-3-Clause' },
    { name: 'Mozilla Public License 2.0', url: 'https://www.mozilla.org/en-US/MPL/2.0/' },
    { name: 'Sin licencia', url: '' }
  ];

  endpointsCount = 0;
  tagsCount = 0;
  serversCount = 0;
  componentsCount = 0;
  securitySchemesCount = 0;
  servers: OpenApiServerObject[] = [];
  securitySchemes: { [key: string]: OpenApiSecuritySchemeObject } = {};

  private sub?: Subscription;

  private updateCounts(openapi: any) {
    this.endpointsCount = openapi?.paths ? Object.keys(openapi.paths).length : 0;
    this.tagsCount = openapi?.tags ? openapi.tags.length : 0;
    this.serversCount = openapi?.servers ? openapi.servers.length : 0;
    this.componentsCount = openapi?.components?.schemas ? Object.keys(openapi.components.schemas).length : 0;
    this.securitySchemesCount = openapi?.components?.securitySchemes ? Object.keys(openapi.components.securitySchemes).length : 0;
    this.servers = openapi?.servers || [];
    this.securitySchemes = openapi?.components?.securitySchemes || {};
  }

  constructor(private openapiService: OpenapiService, private dialog: MatDialog, private snackBar: MatSnackBar) {
    // Inicializa info solo si hay un modelo cargado
    const openapi = this.openapiService.getOpenapi();
    if (openapi && openapi.info) {
      this.info = {
        title: openapi.info.title || '',
        description: openapi.info.description || '',
        contact: openapi.info.contact || { email: '' },
        license: openapi.info.license || { name: '', url: '' },
        version: openapi.info.version || ''
      };
      this.updateCounts(openapi);
    }
    this.sub = this.openapiService.openapi$.subscribe(openapi => {
      if (openapi && openapi.info) {
        this.info = {
          title: openapi.info.title || '',
          description: openapi.info.description || '',
          contact: openapi.info.contact || { email: '' },
          license: openapi.info.license || { name: '', url: '' },
          version: openapi.info.version || ''
        };
        this.updateCounts(openapi);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  saveInfo() {
    // Actualiza el modelo global con los nuevos datos de info
    const openapi = this.openapiService.getOpenapi();
    if (openapi) {
      this.openapiService.setOpenapi({ ...openapi, info: { ...this.info } });
    }
    this.editInfo = false;
  }

  editInfoMode() {
    this.editInfo = true;
  }


  onLicenseChange(event: MatSelectChange) {
    const licenseName = event.value;
    const found = this.licenseOptions.find(opt => opt.name === licenseName);
    if (found) {
      this.info.license = { name: found.name, url: found.url };
    } else {
      this.info.license = { name: licenseName, url: '' };
    }
  }

  editServer(index: number) {
    const dialogRef = this.dialog.open(EditServerDialogComponent, {
      width: '500px',
      data: {
        server: this.servers[index],
        isEdit: true
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.servers[index] = result;
        this.updateServersInOpenapi();
        this.snackBar.open('Servidor actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  addServer() {
    const dialogRef = this.dialog.open(EditServerDialogComponent, {
      width: '500px',
      data: {
        isEdit: false
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.servers.push(result);
        this.updateServersInOpenapi();
        this.snackBar.open('Servidor agregado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  deleteServer(index: number) {
    this.servers.splice(index, 1);
    this.updateServersInOpenapi();
    this.snackBar.open('Servidor eliminado', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
  }

  private updateServersInOpenapi() {
    const openapi = this.openapiService.getOpenapi();
    if (openapi) {
      this.openapiService.setOpenapi({ ...openapi, servers: this.servers });
    }
  }

  editSecurityScheme(schemeName: string) {
    const dialogRef = this.dialog.open(EditSecurityDialogComponent, {
      width: '500px',
      data: {
        schemeName: schemeName,
        scheme: this.securitySchemes[schemeName],
        isEdit: true
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Eliminar el anterior si cambió de nombre
        if (result.schemeName !== schemeName) {
          delete this.securitySchemes[schemeName];
        }
        this.securitySchemes[result.schemeName] = result.scheme;
        this.updateSecuritySchemesInOpenapi();
        this.snackBar.open('Esquema de seguridad actualizado', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  addSecurityScheme() {
    const dialogRef = this.dialog.open(EditSecurityDialogComponent, {
      width: '500px',
      data: {
        isEdit: false
      },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.securitySchemes[result.schemeName] = result.scheme;
        this.updateSecuritySchemesInOpenapi();
        this.snackBar.open('Esquema de seguridad agregado', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
      }
    });
  }

  deleteSecurityScheme(schemeName: string) {
    delete this.securitySchemes[schemeName];
    this.updateSecuritySchemesInOpenapi();
    this.snackBar.open('Esquema de seguridad eliminado', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
  }

  private updateSecuritySchemesInOpenapi() {
    const openapi = this.openapiService.getOpenapi();
    if (openapi) {
      if (!openapi.components) {
        openapi.components = {};
      }
      openapi.components.securitySchemes = Object.keys(this.securitySchemes).length > 0 ? this.securitySchemes : undefined;
      this.openapiService.setOpenapi(openapi);
    }
  }

  getSecuritySchemeKeys(): string[] {
    return Object.keys(this.securitySchemes);
  }

}
