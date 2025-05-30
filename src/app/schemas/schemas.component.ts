import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenapiService } from '../core/services/openapi.service';

@Component({
  selector: 'app-schemas',
  templateUrl: './schemas.component.html',
  styleUrl: './schemas.component.scss'
})
export class SchemasComponent implements OnDestroy {
  schemas: any[] = [];
  private sub?: Subscription;

  constructor(private openapiService: OpenapiService) {
    this.sub = this.openapiService.openapi$.subscribe((openapi: any) => {
      this.schemas = openapi?.components?.schemas ? Object.keys(openapi.components.schemas).map(name => ({ name, ...openapi.components.schemas[name] })) : [];
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
