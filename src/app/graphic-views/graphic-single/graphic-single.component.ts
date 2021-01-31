import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DrilldownDialogComponent } from 'app/dialogs/drilldown-dialog/drilldown-dialog.component';
import { POSSIBLE_FILTERS, LABELS_PLURAL } from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import { QueryParametersService } from 'services/query-parameters.service';
import * as filter from 'lodash.filter';
import * as Highcharts from 'highcharts';
import { ChartService } from 'services/chart.service';
import { TableService } from 'services/table.service';

@Component({
  selector: 'app-graphic-single',
  templateUrl: './graphic-single.component.html',
  styleUrls: ['./graphic-single.component.css']
})
export class GraphicSingleComponent implements OnInit {

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

  sCriteriaVisible: boolean;

  chartsReady: boolean = false;
  
  breadcrumbsData = {};
  
  table: any[];
  showTable: boolean = false;

  error: boolean = false;
  errorMessage: number = 0;

  searchText: string = "";

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private combinedService: CombinedService,
    private paramsService: QueryParametersService,
    private chartService: ChartService,
    private tableService: TableService,
    private cd: ChangeDetectorRef) { }

  ngOnInit(): void {    
    this.initChange = true;
    this.actualVariablesGroup = this.activatedRoute.snapshot.parent.url[0].path;
    this.actualCategory = this.activatedRoute.snapshot.url[0].path;
    this.actualFilter = this.actualCategory + 'Ids';
    
    switch(this.actualCategory){
      case 'continent':
      case 'country':
      case 'tag':
      case 'sector':
      case 'org':
      case 'app':
      case 'eval':
        this.sCriteriaVisible = true;
        break;
      default:
        this.sCriteriaVisible = false;
        break;
    }

    // if queryparams changed (even if first load!), but it was not from a checkbox change, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
      }
    });
  }

  /** 
   * Method to handle mouse and keyboard clicks on columns
   * Opens drilldown-dialog and handles its closing
   */
  onPointSelect(e: any, outsideClick: boolean = false, xAxisIndex?: number): void {
    // outsideClick - mouse click outside of column
    // e.point - mouse click on column
    // e.target - keyboard press on column
    if(outsideClick || e.point || e.target){
      let data = outsideClick ? {} : (e.point ? e.point : e.target);
      let checkedCheckboxes = filter(this.xAxisVars, 'checked');

      // manually getting data if clicked outside
      if(outsideClick){
        data.category = checkedCheckboxes[xAxisIndex].name;
        // no variable clicked, so its empty
        data.series = {
          'userOptions': {
            id: ''
          }
        };
        data.index = xAxisIndex;
      }

      const dialogConfig = new MatDialogConfig();
      dialogConfig.width = '50rem';
      dialogConfig.position = {
        top: '20vh'
      };
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        category: this.actualCategory,
        filter: this.actualFilter,
        group: this.actualVariablesGroup,
        variable: data.series['userOptions'].id,
        name: data.category,
        id: checkedCheckboxes[data.index].id,
        queryParams: this.activatedRoute.snapshot.queryParams
      }
      let dialogRef = this.dialog.open(DrilldownDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(cat => {
        if(cat){
          if(!cat.comparing){
            //this.closedDialog.emit(cat);
            this.submittedCategory(cat.selected, cat);
          } else {
            this.comparingCategory(cat);
          }
        }
      })
    }
  }
  
  private async prepareApplicationGraphic(input: any){
    let data, rawData, filterArray, idInParams;
    this.breadcrumbsData = {};
    let subtitle = "";
    let subtitlePossibilities = [];
    let variableName, tableHeaders = [];
    this.chartsReady = false;

    if(this.actualVariablesGroup === 'assertions'){
      variableName = this.actualVariablesGroup;
      tableHeaders.push('# pages');
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
    this.table = [[...tableHeaders]];

    subtitlePossibilities = this.paramsService.prepareQueryParams(input, true, this.actualFilter);   

    filterArray = this.paramsService.getParam('filter', this.activatedRoute.snapshot.queryParams);
    try{
      // input can be sent as '{}' in this function
      data = await this.combinedService.getData(this.actualCategory, this.actualVariablesGroup, input);
    } catch(err) {
      this.error = true;
      this.errorMessage = 1;
    }

    if(data && data['success'] === 1){
      if(data['result'].length){
        rawData = data['result'];
        subtitle = this.chartService.prepareSubtitle(rawData, subtitlePossibilities, 
                    this.activatedRoute.snapshot.queryParams);
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

      this.xAxisVars = [];
      this.table = [[...tableHeaders]];

      let test, testId, rowIndex = 1;
      for(let vars of rawData){
        tableData = [];
        testId = vars.id ? vars.id : 0;
        if(this.actualCategory === 'sc'){
          test = vars.name ? 'SC ' + testId + ' - ' + vars.name : 'Unspecified';
        } else {
          test = vars.name ? vars.name : 'Unspecified';
        }
        idInParams = filterArray.includes(testId.toString());
        this.xAxisVars.push({name: test, id: testId, checked: !idInParams});
        if(!idInParams){

          // handling x axis
          if(this.actualCategory === 'sc'){
            name = 'SC ' + testId;
          } else {
            name = test;
          }
          names.push(name);

          // handling y axis and table data
          if(this.actualVariablesGroup === 'assertions'){
            tableData.push(vars.nPages);
            nPages.push(vars.nPages);
          }
          nPassed.push(vars.nPassed);
          nFailed.push(vars.nFailed);
          nCantTell.push(vars.nCantTell);
          nInapplicable.push(vars.nInapplicable);
          nUntested.push(vars.nUntested);
          
          tableData.push(vars.nPassed);
          tableData.push(vars.nFailed);
          tableData.push(vars.nCantTell);
          tableData.push(vars.nInapplicable);
          tableData.push(vars.nUntested);
          
          this.table = this.tableService.addDataToTableSimple(name, tableData, rowIndex, this.table);
          rowIndex++;
        }
      }

      this.breadcrumbsData['category'] = this.actualCategory;
      this.breadcrumbsData['type'] = this.actualVariablesGroup;

      this.chartsReady = true;
      this.cd.detectChanges();

      let visibleSeries = [];
      let nMetrics = this.actualVariablesGroup === 'assertions' ? 5 : 4;
      for(let i = 0; i <= nMetrics; i++){
        visibleSeries.push(
          this.chartService.isSeriesVisible(i,
                                            this.activatedRoute.snapshot.queryParams,
                                            true, this.actualVariablesGroup));
      }

      let resultData = this.chartService.combineChartData(
                    this.actualVariablesGroup, tableHeaders, visibleSeries,
                    nPassed, nFailed, nCantTell, nInapplicable, nUntested,
                    nPages);
      
      this.prepareChart(names, resultData, subtitle);
      
    }
  }

  routeAfterCheckboxOrLegendClick(id: number, type: number): void {
    this.legendChange = type === 1;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    let updatedParams = this.paramsService.getParamsAfterClick(id, type, 
                                                              actualParams, 
                                                              this.actualFilter,
                                                              this.actualVariablesGroup)[0];
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: updatedParams
    });
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

      let url = cat !== 'timeline' ? '../' + cat : '../../timeline/' + this.actualVariablesGroup;

      this.router.navigate([url], {
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

  changeVariablesGroup() {
    this.chartService.changeVariablesGroup(this.actualVariablesGroup, this.actualCategory);
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

  handleCheckboxes(handler: boolean){
    this.chartService.handleAllCheckboxesSimple(handler, this.xAxisVars);
  }

  prepareChart(names: string[], resultData: any, subtitle: string){
    this.chart = Highcharts.chart('chart', {
      chart: {
        type: 'column',
        animation: false,
        events: {
          click: (e: any) => {
            let xAxisValue = Math.abs(Math.round(e.xAxis[0].value));
            this.onPointSelect(this.chart, true, xAxisValue);
          }
        }
      },
      title: {
        text: LABELS_PLURAL[this.actualCategory] + ' column chart'
      },
      //to enable a single tooltip to all series at one point
      tooltip: {
        shared: true
      },
      credits: {
        enabled: false
      },
      exporting: {
        accessibility:{
          enabled: true
        },
        showTable: false,
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
      //x axis - column names
      xAxis: {
        categories: names,
        crosshair: true
      },
      yAxis: {
        min: 0,
        tickAmount: 8,
        title: {
          text: this.actualVariablesGroup === 'scriteria' ? 
                'Number of success criteria' : 'Number of pages/assertions'
        }
      },
      plotOptions: {
        series: {
          // disabling graphic animations
          animation: false,
          cursor: 'pointer',
          events: {
              legendItemClick: (e) => {
                this.routeAfterCheckboxOrLegendClick(e.target['_i'], 1);
              }              
          },
          point: {
            events: {
              click: (e) => {
                this.onPointSelect(e);
              }
            }
          },
          compare: 'value',
          showInNavigator: true
        },
        column: {
          /* stacked bars if graphic metrics are success criteria related */
          stacking: this.actualVariablesGroup === 'scriteria' ? 'normal' : undefined
        }
      },
      series: resultData
    });

    if(subtitle)
      this.chart.setSubtitle({text: subtitle});
  }

}