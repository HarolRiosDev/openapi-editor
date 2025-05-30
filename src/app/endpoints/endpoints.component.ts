import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OpenapiService } from '../core/services/openapi.service';

@Component({
  selector: 'app-endpoints',
  templateUrl: './endpoints.component.html',
  styleUrl: './endpoints.component.scss'
})
export class EndpointsComponent implements OnDestroy {
  endpoints: any[] = [];
  private sub?: Subscription;

  constructor(private openapiService: OpenapiService) {
    this.sub = this.openapiService.openapi$.subscribe((openapi: any) => {
      this.endpoints = openapi?.paths ? Object.keys(openapi.paths).map(path => ({ path, ...openapi.paths[path] })) : [];
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
