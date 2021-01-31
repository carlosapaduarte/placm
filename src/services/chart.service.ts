import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { remove } from 'lodash';
import { LABELS_PLURAL, LABELS_SINGULAR, SECTORS } from 'utils/constants';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor(
    private router: Router) { }

  prepareSubtitle(data: any, subs: string[], queryParams: Params): string {
    let result = "";
    if(data.length > 0){
      for(let sub of subs){
        let infoQuery = data[0][sub + 'Names'];
        if(infoQuery){
          let arrayInfoQuery = JSON.parse(infoQuery);

          if(result){
            result = result + "; ";
          }

          if(arrayInfoQuery.length > 1) {
            result = result + LABELS_PLURAL[sub];
            let allNames = [];
            for(let name of arrayInfoQuery){
              allNames.push(name);
            }
            result = result + ' ' + allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1);
          } else {
            result = result + LABELS_SINGULAR[sub] + ' ' + arrayInfoQuery[0];
          }
        } else {
          // transpose 0 and 1 into Public and Private
          if(sub === 'sector'){
            
            if(result) {
              result = result + "; ";
            }
            let sectorIds = queryParams['sectorIds'];
            sectorIds = sectorIds.split(',');
            
            // remove all sectorIds manually inserted
            sectorIds = remove(sectorIds, function(n) {
              return n !== 0 && n !== 1;
            });

            if(sectorIds.length > 1) {
              let allNames = [];
              for(let id of sectorIds){
                allNames.push(SECTORS[id]);
              }
              result = result + allNames.slice(0, -1).join(', ') + ' and ' + allNames.slice(-1);
              result = result + ' ' + LABELS_PLURAL[sub];
            } else {
              result = result + SECTORS[sectorIds[0]] + ' ' + LABELS_SINGULAR[sub];
            }
          }
          // Theres no info about this queryParam in this SQL Query!
          //console.log(sub);
        }
      }
    }
    return result;
  }

  isSeriesVisible(index: number, queryParams: any, multipleCharts: boolean, graphicType: string, unitedChart: boolean = false): boolean {
    let result;
    let parameterParam = queryParams['p'];
    let i = index.toString();
    // visible if index exists on p queryParam or
    // if studying assertions, visible nPages (i=0) or
    // if studying scriteria, visible nPassed and nFailed (i=0,1)
    if(parameterParam){
      result = parameterParam.split(',').includes(i);
    } else {
      if(!multipleCharts || (multipleCharts && !unitedChart)){
        if(graphicType === 'assertions'){
          result = index === 0;
        } else {
          result = index === 0 || index === 1;
        }
      } else {
        result = false;
      }
    }
    return result;
  }

  /**
   * Possible variables group 
   * @param actualVariablesGroup variables group applied - assertions || scriteria
   * @param actualCategory category applied - continent || country || ...
   * @param single true if graphic-simple, false if graphic-compare
   * @param unitedChart true if graphic-compare data in same chart, false if in multiple charts
   */
  changeVariablesGroup(actualVariablesGroup: string, actualCategory: string, single: boolean = true, unitedChart: boolean = false) {
    let newQueryParams = {};
    let routeString = '/';
    if(!single){
      routeString += 'compare/'
    }

    if(actualVariablesGroup === 'assertions'){
      routeString += 'scriteria/'
      if(single || !unitedChart){
        newQueryParams = {p: '0,1'};
      }
    } else {
      routeString += 'assertions/'
      if(single || !unitedChart){
        newQueryParams = {p: '0'};
      }
    }

    this.router.navigate([routeString + actualCategory], {
      queryParams: newQueryParams,
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Method to select and unselect all checkboxes in graphic-simple
   * @param handler true to select all, false to unselect all
   * @param checkboxList list of all existent checkboxes
   */
  handleAllCheckboxesSimple(handler: boolean, checkboxList: any[]){
    this.router.navigate([], {
      queryParams: {
        filter: handler ? null : checkboxList.map(x => x.id).join(',')
      },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Method to select and unselect all checkboxes in graphic-compare
   * 
   * p is a positive filter - if its in 'p', it is on the chart
   * filter is a negative filter - if its in 'filter', its not on the chart
   * 
   * @param handler true to select all, false to unselect all
   * @param unitedChart true if data in same chart, false if in multiple charts
   * @param checkboxList list of all existent checkboxes
   */
  handleAllCheckboxesCompare(handler: boolean, unitedChart: boolean, checkboxList: any[]){
    if(unitedChart){
      this.router.navigate([], {
        queryParams: {
          p: handler ? [...Array(checkboxList.length).keys()].join(',') : null
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        queryParams: {
          filter: handler ? null : checkboxList.map(x => x.id).join(',')
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  /**
   * 
   * @param resultData 
   * @param variableGroup 
   * @param tableHeaders 
   * @param dataToAdd 
   * @param visibleSeries 
   * @returns prepared/modified list of chart series
   */
  combineChartData(variableGroup: string, tableHeaders: string[], visibleSeries: boolean[], ...dataToAdd: any[]) : any[] {
    let i = 0;
    let resultData = [];

    if(variableGroup === 'assertions'){
      resultData.push({
        id: 'nPages',
        name: tableHeaders[i],
        // nPages must always be in the 6th (last) position
        data: dataToAdd[5],
        visible: visibleSeries[i]
      });
      i++;
    }

    resultData.push({
      id: 'nPassed',
      name: tableHeaders[i],
      data: dataToAdd[i],
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nFailed',
      name: tableHeaders[i],
      data: dataToAdd[i],
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nCantTell',
      name: tableHeaders[i],
      data: dataToAdd[i],
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nInapplicable',
      name: tableHeaders[i],
      data: dataToAdd[i],
      visible: visibleSeries[i]
    });
    i++;

    resultData.push({
      id: 'nUntested',
      name: tableHeaders[i],
      data: dataToAdd[i],
      visible: visibleSeries[i]
    });

    return resultData;

  }

  /**
   * 
   * @param data Checkboxes' corresponding data 
   * @param unitedChart 
   * @param filterParams 
   * @param pParams 
   */
  changeGraphicType(data: any[], unitedChart: boolean, filterParams: any[], pParams: any[]) {
    let futureFilters = []; 
    if(!unitedChart){
      // nVars here is equal to the number of checkboxes
      let nVars = data.length;
      futureFilters = [...Array(nVars).keys()];
      if(filterParams.length){
        for(let filter of filterParams){
          let idIndex = data.findIndex(x => +x.dbId === +filter);
          if(idIndex >= 0){
            futureFilters = futureFilters.filter(x => x !== idIndex);
          }
        }
      }
    } else {
      if(pParams.length){
        futureFilters = data.map(x => x.dbId);
        for(let p of pParams){
          futureFilters = futureFilters.filter(x => x !== data[+p].dbId);
        }
      }
    }
    
    this.router.navigate([], {
      queryParams: {
        graph: unitedChart ? 0 : 1,
        // if its not united chart, it will fill p parameter with 0,1,2,... 
        // to make the checkbox click equal to the legend click
        p: unitedChart ? null : futureFilters.join(','),
        // if its united chart, it will fill filter parameter with all ids... 
        // to make the legend click equal to the checkbox click
        filter: unitedChart ? (futureFilters.length ? futureFilters.join(',') : null) : null
      },
      queryParamsHandling: 'merge'
    });
  }

}
