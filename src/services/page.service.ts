import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const pageUrl = BASE_URL.concat('page/');

@Injectable({
  providedIn: 'root'
})
export class PageService {

  constructor(
    private http: HttpClient) { }

  getAllByApplicationId(id: number): Promise<any> {
    let data = new HttpParams().set('id', id.toString())
    return this.http.get(pageUrl.concat('byApp'), {params: data})
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
