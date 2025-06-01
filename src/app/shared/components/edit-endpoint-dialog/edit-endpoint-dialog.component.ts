import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms'; // Importa Validators
import { OpenApiOperationObject, Openapi, OpenApiSchemaObject, OpenApiRequestBodyObject, OpenApiResponseObject, OpenApiPathItemObject } from '../../../../app/core/models/openapi.model';
import { OpenapiService } from '../../../../app/core/services/openapi.service';
import { Observable, of } from 'rxjs';
import { startWith, map } from 'rxjs/operators';


// Lista de códigos de estado HTTP comunes
const HTTP_STATUS_CODES = [
  { code: '100', description: 'Continue' }, { code: '101', description: 'Switching Protocols' },
  { code: '200', description: 'OK' }, { code: '201', description: 'Created' },
  { code: '202', description: 'Accepted' }, { code: '204', description: 'No Content' },
  { code: '300', description: 'Multiple Choices' }, { code: '301', description: 'Moved Permanently' },
  { code: '302', description: 'Found' }, { code: '304', description: 'Not Modified' },
  { code: '400', description: 'Bad Request' }, { code: '401', description: 'Unauthorized' },
  { code: '403', description: 'Forbidden' }, { code: '404', description: 'Not Found' },
  { code: '405', description: 'Method Not Allowed' }, { code: '409', description: 'Conflict' },
  { code: '415', description: 'Unsupported Media Type' },
  { code: '422', description: 'Unprocessable Content' }, { code: '429', description: 'Too Many Requests' },
  { code: '500', description: 'Internal Server Error' }, { code: '501', description: 'Not Implemented' },
  { code: '502', description: 'Bad Gateway' }, { code: '503', description: 'Service Unavailable' },
  { code: '504', description: 'Gateway Timeout' },
];

export interface EndpointDisplayItem {
  path: string;
  method: string;
  details: OpenApiOperationObject & {
    requestBodyRef?: string;
    responsesArray?: { statusCode: string; ref?: string }[];
  };
}

@Component({
  selector: 'app-edit-endpoint-dialog',
  templateUrl: './edit-endpoint-dialog.component.html',
  styleUrl: './edit-endpoint-dialog.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatDividerModule,
    MatCardModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatTooltipModule,
    ReactiveFormsModule,
  ],
})
export class EditEndpointDialogComponent implements OnInit {
  editingEndpoint: EndpointDisplayItem;
  filteredStatusCodes: { code: string; description: string }[] = HTTP_STATUS_CODES;
  private openapiSpec: Openapi | null = null;

  allSchemaNames: string[] = [];
  allRequestBodyNames: string[] = [];
  allResponseNames: string[] = [];
  allExistingTags: string[] = [];

  filteredRequestBodyRefOptions: Observable<string[]> = of([]);

  // Inicializa el FormControl sin el validador `required` al principio
  requestBodyRefControl = new FormControl('');
  tagInputControl = new FormControl('');
  filteredTagOptions: Observable<string[]> = of([]);

  @ViewChild('editEndpointForm') editEndpointForm!: NgForm; // Acceso al formulario

  constructor(
    public dialogRef: MatDialogRef<EditEndpointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EndpointDisplayItem,
    private openapiService: OpenapiService
  ) {
    this.editingEndpoint = JSON.parse(JSON.stringify(data)); // Copia profunda para no modificar el objeto original
  }

  ngOnInit(): void {
    this.openapiService.openapi$.subscribe(spec => {
      this.openapiSpec = spec;
      this.loadComponentNames();
      this.loadExistingTags();
      this.setupAutocompleteFilters();

      // **Añade la validación condicional aquí**
      this.updateRequestBodyRefValidation();

      setTimeout(() => {
        if (this.editEndpointForm) {
          this.editEndpointForm.form.updateValueAndValidity();
          console.log('Initial Form State after setTimeout:', this.editEndpointForm.form.valid);

          if (this.editEndpointForm.form.invalid) {
             console.log('Initial Form is INVALID. Checking individual controls...');
             Object.keys(this.editEndpointForm.form.controls).forEach(key => {
               const control = this.editEndpointForm.form.controls[key];
               if (control.invalid) {
                 console.log(`  Control '${key}' is INVALID on init.`);
                 console.log(`    Value:`, control.value);
                 console.log(`    Errors:`, control.errors);
               }
             });
          }
        }
      });
    });

    if (!this.editingEndpoint.details.tags) {
      this.editingEndpoint.details.tags = [];
    }

    if (!this.editingEndpoint.details.responsesArray) {
      this.editingEndpoint.details.responsesArray = [];
      if (this.editingEndpoint.details.responses) {
        for (const statusCode in this.editingEndpoint.details.responses) {
          const response = this.editingEndpoint.details.responses[statusCode];

          if (response && typeof response === 'object') {
            if ('description' in response) {
              this.editingEndpoint.details.responsesArray.push({
                statusCode: statusCode || '',
                ref: (response.content?.['application/json']?.schema?.$ref || (response as { $ref?: string }).$ref || '')
              });
            } else if ('$ref' in response) {
              const refPath: string = response.$ref;
              this.editingEndpoint.details.responsesArray.push({
                statusCode: statusCode || '',
                ref: refPath || ''
              });
            }
          }
        }
      }
    }

    this.requestBodyRefControl.setValue(this.editingEndpoint.details.requestBodyRef || '');
  }

  // Nuevo método para actualizar la validación del Request Body
  updateRequestBodyRefValidation(): void {
    // Si el método NO es 'get' o 'head', el Request Body es necesario
    if (this.editingEndpoint.method !== 'get' && this.editingEndpoint.method !== 'head' ) {
      this.requestBodyRefControl.setValidators(Validators.required);
    } else {
      // Si el método ES 'get' o 'head', el Request Body no es necesario
      this.requestBodyRefControl.clearValidators();
    }
    // Siempre actualiza el estado de validez del control después de cambiar sus validadores
    this.requestBodyRefControl.updateValueAndValidity();
  }

  // Asegúrate de llamar a `updateRequestBodyRefValidation()` cada vez que el método cambie
  // Esto se hará implícitamente porque `editingEndpoint.method` está enlazado con `ngModel`
  // y `ngModel` provoca un ciclo de detección de cambios que reevaluará las propiedades.
  // Sin embargo, para mayor seguridad, podemos añadir un evento `(change)` al `mat-select`
  // o un `valueChanges` subscription si estuviéramos usando Reactive Forms para `editingEndpoint.method`.
  // Por ahora, el `setTimeout` inicial y la reevaluación del formulario en `save` deberían ser suficientes,
  // dado que `updateRequestBodyRefValidation` se llama en `ngOnInit`.

  private loadComponentNames(): void {
    this.allSchemaNames = [];
    if (this.openapiSpec?.components?.schemas) {
      this.allSchemaNames = Object.keys(this.openapiSpec.components.schemas);
    }

    this.allRequestBodyNames = [];
    if (this.openapiSpec?.components?.requestBodies) {
      this.allRequestBodyNames = Object.keys(this.openapiSpec.components.requestBodies);
    }

    this.allResponseNames = [];
    if (this.openapiSpec?.components?.responses) {
      this.allResponseNames = Object.keys(this.openapiSpec.components.responses);
    }
  }

  private loadExistingTags(): void {
    const uniqueTags = new Set<string>();

    if (this.openapiSpec?.tags) {
      this.openapiSpec.tags.forEach(tag => uniqueTags.add(tag.name));
    }

    if (this.openapiSpec?.paths) {
      for (const path in this.openapiSpec.paths) {
        const pathItem: OpenApiPathItemObject = this.openapiSpec.paths[path];
        const httpMethods: (keyof OpenApiPathItemObject)[] = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];

        for (const method of httpMethods) {
          const operation: OpenApiOperationObject | undefined = pathItem[method];
          if (operation?.tags) {
            operation.tags.forEach(tag => uniqueTags.add(tag));
          }
        }
      }
    }
    this.allExistingTags = Array.from(uniqueTags).sort();
  }

  private setupAutocompleteFilters(): void {
    this.filteredRequestBodyRefOptions = this.requestBodyRefControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterRequestBodyRefOptions(value || ''))
    );

    this.filteredTagOptions = this.tagInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  private _filterRequestBodyRefOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    const suggestions: string[] = [];

    this.allRequestBodyNames.forEach(name => {
      if (name.toLowerCase().includes(filterValue)) {
        suggestions.push(`#/components/requestBodies/${name}`);
      }
    });

    this.allSchemaNames.forEach(name => {
      if (name.toLowerCase().includes(filterValue)) {
        suggestions.push(`#/components/schemas/${name}`);
      }
    });

    return suggestions;
  }

  _filterResponseRefOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    const suggestions: string[] = [];

    this.allResponseNames.forEach(name => {
      if (name.toLowerCase().includes(filterValue)) {
        suggestions.push(`#/components/responses/${name}`);
      }
    });

    this.allSchemaNames.forEach(name => {
      if (name.toLowerCase().includes(filterValue)) {
        suggestions.push(`#/components/schemas/${name}`);
      }
    });

    return suggestions;
  }

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allExistingTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) &&
      !this.editingEndpoint.details.tags?.includes(tag)
    );
  }

  filterStatusCodes(value: string): void {
    const filterValue = value ? value.toLowerCase() : '';
    this.filteredStatusCodes = HTTP_STATUS_CODES.filter(option =>
      option.code.toLowerCase().includes(filterValue) ||
      option.description.toLowerCase().includes(filterValue)
    );
  }

  addTagFromInput(inputValue: string): void {
    const value = (inputValue || '').trim();
    if (!this.editingEndpoint.details.tags) {
      this.editingEndpoint.details.tags = [];
    }
    if (value && !this.editingEndpoint.details.tags.includes(value)) {
      this.editingEndpoint.details.tags.push(value);
      if (!this.allExistingTags.includes(value)) {
        this.allExistingTags.push(value);
        this.allExistingTags.sort();
      }
    }
    this.tagInputControl.setValue('');
  }

  removeTag(tag: string): void {
    const index = this.editingEndpoint.details.tags?.indexOf(tag) ?? -1;
    if (index >= 0) {
      this.editingEndpoint.details.tags?.splice(index, 1);
    }
  }

  addResponse(): void {
    if (!this.editingEndpoint.details.responsesArray) {
      this.editingEndpoint.details.responsesArray = [];
    }
    this.editingEndpoint.details.responsesArray.push({ statusCode: '', ref: '' });
  }

  removeResponse(index: number): void {
    this.editingEndpoint.details.responsesArray?.splice(index, 1);
  }

  // Método para manejar el cambio de método del endpoint
  onMethodChange(): void {
    this.updateRequestBodyRefValidation();
    // Forzar la revalidación de todo el formulario para que el cambio de validador del Request Body se refleje
    if (this.editEndpointForm) {
      this.editEndpointForm.form.updateValueAndValidity();
    }
  }

  save(form: NgForm): void {
    console.log('--- FORM SAVE ATTEMPT ---');
    console.log('Form valid:', form.valid);
    console.log('Form pristine:', form.pristine);
    console.log('Form touched:', form.touched);

    if (!form.valid) {
      console.log('Form is INVALID. Checking individual controls...');
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control.invalid) {
          console.log(`  Control '${key}' is INVALID.`);
          console.log(`    Value:`, control.value);
          console.log(`    Errors:`, control.errors);
          console.log(`    Touched:`, control.touched);
          console.log(`    Dirty:`, control.dirty);
        }
      });

      const pathControl = form.controls['path'];
      if (pathControl && pathControl.invalid) {
          console.log('Detailed Path Control Info:');
          console.log('  Path Value (String):', String(pathControl.value));
          console.log('  Path Value (Raw):', pathControl.value);
          console.log('  Path TypeOf Value:', typeof pathControl.value);
          console.log('  Path Length:', (pathControl.value ? String(pathControl.value).length : 0));
          console.log('  Path Starts with /:', (pathControl.value ? String(pathControl.value).startsWith('/') : false));
          console.log('  Path Errors (specific):', pathControl.errors);
      }
    }

    if (form.valid) {
      const finalDetails: OpenApiOperationObject = {};

      if (this.editingEndpoint.details.summary) finalDetails.summary = this.editingEndpoint.details.summary;
      if (this.editingEndpoint.details.description) finalDetails.description = this.editingEndpoint.details.description;
      if (this.editingEndpoint.details.operationId) finalDetails.operationId = this.editingEndpoint.details.operationId;

      if (this.editingEndpoint.details.tags && this.editingEndpoint.details.tags.length > 0) {
        finalDetails.tags = this.editingEndpoint.details.tags;
      }

      const requestBodyRefValue = this.requestBodyRefControl.value?.trim();
      if (this.editingEndpoint.method !== 'get' && this.editingEndpoint.method !== 'head' && requestBodyRefValue) {
        finalDetails.requestBody = {
          $ref: requestBodyRefValue
        };
      }

      const responses: OpenApiOperationObject['responses'] = {};
      this.editingEndpoint.details.responsesArray?.forEach((resp) => {
        if (resp.statusCode) {
          let refValue = resp.ref?.trim();

          if (refValue && !refValue.startsWith('#/components/')) {
            if (this.allResponseNames.includes(refValue)) {
              refValue = `#/components/responses/${refValue}`;
            } else if (this.allSchemaNames.includes(refValue)) {
              refValue = `#/components/schemas/${refValue}`;
            }
          }

          const statusCodeDescription = HTTP_STATUS_CODES.find(s => s.code === resp.statusCode)?.description || 'No description provided';

          if (refValue && refValue.startsWith('#/components/responses/')) {
            responses[resp.statusCode] = { '$ref': refValue };
          } else {
            const responseObj: { description: string; content?: { [key: string]: any } } = {
              description: statusCodeDescription
            };
            if (refValue && refValue.trim()) {
              responseObj.content = {
                'application/json': {
                  schema: { '$ref': refValue }
                }
              };
            }
            responses[resp.statusCode] = responseObj;
          }
        }
      });

      if (Object.keys(responses).length > 0) {
        finalDetails.responses = responses;
      }

      if (!finalDetails.summary?.trim()) delete finalDetails.summary;
      if (!finalDetails.description?.trim()) delete finalDetails.description;
      if (!finalDetails.operationId?.trim()) delete finalDetails.operationId;
      if (finalDetails.tags && finalDetails.tags.length === 0) delete finalDetails.tags;
      if (finalDetails.responses && Object.keys(finalDetails.responses).length === 0) delete finalDetails.responses;

      console.log('Final details being saved:', finalDetails);
      this.dialogRef.close({
        path: this.editingEndpoint.path,
        method: this.editingEndpoint.method,
        details: finalDetails
      });
    } else {
      console.log('Form is invalid, cannot save. Please check console for invalid controls.');
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}