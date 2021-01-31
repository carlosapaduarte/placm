import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { POSSIBLE_FILTERS, LABELS_PLURAL, LABELS_SINGULAR, SECTORS, queryParamsRegex } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as isEmpty from 'lodash.isempty';
import * as remove from 'lodash.remove';
import * as Highstock from 'highcharts/highstock';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-graphic-timeline',
  templateUrl: './graphic-timeline.component.html',
  styleUrls: ['./graphic-timeline.component.css']
})
export class GraphicTimelineComponent implements OnInit {

  @Output() closedDialog = new EventEmitter();
  actualVariablesGroup: string;
  actualCategory: string;
  actualFilter: string;
  options: any;
  xAxisVars: any[] = [];
  chart: any;
  allDataPrepared = false;

  initChange = false;
  legendChange = false;

  homepageUrl: string; 

  sCriteriaVisible: boolean;

  chartsReady: boolean = false;
  
  breadcrumbsData = {};
  
  table: any[];
  showTable: boolean = false;

  error: boolean = false;
  errorMessage: number = 0;

  legendAlreadyClicked: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private combinedService: CombinedService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {    
    this.initChange = true;
    this.actualVariablesGroup = this.activatedRoute.snapshot.url[0].path;
    //this.actualFilter = this.actualCategory + 'Ids';
    
    this.sCriteriaVisible = Object.keys(this.activatedRoute.snapshot.queryParams).every(
      x => !['scIds', 'typeIds', 'ruleIds'].includes(x)
    );

    // if queryparams changed (even if first load!), but it was not from a checkbox change, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
      }
    });
  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number): void {
    this.legendChange = type === 1;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let queryParamsArray = [];
    let actualFilterExists = false;
    let workingParam = type === 0 ? 'filter' : 'p';
    let assertionsGraphic = this.actualVariablesGroup === 'assertions' ? true : false;
    
    let emptyParamString = "";
    /*// if it wasnt a legend click on the first p
    if(!(type === 1 && id === 0)){
      emptyParamString = '"' + workingParam + '":"';
      // if it was a legend click, there needs to be added the first p (because its always visible in initialization)
      if(type === 1){
        emptyParamString = emptyParamString + '0,';
      }
      emptyParamString = emptyParamString + id.toString() + '"';
    }*/

    if(this.legendChange){
      if(assertionsGraphic){
        if(id === 0){
          if(this.legendAlreadyClicked){
            emptyParamString = '"' + workingParam + '":"';
            emptyParamString += id.toString() + '"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!this.legendAlreadyClicked)
            emptyParamString += '0,';
          emptyParamString += id.toString() + '"';
        }
      } else if(!assertionsGraphic){
        if([0,1].includes(id)){
          emptyParamString = '"' + workingParam + '":"';
          if(this.legendAlreadyClicked){
            emptyParamString += id.toString() + '"';
          } else {
            emptyParamString += id === 0 ? '1"' : '0"';
          }
        } else {
          emptyParamString = '"' + workingParam + '":"';
          if(!this.legendAlreadyClicked)
            emptyParamString +=  '0,1,';
          emptyParamString += id.toString() + '"';
        }
      }
      this.legendAlreadyClicked = true;
    } else {
      emptyParamString = '"' + workingParam + '":"';
      emptyParamString += id.toString() + '"';
    }

    if(!isEmpty(actualParams)){
      // search in all queryParams
      for(let params in actualParams){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== workingParam){
            queryParamsArray.push('"' + params + '":"' + actualParams[params] + '"');
          }
          else if(params === workingParam){
            actualFilterExists = true;
          }
        }
      }

      // if this category's filter is in queryParams, add or remove id from it
      if(actualFilterExists){
        let idsArray = actualParams[workingParam].split(',');
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

    let jsonNavExtras = JSON.parse('{' + queryParamsArray.join(',') + '}');

    // update data table on checkbox click
    if(this.chart.options.exporting.showTable){
      let element = document.getElementsByClassName("highcharts-data-table");
      if(element)
        element[0].removeChild(element[0].childNodes[0]);
    }
    this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: jsonNavExtras // remove to replace all query params by provided
    });
  }

  getFilterParamsArray(): string[] {
    let filter = this.activatedRoute.snapshot.queryParams['filter'];
    // if there were any filters active (in the url)
    if(filter){
      return filter.split(',');
    } else {
      return [];
    }
  }
  
  private async prepareApplicationGraphic(input: any){
    this.breadcrumbsData = {};
    let data;
    let rawData;
    let filterArray;
    let idInParams;
    let resultData = [];
    let subtitle = "";
    let subtitlePossibilities = [];
    let variableName, tableHeaders = [];
    this.chartsReady = false;

    /* if(this.chart){
      this.chart.destroy();
      this.chart = undefined;
    } */
    if(this.actualVariablesGroup === 'assertions'){
      variableName = this.actualVariablesGroup;
      tableHeaders = ['# pages']
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
    this.table = [[...tableHeaders]];

    if(!isEmpty(input)){
      
      // removing actual filter from queryParams, because
      // we want to query all data and manipulate this data in the client
      let removed;
      ({[this.actualFilter]: removed, ...input} = input);

      // search in all queryParams
      for(let params in input){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params !== this.actualFilter && params !== 'filter' && params !== 'p'){
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
            // remove all queryParams equal to filter, p and filter corresponding to actual category
            ({[params]: removed, ...input} = input);
          }
        }
      }
    }    

    filterArray = this.getFilterParamsArray();
    try{
      // input can be sent as '{}' in this function
      data = await this.combinedService.getTimelineData(this.actualVariablesGroup, input);
    } catch(err) {
      this.error = true;
      this.errorMessage = 1;
    }

    if(data && data['success'] === 1){
      if(data['result'].length){
        rawData = data['result'];
        subtitle = this.prepareSubtitle(rawData, subtitlePossibilities);
      } else {
        this.error = true;
        this.errorMessage = -2;
      }
    } else {
      this.error = true;
      this.errorMessage = 2;
    }

    if(!this.error){
      let names = [], nPages = [], nPassed = [],
          nFailed = [], nCantTell = [], 
          nInapplicable = [], nUntested = [], tableData = [];
      let name;

      // todo sorting
      /*rawData = rawData.sort(function (a,b) {
        let comparison = 0;
        if (a.name > b.name) {
          comparison = 1;
        } else if (a.name < b.name) {
          comparison = -1;
        }
        return comparison;
      });*/

      this.xAxisVars = [];
      this.table = [[...tableHeaders]];

      let test, testDate, rowIndex = 1;
      for(let vars of rawData){
        tableData = [];
        testDate = Date.UTC(+vars.date.split('-')[0], +vars.date.split('-')[1] - 1);
        idInParams = filterArray.includes(vars.date.replace('-','').toString());
        this.xAxisVars.push({name: vars.date, id: vars.date.replace('-',''), checked: !idInParams});
        if(!idInParams){

          // handling x axis
          names.push(testDate);

          // handling y axis and table data
          if(this.actualVariablesGroup === 'assertions'){
            tableData.push(vars.nPages);
            nPages.push([testDate, vars.nPages]);
          }
          nPassed.push([testDate, vars.nPassed]);
          nFailed.push([testDate, vars.nFailed]);
          nCantTell.push([testDate, vars.nCantTell]);
          nInapplicable.push([testDate, vars.nInapplicable]);
          nUntested.push([testDate, vars.nUntested]);
          
          tableData.push(vars.nPassed);
          tableData.push(vars.nFailed);
          tableData.push(vars.nCantTell);
          tableData.push(vars.nInapplicable);
          tableData.push(vars.nUntested);
          
          this.table = this.addDataToTable(vars.date, tableData, rowIndex, this.table);
          rowIndex++;
        }
        
      }

      this.breadcrumbsData['category'] = 'timeline';
      this.breadcrumbsData['type'] = this.actualVariablesGroup;

      this.chartsReady = true;
      this.cd.detectChanges();

      let visibleSeries = [];
      for(let i = 0; i <= 5; i++){
        visibleSeries.push(this.isSeriesVisible(i));
      }

      let i = 0;

      if(this.actualVariablesGroup === 'assertions'){
        resultData.push({
          id: 'nPages',
          name: tableHeaders[i],
          data: nPages,
          visible: visibleSeries[i]
        });
        i++;
      }

      resultData.push({
        id: 'nPassed',
        name: tableHeaders[i],
        data: nPassed,
        visible: visibleSeries[i]
      });
      i++;

      resultData.push({
        id: 'nFailed',
        name: tableHeaders[i],
        data: nFailed,
        visible: visibleSeries[i]
      });
      i++;

      resultData.push({
        id: 'nCantTell',
        name: tableHeaders[i],
        data: nCantTell,
        visible: visibleSeries[i]
      });
      i++;

      resultData.push({
        id: 'nInapplicable',
        name: tableHeaders[i],
        data: nInapplicable,
        visible: visibleSeries[i]
      });
      i++;

      resultData.push({
        id: 'nUntested',
        name: tableHeaders[i],
        data: nUntested,
        visible: visibleSeries[i]
      });

      this.chart = Highstock.stockChart('chart', {
        chart: {
          alignTicks: false,
          animation: false,
          type: 'column'
        },
        rangeSelector : {
          enabled: !!names.length,
          inputDateFormat: '%b, %Y',
          inputEditDateFormat: '%m-%Y'
        },
        title: {
          text: 'Timeline column chart'
        },
        tooltip: {
          split: false,
          shared: true,
          xDateFormat: '%B %Y'
        },
        credits: {
          enabled: false
        },
        exporting: {
          accessibility:{
            enabled: true
          },
          showTable: false,//this.chart ? this.chart.options.exporting.showTable : false,
          menuItemDefinitions: {
            // toggle data table
            viewData: {
                onclick: () => {
                  let element;
                  this.showTable = !this.showTable;
                  this.cd.detectChanges();
                  element = document.getElementById("dataTable");
                  
                  if(this.showTable){
                    element.focus();
                    element.scrollIntoView();
                  } 

                  this.updateMenuTableText();
                },
                text: 'Show and go to data table'
            }
          },
          buttons: {
            contextButton: {
              menuItems: ['viewData', 'separator', "viewFullscreen", "printChart", "separator", "downloadPNG", "downloadPDF", "downloadSVG", 'separator', 'downloadCSV', 'downloadXLS']
            }
          }
        },
        accessibility: {
          announceNewData: {
              enabled: true
          }
        },
        //eixo dos x - month-year
        xAxis: {
          minRange: 1,
          type: 'datetime',
          tickPositions: names.length <= 3 ? names : undefined,
          labels: {
            formatter: function () {
              return Highcharts.dateFormat('%b %Y', this.value);
            }
          },
        },
        yAxis: {
          title: {
            text: this.actualVariablesGroup === 'scriteria' ? 
                  'Number of success criteria' : 'Number of pages/assertions'
          }
        },
        legend: {
          enabled: true   
        },
        plotOptions: {
          column: {
            getExtremesFromAll: true
          },
          series: {
            showInNavigator: true,
            animation: {
              duration: 0
            },
            events: {
              legendItemClick: (e) => {
                this.updateBySelection(e.target['_i'], 1);
              }  
            },
          }
        },
        series: resultData.length ? resultData : undefined
      });

      if(subtitle)
        this.chart.setSubtitle({text: subtitle});
    }
  }

  prepareSubtitle(data: any, subs: string[]): string {
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
          if(sub === 'sector'){
            
            if(result) {
              result = result + "; ";
            }
            let sectorIds = this.activatedRoute.snapshot.queryParams['sectorIds'];
            sectorIds = sectorIds.split(',');
            
            //remove all sectorIds manually inserted
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

  isSeriesVisible(index: number): boolean {
    let result;
    let parameterParam = this.activatedRoute.snapshot.queryParams['p'];
    let i = index.toString();
    // visible if index exists on p queryParam or
    // if studying assertions, visible nPages (i=0) or
    // if studying scriteria, visible nPassed and nFailed (i=0,1)
    if(parameterParam){
      result = parameterParam.split(',').includes(i);
    } else {
      if(this.actualVariablesGroup === 'assertions'){
        result = index === 0;
      } else {
        result = index === 0 || index === 1;
      }
    }
    return result;
  }

  submittedCategory(cat: string, extra?: any){
    if(!extra){
      this.router.navigate(['../' + cat], {
        relativeTo: this.activatedRoute
      });
    } else {
      let queryParamsString = '{"' + extra.filter + '":"' + extra.id + '"';

      let actualExtras = this.activatedRoute.snapshot.queryParams;
      if(actualExtras){
        for(let params in actualExtras){
          if(POSSIBLE_FILTERS.includes(params) && params !== extra.filter && params !== 'filter' && params !== 'p'){
            queryParamsString = queryParamsString + ',"'
                     + params + '":"' + actualExtras[params] + '"';
          }
        }
      }
      queryParamsString = queryParamsString + '}';

      this.router.navigate(['../' + cat], {
        relativeTo: this.activatedRoute,
        queryParams: JSON.parse(queryParamsString)
      });
    }
  }
  
  comparingCategory(data: any){
    this.router.navigate(['../../compare/' + this.actualVariablesGroup + '/' + this.actualCategory], {
      relativeTo: this.activatedRoute,
      queryParams: data.queryParams
    });
  }

  changeType() {
    if(this.actualVariablesGroup === 'assertions'){
      this.router.navigate(['../../timeline/scriteria'], {
        queryParams: {
          p: '0,1'
        },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['../../timeline/assertions'], {
        queryParams: {
          p: '0'
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  updateMenuTableText() {
    let updatedText = this.showTable ? 'Hide data table' : 'Show and go to data table';
    this.chart.update(
      {exporting: {
        menuItemDefinitions: {
          viewData: {
            text: updatedText
          }
        }
      }});
  }

  selectAllCheckboxes() {
    this.router.navigate([], {
      queryParams: {
        filter: null
      },
      queryParamsHandling: 'merge'
    });
  }
  unselectAllCheckboxes() {
    this.router.navigate([], {
      queryParams: {
        filter: this.xAxisVars.map(x => x.id).join(',')
      },
      queryParamsHandling: 'merge'
    });
  }

  addDataToTable(header: string, data: number[], rowIndex: number, table: any[]): any[] {
    if(!table[rowIndex])
      table[rowIndex] = [];

    table[rowIndex][0] = header;

    // +1 because header will be the first column
    let actualColIndex = 1;
    for(let i = 0; i < data.length; i++){
      table[rowIndex][actualColIndex] = data[i];
      actualColIndex++;
    }
    return table;
  }
}
