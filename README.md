# OpenapiEditor

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.13.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.



## 🧩 Resumen del Proyecto: Visual OpenAPI YAML Editor

**Visual OpenAPI YAML Editor** es una aplicación web construida con **Angular 19 (standalone architecture)**, diseñada para facilitar la **creación, edición y visualización de archivos YAML** compatibles con el estándar **OpenAPI 3.0+**. Está enfocada en ofrecer una experiencia visual amigable, moderna y práctica para equipos de desarrollo de APIs.

---

### 🛠️ Características principales

1. **Editor Visual de YAML (OpenAPI)**
   - Generación automática de referencias con `$ref` para `schemas`, `requestBodies`, `responses`, y `parameters`.

2. **4 Páginas principales de la aplicación**

#### 📄 1. Dashboard (Inicio)
- Importar YAML existente o crear uno nuevo.
- Visualización estilo Swagger (solo lectura).
- Cards informativas:
  - Total de endpoints con opción de añadir nuevos.
  - Total de esquemas con vista rápida y creación.
  - Estadísticas breves.

#### 🧬 2. Components
- Visualización de componentes en tarjetas.
- Creación, edición y eliminación de objetos/schema.
- Filtro y orden amigables.

#### 🔧 3. Endpoints
- Gestión de endpoints (`GET`, `POST`, etc.).
- Asignación de tags y relación con esquemas ya definidos.
- Organización visual según orden de definición.

#### 📄 4. YAML / JSON Viewer
- Visualización del archivo generado.
- Opciones de exportación como `.yaml` o `.json`.

---

### 🧱 Arquitectura Técnica

- Framework: **Angular 19 standalone**
- YAML generado sigue estructura clara y limpia:

```yaml
/api/auth/register:
  post:
    tags:
      - Authentication
    summary: User registration.
    requestBody:
      $ref: "#/components/requestBodies/RegisterRequest"
    responses:
      "201":
        $ref: "#/components/responses/Created"
```

- Modular, escalable y orientado a UX funcional y eficiente.

### 🎯 Objetivo

Reducir la fricción en la definición técnica de APIs, facilitando colaboración entre desarrolladores backend, frontend y product managers, con una herramienta visual de alto nivel.
