import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Openapi } from '../models/openapi.model';

@Injectable({
  providedIn: 'root'
})
export class OpenapiService {
  private openapiSubject = new BehaviorSubject<Openapi | null>(null);
  openapi$ = this.openapiSubject.asObservable();

  setOpenapi(data: Openapi) {
    this.openapiSubject.next(data);
  }

  getOpenapi(): Openapi | null {
    return this.openapiSubject.value;
  }
}
