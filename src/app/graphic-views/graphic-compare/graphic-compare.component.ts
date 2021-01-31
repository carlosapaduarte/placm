import { Component, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { CompareDialogComponent } from 'app/dialogs/compare-dialog/compare-dialog.component';
import { LABELS_PLURAL, LABELS_SINGULAR} from '../../../utils/constants';
import { CombinedService } from 'services/combined.service';
import * as Highcharts from 'highcharts';
import { QueryParametersService } from 'services/query-parameters.service';
import { ChartService } from 'services/chart.service';
import { TableService } from 'services/table.service';
import { filter } from 'lodash';

@Component({
  selector: 'app-graphic-compare',
  templateUrl: './graphic-compare.component.html',
  styleUrls: ['./graphic-compare.component.css']
})
export class GraphicCompareComponent implements OnInit {

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
  checkboxClick = false;

  sCriteriaVisible: boolean;

  charts: any[];
  actualCharts: any[] = [];

  chartsReady: boolean = false;
  tableReady: boolean = false;

  comparing: boolean;
  colSpan: number;
  rowIndex: number;

  table: any[];
  showTable: boolean = false;

  failedIds: any[] = [];
  unitedChart: boolean = false;

  breadcrumbsData = {
    comparing: true
  };
  
  error: boolean = false;
  errorMessage: number = 0;

  legendAlreadyClicked: boolean = false;
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
    this.breadcrumbsData['names'] = [];

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

    this.clearExistentCharts();
    // if queryparams changed (even if first load!), but it was a legend change from united charts, then refresh data!
    this.activatedRoute.queryParams.subscribe(async (params: any) => {
      if(this.legendChange) {
        this.legendChange = false;
      } else {
        // make it a bit faster but showing and hiding charts instead of loading them all
        if(this.checkboxClick && this.comparing && !this.unitedChart){
          this.handleCheckboxClick();
          this.afterCheckboxClick();
        } else {
          // load all charts again
          this.clearExistentCharts();
          await this.prepareApplicationGraphic(this.activatedRoute.snapshot.queryParams);
          if(this.checkboxClick){
            this.afterCheckboxClick();
          }
        }
      }
    });
  }

  afterCheckboxClick() {
    let element = document.getElementById("checkboxes");
    element.scrollIntoView();
    this.checkboxClick = false;
  }

  handleCheckboxClick(){
    let resetIds = [];
    let hideIds = [];
    let pArray = this.paramsService.getParam('p', this.activatedRoute.snapshot.queryParams);
    let filterArray = this.paramsService.getParam('filter', this.activatedRoute.snapshot.queryParams);

    // get to know which indexes of checkboxes are clicked
    for(let x = 0; x < this.xAxisVars.length; x++){
      let id = this.xAxisVars[x].id;
      let toHide = !this.unitedChart ? filterArray.indexOf(id.toString()) >= 0 : pArray.indexOf(x.toString()) < 0;
      if(!toHide){
        resetIds.push('chart'+x);
      } else {
        hideIds.push('chart'+x);
      }
      this.xAxisVars[x].checked = !toHide;
    }

    // make charts visible if checkbox clicked
    let chart;
    for(let chartId of hideIds){
      chart = document.getElementById(chartId).style.display = 'none';
    }
    for(let chartId of resetIds){
      chart = document.getElementById(chartId).style.display = 'block';
    }
  }

  // type 0 = checkbox; type 1 = legend click
  updateBySelection(id: number, type: number, e?: any): void {
    this.legendChange = type === 1 && !this.unitedChart;
    this.checkboxClick = type === 0 || (type === 1 && this.unitedChart);
    //this.checkboxData = e;
    let actualParams = this.activatedRoute.snapshot.queryParams;
    //let workingParam = type === 0 ? (!this.unitedChart ? 'filter' : 'p') : 'p';

    let updatedParams;
    [updatedParams, this.legendAlreadyClicked] = this.paramsService.getParamsAfterClick(id, type,
      actualParams, this.actualVariablesGroup, this.actualFilter, true, this.unitedChart, this.legendAlreadyClicked);
    

    for(let c of this.actualCharts){
      // if legend click and click not on chart clicked
      // to make all charts update legend
      if(type === 1 && e.target.chart.renderTo !== c['renderTo']){
        // setVisible toggles visibility
        c.series[id].setVisible();
      }
    }

    this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: updatedParams
    });
  }

  // paramArgInfo here can be all ids of paramArg or id of paramArg
  onPointSelect(e: any, paramArgInfo: number|string, outsideClick: boolean = false, xAxisIndex?: number, chartIndex?: number): void {
    // outsideClick - mouse click outside of column
    // e.point - mouse click on column
    // e.target - keyboard press on column
    if(outsideClick || e.point || e.target){
      let data = outsideClick ? {} : (e.point ? e.point : e.target);
      //let checkedCheckboxes = this.xAxisVars.filter(x => {if(x.checked === true) return x;});
      let checkedCheckboxes = filter(this.xAxisVars, 'checked');

      let titleString = outsideClick ? e.title.textStr : data.series.chart.title.textStr;
      for(let value of Object.values(LABELS_SINGULAR)){
        titleString = titleString.replace(value, '');
      }
      let graphTitle = titleString.replace(' column chart','').trim();

      // manually assigning data if clicked outside
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
      dialogConfig.autoFocus = true;
      dialogConfig.width = '50rem';
      dialogConfig.position = {
        top: '20vh'
      };
      dialogConfig.data = {
        category: this.actualCategory,
        type: this.actualVariablesGroup,
        filter: this.actualFilter,
        name: data.category,
        variable: data.series['userOptions'].id,
        id: checkedCheckboxes[data.index].id,
        queryParams: this.activatedRoute.snapshot.queryParams,
        graphTitle: graphTitle,
        graphId: outsideClick ? +paramArgInfo[chartIndex] : +paramArgInfo
      }
      let dialogRef = this.dialog.open(CompareDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(cat => {
        if(cat){
          this.comparingCategory(cat);
        }
      })
    }
  }
  
  private async prepareApplicationGraphic(input: any){
    /* this.chartResultData = [];
    this.chartNames = []; */
    this.breadcrumbsData = {
      comparing: true
    };
    let assertionsGraphic = this.actualVariablesGroup === 'assertions';
    this.breadcrumbsData['names'] = [];
    let data, rawData;
    let idInParams;
    let resultData = [];
    let subtitle = "";
    let subtitlePossibilities = [];
    let checkboxesPossibilities = [];
    // tableHeaders will be used to store variable names of chart and table headers
    let variableName, tableHeaders = [];
    this.actualCharts = [];
    this.failedIds = [];
    this.chartsReady = false;
    this.tableReady = false;

    // 1. prepare legend names and table headers //
    if(assertionsGraphic){
      variableName = this.actualVariablesGroup;
      tableHeaders.push('# pages');
    } else {
      variableName = 'criteria';
    }
    tableHeaders.push('# passed ' + variableName, 
      '# failed ' + variableName, '# cantTell '+ variableName,
      '# inapplicable ' + variableName, '# untested ' + variableName);
    // 1. -------------------------------------- //
  
    [input, subtitlePossibilities] = this.paramsService.prepareQueryParams(input);

    // 3. get data and send errors //
    let firstParam = Object.keys(input)[0];
    if(!firstParam){
      // we need to have queryParams while comparing!
      this.error = true;
      this.errorMessage = -1;
    }

    if(!this.error){  
      try{
        // input can't be sent as '{}' in this function
        data = await this.combinedService.getData(this.actualCategory, this.actualVariablesGroup, input, true);
      } catch (err){
        this.error = true;
        this.errorMessage = 3;
      }

      if(data && data['success'] === 1){
        if(data['result'].length){
          rawData = data['result'];
        } else {
          this.error = true;
          this.errorMessage = -2;
        }
      } else {
        this.error = true;
        this.errorMessage = 4;
      }
    }
    
    // 3. ------------------------ //

    let existentIds = [];
    let filterArray, pArray;
    let titleCategory, paramArg, orderByParam, orderByParamName;

    if(!this.error){
      filterArray = this.paramsService.getParam('filter', this.activatedRoute.snapshot.queryParams);
      pArray = this.paramsService.getParam('p', this.activatedRoute.snapshot.queryParams);
      [orderByParam, this.comparing] = this.paramsService.getOrderByParam(input, this.actualCategory);

      this.unitedChart = this.comparing && 
        this.activatedRoute.snapshot.queryParams.graph === '1';

      if(this.comparing){
        titleCategory = this.actualCategory;
        paramArg = this.actualCategory + 'Ids';
        orderByParamName = 'name';
      } else {
        titleCategory = orderByParam.replace('Id','');
        paramArg = orderByParam + 's';
        orderByParamName = titleCategory + 'Name';
      }
      let paramArgIds = input[paramArg].split(',');

      // fill null with unspecified (only happens in continent, country or tags)
      if(['continent', 'country', 'tag'].includes(titleCategory)){
        rawData = rawData.map(x => {
          // if not comparing
          if(x[orderByParam] === null){
            x[orderByParam] = 0;
            x[orderByParamName] = 'Unspecified'
          }
          // if comparing
          if(x.id == null){
            x.id = 0;
          }
          return x;
        });
      }

      // splitting result by paramArgIds and storing it in graphSplitData
      let graphSplitData: IHash = {};
      for(let i = 0; i < paramArgIds.length; i++){
        graphSplitData[paramArgIds[i]] = [];
      }

      for(let vars of rawData) {
        if(this.comparing){
          if(graphSplitData[vars.id]){
            graphSplitData[vars.id].push(vars);
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          }
        } else {
          if(!existentIds.includes(vars.id))
            existentIds.push(vars.id);
          if(!this.breadcrumbsData['names'].includes(vars[orderByParamName]))
            this.breadcrumbsData['names'].push(vars[orderByParamName]);
          graphSplitData[vars[orderByParam]].push(vars);
        }
      }

      this.breadcrumbsData['category'] = this.actualCategory;
      this.breadcrumbsData['title'] = titleCategory;
      this.breadcrumbsData['type'] = this.actualVariablesGroup;

      // 4. load charts in dom //
      this.charts = paramArgIds.filter(id => {
        if(graphSplitData[id].length > 0) 
          return id;
      });
      this.chartsReady = true;
      this.cd.detectChanges();
      // 4. ------------------ //
      
      // 5. fill graphSplitData with nulls in empty spaces to make data correlation easier //
      // only happens while not comparingSameType
      for(let i = 0; i < existentIds.length; i++){
        paramArgIds.forEach(id => {
          // if theres any data
          let value = graphSplitData[id];
          if(value.length > 0){
            if(value[i]){
              if(value[i]['id'] !== existentIds[i]){
                let correctIndex = value.findIndex((item, index) => {
                  return item.id === existentIds[i];
                });
                if(correctIndex >= i) {
                  value.splice(i, 0, value[correctIndex]);
                  value.splice(correctIndex+1, 1);
                } else {
                  value.splice(i, 0, {id: existentIds[i], index: i});
                }
              }
            } else {
              value.splice(i, 0, {id: existentIds[i], index: i});
            }
          }
        });
      }
      // 5. ------------------------------------------------------------------------------ //

      let names = [], nPages = [], nPassed = [],
          nFailed = [], nCantTell = [], 
          nInapplicable = [], nUntested = [];

      this.xAxisVars = [];
      let test, testId;
      let chart, chartIndex = 0;
      let dataIndex = 0;
      this.table = [[...tableHeaders]];
      let columnIndex;
      this.colSpan = this.comparing ? 1 : this.charts.length;
      this.rowIndex = 1;
      let tableData: any[];
      let columnHeaders: string[] = [];
      let name;
      let titleName;
      let checkboxIndex = 0;
      let stackingMax = 0;
      let maxValue = 0;

      let chartData: IHashString = {};

      paramArgIds.forEach((key) => {
        if(graphSplitData[key].length > 0){
          columnIndex = this.comparing ? 0 : this.charts.indexOf(key);
          this.rowIndex = this.comparing ? this.rowIndex : 2;
          names = [], nPages = [], nPassed = [],
          nFailed = [], nCantTell = [], 
          nInapplicable = [], nUntested = [];
          resultData = [];
          dataIndex = 0;
          titleName = '';
          for(let vars of graphSplitData[key]){
            tableData = [];
            testId = vars.id ? vars.id : 0;
            name = '';

            if(vars.index !== undefined){
              test = '-';
            } else {
              // get name of variable to put on checkboxes and data
              if(this.actualCategory === 'sc'){
                test = vars.name ? 'SC ' + testId + ' - ' + vars.name : 'Unspecified';
              } else {
                test = vars.name ? vars.name : 'Unspecified';
              }
              // get name of orderByParam to put on chart title
              if(titleName.length === 0){
                titleName = vars[orderByParamName];
                // adding titleName to legend
              }

              if(this.unitedChart)
                chartData[titleName] = [];
            }
            
            idInParams = filterArray.includes(testId.toString()) || (this.unitedChart && !pArray.includes(checkboxIndex.toString()));
            if(test !== '-' && !checkboxesPossibilities.includes(test)){
              checkboxesPossibilities.push(test);
              let checkId = this.unitedChart ? checkboxIndex : testId;
              this.xAxisVars.push({name: test, id: checkId, dbId: testId, checked: !idInParams, groupById: +key});
              checkboxIndex++;
            }

            // only passes if [id not in filter] or [it was manually filled with null and not same index]
            if(!idInParams || (vars.index !== undefined && vars.index !== dataIndex)){
    
              // handling x axis
              if(this.actualCategory === 'sc'){
                name = 'SC ' + testId;
              } else {
                name = test;
              }
              names.push(name);
    
              // handling y axis and table data
              if(vars.index !== undefined){
                if(assertionsGraphic){
                  tableData.push(0);
                  if(!this.unitedChart)
                    nPages.push(0);
                }
                tableData.push(0,0,0,0,0);

                if(!this.unitedChart){
                  nPassed.push(0);
                  nFailed.push(0);
                  nCantTell.push(0);
                  nInapplicable.push(0);
                  nUntested.push(0);
                } else {
                  chartData[titleName].push(...tableData);
                }
              } else {
                if(assertionsGraphic){
                  tableData.push(vars.nPages);
                  if(!this.unitedChart)
                    nPages.push(vars.nPages);
                }
                tableData.push(vars.nPassed);
                tableData.push(vars.nFailed);
                tableData.push(vars.nCantTell);
                tableData.push(vars.nInapplicable);
                tableData.push(vars.nUntested);
                stackingMax = vars.nPassed + vars.nFailed + vars.nCantTell + vars.nInapplicable + vars.nUntested;
                let assertionsMax = Math.max(...tableData);
                maxValue = assertionsGraphic ? (assertionsMax > maxValue ? assertionsMax : maxValue) :
                    (stackingMax > maxValue ? stackingMax : maxValue);

                if(!this.unitedChart){
                  nPassed.push(vars.nPassed);
                  nFailed.push(vars.nFailed);
                  nCantTell.push(vars.nCantTell);
                  nInapplicable.push(vars.nInapplicable);
                  nUntested.push(vars.nUntested);
                } else {
                  chartData[titleName].push(...tableData);
                }
              }
              this.table = this.tableService.addDataToTable(this.table, tableData, true, this.rowIndex, columnIndex, this.colSpan);
              this.table = this.tableService.addRowHeaderToTable(this.table, name, this.rowIndex);
              this.rowIndex++;
            }
            // handling table headers
            if(!this.comparing){
              if(vars[orderByParamName] && !columnHeaders.includes(vars[orderByParamName])){
                columnHeaders.push(vars[orderByParamName]);
                let totalColumns = this.actualVariablesGroup === 'assertions' ? 6 : 5;
                this.table = this.tableService.addColumnHeaderToTable(this.table, vars[orderByParamName], columnIndex, this.colSpan, totalColumns);
              }
            }
            dataIndex++;
          }

          // if its united chart, names will be filled only with one name so we need to fill it with the correct xAxis names
          if(this.unitedChart){
            names = [...tableHeaders];
          }

          // if theres data to present -> does not load empty charts
          if(names.length > 0){
            let visibleSeries = [];

            if(!this.unitedChart){
              let i = 0;
              let nMetrics = this.actualVariablesGroup === 'assertions' ? 5 : 4;
              for(let i = 0; i <= nMetrics; i++){
                visibleSeries.push(
                  this.chartService.isSeriesVisible(i,
                    this.activatedRoute.snapshot.queryParams,
                    true, this.actualVariablesGroup));
              }
              
              resultData = this.chartService.combineChartData(
                this.actualVariablesGroup, tableHeaders, visibleSeries,
                nPassed, nFailed, nCantTell, nInapplicable, nUntested,
                nPages);

            } else {
              let i = 0;
              Object.keys(chartData).forEach((k) => {
                resultData.push({
                  id: k,
                  name: k,
                  data: chartData[k],
                  visible: this.chartService.isSeriesVisible(i,
                            this.activatedRoute.snapshot.queryParams,
                            true, this.actualVariablesGroup, this.unitedChart)
                });
                i++;
              });
            }
            
            if(!(this.unitedChart && resultData.length !== paramArgIds.length)){

              chart = Highcharts.chart({
                chart: {
                  type: 'column',
                  animation: false,
                  renderTo: 'chart'+chartIndex,
                  events: {
                    click: (e: any) =>  {
                      if(!this.comparing){
                        let xAxisValue = Math.abs(Math.round(e.xAxis[0].value));
                        let chartIndex = +e.path[3].id.replace('chart','');
                        this.onPointSelect(this.actualCharts[chartIndex], paramArgIds, true, xAxisValue, chartIndex);
                      }
                    }
                  },
                },
                title: {
                  text: !this.unitedChart ? 
                    LABELS_SINGULAR[titleCategory] + ' ' + titleName + ' column chart':
                    LABELS_PLURAL[titleCategory] + ' ' + 
                    Object.keys(chartData).slice(0, -1).join(', ') + ' and ' + Object.keys(chartData).slice(-1) + 
                    ' column chart'
                },
                //to enable a single tooltip to all series at one point
                tooltip: {
                  enabled: true,
                  shared: true
                },
                credits: {
                  enabled: false
                },
                exporting: {
                  accessibility:{
                    enabled: true
                  },
                  showTable: this.actualCharts[chartIndex] ? this.actualCharts[chartIndex].options.exporting.showTable : false,
                  menuItemDefinitions: {
                    // toggle data table
                    viewData: {
                        onclick: () => {
                          let element;
                          this.showTable = !this.showTable;
                          this.cd.detectChanges();
                          if(this.comparing)
                            element = document.getElementById("tableSame");
                          else
                            element = document.getElementById("tableDiff");
                          
                          if(this.showTable){
                            element.focus();
                            element.scrollIntoView();
                          } 
        
                          this.updateMenuTableText();
                        },
                        text: this.showTable ? 'Hide data table' : 'Show and go to data table'
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
                //eixo dos x - nomes de cada coluna
                xAxis: {
                  categories: names,
                  crosshair: true
                },
                yAxis: {
                  min: 0,
                  title: {
                    text: this.actualVariablesGroup === 'scriteria' ? 
                          'Number of success criteria' : 'Number of pages/assertions'
                  }
                },
                plotOptions: {
                  series: {
                    // disabling graphic animations
                    animation: false,
                    cursor: !this.comparing ? 'pointer' : undefined,
                    events: {
                        legendItemClick: (e) => {
                          this.updateBySelection(e.target['index'], 1, e);
                        }              
                    },
                    point: {
                      events: {
                        click: (e) => {
                          if(!this.comparing)
                            this.onPointSelect(e, key);
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
                chart.setSubtitle({text: subtitle});

              this.actualCharts.push(chart);
              chartIndex++;
            }
          }
        } else {
          this.failedIds.push(key);
        }
      });
      
      let checkedCheckboxes = this.xAxisVars.filter(x => {if(x.checked === true) return x;});
      if(checkedCheckboxes.length === 1){
        this.breadcrumbsData['comparingByOne'] = checkedCheckboxes[0].name;
      }
      this.tableReady = true;

      if(this.actualCategory === 'eval' || this.actualCategory === 'type'){
        this.xAxisVars.sort(function(a, b){
          return a.name.localeCompare(b.name);
        });
      }

      // set the maximum yaxis value and set it to all charts
      for(let chart of this.actualCharts) {
        chart.yAxis[0].update({
          max: maxValue
        });
      }

      // show tooltip on all graphic on mouse hover or keyboard focus
      Array.from(document.getElementsByClassName('chart')).forEach((x) => {
        ['mousemove', 'touchmove', 'touchstart', 'keyup', 'mouseleave'].forEach((eventType) => {
          x.addEventListener( 
            eventType,
            (e) => {
              if(e.type === 'mouseleave'){
                for (let i = 0; i < this.actualCharts.length; i++) {
                  chart = this.actualCharts[i];
                  if (chart) chart.pointer.reset();
                }
              } else {
                if(e.target['point']){
                  let chart, point, i, j, event, serie, points = [];
                  //let chartIndex = +e['path'][5]['id'].replace('chart','');
                  for (i = 0; i < this.actualCharts.length; i++) {
                    points = [];
                    chart = this.actualCharts[i];
                    if (!chart) continue;
    
                    // Find coordinates within the chart
                    event = chart.pointer.normalize(e);
            
                    for (j = 0; j < chart.series.length; j++) {
                      serie = chart.series[j];
                      if (!serie.visible || serie.enableMouseTracking === false) continue;
    
                      point = serie.points[e.target['point']['index']];
    
                      // Get point differently if it's from a keyboard focus ou a mouse hover
                      /*if(e['keyCode'] && [37, 38, 39, 40].includes(e['keyCode'])){
                      point = serie.points[e.target['point']['index']];
                      } else {
                        point = serie.searchPoint(event, false);
                      }*/
    
                      // Get the hovered point
                      if (point) points.push(point); 
                    }
    
                    if (points.length) {
                      if (chart.tooltip.shared) {
                          chart.tooltip.refresh(points);
                      } else {
                          chart.tooltip.refresh(points[0]);
                      }
                      chart.xAxis[0].drawCrosshair(e, points[0]);
                    }
                  }
                }
              }
            }
          );
        });
      });
    }
  }
  
  updateMenuTableText() {
    let updatedText = this.showTable ? 'Hide data table' : 'Show and go to data table';
    for(let c of this.actualCharts){
      c.update(
        {exporting: {
          menuItemDefinitions: {
            viewData: {
              text: updatedText
            }
          }
        }});
    }
  }

  comparingCategory(data: any){
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: data.queryParams
    });
  }

  clearExistentCharts() {
    let existentCharts = Highcharts.charts.filter(x => {if(x !== undefined) return x;});
    for(let chart of existentCharts){
      chart.destroy();
    }
  }

  changeVariablesGroup() {
    this.chartService.changeVariablesGroup(this.actualVariablesGroup, this.actualCategory, false, this.unitedChart);
  }

  changeGraphicType(){
    let filterParams = this.paramsService.getParam('filter', this.activatedRoute.snapshot.queryParams);
    let pParams = this.paramsService.getParam('p', this.activatedRoute.snapshot.queryParams);
    if(this.unitedChart){
      this.legendAlreadyClicked = false;
    }
    this.chartService.changeGraphicType(this.xAxisVars, this.unitedChart, filterParams, pParams);
  }

  handleCheckboxes(handler: boolean){
    this.checkboxClick = true;
    this.chartService.handleAllCheckboxesCompare(handler, this.unitedChart, this.xAxisVars);
    // hide table if unselect all checkboxes
    if(!handler){
      this.showTable = false;
    }
  }
}

export interface IHash {
  [index: number] : any[];
} 
export interface IHashString {
  [index: string] : any[];
}