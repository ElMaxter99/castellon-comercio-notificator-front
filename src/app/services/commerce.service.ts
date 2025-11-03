import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commerce } from '../models/commerce.model';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/comercios';

  getCommerces(): Observable<Commerce[]> {
    return this.http.get<Commerce[]>(this.baseUrl);
  }
}
