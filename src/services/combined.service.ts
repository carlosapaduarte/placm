import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { CountryService } from './country.service';
import { EvaluationService } from './evaluation.service';
import { RuleService } from './rule.service';
import { TagService } from './tag.service';
import { CriteriaService } from './criteria.service';
import { TimelineService } from './timeline.service';
import { SessionStorage } from '@cedx/ngx-webstorage';
import { POSSIBLE_FILTERS, SERVER_NAME, BASE_URL, queryParamsRegex } from 'utils/constants';
import { throwError } from 'rxjs';
import { PLACMError } from 'models/error';
import { catchError, retry, map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CombinedService {

  constructor(
    private countryService: CountryService,
    private tagService: TagService,
    private appService: AppService,
    private evalService: EvaluationService,
    private ruleService: RuleService,
    private criteriaService: CriteriaService,
    private timelineService: TimelineService,
    private session: SessionStorage,
    private http: HttpClient
  ) { }

  async getData(category: string, type?: string, queryParams?: any, comparing?: boolean): Promise<any> {
    let sessionName = this.getStorageName(category, type, [queryParams], comparing);
    let sessionData = this.session.getObject(sessionName);
    let oneMinuteHasPassed = Date.now() - (sessionData ? sessionData.timedate : 0) > 60000;
    let paramsExist = queryParams ? Object.keys(queryParams).length : false;
    
    if(!paramsExist && comparing){
      return Promise.reject({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' })
    }

    let data;
    try {
      if(sessionData === undefined || (sessionData.result === [] && oneMinuteHasPassed)){
        switch(category){
          case 'continent':
          case 'country':
            if(paramsExist){
              data = await this.countryService.getData(SERVER_NAME, category, type, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.countryService.getData(SERVER_NAME, category, type);
            }
            break;
          case 'tag':
            if(paramsExist){
              data = await this.tagService.getData(SERVER_NAME, type, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.tagService.getData(SERVER_NAME, type);
            }
            break;
          case 'sector':
          case 'org':
          case 'app':
            if(paramsExist){
              data = await this.appService.getData(SERVER_NAME, category, type, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.appService.getData(SERVER_NAME, category, type);
            }
            break;
          case 'eval':
            if(paramsExist){
              data = await this.evalService.getEvalutionToolData(SERVER_NAME, type, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.evalService.getEvalutionToolData(SERVER_NAME, type);
            }
            break;
          case 'sc':
            if(paramsExist){
              data = await this.criteriaService.getData(SERVER_NAME, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.criteriaService.getData(SERVER_NAME);
            }
            break;
          case 'type':
            if(paramsExist){
              data = await this.ruleService.getElementTypeData(SERVER_NAME, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.ruleService.getElementTypeData(SERVER_NAME);
            }
            break;
          case 'rule':
            if(paramsExist){
              data = await this.ruleService.getRuleData(SERVER_NAME, JSON.stringify(queryParams), comparing);
            } else {
              data = await this.ruleService.getRuleData(SERVER_NAME);
            }
            break;
          case 'scApp':
            data = await this.appService.getSuccessCriteriaData(SERVER_NAME, JSON.stringify(queryParams));
            break;
          default:
            //todo error
            data = await this.countryService.getData(SERVER_NAME, 'continent');
            break;
        } 
      } else {
        if(category === 'tagNames'){
          if(oneMinuteHasPassed){
            data = await this.tagService.getNames(SERVER_NAME);
          }
        } else {
          // if it reaches here, it means data exists on sessionstorage
        }
      }

      if(await data && data.success === 1){
        // because the first 6 items in result array are OkPackets and not RowDataPackets
        if(type === 'scriteria')
          data.result = data.result[6];
        // because the first 8 items in result array are OkPackets and not RowDataPackets
        if(type === 'scApp')
          data.result = data.result[8];
        //
        data.timedate = Date.now();
        this.session.setObject(sessionName, data);
      }
      return this.session.getObject(sessionName);
    } catch (err){
      return Promise.reject(err);
    }
  }

  async getNames(category: string, queryParams?: any): Promise<any> {
    let sessionName = this.getStorageName(category, 'names', [queryParams]);
    let sessionData = this.session.getObject(sessionName);
    let oneMinuteHasPassed = Date.now() - (sessionData ? sessionData.timedate : 0) > 60000;
    let paramsExist = queryParams ? Object.keys(queryParams).length : false;

    let data;
    try {
      if(sessionData === undefined || (sessionData.result === [] && oneMinuteHasPassed)){
        switch(category){
          case 'continent':
          case 'country':
            if(paramsExist){
              data = await this.countryService.getNames(SERVER_NAME, category, JSON.stringify(queryParams));
            } else {
              data = await this.countryService.getNames(SERVER_NAME, category);
            }
            break;
          case 'tag':
            if(paramsExist){
              data = await this.tagService.getNames(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.tagService.getNames(SERVER_NAME);
            }
            break;
          case 'sector':
          case 'org':
          case 'app':
            if(paramsExist){
              data = await this.appService.getNames(SERVER_NAME, category, JSON.stringify(queryParams));
            } else {
              data = await this.appService.getNames(SERVER_NAME, category);
            }
            break;
          case 'eval':
            if(paramsExist){
              data = await this.evalService.getNames(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.evalService.getNames(SERVER_NAME);
            }
            break;
          case 'sc':
            if(paramsExist){
              data = await this.criteriaService.getNames(SERVER_NAME, JSON.stringify(queryParams));
            } else {
              data = await this.criteriaService.getNames(SERVER_NAME);
            }
            break;
          case 'type':
          case 'rule':
            if(paramsExist){
              data = await this.ruleService.getNames(SERVER_NAME, category, JSON.stringify(queryParams));
            } else {
              data = await this.ruleService.getNames(SERVER_NAME, category);
            }
            break;
          default:
            //todo error
            data = await this.countryService.getNames(SERVER_NAME, 'continent');
            break;
        } 
      }

      if(await data && data.success === 1){
        data.timedate = Date.now();
        this.session.setObject(sessionName, data);
      }
      return this.session.getObject(sessionName);
    } catch (err){
      return Promise.reject(err);
    }
  }

  async getAllNames(category: string): Promise<any> {
    let sessionName = this.getStorageName(category, 'allNames');
    let sessionData = this.session.getObject(sessionName);

    let data;
    try {
      if(sessionData === undefined || sessionData.result === []){
        switch(category){
          case 'continent':
          case 'country':
            data = await this.countryService.getAllNames(SERVER_NAME, category);
            break;
          case 'tag':
            data = await this.tagService.getAllNames(SERVER_NAME);
            break;
          default:
            //todo error
            data = await this.countryService.getNames(SERVER_NAME, 'continent');
            break;
        } 
      }

      if(await data && data.success === 1){
        data.timedate = Date.now();
        this.session.setObject(sessionName, data);
      }
      return this.session.getObject(sessionName);
    } catch (err){
      return Promise.reject(err);
    }
  }

  async getTimelineData(type: string, queryParams?: any): Promise<any> {
    let sessionName = this.getStorageName('timeline', type, [queryParams]);
    let sessionData = this.session.getObject(sessionName);
    let oneMinuteHasPassed = Date.now() - (sessionData ? sessionData.timedate : 0) > 60000;
    let paramsExist = queryParams ? Object.keys(queryParams).length : false;

    let data;
    try {
      if(sessionData === undefined || (sessionData.result === [] && oneMinuteHasPassed)){
        if(paramsExist){
          data = await this.timelineService.getByMonth(SERVER_NAME, type, JSON.stringify(queryParams));
        } else {
          data = await this.timelineService.getByMonth(SERVER_NAME, type);
        }
      }

      if(await data && data.success === 1){
        data.timedate = Date.now();
        if(type === 'scriteria')
          data.result = data.result[6];
        this.session.setObject(sessionName, data);
      }
      return this.session.getObject(sessionName);
    } catch (err){
      return Promise.reject(err);
    }
  }

  fetchDocument(url: string): Promise<any> {
    let param = new HttpParams();
    param = param.append('url', url);
    return this.http.get(BASE_URL + 'doc/fetch', {params: param})
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

  clearStorage(){
    this.session.clear();
  }

  private getStorageName(category: string, type: string, queryParams?: any, comparing?: boolean): string {
    let storageName;
    let serverName = SERVER_NAME;
    let result = category;
    let compare = comparing ? 'comp' : '';
    queryParams = queryParams ? this.sortObject(queryParams) : [];
    for(let param in queryParams[0]){
      if(POSSIBLE_FILTERS.includes(param) && param !== 'filter' && param !== 'p')
        result = result + ';' + param.substring(0, 3) + '=' + this.sortObject(queryParams[0][param].split(','));
    }
    storageName = comparing ? 
                  compare + '_' + type.substring(0, 2) + '_' + result : 
                  type.substring(0, 2) + '_' + result;
    if(serverName !== ''){
      storageName += '_' + serverName;
    }
    return storageName;
  }

  private sortObject(obj) {
    if (typeof obj !== "object" || obj === null)
        return obj;

    if (Array.isArray(obj))
        return obj.map((e) => this.sortObject(e)).sort();

    return Object.keys(obj).sort().reduce((sorted, k) => {
        sorted[k] = this.sortObject(obj[k]);
        return sorted;
    }, {});
  }
}
