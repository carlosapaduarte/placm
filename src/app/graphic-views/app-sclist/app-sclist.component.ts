import { Component, OnInit, ViewChild, QueryList, ViewChildren, AfterViewInit, AfterContentInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { CombinedService } from 'services/combined.service';
import { ActivatedRoute } from '@angular/router';
import { POSSIBLE_FILTERS, queryParamsRegex, LABELS_PLURAL, LABELS_SINGULAR } from 'utils/constants';
import { MatTableDataSource } from "@angular/material/table";
import * as isEmpty from 'lodash.isempty';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-app-sclist',
  templateUrl: './app-sclist.component.html',
  styleUrls: ['./app-sclist.component.css']
})

export class AppSCListComponent implements OnInit {
  loadingResponse: boolean = true;
  allLoaded: boolean = false;

  data: any;
  sortedData: any = [];
  outcomes: any = [];
  chart: any;
  chartReady: boolean = false;
  names: string[] = [];
  breadcrumbsData: string[] = [];
  breadcrumbsReady: boolean = false;

  error: boolean = false;
  errorMessage: number = 0;
  
  displayedColumns: string[] = [
    'outcome',
    'rulename',
    'page',
    'eval',
    'description'
  ];

  sortList: QueryList<MatSort>;
  @ViewChildren(MatSort) set matSort(ms: QueryList<MatSort>) {
    this.sortList = ms;
    if(this.sortedData){
      for(let i = 0; i < this.sortedData.length; i++){
        this.sortedData[i].table.sort = this.sortList.toArray()[i];
      }
    }
  }
  
  constructor(
    private activatedRoute: ActivatedRoute,
    private combinedService: CombinedService,
    private cd: ChangeDetectorRef) {
  }

  async ngOnInit(): Promise<void> {
    await this.prepareQuery();
  }

  async prepareQuery(): Promise<void> {
    let input = this.activatedRoute.snapshot.queryParams;
    // get appIds and filters
    if(!isEmpty(input)){
      
      let removed;
      /*/ removing actual filter from queryParams, because
      // we want to query all data and manipulate this data in the client
      ({[this.actualFilter]: removed, ...input} = input);*/

      // search in all queryParams
      for(let params in input){
        // only accept possible ones
        if(POSSIBLE_FILTERS.includes(params)){
          if(params === 'appIds'){
            if(input[params]){
              if(!queryParamsRegex.test(input[params])){
                // remove all queryParams that are not composed of only numbers or commas
                ({[params]: removed, ...input} = input);
              }
            }
          } else {
            // remove all queryParams different than appIds
            ({[params]: removed, ...input} = input);
          }
        }
      }
    }

    let response;
    let result;
    try{
      response = await this.combinedService.getData('app', 'scriteria');
    } catch (err){
      this.error = true;
      this.errorMessage = 6;
    }
    if (response && response['success'] === 1) {
      result = response['result'];
    } else {
      this.error = true;
      this.errorMessage = 7;
    }

    if(!this.error){
      try{
        response = await this.combinedService.getData('scApp', 'scApp', input);
      } catch (err){
        this.error = true;
        this.errorMessage = 8;
      }
      
      if(!this.error){

        // only prepareGraphic after making sure both queries dont return error
        this.chartReady = true;
        this.cd.detectChanges();
        this.prepareGraphic(result, input);
        this.breadcrumbsData['comparing'] = false;
        this.breadcrumbsData['type'] = 'scriteria';
        this.breadcrumbsData['category'] = 'scApp';
        this.breadcrumbsData['appNames'] = this.names;
        this.breadcrumbsReady = true;

        if (response && response['success'] === 1) {
          this.data = response['result'];
          for(let i = 0; i < this.data.length; i++){
            this.data[i].Assertions = JSON.parse(this.data[i].Assertions);
            this.data[i].table = new MatTableDataSource(this.data[i].Assertions);
          }
          this.prepareAccordions();
          // this for loop is really important - sort data by outcome to make matSort work properly
          for(let d of this.outcomes){
            this.sortedData.push(...d.data); 
          }
          this.allLoaded = true;
          this.loadingResponse = false;
        }
      } else {
        this.error = true;
        this.errorMessage = 9;
      }
    }
  }

  prepareGraphic(appsData: any, input: any): void {
    let nPassed = [],
        nFailed = [], nCantTell = [], 
        nInapplicable = [], nUntested = [];

    let data, graphicData = [];
    if(input && input.appIds){
      data = appsData.filter(function(x) {
        if(input.appIds.split(',').indexOf(x.id.toString()) >= 0){
          return x;
        }
      });
    } else {
      // nao ha params, nao ha grafico -> todo error
      this.error = true;
      this.errorMessage = 5;
    }

    if(data && data.length){
      for(let d of data){
        this.names.push(d.name);
        nPassed.push(d.nPassed);
        nFailed.push(d.nFailed);
        nCantTell.push(d.nCantTell);
        nInapplicable.push(d.nInapplicable);
        nUntested.push(d.nUntested);
      }

      graphicData.push({
        id: 'nPassed',
        name: '# passed criteria',
        data: nPassed,
        visible: true
      });

      graphicData.push({
        id: 'nFailed',
        name: '# failed criteria',
        data: nFailed,
        visible: true
      });

      graphicData.push({
        id: 'nCantTell',
        name: '# cantTell criteria',
        data: nCantTell,
        visible: true
      });

      graphicData.push({
        id: 'nInapplicable',
        name: '# inapplicable criteria',
        data: nInapplicable,
        visible: true
      });

      graphicData.push({
        id: 'nUntested',
        name: '# untested criteria',
        data: nUntested,
        visible: false
      });
      this.chart = Highcharts.chart('chart', {
        chart: {
          type: 'column',
          animation: false
        },
        title: {
          text: this.names.length <= 1 ? 
          LABELS_SINGULAR['app'] + ' ' + this.names[0] + ' column chart' : 
          LABELS_PLURAL['app'] + ' ' + this.names.slice(0, -1).join(', ') + ' and ' + this.names.slice(-1) + ' column chart' 
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
          showTable: this.chart !== undefined ? this.chart.options.exporting.showTable : false,
          menuItemDefinitions: {
            // toggle data table
            viewData: {
                onclick: () => {
                  if(this.chart.options.exporting.showTable){
                    let element = document.getElementsByClassName("highcharts-data-table");
                    if(element)
                      element[0].removeChild(element[0].childNodes[0]);
                  }
                  this.chart.update({
                    exporting: {
                      showTable: !this.chart.options.exporting.showTable
                    }
                  });
                  this.chart.reflow();
                },
                text: 'Toggle data table'
            }
          },
        },
        accessibility: {
          announceNewData: {
              enabled: true
          }
        },
        //eixo dos x - nomes de cada coluna
        xAxis: {
          categories: this.names,
          crosshair: true
        },
        /*legend: {
          accessibility: {
            enabled: true,
            keyboardNavigation: {
              enabled: true
            }
          },
          itemHoverStyle: {}
        },*/
        plotOptions: {
          series: {
            // disabling graphic animations
            animation: false,
            compare: 'value',
            showInNavigator: true
            
          }
        },
        series: graphicData
      });

    } else {
      //todo nao foi possivel calcular os appIds corretamente
    }
  }

  prepareAccordions(): void {
    this.outcomes.push({
      title: 'Passed criteria',
      code: 'passed',
      desc: '',
      data: this.data.filter(function(x) {
        if(x.outcome === 'passed')
          return x;
      })
    });
    this.outcomes.push({
      title: 'Failed criteria',
      code: 'failed',
      desc: '',
      data: this.data.filter(function(x) {
        if(x.outcome === 'failed')
          return x;
      })
    });
    this.outcomes.push({
      title: 'Can\'tTell criteria',
      code: 'cantTell',
      desc: '',
      data: this.data.filter(function(x) {
        if(x.outcome === 'cantTell')
          return x;
      })
    });
    this.outcomes.push({
      title: 'Inapplicable criteria',
      code: 'inapplicable',
      desc: '',
      data: this.data.filter(function(x) {
        if(x.outcome === 'inapplicable')
          return x;
      })
    });
    this.outcomes.push({
      title: 'Untested criteria',
      code: 'untested',
      desc: '',
      data: this.data.filter(function(x) {
        if(x.outcome === 'untested')
          return x;
      })
    });
  }

  trackByIndex(index: number, data: any): number {
    return +data['SCId'].replace('.','');
  }

}
