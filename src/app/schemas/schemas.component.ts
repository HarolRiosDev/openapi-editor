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

  constructor(private openapiService: OpenapiService) {
    this.sub = this.openapiService.openapi$.subscribe((openapi: any) => {

      this.parameters = openapi?.components?.parameters 
      ? Object.keys(openapi.components.parameters).map(name => ({ name, ...openapi.components.parameters[name] })) 
      : [];

      this.schemas = openapi?.components?.schemas 
      ? Object.keys(openapi.components.schemas).map(name => ({ name, ...openapi.components.schemas[name] })) 
      : [];

      this.responses = openapi?.components?.responses 
      ? Object.keys(openapi.components.responses).map(name => ({ name, ...openapi.components.responses[name] })) 
      : [];

      this.requestBodies = openapi?.components?.requestBodies 
      ? Object.keys(openapi.components.requestBodies).map(name => ({ name, ...openapi.components.requestBodies[name] })) 
      : [];

      this.securitySchemes = openapi?.components?.securitySchemes 
      ? Object.keys(openapi.components.securitySchemes).map(name => ({ name, ...openapi.components.securitySchemes[name] })) 
      : [];
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }


  onAddParameter() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditParameter(param: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteParameter(param: any) {
    // Confirmación y eliminación del parámetro
  }


  onAddSchema() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditSchema(param: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteSchema(param: any) {
    // Confirmación y eliminación del parámetro
  }


  onAddSecuritySchema() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditSecuritySchema(param: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteSecuritySchema(param: any) {
    // Confirmación y eliminación del parámetro
  }


  onAddResponse() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditResponse(param: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteResponse(param: any) {
    // Confirmación y eliminación del parámetro
  }


  onAddResquestBody() {
    // Lógica para añadir un nuevo parámetro (mostrar modal, etc.)
  }

  onEditResquestBody(param: any) {
    // Lógica para editar el parámetro (abrir diálogo, etc.)
  }

  onDeleteResquestBody(param: any) {
    // Confirmación y eliminación del parámetro
  }

}
