import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './error-dialog.component.html',
  styleUrls: ['./error-dialog.component.css']
})
export class ErrorDialogComponent implements OnInit {

  links: string[];
  files: string[];
  message: string;
  response: string;

  constructor(
    private dialogRef: MatDialogRef<ErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.links = data.links;
    this.files = data.files;
    this.message = data.message;
    this.response = data.response;
   }

  ngOnInit() {
  }


  close() {
    this.dialogRef.close();
  } 
}
