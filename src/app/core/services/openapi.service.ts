import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Openapi } from '../models/openapi.model';

@Injectable({
  providedIn: 'root'
})
export class OpenapiService {
  private openapiSubject = new BehaviorSubject<Openapi | null>(null);
  openapi$ = this.openapiSubject.asObservable();
  
  private readonly STORAGE_KEY = 'openapi-spec';
  private readonly STORAGE_TIMESTAMP_KEY = 'openapi-spec-timestamp';
  private autoSaveEnabled = true;

  constructor() {
    // Cargar datos guardados al iniciar el servicio
    const saved = this.loadFromLocalStorage();
    if (saved) {
      this.openapiSubject.next(saved);
    }
  }

  setOpenapi(data: Openapi) {
    this.openapiSubject.next(data);
    // Auto-guardar si está habilitado
    if (this.autoSaveEnabled) {
      this.saveToLocalStorage(data);
    }
  }

  getOpenapi(): Openapi | null {
    return this.openapiSubject.value;
  }

  /**
   * Guarda la especificación OpenAPI en localStorage
   */
  saveToLocalStorage(data: Openapi = this.openapiSubject.value!): boolean {
    try {
      if (!data) {
        console.warn('No hay datos para guardar');
        return false;
      }
      const jsonData = JSON.stringify(data);
      const timestamp = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, jsonData);
      localStorage.setItem(this.STORAGE_TIMESTAMP_KEY, timestamp);
      return true;
    } catch (err) {
      console.error('Error al guardar en localStorage:', err);
      return false;
    }
  }

  /**
   * Carga la especificación OpenAPI desde localStorage
   */
  loadFromLocalStorage(): Openapi | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as Openapi;
        // No notificar automáticamente, dejar que el componente decida
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error al cargar desde localStorage:', err);
      return null;
    }
  }

  /**
   * Obtiene el timestamp del último guardado
   */
  getLastSaveTime(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_TIMESTAMP_KEY);
    } catch (err) {
      console.error('Error al obtener timestamp:', err);
      return null;
    }
  }

  /**
   * Limpia todos los datos guardados en localStorage
   */
  clearLocalStorage(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.STORAGE_TIMESTAMP_KEY);
      return true;
    } catch (err) {
      console.error('Error al limpiar localStorage:', err);
      return false;
    }
  }

  /**
   * Verifica si hay datos guardados en localStorage
   */
  hasSavedData(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Habilita o deshabilita el auto-guardado
   */
  setAutoSave(enabled: boolean) {
    this.autoSaveEnabled = enabled;
  }
}
