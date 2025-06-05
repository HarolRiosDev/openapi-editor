import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenapiService } from '../core/services/openapi.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OpenApiParameterObject, OpenApiReferenceObject } from '../core/models/openapi.model';
import { OpenApiSchemaObject } from '../core/models/openapi.model';
import { OpenApiResponseObject } from '../core/models/openapi.model';
import { OpenApiRequestBodyObject } from '../core/models/openapi.model';
import { EditParameterDialogComponent } from './dialogs/edit-parameter-dialog/edit-parameter-dialog.component';
import { EditSchemaDialogComponent } from './dialogs/edit-schema-dialog/edit-schema-dialog.component';
import { EditSecurityDialogComponent } from './dialogs/edit-security-dialog/edit-security-dialog.component';
import { EditResponseDialogComponent } from './dialogs/edit-response-dialog/edit-response-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-schemas',
  imports: [
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
  templateUrl: './schemas.component.html',
  styleUrl: './schemas.component.scss'
})
export class SchemasComponent implements OnDestroy {
  parameters: any[] = [];
  schemas: any[] = [];
  responses: any[] = [];
  requestBodies: any[] = [];
  securitySchemes: any[] = [];
  private sub?: Subscription;

  constructor(private openapiService: OpenapiService, private dialog: MatDialog) {
    this.sub = this.openapiService.openapi$.subscribe((openapi: any) => {
      const paramsObj = openapi?.components?.parameters || {};
       this.parameters = Object.entries(paramsObj).map(([key, value]) => ({
        key, ...(value as Record<string, OpenApiParameterObject | OpenApiReferenceObject>)
      }));

      const schemasObj = openapi?.components?.schemas || {};
      this.schemas = Object.entries(schemasObj).map(([key, value]) => ({
        key, ...(value as Record<string, OpenApiSchemaObject | OpenApiReferenceObject>)
      }));

      const responsesObj = openapi?.components?.responses || {};
      this.responses = Object.entries(responsesObj).map(([key, value]) => ({
        key, ...(value as Record<string, OpenApiResponseObject | OpenApiReferenceObject>)
      }));

      const requestBodiesObj = openapi?.components?.requestBodies || {};
      this.requestBodies = Object.entries(requestBodiesObj).map(([key, value]) => ({
        key, ...(value as Record<string, OpenApiRequestBodyObject | OpenApiReferenceObject>)
      }));

      const securitySchemesObj = openapi?.components?.securitySchemes || {};
      this.securitySchemes = Object.entries(securitySchemesObj).map(([key, value]) => ({
        key, ...(value as Record<string, any>)
      }));
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }


  onAddParameter() {
    const openapi = this.openapiService.getOpenapi();
    const dialogRef = this.dialog.open(EditParameterDialogComponent, {
    width: '500px',
    data: { parameter: {},existingParameter: this.parameters,isEdit: false, } // Nuevo parámetro vacío
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Agrega al OpenAPI
       // this.openapiService.setOpenapi({ ...openapi, components.parameters: this.parameters});   
      }
    });
  }

  onEditParameter(param:any, key: any) {
    console.log('onEditParameter', key);
    const openapi = this.openapiService.getOpenapi();
    const dialogRef = this.dialog.open(EditParameterDialogComponent, {
    width: '500px',
    data: { key: key, parameter: param ,existingParameter: this.parameters,isEdit: true, } // Nuevo parámetro vacío
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Agrega al OpenAPI
       // this.openapiService.setOpenapi({ ...openapi, components.parameters: this.parameters});   
      }
    });
  }

  onDeleteParameter(key: any) {
   const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.parameters?.[key]) {
      delete openapi.components.parameters[key];
      this.openapiService.setOpenapi(openapi);
    }
  }


  onAddSchema() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditSchema(key: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteSchema(key: any) {
    const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.schemas?.[key]) {
      delete openapi.components.schemas[key];
      this.openapiService.setOpenapi(openapi);
    }
  }


  onAddSecuritySchema() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditSecuritySchema(key: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteSecuritySchema(key: any) {
   const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.securitySchemes?.[key]) {
      delete openapi.components.securitySchemes[key];
      this.openapiService.setOpenapi(openapi);
    }
  }


  onAddResponse() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditResponse(key: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteResponse(key: any) {
    const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.responses?.[key]) {
      delete openapi.components.responses[key];
      this.openapiService.setOpenapi(openapi);
    }
  }


  onAddResquestBody() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditResquestBody(key: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteResquestBody(key: any) {
    const openapi = this.openapiService.getOpenapi();
    if (openapi?.components?.requestBodies?.[key]) {
      delete openapi.components.requestBodies[key];
      this.openapiService.setOpenapi(openapi);
    }
  }

}
