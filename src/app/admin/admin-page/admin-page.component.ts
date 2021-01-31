import { Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { DatabaseDialogComponent } from 'app/dialogs/database-dialog/database-dialog.component';
import { CombinedService } from 'services/combined.service';

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent implements OnInit {

  countries: any;
  tags: any;
  loading: boolean = true;

  constructor(
    private dialog: MatDialog,
    private combinedService: CombinedService) { }

  async ngOnInit(): Promise<void> {
    try {
      await this.combinedService.getNames('country');
      await this.combinedService.getNames('tag');
      this.loading = false;
    } catch(err) {
      //todo error fix
    }
  }

  ngOnDestroy(){
    this.loading = true;
  }

  openDialog(){
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.disableClose = true;
    dialogConfig.width = '50rem';
    dialogConfig.position = {
      top: '20vh'
    };
    const dialog = this.dialog.open(DatabaseDialogComponent, dialogConfig);
    dialog.afterClosed().subscribe(() => {
      // Do stuff after the dialog has closed
  });
  }

}
