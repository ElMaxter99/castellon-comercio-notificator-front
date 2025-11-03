import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Commerce } from '../models/commerce.model';
import { CommerceStatus } from '../models/commerce-status.model';
import { CommerceHistoryEntry } from '../models/commerce-history-entry.model';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://bcc-api.alvaromaxter.es/api/comercios';

  getCommerces(): Observable<Commerce[]> {
    return this.http.get<Commerce[]>(this.baseUrl);
  }

  getStatus(): Observable<CommerceStatus> {
    return this.http.get<CommerceStatus>(`${this.baseUrl}/status`);
  }

  getHistory(): Observable<CommerceHistoryEntry[]> {
    return this.http.get<CommerceHistoryEntry[]>(`${this.baseUrl}/history`);
  }
}
