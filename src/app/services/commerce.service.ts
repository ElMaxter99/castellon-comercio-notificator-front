import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Commerce } from '../models/commerce.model';
import { CommerceStatus } from '../models/commerce-status.model';
import { CommerceHistoryEntry } from '../models/commerce-history-entry.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommerceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/comercios`;

  getCommerces(): Observable<Commerce[]> {
    return this.http.get<Commerce[]>(this.baseUrl).pipe(
      map((commerces) => commerces.map((commerce) => this.normaliseCommerce(commerce)))
    );
  }

  getStatus(): Observable<CommerceStatus> {
    return this.http.get<CommerceStatus>(`${this.baseUrl}/status`);
  }

  getHistory(): Observable<CommerceHistoryEntry[]> {
    return this.http.get<CommerceHistoryEntry[]>(`${this.baseUrl}/history`);
  }

  private normaliseCommerce(commerce: Commerce): Commerce {
    return {
      ...commerce,
      img: this.ensureHttps(commerce.img),
      mapsUrl: this.ensureHttps(commerce.mapsUrl)
    };
  }

  private ensureHttps(url: string | null | undefined): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('http://')) {
      return `https://${url.slice('http://'.length)}`;
    }

    return url;
  }
}
