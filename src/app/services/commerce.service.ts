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
  private readonly mockBaseUrl = 'public/mockup';
  private readonly isLive = environment.isLive;

  getCommerces(): Observable<Commerce[]> {
    const request$ = this.isLive
      ? this.http.get<Commerce[]>(this.baseUrl)
      : this.http.get<Commerce[]>(`${this.mockBaseUrl}/commerces.json`);

    return request$.pipe(
      map((commerces) => commerces.map((commerce) => this.normaliseCommerce(commerce)))
    );
  }

  getStatus(): Observable<CommerceStatus> {
    if (this.isLive) {
      return this.http.get<CommerceStatus>(`${this.baseUrl}/status`);
    }

    return this.http.get<CommerceStatus>(`${this.mockBaseUrl}/status.json`);
  }

  getHistory(): Observable<CommerceHistoryEntry[]> {
    if (this.isLive) {
      return this.http.get<CommerceHistoryEntry[]>(`${this.baseUrl}/history`);
    }

    return this.http.get<CommerceHistoryEntry[]>(`${this.mockBaseUrl}/history.json`);
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
