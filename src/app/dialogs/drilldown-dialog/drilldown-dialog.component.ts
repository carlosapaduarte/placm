import { Component, OnInit, Inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LABELS_SINGULAR, LABELS_PLURAL, POSSIBLE_FILTERS, queryParamsRegex } from 'utils/constants';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { startWith } from 'rxjs/internal/operators/startWith';
import { map } from 'rxjs/internal/operators/map';
import { CombinedService } from 'services/combined.service';

@Component({
  selector: 'app-drilldown-dialog',
  templateUrl: './drilldown-dialog.component.html',
  styleUrls: ['./drilldown-dialog.component.css']
})
export class DrilldownDialogComponent implements OnInit {

  category: string;
  categoryName: string;
  categoryNamePlural: string;
  filterName: string;
  name: string;
  variable: string;
  id: string;
  variableGroup: string;
  selectedCategory: string;
  lastDrilldown: boolean;
  scApp: boolean;
  queryParams: any[];

  teste: {id: 0, name: 'ola'};

  compareForm: FormGroup;
  sameNames: any[] = [];
  categories: any[] = [];
  names: any[] = [];
  sameNamesOptions: Observable<any[]>;
  categoriesOptions: Observable<any[]>;
  namesOptions: Observable<any[]>;
  namesOptionsReady: boolean = false;

  scriteriaTimelineVisible: boolean;

  @ViewChild('autocompleteTrigger') autocompleteTrigger;
  @ViewChild('selectAllOption') selectAllOption;
  constructor(@Inject(MAT_DIALOG_DATA) data,
    public dialog: MatDialog,
    private dialogRef: MatDialogRef<DrilldownDialogComponent>,
    private combinedService: CombinedService,
    private cd: ChangeDetectorRef) {
      this.category = data.category;
      this.categoryName = LABELS_SINGULAR[this.category].toLowerCase();
      this.categoryNamePlural = LABELS_PLURAL[this.category].toLowerCase();
      this.variableGroup = data.group;
      this.filterName = data.filter;
      this.name = data.name;
      this.variable = data.variable;
      this.id = data.id;
      this.lastDrilldown = this.category === 'rule' || (this.variableGroup === 'scriteria' && this.category === 'eval');
      this.scApp = this.category === 'app' && this.variableGroup === 'scriteria';
      this.queryParams = data.queryParams;

      if(this.variableGroup === 'assertions'){
        this.scriteriaTimelineVisible = true;
      } else {
        switch(this.category){
          case 'continent':
          case 'country':
          case 'tag':
          case 'sector':
          case 'org':
          case 'app':
          case 'eval':
            this.scriteriaTimelineVisible = true;
            break;
          default:
            this.scriteriaTimelineVisible = false;
            break;
        }
      }

      this.prepareCategories();
      this.initializeForms();
    }

  async ngOnInit(): Promise<void> {
    await this.prepareNames();
    this.sameNamesOptions = this.compareForm.controls.sameNames!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('names', name) : this.sameNames.slice()));   

    this.categoriesOptions = this.compareForm.controls.category!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('category', name) : this.categories.slice()));

    this.namesOptions = this.compareForm.controls.names!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('names', name) : this.names.slice()));   
  }

  close() {
    this.dialogRef.close();
  }

  changedCategorySelection(category: any){
    this.selectedCategory = category;
  }

  goToSCDetailsPage(){
    this.dialogRef.close({selected: 'scApp', filter: this.filterName, id: this.id});
  }
  
  goToTimelinePage(){
    this.dialogRef.close({selected: 'timeline', filter: this.filterName, id: this.id});
  }

  async goToCompPageSame(){
    let idsSelected = this.compareForm.controls.sameNames.value.map(x => x.id);
    this.dialogRef.close({comparing: true,
                          selected: this.category,
                          ids: idsSelected,
                          queryParams: await this.prepareQueryParams(this.category, idsSelected, false)})
  }

  async goToCompPageDifferent(){
    let categorySelected = this.compareForm.controls.category.value ?
                            this.compareForm.controls.category.value.value :
                            this.category;
    let idsSelected = this.compareForm.controls.names.value.map(x => x.id);
    this.dialogRef.close({comparing: true,
                          selected: categorySelected,
                          ids: idsSelected,
                          queryParams: await this.prepareQueryParams(categorySelected, idsSelected, true)})
  }

  submittedCategory(){
    this.dialogRef.close({selected: this.selectedCategory, filter: this.filterName, id: this.id});
  }

  private initializeForms(){
    this.compareForm = new FormGroup({
      'category': new FormControl(''),
      'names': new FormControl(''),
      'sameNames': new FormControl(''),
    });
  }

  async prepareNames(): Promise<void> {
    this.sameNames = await this.combinedService.getNames(this.category, this.queryParams);
    if(this.sameNames && this.sameNames['success'] === 1 && this.sameNames['result'].length > 0){
      this.sameNames = this.sameNames['result'];
      let nullIndex = this.sameNames.findIndex(function(item, i) {
        return item.id === null;
      });
      if(nullIndex >= 0){
        this.sameNames[nullIndex].id = 0;
        this.sameNames[nullIndex].name = 'Unspecified'
      }
      this.sameNames.sort(function(a, b){
        return a.name.localeCompare(b.name);
      });
      this.compareForm.get('sameNames').setValue(this.sameNames.filter(x => {if(x.id === this.id) return x}));
    } else {
      this.sameNames = [];
    }
  }

  selectAllNameOptions(): void {
    if(this.selectAllOption._selected){
      this.compareForm.get('names').setValue(this.names);
      this.selectAllOption._selected = true;
    } else {
      this.compareForm.get('names').setValue([]);
    }
  }

  prepareCategories(): void {
    this.categories = [];
    let futureCategories = [];
    switch(this.category){
      case 'continent':
        futureCategories = ['country', 'tag'];
        break;
      case 'country':
        futureCategories = ['continent', 'tag'];
        break;
      case 'tag':
        futureCategories = ['continent', 'country', 'sector'];
        break;
      case 'sector':
        futureCategories = ['continent', 'country', 'tag', 'org', 'app'];
        break;
      case 'org':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'app'];
        break;
      case 'app':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org'];
        break;
      case 'eval':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app'];
        break;
      case 'sc':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval'];
        break;
      case 'type':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval', 'sc'];
        break;
      case 'rule':
        futureCategories = ['continent', 'country', 'tag', 'sector', 'org', 'app', 'eval', 'sc', 'type'];
        break;
      default:
        futureCategories = [];
        break;
    }

    for(let cat of futureCategories){
      this.categories.push(
        {
          name: LABELS_SINGULAR[cat],
          plural: LABELS_PLURAL[cat],
          value: cat
        }
      );
    }
  }
  
  async prepareQueryParams(cat: string, ids: number[], filter?: boolean): Promise<any> {
    let selectedParam = cat + 'Ids';
    let queryParamsString = '{"' + selectedParam + '":"' + ids.join(',') + '"';
    if(this.queryParams){
      for(let params in this.queryParams){
        if(POSSIBLE_FILTERS.includes(params) && params !== selectedParam && params !== 'filter' && params !== 'p'){
          queryParamsString += ',"' + params + '":"' + this.queryParams[params] + '"';
        }
      }
    }

    let data, filters: any[] = [];
    if(filter){
      data = await this.combinedService.getData(this.category, this.variableGroup, this.queryParams);
      if(data['success'] === 1){
        filters = data['result'].map(x => x.id === null ? 0 : x.id).filter(id => id !== this.id);
        if(filters.length)
          queryParamsString += ',"filter":"' + filters.join(',') + '"';
      }
    } else {
      queryParamsString += ',"p":"' + [...Array(ids.length).keys()].join(',') + '","graph":"1"';
    }

    queryParamsString += '}';
    return JSON.parse(queryParamsString);
  }

  displayFn(cat: any): string {
    return cat && cat.name ? cat.name : '';
  }

  inputControl(event: any) {
    setTimeout(async () => { 
      let isValueTrue = this.categories.filter(myAlias => myAlias.name === event.target.value);
      
      if (isValueTrue.length === 0){
          this.compareForm.get('category').setValue('');
      } else {
        this.namesOptionsReady = false;
        let selectedCategory = this.compareForm.controls['category'].value.value;
        let selectedCategoryIds = selectedCategory + 'Ids';
        let newQueryParams = this.addClickedParams();
        this.names = await this.combinedService.getNames(selectedCategory, newQueryParams);
        if(this.names && this.names['success'] === 1 && this.names['result'].length > 0){
          this.names = this.names['result'];
          let nullIndex = this.names.findIndex(function(item, i) {
            return item.id === null;
          });
          if(nullIndex >= 0){
            this.names[nullIndex].id = 0;
            this.names[nullIndex].name = 'Unspecified'
          }
          this.names.sort(function(a, b){
            return a.name.localeCompare(b.name);
          });
          if(Object.keys(this.queryParams).includes(selectedCategoryIds)){
            this.compareForm.get('names').setValue(this.names.filter(x => {if(this.queryParams[selectedCategoryIds].includes(x.id)) return x}));
          } else {
            this.compareForm.get('names').setValue('');
          }
        } else {
          this.names = [];
        }
        this.namesOptionsReady = true;
        this.cd.detectChanges();
      }
    }, 100);
  }

  private _filter(type: string, value: any): string[] {
    const filterValue = value.toLowerCase();
    let filter;
    switch(type){
      case 'category':
        filter = this.categories.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
      case 'names':
        filter = this.names.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
    }
    return filter;
  }
  
  clearInput(inputName: string) {
    this.compareForm.get(inputName).setValue('');
    if(inputName === 'category')
      setTimeout(() => this.autocompleteTrigger.openPanel());
  }

  private addClickedParams(): any{
    let queryParamsString = '{"' + this.filterName + '":"' + this.id + '"';
    if(this.queryParams){
      for(let params in this.queryParams){
        if(POSSIBLE_FILTERS.includes(params) && params !== 'filter' && params !== 'p'){
          queryParamsString += ',"' + params + '":"' + this.queryParams[params] + '"';
        }
      }
    }
    queryParamsString += '}';
    return JSON.parse(queryParamsString);
  }

}
