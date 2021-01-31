import { Injectable } from "@angular/core";
import { ConfigService } from "./config.service";
import { Observable, of, throwError } from "rxjs";
import { ajax } from "rxjs/ajax";
import { catchError, map, retry } from "rxjs/operators";
import { PLACMError } from "../models/error";
import { Response } from "../models/response";
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from 'utils/constants';

@Injectable({
  providedIn: "root"
})
export class EarlService {
  constructor(
    private config: ConfigService,
    private http: HttpClient) {}

  sendEARLReport(serverName: string, formData: string, jsons: string): Promise<any> {
    return this.http.post((BASE_URL.concat('admin/report/add')), { serverName, formData, jsons })
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
