/**
 * API Service - Angular
 * 
 * HTTP INTERCEPTORS in Angular:
 * - Intercept HTTP requests and responses
 * - Transform requests (add headers, logging)
 * - Transform responses (error handling, data mapping)
 * - Chain multiple interceptors (middleware pattern)
 * 
 * ANGULAR HttpClient vs Axios:
 * - HttpClient returns Observables (RxJS)
 * - Built-in JSON parsing
 * - Type-safe with generics
 * - Automatic change detection with async pipe
 * - Interceptors replace axios interceptors
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, value);
        }
      });
    }
    return this.http.get<T>(`${this.apiUrl}${path}`, { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`);
  }
}
