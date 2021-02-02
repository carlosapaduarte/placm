import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { trim } from 'lodash';
import { FormGroup, FormControl, AbstractControl, Validators } from '@angular/forms';
import { StatementService } from 'services/statement.service';
import { parseFile } from 'utils/file';
import { SERVER_NAME, TYPES, SECTORS, FILEINPUT_LABEL, GENERATORS } from 'utils/constants';
import { map, startWith } from 'rxjs/operators';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { CombinedService } from 'services/combined.service';
import { ErrorDialogComponent } from 'app/dialogs/error-dialog/error-dialog.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SuccessDialogComponent } from 'app/dialogs/success-dialog/success-dialog.component';

@Component({
  selector: 'app-submit-accessibility-statement',
  templateUrl: './submit-accessibility-statement.component.html',
  styleUrls: ['./submit-accessibility-statement.component.css']
})
export class SubmitAccessibilityStatementComponent implements OnInit {
  loadingResponse: boolean;
  asLinks: FormControl;
  sqlData: FormGroup;
  error: boolean;
  linkErrorMessage: string;
  fileErrorMessage: string = '';
  errorFiles: string[];

  filesFromInput: FileList = undefined;

  labelVal: any;
  generators: any;

  dialogConfig: MatDialogConfig;

  errorsLinks: string[] = [];

  countriesOptions: Observable<any[]>;
  tagsOptions: Observable<any[]>;
  countries: any[] = [];
  tags: any[] = [];
  sectors: any[] = [];
  types: any[] = [];

  linksError: string[] = [];
  filesError: string[] = [];
  
  separatorKeysCodes: number[] = [COMMA, ENTER];
  selectedTags: any[] = [];
  selectedTagsNames: string[] = [];
  @ViewChild('tagsInput') tagsInput: ElementRef<HTMLInputElement>;

  constructor(
    private statement: StatementService,
    private dialog: MatDialog,
    private combinedService: CombinedService
  ) {
    this.initializeForms();
    this.dialogConfig = new MatDialogConfig();
    this.dialogConfig.disableClose = true;
    this.dialogConfig.autoFocus = true;
  };

  ngOnInit(){
    this.countriesOptions = this.sqlData.controls.country!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('country', name) : this.countries.slice()));
    this.tagsOptions = this.sqlData.controls.tags!.valueChanges.pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value['name']),
      map(name => name ? this._filter('tag', name) : this.tags.slice()));
    this.prepareData();
    this.labelVal = FILEINPUT_LABEL;
    this.generators = GENERATORS;
  }

  private async prepareData(): Promise<void> {
    if(SERVER_NAME !== undefined){
      this.countries = await this.combinedService.getAllNames('country');
      this.countries = this.countries['result'];
      this.tags = await this.combinedService.getAllNames('tag');
      this.tags = this.tags['result'];
    }
    for(let sec of Object.keys(SECTORS)){
      this.sectors.push({name: SECTORS[sec], value: sec});
      this.types.push({name: TYPES[sec], value: sec});
    }
  }

  private initializeForms(){
    this.asLinks = new FormControl('',[
      this.urlValidator.bind(this)
    ]);
    this.sqlData = new FormGroup({
      'generator': new FormControl('',
        Validators.required),
      'appName': new FormControl(),
      'appUrl': new FormControl(),
      'org': new FormControl(),
      'type': new FormControl('', 
        Validators.required),
      'sector': new FormControl('', 
        Validators.required),
      'country': new FormControl(),
      'tags': new FormControl()
    });
    this.selectedTags = [];
    this.selectedTagsNames = [];
  }
  
  urlValidator(control: AbstractControl): any {
    const urls = control.value;
    
    if(urls.length === 0){
      return null;
    }

    for(let url of urls.split('\n')){
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return null
      } else {
        return {'url': true};
      }
    }

    return null;
  }

  displayFn(cat: any): string {
    return cat && cat.name ? cat.name : '';
  }

  inputControl(event: any) {
    setTimeout(() => {
      let isValueTrue = this.countries.filter(myAlias => myAlias.name === event.target.value);
      if (isValueTrue.length === 0) {
          this.sqlData.get('country').setValue('');
      }
    }, 100);
  }

  private _filter(type: string, value: any): string[] {
    const filterValue = value.toLowerCase();
    let filter;
    switch(type){
      case 'country':
        filter = this.countries.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
      case 'tag':
        filter = this.tags.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
        break;
    }
    return filter;
  }

  addTag(event: any): void {
    if(event.value || event.value === ''){
        if(event.value.trim() !== ''){
          if(this.selectedTagsNames.indexOf(event.value) < 0){
            this.selectedTags.push(event.value);
            this.selectedTagsNames.push(event.value);
          }
        }
    } else {
      if(this.selectedTagsNames.indexOf(event.option.viewValue) < 0){
        this.selectedTags.push(event.option.value);
        this.selectedTagsNames.push(event.option.viewValue);
      }
    }

    // Reset the input value
    this.tagsInput.nativeElement.value = '';
    this.sqlData.controls.tags.setValue('');
  }

  removeTag(tag: string): void {
    const index = this.selectedTagsNames.indexOf(tag);

    if (index >= 0) {
      this.selectedTagsNames.splice(index, 1);
      this.selectedTags.splice(index, 1);
    }
  }

  addFile(e: Event): void {
    this.filesFromInput = (<HTMLInputElement>e.target).files;
    let selectedFiles = this.filesFromInput.length;
    let firstFile = this.filesFromInput[0];

    this.errorFiles = [];

    if(selectedFiles > 1){
      for(let i = 0; i < selectedFiles; i++){
        if(this.filesFromInput[i].type !== 'text/html'){
          this.errorFiles.push(this.filesFromInput[i].name);
        }
      }
      this.labelVal = selectedFiles + " selected files";
    } else {
      if(firstFile && firstFile.name){
        if(firstFile.type !== 'text/html'){
          this.errorFiles.push(firstFile.name);
        }
        this.labelVal = firstFile.name;
      } else {
        this.clearFileInput();
      }
    }
    if(this.errorFiles.length){
      this.fileErrorMessage = 'The following chosen files are not .html files:';
    } else {
      this.fileErrorMessage = '';
    }
  }

  clearFileInput(): void {
    this.filesFromInput = undefined;
    this.labelVal = FILEINPUT_LABEL;
    (<HTMLInputElement>document.getElementById('asFiles')).value = "";
    this.fileErrorMessage = '';
  }

  isInputEmptyOrWithErrors(): boolean {
    return (!trim(this.asLinks.value) && this.filesFromInput === undefined) ||
    (this.asLinks.hasError('url') || !!this.fileErrorMessage.length);
  }

  isDisabledButton(): boolean {
    return this.isInputEmptyOrWithErrors() || this.sqlData.status === 'INVALID';
  }

  async sendFile(): Promise<void> {
    let textareaLinks = trim(this.asLinks.value);
    if (!this.filesFromInput && !textareaLinks) {
      this.asLinks.reset();
      return;
    }

    let linksToRead = textareaLinks.split('\n');
    let linksRead: string[] = [];
    let dataFromLink: string;
    let dataFromLinks: string[] = [];
    let dataFromFiles: string[] = [];

    this.linksError = [];
    this.filesError = [];

    if(linksToRead.length > 0 && linksToRead[0] !== ''){
      for(let link of linksToRead){
        let response;
        try {
          response = await this.combinedService.fetchDocument(link);
          dataFromLink = response.result;
        } catch(err) {
          if(!this.linksError.includes(link))
            this.linksError.push(link);
        }   
        
        if(dataFromLink){
          dataFromLinks.push(dataFromLink);
          linksRead.push(link);
        } else {
          if(!this.linksError.includes(link))
            this.linksError.push(link);
        }
      }
    }

    try {
      if(this.filesFromInput){
        for(let file of Array.from(this.filesFromInput)){
          let dataFromFile = await parseFile(file);
          if(dataFromFile){
            dataFromFiles.push(dataFromFile);
          } else {
            this.filesError.push(file.name);
          }
        }
      }
    } catch (err) {
      this.fileErrorMessage = "parseError";
    }

    if(!!this.filesError.length || !!this.linksError.length || !!this.fileErrorMessage){
      this.dialogConfig.data = {
        links: this.linksError,
        files: this.filesError,
        message: this.fileErrorMessage
      };
      this.dialog.open(ErrorDialogComponent, this.dialogConfig);
    } else {
      let dataFromBothInputs = dataFromLinks.concat(dataFromFiles);
      let dataFromBothInputsJson = JSON.stringify(dataFromBothInputs);
      let linksJson = JSON.stringify(linksRead);
      let formData = this.sqlData.value;
      if(this.sqlData.controls.tags.value !== null && this.sqlData.controls.tags.value !== ''){
        this.selectedTags.push(this.sqlData.controls.tags.value);
      }
      formData['tags'] = this.selectedTags;
      let formDataJson = JSON.stringify(formData);

      this.loadingResponse = true;
      this.statement.sendAccessibilityStatement(SERVER_NAME, linksRead.length, formDataJson, linksJson, dataFromBothInputsJson).then(response => {
        if (!response) {
          this.error = true;
        } else {
          if(response.result.failedLinks.length > 0){
            this.dialogConfig.data = {
              links: response.result.failedLinks,
              response: true
            };
            this.dialog.open(ErrorDialogComponent, this.dialogConfig);
          } else {
            this.dialogConfig.data = {
              results: response.result,
              fromAS: true
            };
            this.dialog.open(SuccessDialogComponent, this.dialogConfig);

            this.labelVal = FILEINPUT_LABEL;
            this.filesFromInput = undefined;
            this.initializeForms();
          }
          this.combinedService.clearStorage();
        }
        this.loadingResponse = false;
      });
    }
  }
}