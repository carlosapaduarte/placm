import { Injectable } from '@angular/core';
import { POSSIBLE_FILTERS, queryParamsRegex } from 'utils/constants';
import * as isEmpty from 'lodash.isempty';

@Injectable({
  providedIn: 'root'
})
export class QueryParametersService {

  /**
   * Clarification of used query parameters 
   * p - used for visibility of graphic series (0 to n series)
   * filter - used for visibility of checkboxes' data (id of respective data)
   * graph - 0 for multiple, 1 for united (not used in graphic-simple)
   * In united charts, p is used to represent both series and checkboxes
   * 
   * Every possible category has a filter, corresponding to the category name + 'Ids' 
   * such as continentIds, countryIds, ...
   */
  constructor() { }

  /**
   * Gets values of given query parameter
   * 
   * @param param Desired query parameter
   * @param queryParams List of all query parameters
   * @returns List of values of query parameter, splitted by commas
   */
  getParam(param: string, queryParams: any): string[] {
    let parameter = queryParams[param];
    if(parameter){
      return parameter.split(',');
    } else {
      return [];
    }
  }

  /**
   * Get the query parameter where data will be based on
   * Either first parameter or 'name'/'id'
   * 
   * @param input 
   * @param category
   * @returns array of order by parameter and boolean representing if graphic is comparing data
   */
  getOrderByParam(input: any, category: string): any[] {
    let result, comparing;
    let params = Object.keys(input);
    if(params.length && !params[0].includes(category)){
      comparing = false;
      // usually categoryId (eg. tagId or continentId)
      result = params[0].substring(0, params[0].length - 1);
    } else {
      comparing = true;
      if(category === 'rule'){
        result = 'name';
      } else {
        result = 'id';
      }
    }
    return [result, comparing];
  }

  /**
   * Calculates new query params after checkbox or chart legend click
   * 
   * @param id - id of data clicked
   * @param clickType - 0 = checkbox click; 1 = legend click
   * @param queryParams - active query params
   * @param multipleCharts - true if multiple charts in same view
   * @param graphicType - active metrics group (assertions or scriteria)
   * @param categoryFilter - main filter, based on data category applied in view 
   * @param legendAlreadyClicked - only used if multiple charts in view
   * 
   * @returns [<any> updated query params, <boolean> legendAlreadyClicked]
   */
  getParamsAfterClick(id: number, clickType: number, queryParams: any, 
                      graphicType: string, categoryFilter: string,
                      multipleCharts: boolean = false, unitedChart: boolean = false, 
                      legendAlreadyClicked?: boolean): any[] {
    let queryParamsArray = [];
    let actualFilterExists = false;

    let workingParam;
    if(clickType === 0){
      if(!multipleCharts || (multipleCharts && !unitedChart)){
        workingParam = 'filter';
      } else {
        workingParam = 'p';
      }
    } else {
      workingParam = 'p';
    }
    let legendClick = !multipleCharts ? clickType === 1 : clickType === 1 && !unitedChart; 

    let assertionsGraphic = graphicType === 'assertions';
    let legendClicked = legendAlreadyClicked;
    
    let emptyParamString = '';

    if(legendClick){
      if(assertionsGraphic){
        if(id === 0){
          if(legendClicked){
            emptyParamString = '"' + workingParam + '":"';
            emptyParamString += id.toString() + '"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!legendClicked)
            emptyParamString += '0,';
          emptyParamString += id.toString() + '"';
        }
      } else {
        if([0,1].includes(id)){
          emptyParamString = '"' + workingParam + '":"';
          if(legendClicked){
            emptyParamString += id.toString() + '"';
          } else {
            emptyParamString += id === 0 ? '1"' : '0"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!legendClicked)
            emptyParamString +=  '0,1,';
          emptyParamString += id.toString() + '"';
        }
      }
      legendClicked = true;
    } else {
      emptyParamString = '"' + workingParam + '":"';
      emptyParamString += id.toString() + '"';
    }

    if(!isEmpty(queryParams)){
      // search in all queryParams
      for(let params in queryParams){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params === workingParam){
            // to pass to the next condition
            actualFilterExists = true;
          } else {
            if(!multipleCharts){
              if(params !== categoryFilter){
                queryParamsArray.push('"' + params + '":"' + queryParams[params] + '"');
              }
            } else {
              queryParamsArray.push('"' + params + '":"' + queryParams[params] + '"');
            }
          }
        }
      }

      // if this category's filter is in queryParams, add or remove id from it
      if(actualFilterExists){
        let idsArray = queryParams[workingParam].split(',');
        let indexId = idsArray.indexOf(id.toString());

        // if this id already exists, needs to be removed
        if(indexId >= 0){
          idsArray.splice(indexId, 1);
        } 
        // if it doesnt, needs to be added
        else {
          idsArray.push(id.toString());
        }

        if(idsArray.length) {
          idsArray = idsArray.sort(function(a,b) {
            return +a - +b;
          });
          queryParamsArray.push('"' + workingParam + '":"' + idsArray.join(',') + '"');
        }
      } else {
        if(emptyParamString)
          queryParamsArray.push(emptyParamString);
      }
    } else {
      if(emptyParamString)
        queryParamsArray.push(emptyParamString);
    }

    return [JSON.parse('{' + queryParamsArray.join(',') + '}'), legendClicked];
  }

  /**
   * Remove unwanted params from queryParams and get params to compose the graphic subtitle
   * 
   * @param input queryParams
   * @param single true if graphic-simple, false if graphic-compare
   * @param actualFilter filter respective to applied category - continentIds || countryIds || ...
   * @returns list of params to be parsed into graphic subtitle
   */
  prepareQueryParams(input: any, single: boolean = false, actualFilter: string = null): any[]{
    let subtitlePossibilities = [];
    if(!isEmpty(input)){
      let removed;

      if(single){
        // removing actual filter from queryParams 
        // it's not supposed to be there - it was manually inserted
        ({[actualFilter]: removed, ...input} = input);
      }

      for(let params in input){
        if(POSSIBLE_FILTERS.includes(params)){
          if( (!single || (single && params !== actualFilter)) && params !== 'filter' && params !== 'p'){
            if(input[params]){
              if(!queryParamsRegex.test(input[params])){
                // remove all queryParams that are not composed of only numbers or commas
                ({[params]: removed, ...input} = input);
              } else {
                // preparing graphic subtitle
                subtitlePossibilities.push(params.replace('Ids', ''));
              }
            }
          } else {
            // remove all queryParams equal to filter and p
            ({[params]: removed, ...input} = input);
          }
        } else {
          // remove all queryParams that are not possible
          ({[params]: removed, ...input} = input);
        }
      }
    }
    return [input, subtitlePossibilities];
  }

}
