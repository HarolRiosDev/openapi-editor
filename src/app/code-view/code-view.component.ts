import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OpenapiService } from '../core/services/openapi.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as yaml from 'js-yaml';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-code-view',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSnackBarModule],
  templateUrl: './code-view.component.html',
  styleUrl: './code-view.component.scss'
})
export class CodeViewComponent implements OnInit, OnDestroy {
  codeYAML: string = '';
  codeJSON: string = '';
  highlightedYAML: SafeHtml = '';
  highlightedJSON: SafeHtml = '';
  selectedIndex: number = 0;
  private openApiSub?: Subscription;

  constructor(
    private openapiService: OpenapiService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    // Suscribirse a cambios del modelo OpenAPI y regenerar código
    this.openApiSub = this.openapiService.openapi$.subscribe(() => {
      this.generateCode();
    });
    // Generar código inicial
    this.generateCode();
  }

  ngOnDestroy() {
    this.openApiSub?.unsubscribe();
  }

  private generateCode() {
    try {
      const openapi = this.openapiService.getOpenapi();
      
      // Generar YAML
      this.codeYAML = yaml.dump(openapi, { lineWidth: -1, indent: 2 });
      this.highlightedYAML = this.sanitizer.bypassSecurityTrustHtml(this.highlightYAML(this.codeYAML));
      
      // Generar JSON
      this.codeJSON = JSON.stringify(openapi, null, 2);
      this.highlightedJSON = this.sanitizer.bypassSecurityTrustHtml(this.highlightJSON(this.codeJSON));
    } catch (err) {
      console.error('Error generando código:', err);
      this.codeYAML = '# Error al generar YAML';
      this.codeJSON = '// Error al generar JSON';
      this.highlightedYAML = this.sanitizer.bypassSecurityTrustHtml(this.codeYAML);
      this.highlightedJSON = this.sanitizer.bypassSecurityTrustHtml(this.codeJSON);
    }
  }

  private highlightJSON(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(?:\\.|[^"\\])*":\s*)/g, '<span class="json-key">$1</span>')
      .replace(/:\s*"((?:\\.|[^"\\])*)"/g, ':<span class="json-string"> "$1"</span>')
      .replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ':<span class="json-number"> $1</span>')
      .replace(/:\s*(true|false|null)/g, ':<span class="json-boolean"> $1</span>')
      .replace(/([{}[\],])/g, '<span class="json-bracket">$1</span>');
  }

  private highlightYAML(code: string): string {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*):/gm, '$1<span class="yaml-key">$2:</span>')
      .replace(/:\s*"((?:\\.|[^"\\])*)"/g, ': <span class="yaml-string">"$1"</span>')
      .replace(/:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g, ': <span class="yaml-number">$1</span>')
      .replace(/:\s*(true|false|null|~)/g, ': <span class="yaml-boolean">$1</span>')
      .replace(/^(\s*)#(.*)$/gm, '$1<span class="yaml-comment">#$2</span>');
  }

  copyToClipboard(format: 'yaml' | 'json') {
    const code = format === 'yaml' ? this.codeYAML : this.codeJSON;
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open(`Código ${format.toUpperCase()} copiado al portapapeles`, 'Cerrar', { duration: 2000 });
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.snackBar.open('Error al copiar al portapapeles', 'Cerrar', { duration: 2000, panelClass: 'snackbar-error' });
    });
  }

  downloadFile(format: 'yaml' | 'json') {
    const code = format === 'yaml' ? this.codeYAML : this.codeJSON;
    const filename = `openapi.${format}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    this.snackBar.open(`Archivo ${filename} descargado`, 'Cerrar', { duration: 2000 });
  }
}
