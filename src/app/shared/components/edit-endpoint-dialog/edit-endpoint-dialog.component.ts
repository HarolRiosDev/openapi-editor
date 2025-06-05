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
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

import {
  OpenApiOperationObject,
  Openapi,
  OpenApiSchemaObject,
  OpenApiRequestBodyObject, // Puede que no necesites importarla si solo usas el $ref
  OpenApiResponseObject,
  OpenApiPathItemObject,
  OpenApiParameterObject,
  OpenApiReferenceObject,
  EndpointDisplayItem
} from '../../../../app/core/models/openapi.model'; // Asegúrate de que la ruta es correcta
import { OpenapiService } from '../../../../app/core/services/openapi.service'; // Asegúrate de que la ruta es correcta
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
    MatCheckboxModule,
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
  allParameterNames: string[] = []; // Nombres de parámetros globales (ej. 'userId' para #/components/parameters/userId)

  parameterInOptions: string[] = ['path', 'query', 'header', 'cookie'];
  parameterTypeOptions: string[] = ['string', 'number', 'integer', 'boolean', 'array', 'object'];

  filteredRequestBodyRefOptions: Observable<string[]> = of([]);
  requestBodyRefControl = new FormControl(''); // FormControl para el campo de referencia del Request Body
  tagInputControl = new FormControl('');
  filteredTagOptions: Observable<string[]> = of([]);

  @ViewChild('editEndpointForm') editEndpointForm!: NgForm;

  constructor(
    public dialogRef: MatDialogRef<EditEndpointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EndpointDisplayItem,
    private openapiService: OpenapiService
  ) {
    // IMPORTANTE: Hacer una copia profunda de los datos entrantes.
    // Esto asegura que los cambios en el diálogo no afecten el objeto original hasta que se guarde.
    this.editingEndpoint = JSON.parse(JSON.stringify(data));
  }

  ngOnInit(): void {
    // Suscribirse al openapiSpec para tener acceso a los componentes globales
    this.openapiService.openapi$.subscribe(spec => {
      this.openapiSpec = spec;
      this.loadComponentNames(); // Carga nombres de schemas, requestBodies, responses
      this.loadExistingTags();   // Carga tags existentes
      this.loadParameterNames(); // Carga nombres de parámetros globales
      this.setupAutocompleteFilters(); // Configura los autocompletes

      this.updateRequestBodyRefValidation(); // Actualiza la validación del request body según el método HTTP

      // >>>>>>>>>>>>>> INICIO DE CORRECCIONES Y REFINAMIENTOS EN ngOnInit <<<<<<<<<<<<<<<

      // 1. Inicializar requestBodyRefControl:
      // Si el endpoint ya tiene un requestBody que es una referencia, establece el valor del FormControl.
      if (this.editingEndpoint.details.requestBody && this.isReferenceObject(this.editingEndpoint.details.requestBody)) {
        this.requestBodyRefControl.setValue(this.editingEndpoint.details.requestBody.$ref || '');
      } else {
        // Si no tiene requestBody o no es una referencia, el control debe estar vacío.
        this.requestBodyRefControl.setValue('');
      }

      // 2. Inicializar parametersArray para la UI:
      // Aquí es donde se resuelve la referencia a OpenApiParameterObject para el modelo de la UI.
      if (!this.editingEndpoint.details.parametersArray) {
        this.editingEndpoint.details.parametersArray = [];
      }
      if (this.editingEndpoint.details.parameters && this.editingEndpoint.details.parameters.length > 0) {
        this.editingEndpoint.details.parametersArray = this.editingEndpoint.details.parameters
          .map(p => {
            if (this.isReferenceObject(p)) {
              // Si 'p' es una referencia, intenta resolverla a un OpenApiParameterObject completo.
              const resolved = this.resolveParameterReference(p);
              if (resolved) {
                return { ...resolved }; // Devuelve una copia profunda del objeto resuelto.
              }
              return null; // Si no se puede resolver, se filtrará.
            }
            // Si 'p' ya es un OpenApiParameterObject, devuelve una copia profunda.
            return { ...p };
          })
          .filter(p => p !== null) as OpenApiParameterObject[]; // Filtra los nulos y asegura el tipo.
      } else {
        this.editingEndpoint.details.parametersArray = []; // Asegura que sea un array vacío si no hay parámetros.
      }
      // Después de cargar y resolver los existentes, añadir o actualizar los parámetros de ruta.
      this.initializeParameters(); // Este método añade los path parameters si no existen o marca como required.


      // 3. Inicializar responsesArray para la UI:
      // Reconstruye `responsesArray` (el modelo de tu UI) a partir de `details.responses` (el modelo OpenAPI).
      if (!this.editingEndpoint.details.responsesArray) {
        this.editingEndpoint.details.responsesArray = [];
      }
      // Vacia el array antes de reconstruirlo para evitar duplicados si esta parte se ejecuta varias veces.
      this.editingEndpoint.details.responsesArray = [];
      if (this.editingEndpoint.details.responses) {
        for (const statusCode in this.editingEndpoint.details.responses) {
          const response = this.editingEndpoint.details.responses[statusCode];

          if (this.isReferenceObject(response)) {
            // Si la respuesta es una referencia a un objeto Response global
            this.editingEndpoint.details.responsesArray.push({
              statusCode: statusCode || '',
              description: 'Referencia a ' + response.$ref.split('/').pop(), // Descripción para la UI
              ref: response.$ref || '' // Guarda el $ref para la UI
            });
          } else if (response && typeof response === 'object' && 'description' in response) {
            // Si la respuesta es un objeto Response inline
            // Verifica si contiene un esquema referenciado en su 'content'
            const schemaRef = (response.content?.['application/json']?.schema && this.isReferenceObject(response.content['application/json'].schema))
                              ? response.content['application/json'].schema.$ref
                              : undefined;
            this.editingEndpoint.details.responsesArray.push({
              statusCode: statusCode || '',
              description: response.description || 'No description provided',
              ref: schemaRef // Guarda el $ref del esquema si existe, para la UI
            });
          }
        }
      }
      // >>>>>>>>>>>>>> FIN DE CORRECCIONES Y REFINAMIENTOS EN ngOnInit <<<<<<<<<<<<<<<

      // Pequeño timeout para asegurar que el formulario se actualice después de los cambios asíncronos.
      setTimeout(() => {
        if (this.editEndpointForm) {
          this.editEndpointForm.form.updateValueAndValidity();
        }
      });
    });

    // Si no hay tags, inicializar como array vacío.
    if (!this.editingEndpoint.details.tags) {
      this.editingEndpoint.details.tags = [];
    }
  }

  /**
   * Carga los nombres de los parámetros definidos globalmente en `#/components/parameters`.
   */
  private loadParameterNames(): void {
    this.allParameterNames = [];
    if (this.openapiSpec?.components?.parameters) {
      this.allParameterNames = Object.keys(this.openapiSpec.components.parameters);
    }
  }

  /**
   * Inicializa o actualiza `parametersArray` (modelo de la UI)
   * incluyendo los parámetros de ruta obligatorios.
   */
  private initializeParameters(): void {
    if (!this.editingEndpoint.details.parametersArray) {
      this.editingEndpoint.details.parametersArray = [];
    }

    const pathParams = this.extractPathParameters(this.editingEndpoint.path);

    // Añadir parámetros de ruta si no existen ya
    pathParams.forEach(paramName => {
      const existing = this.editingEndpoint.details.parametersArray?.find(p => p.name === paramName && p.in === 'path');
      if (!existing) {
        this.editingEndpoint.details.parametersArray?.push({
          key: '', // Inicializar key como vacío, se puede ajustar según sea necesario
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' } // Default schema para path parameters
        });
      } else {
        // Asegurarse de que los path parameters existentes estén marcados como required
        existing.required = true;
      }
    });

    // Eliminar parámetros de ruta que ya no están en la URL (si los hay)
    // Filtra el array, manteniendo solo los que no son 'path' O los que sí son 'path' pero están en pathParams
    this.editingEndpoint.details.parametersArray = this.editingEndpoint.details.parametersArray?.filter(param =>
      param.in !== 'path' || pathParams.includes(param.name)
    ) || [];


    // Ordenar los parámetros: path primero, luego query, header, cookie, y alfabéticamente por nombre
    this.editingEndpoint.details.parametersArray.sort((a, b) => {
      const inOrder = ['path', 'query', 'header', 'cookie'];
      const inA = inOrder.indexOf(a.in);
      const inB = inOrder.indexOf(b.in);

      if (inA !== inB) {
        return inA - inB; // Ordena por 'in' (path, query, header, cookie)
      }
      return a.name.localeCompare(b.name); // Luego por nombre alfabéticamente
    });
  }

  /**
   * Type guard para verificar si un objeto es una referencia de OpenAPI ($ref).
   */
  public isReferenceObject(obj: any): obj is OpenApiReferenceObject {
    return obj && typeof obj === 'object' && '$ref' in obj;
  }

  /**
   * Type guard para verificar si un objeto es un esquema de OpenAPI (no una referencia).
   */
  public isSchemaObject(obj: any): obj is OpenApiSchemaObject {
      return obj && typeof obj === 'object' && !('$ref' in obj);
  }

  /**
   * Resuelve una referencia a un parámetro global de OpenAPI.
   * @param refObj El objeto de referencia ($ref).
   * @returns El objeto de parámetro resuelto o `undefined` si no se encuentra.
   */
  private resolveParameterReference(refObj: OpenApiReferenceObject): OpenApiParameterObject | undefined {
    if (!this.openapiSpec?.components?.parameters) return undefined;

    const refPath = refObj.$ref;
    const parts = refPath.split('/');
    const name = parts[parts.length - 1]; // Obtiene el nombre del componente (ej. 'userId' de '#/components/parameters/userId')

    const globalParam = this.openapiSpec.components.parameters[name];
    if (globalParam && !this.isReferenceObject(globalParam)) {
      const resolvedParam = globalParam as OpenApiParameterObject;
      // Asegurar que el esquema tiene un tipo si es un SchemaObject y no tiene
      if (!resolvedParam.schema) {
          resolvedParam.schema = { type: 'string' };
      } else if (this.isSchemaObject(resolvedParam.schema) && !resolvedParam.schema.type) {
          resolvedParam.schema.type = 'string';
      }
      return resolvedParam;
    }
    return undefined;
  }

  /**
   * Extrae los nombres de los parámetros de ruta de una cadena de URL.
   * @param path La cadena de la ruta (ej. "/users/{userId}/posts").
   * @returns Un array de nombres de parámetros (ej. ["userId"]).
   */
  public extractPathParameters(path: string): string[] {
    const params: string[] = [];
    const regex = /{([^}]+)}/g; // Busca patrones como {paramName}
    let match;
    while ((match = regex.exec(path)) !== null) {
      params.push(match[1]);
    }
    return params;
  }

  /**
   * Actualiza la validación del `requestBodyRefControl` según el método HTTP.
   * Por ejemplo, los métodos GET/HEAD/DELETE no deben tener request body.
   */
  public updateRequestBodyRefValidation(): void {
    if (this.editingEndpoint.method !== 'get' && this.editingEndpoint.method !== 'head' && this.editingEndpoint.method !== 'delete') {
      this.requestBodyRefControl.setValidators(Validators.required);
    } else {
      this.requestBodyRefControl.clearValidators();
      // Si el método no requiere request body, limpiar su valor para evitar guardarlo.
      this.requestBodyRefControl.setValue('');
    }
    this.requestBodyRefControl.updateValueAndValidity(); // Recalcula el estado de validación
  }

  /**
   * Se llama cuando cambia el método HTTP seleccionado.
   * Llama a `updateRequestBodyRefValidation()` para ajustar la validación.
   */
  public onMethodChange(): void {
    this.updateRequestBodyRefValidation();
    if (this.editEndpointForm) {
      this.editEndpointForm.form.updateValueAndValidity();
    }
  }

  /**
   * Carga los nombres de los componentes (schemas, requestBodies, responses)
   * desde la especificación OpenAPI global para autocompletar.
   */
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

  /**
   * Carga todos los tags existentes de la especificación OpenAPI.
   */
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
          const operation = pathItem[method];
          // Solo procesar operaciones válidas (no null, no array, etc.)
          if (operation && typeof operation === 'object' && !Array.isArray(operation) && ('tags' in operation)) {
              const op = operation as OpenApiOperationObject;
              if (op.tags) {
                op.tags.forEach(tag => uniqueTags.add(tag));
              }
          }
        }
      }
    }
    this.allExistingTags = Array.from(uniqueTags).sort();
  }

  /**
   * Configura los filtros para los autocompletes de Request Body y Tags.
   */
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

  /**
   * Filtra las opciones de autocompletado para Request Body references.
   * Incluye referencias a `#/components/requestBodies/` y `#/components/schemas/`.
   */
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

  /**
   * Filtra las opciones de autocompletado para Response references.
   * Incluye referencias a `#/components/responses/` y `#/components/schemas/`.
   */
  public _filterResponseRefOptions(value: string): string[] {
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

  /**
   * Filtra las opciones de autocompletado para Tags.
   */
  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allExistingTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) &&
      !this.editingEndpoint.details.tags?.includes(tag) // Evitar mostrar tags ya seleccionados
    );
  }

  /**
   * Filtra la lista de códigos de estado HTTP para el autocompletado.
   */
  public filterStatusCodes(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value;
    const filterValue = value ? value.toLowerCase() : '';
    this.filteredStatusCodes = HTTP_STATUS_CODES.filter(option =>
      option.code.toLowerCase().includes(filterValue) ||
      option.description.toLowerCase().includes(filterValue)
    );
  }

  /**
   * Añade un tag seleccionado del autocompletado al endpoint.
   */
  public addTagFromInput(event: MatAutocompleteSelectedEvent): void {
    const value = (event.option.value || '').trim();
    if (!this.editingEndpoint.details.tags) {
      this.editingEndpoint.details.tags = [];
    }
    if (value && !this.editingEndpoint.details.tags.includes(value)) {
      this.editingEndpoint.details.tags.push(value);
      // Si es un nuevo tag, añadirlo a la lista de todos los tags existentes
      if (!this.allExistingTags.includes(value)) {
        this.allExistingTags.push(value);
        this.allExistingTags.sort();
      }
    }
    this.tagInputControl.setValue(''); // Limpiar el input del tag
  }

  /**
   * Elimina un tag del endpoint.
   */
  public removeTag(tag: string): void {
    const index = this.editingEndpoint.details.tags?.indexOf(tag) ?? -1;
    if (index >= 0) {
      this.editingEndpoint.details.tags?.splice(index, 1);
    }
  }

  /**
   * Añade una nueva entrada de respuesta a la lista del endpoint.
   */
  public addResponse(): void {
    if (!this.editingEndpoint.details.responsesArray) {
      this.editingEndpoint.details.responsesArray = [];
    }
    this.editingEndpoint.details.responsesArray.push({ statusCode: '', description: '', ref: '' });
  }

  /**
   * Elimina una respuesta de la lista del endpoint.
   */
  public removeResponse(index: number): void {
    const responseToRemove = this.editingEndpoint.details.responsesArray?.[index];
    if (responseToRemove && responseToRemove.statusCode) { // Solo elimina si tiene un código de estado (previene eliminar entradas vacías recién añadidas accidentalmente)
        this.editingEndpoint.details.responsesArray?.splice(index, 1);
    }
  }

  /**
   * Añade un nuevo parámetro a la lista del endpoint.
   */
  public addParameter(): void {
    if (!this.editingEndpoint.details.parametersArray) {
      this.editingEndpoint.details.parametersArray = [];
    }
    this.editingEndpoint.details.parametersArray.push({
      key: '', // Inicializar key como vacío, se puede ajustar según sea necesario
      name: '',
      in: 'query', // Por defecto, 'query'
      required: false,
      schema: { type: 'string' } // Por defecto, schema tipo string
    });
  }

  /**
   * Elimina un parámetro de la lista del endpoint.
   * Evita eliminar parámetros de ruta inferidos.
   */
  public removeParameter(index: number): void {
    const paramToRemove = this.editingEndpoint.details.parametersArray?.[index];
    // No permitir eliminar parámetros de ruta que son parte del path del endpoint
    if (paramToRemove && paramToRemove.in === 'path' && this.extractPathParameters(this.editingEndpoint.path).includes(paramToRemove.name)) {
        console.warn('No se puede eliminar un parámetro de tipo "path" inferido directamente del URL. Ajusta el URL para eliminarlo.');
        return;
    }
    this.editingEndpoint.details.parametersArray?.splice(index, 1);
  }

  /**
   * Filtra los nombres de los parámetros globales para el autocompletado.
   */
  public _filterParameterNames(value: string): string[] {
    const filterValue = value.toLowerCase();
    // Ofrecer las referencias completas para el autocompletado
    return this.allParameterNames.filter(name =>
      name.toLowerCase().includes(filterValue)
    ).map(name => `#/components/parameters/${name}`);
  }

  /**
   * Maneja la selección de un parámetro global del autocompletado.
   * Rellena las propiedades del parámetro con los datos del componente global.
   * @param param El objeto de parámetro actual en la UI que se va a actualizar.
   * @param event El evento de selección del autocompletado.
   */
  public onParameterNameSelect(param: OpenApiParameterObject, event: MatAutocompleteSelectedEvent): void {
    const selectedValue = event.option.value; // El valor seleccionado es la referencia completa (ej. #/components/parameters/MyParam)
    if (selectedValue.startsWith('#/components/parameters/')) {
        const paramName = selectedValue.split('/').pop(); // Extrae el nombre del parámetro (ej. MyParam)
        if (paramName && this.openapiSpec?.components?.parameters) {
            const globalParam = this.openapiSpec.components.parameters[paramName];
            if (globalParam && !this.isReferenceObject(globalParam)) { // Asegura que no es una referencia anidada
                const resolvedParam = globalParam as OpenApiParameterObject;
                // Usa Object.assign para copiar las propiedades del parámetro global al parámetro de la UI.
                // Esto copiará 'name', 'in', 'required', 'description', 'schema', etc.
                Object.assign(param, resolvedParam);

                // Asegurar que el esquema tenga un tipo si es un SchemaObject y no tiene (salvaguarda)
                if (!param.schema) {
                    param.schema = { type: 'string' };
                } else if (this.isSchemaObject(param.schema) && !param.schema.type) {
                    param.schema.type = 'string';
                }
            }
        }
    }
  }

  /**
   * Verifica si un parámetro es un componente global (para deshabilitar campos de edición).
   * @param paramName El nombre del parámetro a verificar.
   * @returns `true` si es un parámetro global, `false` en caso contrario.
   */
  public isGlobalParameter(paramName: string): boolean {
    // Compara el nombre del parámetro con los nombres cargados de #/components/parameters
    return this.allParameterNames.includes(paramName);
  }

  /**
   * Método principal para guardar los cambios del endpoint.
   * Transforma los datos del modelo de UI (`editingEndpoint`) a un objeto OpenAPI (`finalDetails`).
   */
  public save(form: NgForm): void {
    // Log para depuración: estado inicial de `editingEndpoint.details`
    console.log('DEBUG: editingEndpoint.details al inicio de save():', this.editingEndpoint.details);

    if (!form.valid) {
      console.log('Form is INVALID.');
      // Marcar controles como tocados y sucios para mostrar errores de validación en la UI
      Object.keys(form.controls).forEach(key => {
        const control = form.controls[key];
        if (control.invalid) {
          console.log(`  Control '${key}' is INVALID:`, control.errors);
          control.markAsTouched();
          control.markAsDirty();
        }
      });
      return; // No guardar si el formulario no es válido
    }

    // Inicializa el objeto OpenApiOperationObject que se va a guardar
    const finalDetails: OpenApiOperationObject = {
      responses: {} // Inicializa responses aquí, se llenará más abajo
    };

    // Copia las propiedades básicas del endpoint
    if (this.editingEndpoint.details.summary) finalDetails.summary = this.editingEndpoint.details.summary;
    if (this.editingEndpoint.details.description) finalDetails.description = this.editingEndpoint.details.description;
    if (this.editingEndpoint.details.operationId) finalDetails.operationId = this.editingEndpoint.details.operationId;

    // Copia los tags si existen
    if (this.editingEndpoint.details.tags && this.editingEndpoint.details.tags.length > 0) {
      finalDetails.tags = this.editingEndpoint.details.tags;
    }

    // >>>>>>>>>>>>>> SECCIÓN PARA CONSTRUIR REQUEST BODY <<<<<<<<<<<<<<<
    const requestBodyRefValue = this.requestBodyRefControl.value?.trim();
    // Solo añade requestBody si el método HTTP lo permite y hay un valor de referencia
    if (this.editingEndpoint.method !== 'get' && this.editingEndpoint.method !== 'head' && this.editingEndpoint.method !== 'delete' && requestBodyRefValue) {
      finalDetails.requestBody = {
        $ref: requestBodyRefValue // Guarda la referencia tal cual
      };
    } else {
      finalDetails.requestBody = undefined; // Si no cumple las condiciones, no hay request body
    }
    // >>>>>>>>>>>>>> FIN DE SECCIÓN DE REQUEST BODY <<<<<<<<<<<<<<<


    // >>>>>>>>>>>>>> INICIO DE LA SECCIÓN PARA CONSTRUIR RESPONSES <<<<<<<<<<<<<<<
    const responses: OpenApiOperationObject['responses'] = {};
    this.editingEndpoint.details.responsesArray?.forEach((resp) => {
      if (resp.statusCode) { // Asegura que la respuesta tiene un código de estado
        let refValue = resp.ref?.trim();
        const statusCodeDescription = resp.description || HTTP_STATUS_CODES.find(s => s.code === resp.statusCode)?.description || 'No description provided';

        // PRIORIDAD 1: Si `refValue` es una referencia directa a un OBJETO Response global (ej. #/components/responses/SuccessResponse)
        if (refValue && refValue.startsWith('#/components/responses/')) {
            responses[resp.statusCode] = { '$ref': refValue } as OpenApiResponseObject | OpenApiReferenceObject;
        }
        // PRIORIDAD 2: Si `refValue` es una referencia a un SCHEMA global (ej. #/components/schemas/MyObject)
        // En este caso, la respuesta debe tener una descripción y un 'content' con el schema referenciado.
        else if (refValue && refValue.startsWith('#/components/schemas/')) {
            responses[resp.statusCode] = {
                description: statusCodeDescription, // La descripción es parte del objeto Response, no del Schema
                content: {
                    'application/json': { // Asume 'application/json' como tipo de medio por defecto
                        schema: { '$ref': refValue } as OpenApiSchemaObject | OpenApiReferenceObject // Guarda la referencia al SCHEMA aquí
                    }
                }
            };
        }
        // PRIORIDAD 3: Si no hay un `refValue` reconocido como referencia, o si es un texto libre.
        // Se construye una respuesta inline con solo la descripción.
        else {
            const responseObj: OpenApiResponseObject = {
                description: statusCodeDescription
            };
            // Si tu UI permitiera schemas inline (no referenciados), la lógica para construirlos iría aquí
            // (ej. if (resp.inlineSchema) { responseObj.content = ... })
            responses[resp.statusCode] = responseObj;
        }
      }
    });

    // Asigna el objeto 'responses' final si no está vacío, de lo contrario, déjalo indefinido.
    if (Object.keys(responses).length > 0) {
      finalDetails.responses = responses;
    } else {
      finalDetails.responses = undefined;
    }
    // >>>>>>>>>>>>>> FIN DE LA SECCIÓN DE RESPONSES <<<<<<<<<<<<<<<


    // >>>>>>>>>>>>>> INICIO DE LA SECCIÓN PARA CONSTRUIR PARÁMETROS <<<<<<<<<<<<<<<
    const finalParameters: (OpenApiParameterObject | OpenApiReferenceObject)[] = []; // Permitir referencias aquí también
    this.editingEndpoint.details.parametersArray?.forEach(param => {
        // Verifica si el parámetro ya es una referencia global para mantenerla.
        // Esto es importante si el usuario seleccionó un parámetro global para reutilizarlo.
        const globalParamRef = param['ref']; // Si tu UI añade un 'ref' al objeto de parámetro cuando es global
        if (globalParamRef && globalParamRef.startsWith('#/components/parameters/')) {
            finalParameters.push({ '$ref': globalParamRef }); // Guarda como referencia si es un parámetro global
        } else if (param.name && param.in) {
            // Si no es una referencia global explícita o no tiene 'ref', construye el objeto de parámetro inline.
            let paramToSave: OpenApiParameterObject = {
                key: param.key,
                name: param.name,
                in: param.in,
                required: param.required || false,
                schema: param.schema // Copia el objeto schema tal cual (puede ser SchemaObject o ReferenceObject)
            };

            if (param.description) {
                paramToSave.description = param.description;
            }

            // Si el esquema es un SchemaObject y le falta el tipo, asigna 'string' por defecto.
            if (this.isSchemaObject(paramToSave.schema) && !paramToSave.schema.type) {
                paramToSave.schema.type = 'string';
            } else if (!paramToSave.schema) {
                // Salvaguarda: si no hay esquema en absoluto, asigna uno básico.
                paramToSave.schema = { type: 'string' };
            }

            finalParameters.push(paramToSave);
        } else {
            console.warn('Parameter omitted due to missing name or "in":', param); // Log si un parámetro es omitido
        }
    });

    // Asigna el array 'parameters' final si no está vacío, de lo contrario, déjalo indefinido.
    if (finalParameters.length > 0) {
        finalDetails.parameters = finalParameters;
    } else {
        finalDetails.parameters = undefined;
    }
    // >>>>>>>>>>>>>> FIN DE LA SECCIÓN DE PARÁMETROS <<<<<<<<<<<<<<<

    // Limpieza final de propiedades que podrían quedar vacías o no deseadas en el objeto final.
    if (!finalDetails.summary?.trim()) finalDetails.summary = undefined;
    if (!finalDetails.description?.trim()) finalDetails.description = undefined;
    if (!finalDetails.operationId?.trim()) finalDetails.operationId = undefined;
    if (finalDetails.tags && finalDetails.tags.length === 0) finalDetails.tags = undefined;


    // Log para depuración: estado final de `finalDetails` antes de cerrar el diálogo
    console.log('DEBUG: finalDetails antes de cerrar el diálogo:', finalDetails);

    // Cierra el diálogo y pasa el objeto OpenApiOperationObject construido.
    this.dialogRef.close({
      path: this.editingEndpoint.path,
      method: this.editingEndpoint.method,
      details: finalDetails // Este es el objeto OpenAPI OperationObject que el componente padre recibirá
    });
  }

  /**
   * Cierra el diálogo sin guardar cambios.
   */
  public cancel(): void {
    this.dialogRef.close(null);
  }
}