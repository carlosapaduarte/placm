import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { POSSIBLE_FILTERS, HOMEPAGE_LINK, LABELS_SINGULAR, LABELS_PLURAL, queryParamsRegex } from 'utils/constants';

@Component({
  selector: 'app-graphic-breadcrumbs',
  templateUrl: './graphic-breadcrumbs.component.html',
  styleUrls: ['./graphic-breadcrumbs.component.css']
})
export class GraphicBreadcrumbsComponent implements OnInit {

  breadcrumbs: any = [];
  graphicType: string;
  category: string;
  comparing: boolean;
  comparingByOneName: string;
  appNames: string[];

  homepageName = HOMEPAGE_LINK;

  @Input('data') data: any;
  constructor(
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.comparing = this.data.comparing;
    this.graphicType = this.data.type;
    this.category = this.data.category;
    // scApp only
    this.appNames = this.data.appNames;
    this.comparingByOneName = this.data.comparingByOne;

    this.activatedRoute.queryParams.subscribe(() => {
      if(this.comparing)
        this.prepareComparingBreadcrumbs();
      else
        this.prepareBreadcrumbs();
    });
  }

  prepareBreadcrumbs(): void {
    this.breadcrumbs = [];
    let queryParams = this.activatedRoute.snapshot.queryParams;
    let removed;
    let removableFilters = ['filter', 'p', 'graph'];
    for(let f of removableFilters){
      if(queryParams[f])
        ({[f]: removed, ...queryParams} = queryParams);
    }

    let keys = (Object.keys(queryParams)).reverse();
    let route = "";
    let queryParamsToBe = []

    for(let i = 0; i < keys.length; i++){
      if(POSSIBLE_FILTERS.includes(keys[i])){
        queryParamsToBe = [];
        for(let j = i; j >= 0; j--) {
          if(j === i){
            route = keys[j].replace('Ids', '');
          } else {
            queryParamsToBe.push('"' + keys[j] + '":"' + queryParams[keys[j]] + '"');
          }
        }
        this.breadcrumbs.push(
          {
            name: LABELS_SINGULAR[route],
            route: '/' + this.graphicType + '/' + route,
            queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
          });
      }
    }

    if(this.category === 'scApp'){
      if(keys.length){
        this.breadcrumbs.push(
          {
            name: this.appNames.join(';')
          }
        );
      }
    } else if(this.category === 'timeline') {
      this.breadcrumbs.push({
        name: 'Timeline'
      });
    } else {
      this.breadcrumbs.push(
        {
          name: LABELS_SINGULAR[this.activatedRoute.snapshot.routeConfig.path]
        }
      );
    }
  }

  prepareComparingBreadcrumbs(): void {
    this.breadcrumbs = [];
    let queryParamsToBe = [];
    let queryParams = this.activatedRoute.snapshot.queryParams;
    let keys = (Object.keys(queryParams));
    for(let i = 1; i < keys.length; i++){
      if(POSSIBLE_FILTERS.includes(keys[i]) && keys[i] !== 'p' && keys[i] !== 'filter'){
        queryParamsToBe.push('"' + keys[i] + '":"' + queryParams[keys[i]] + '"');
      }
    }
    this.breadcrumbs.push(
      {
        name: LABELS_SINGULAR[this.category],
        route: '/' + this.graphicType + '/' + this.category,
        queryParams: JSON.parse('{' + queryParamsToBe.join(',') + '}')
      });
      
    let result = this.prepareComparingText();  
    this.breadcrumbs.push(
      {
        name: result,
      });
  }

  prepareComparingText(): string {
    let names = this.data.names;
    let result = 'Comparing ';
    if(this.comparingByOneName === undefined){
      result += LABELS_PLURAL[this.category];
    } else {
      if(this.category !== 'sc')
        result += LABELS_SINGULAR[this.category];
      result += ' \'' + this.comparingByOneName + '\'';
    }
    if(this.category !== this.data.title){
      result += ' grouped by ' + LABELS_PLURAL[this.data.title];
    }
    result += ' (';
    if(names.length > 1){
      result += names.slice(0, -1).join(', ') + ' and ';
    }
    result += names.slice(-1) + ')';
    return result;
  }

}
