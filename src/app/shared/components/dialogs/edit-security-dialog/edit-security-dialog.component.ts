import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { OpenApiSecuritySchemeObject } from '../../../../core/models/openapi.model';

@Component({
  selector: 'app-edit-security-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './edit-security-dialog.component.html',
  styleUrl: './edit-security-dialog.component.scss'
})
export class EditSecurityDialogComponent implements OnInit {
  schemeName: string = '';
  scheme: OpenApiSecuritySchemeObject = { type: 'http', scheme: 'bearer' };
  errorMessage: string | null = null;

  securityTypes = ['http', 'apiKey', 'oauth2', 'openIdConnect'];
  httpSchemes = ['basic', 'bearer', 'digest', 'hoba', 'mutual', 'vapid', 'custom'];
  apiKeyLocations = ['query', 'header', 'cookie'];
  oauthFlows = ['implicit', 'password', 'clientCredentials', 'authorizationCode'];

  constructor(
    public dialogRef: MatDialogRef<EditSecurityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      schemeName?: string,
      scheme?: OpenApiSecuritySchemeObject,
      isEdit: boolean
    }
  ) {
    if (data.schemeName) {
      this.schemeName = data.schemeName;
    }
    if (data.scheme) {
      this.scheme = { ...data.scheme };
      if (this.scheme.flows) {
        this.scheme.flows = { ...data.scheme.flows };
      }
    }
  }

  ngOnInit() {
    // Inicializar valores por defecto si es necesario
    if (!this.scheme.type) {
      this.scheme.type = 'http';
      this.scheme.scheme = 'bearer';
    }
  }

  save(form: NgForm): void {
    const name = this.schemeName.trim();
    if (!name) {
      this.errorMessage = 'El nombre del esquema de seguridad es obligatorio.';
      return;
    }
    if (!this.scheme.type) {
      this.errorMessage = 'El tipo de esquema es obligatorio.';
      return;
    }

    // Validaciones por tipo
    if (this.scheme.type === 'http' && !this.scheme.scheme) {
      this.errorMessage = 'El esquema HTTP es obligatorio.';
      return;
    }
    if (this.scheme.type === 'apiKey' && (!this.scheme.name || !this.scheme.in)) {
      this.errorMessage = 'El nombre y la ubicación de la API Key son obligatorios.';
      return;
    }

    this.errorMessage = null;
    this.dialogRef.close({
      schemeName: name,
      scheme: this.scheme
    });
  }

  onTypeChange() {
    // Limpiar campos no relevantes
    if (this.scheme.type === 'http') {
      this.scheme.name = undefined;
      this.scheme.in = undefined;
      this.scheme.openIdConnectUrl = undefined;
      this.scheme.flows = undefined;
      if (!this.scheme.scheme) {
        this.scheme.scheme = 'bearer';
      }
    } else if (this.scheme.type === 'apiKey') {
      this.scheme.scheme = undefined;
      this.scheme.bearerFormat = undefined;
      this.scheme.openIdConnectUrl = undefined;
      this.scheme.flows = undefined;
      if (!this.scheme.name) {
        this.scheme.name = 'api_key';
      }
      if (!this.scheme.in) {
        this.scheme.in = 'header';
      }
    } else if (this.scheme.type === 'oauth2') {
      this.scheme.scheme = undefined;
      this.scheme.bearerFormat = undefined;
      this.scheme.name = undefined;
      this.scheme.in = undefined;
      this.scheme.openIdConnectUrl = undefined;
      if (!this.scheme.flows) {
        this.scheme.flows = {};
      }
    } else if (this.scheme.type === 'openIdConnect') {
      this.scheme.scheme = undefined;
      this.scheme.bearerFormat = undefined;
      this.scheme.name = undefined;
      this.scheme.in = undefined;
      this.scheme.flows = undefined;
      if (!this.scheme.openIdConnectUrl) {
        this.scheme.openIdConnectUrl = '';
      }
    }
  }

  addOAuthFlow(flowType: string) {
    if (!this.scheme.flows) {
      this.scheme.flows = {} as any;
    }
    const flows = this.scheme.flows as Record<string, any>;
    if (!flows[flowType]) {
      flows[flowType] = { scopes: {} };
    }
  }

  removeOAuthFlow(flowType: string) {
    if (this.scheme.flows) {
      const flows = this.scheme.flows as Record<string, any>;
      delete flows[flowType];
    }
  }

  getFlowKeys(): string[] {
    return this.scheme.flows ? Object.keys(this.scheme.flows as Record<string, any>) : [];
  }

  getFlowValue(flowType: string, key: string): any {
    if (!this.scheme.flows) return undefined;
    const flows = this.scheme.flows as Record<string, any>;
    return flows[flowType]?.[key];
  }

  setFlowValue(flowType: string, key: string, value: any) {
    if (!this.scheme.flows) {
      this.scheme.flows = {} as any;
    }
    const flows = this.scheme.flows as Record<string, any>;
    if (!flows[flowType]) {
      flows[flowType] = {};
    }
    flows[flowType][key] = value;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
