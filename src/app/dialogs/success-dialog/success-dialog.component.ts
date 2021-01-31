import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-success-dialog',
  templateUrl: './success-dialog.component.html',
  styleUrls: ['./success-dialog.component.css']
})
export class SuccessDialogComponent implements OnInit {

  results: any;
  result: string[] = [];
  fromAS: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<SuccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.results = data.results;
    this.fromAS = data.fromAS;
   }

  ngOnInit(): void {
    let removed;
    let data = this.results;
    
    // remove unnecessary fields
    let params = ['ASContacts', 'tagApplications', 'tagApplication', 'failedLinks'];
    for(let param of params){
      ({[param]: removed, ...data} = data);
      if(this.fromAS)
        ({[param]: removed, ...data.reports} = data.reports);
    }
    for(let param in data){
      if(param !== 'reports'){
        data[param] = data[param].length;
      }
    }

    if(this.fromAS){
      // get info from reports field
      for(let param in data['reports']){
        if(data[param+'s'] !== undefined){
          data[param+'s'] = data[param+'s'] + data['reports'][param].length;
        } else {
          data[param] = data['reports'][param].length;
        }
      }
    }

    // remove reports and fields with value zero
    // and present the "good" ones
    for(let param in data){ 
      if(data[param] === 0 || param === 'reports'){
       ({[param]: removed, ...data} = data);
      } else {
        this.result.push(data[param] + ' ' + param);
      }
    }
  }

  close() {
    this.dialogRef.close();
  } 
}
