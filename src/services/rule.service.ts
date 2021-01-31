import { Injectable } from '@angular/core';
import { HttpClient, HttpParams} from '@angular/common/http';
import { BASE_URL } from '../utils/constants';
import { retry } from 'rxjs/internal/operators/retry';
import { map, catchError } from 'rxjs/operators';
import { PLACMError } from 'models/error';
import { throwError } from 'rxjs';

const ruleUrl = BASE_URL + 'rule/';

@Injectable({
  providedIn: 'root'
})
export class RuleService {

  constructor(private http: HttpClient) { }

  getAll(): Promise<any> {
    return this.http.get(ruleUrl + 'allData')
      .pipe(
        retry(3),
        //todo error handling
      )
      .toPromise();
  }

  getRuleData(serverName: string, filters?: any, comparing?: boolean): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let compare = comparing ? 'Compare' : ''; 
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(ruleUrl + 'ruleData' + compare, {params: opts})
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

  getElementTypeData(serverName: string, filters?: any, comparing?: boolean): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    let compare = comparing ? 'Compare' : ''; 
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(ruleUrl + 'elemData' + compare, {params: opts})
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

  getNames(serverName: string, category: string, filters?: any): Promise<any> {
    let opts = new HttpParams();
    opts = opts.append('name', serverName);
    if(filters)
      opts = opts.append('filters', filters);
    return this.http.get(ruleUrl + category + 'Names', {params: opts})
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
