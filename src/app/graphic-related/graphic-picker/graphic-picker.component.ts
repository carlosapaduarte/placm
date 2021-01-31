import { Component, OnInit, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { LABELS_SINGULAR } from 'utils/constants';

@Component({
  selector: 'app-graphic-picker',
  templateUrl: './graphic-picker.component.html',
  styleUrls: ['./graphic-picker.component.css']
})
export class GraphicPickerComponent implements OnInit {

  selectedCategory: string;
  categories: any[];

  graphicVariableGroup: string;

  @Input() actualCategory: string;
  @Input() inputVariableGroup: string;
  @Output() submit = new EventEmitter();
  @Output() change = new EventEmitter();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router)
  { 
    this.router.events.subscribe(event => {
      if(event instanceof NavigationEnd){
        let splittedUrl = event.url.split('/');
        if(splittedUrl.length > 1){
          if(splittedUrl[1] === 'assertions' || splittedUrl[1] === 'scriteria'){
            this.graphicVariableGroup = splittedUrl[1];
          } else {
            this.graphicVariableGroup = 'assertions';
          }
          this.prepareData();
        }
      }
    });
  }


  ngOnInit(): void {
    if(this.inputVariableGroup){
      this.graphicVariableGroup = this.inputVariableGroup;
      this.prepareData();
    }
  }

  prepareData(): void {
    this.categories = [];
    let futureCategories = [];
    switch(this.actualCategory){
      case 'home':
      case 'continent':
        futureCategories = ['country', 'tag', 'sector', 'org', 'app', 'eval', 'sc', 'type', 'rule'];
        break;
      case 'country':
        if(!this.activatedRoute.snapshot.queryParams['tagIds']){
          futureCategories.push('tag');
        }
        futureCategories.push('sector', 'org', 'app', 'eval', 'sc', 'type', 'rule');
        break;
      case 'tag':
        if(!this.activatedRoute.snapshot.queryParams['countryIds']){
          futureCategories.push('country');
        }
        if(!this.activatedRoute.snapshot.queryParams['sectorIds']){
          futureCategories.push('sector');
        }
        futureCategories.push('org', 'app', 'eval', 'sc', 'type', 'rule');
        break;
      case 'sector':
        if(!this.activatedRoute.snapshot.queryParams['tagIds']){
          futureCategories.push('tag');
        }
        futureCategories.push('org', 'app', 'eval', 'sc', 'type', 'rule');
        break;
      case 'org':
        futureCategories = ['app', 'eval', 'sc', 'type', 'rule'];
        break;
      case 'app':
        futureCategories = ['eval', 'sc', 'type', 'rule'];
        break;
      case 'eval':
        futureCategories = ['sc', 'type', 'rule'];
        break;
      case 'sc':
        futureCategories = ['type', 'rule'];
        break;
      case 'type':
        futureCategories = ['rule'];
        break;
      case 'rule':
        futureCategories = [];
        break;
      default:
        futureCategories = [];
        break;
    }

    //to remove sc, type and rule from possible dropdowns
    if(this.graphicVariableGroup === 'scriteria')
      futureCategories = futureCategories.slice(0,-3);

    for(let cat of futureCategories){
      this.categories.push(
        {
          name: LABELS_SINGULAR[cat],
          abbr: cat
        }
      );
    }
  }

  clickedSubmit(value?: any) {
    if(value){
      this.changeCategory(value);
    }
    this.submit.emit(
      {
        cat: this.selectedCategory,
        type: this.graphicVariableGroup
      }
    );
  }

  changeCategory(value: any){
    this.selectedCategory = value;
    this.change.emit(this.selectedCategory);
  }

}
