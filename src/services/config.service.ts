import { Injectable } from '@angular/core';
import { retry, map, catchError, tap } from "rxjs/operators";
import { HttpParams, HttpClient } from '@angular/common/http';
import { BASE_URL } from 'utils/constants';
import { throwError, Observable } from 'rxjs';
import { PLACMError } from 'models/error';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  PROTOCOL: string;
  PORT: number;
  HOST: string;
  URI: string;

  constructor(
    private http: HttpClient) {
    this.PROTOCOL = location.protocol + '//';
    this.HOST = location.hostname;

    if (this.HOST === 'localhost') {
      this.PORT = 3443;
    } else {
      if (this.PROTOCOL === 'http://') {
        this.PORT = 80;
      } else {
        this.PORT = 443;
      }
    }

    this.URI = `${this.PROTOCOL}${this.HOST}:${this.PORT}`;
  }

  getServer(service: string): string {
    return `${this.URI}${service}`;
  }

  resetDatabase(serverName: string): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    return this.http.get((BASE_URL + 'db/reset'), {params: opts})
      .pipe(
        retry(3),
        map(res => {
          if (res['success'] !== 1 || res['errors'] !== null) {
            throw new PLACMError(res['success'], res['message']);
          }
          return res;
        }),
        catchError(err => {
          return throwError(err);
        })
      )
      .toPromise();
  }
}
