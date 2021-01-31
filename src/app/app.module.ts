import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'

import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';

import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import * as Highcharts from 'highcharts';
import * as Highstocks from 'highcharts/highstock';
import HC_accessibility from 'highcharts/modules/accessibility';
import HC_exporting from 'highcharts/modules/exporting';
import HC_exportdata from 'highcharts/modules/export-data';
import HC_boost from 'highcharts/modules/boost';
HC_accessibility(Highcharts);
HC_exporting(Highcharts);
HC_exportdata(Highcharts);
HC_boost(Highcharts);
HC_accessibility(Highstocks);
HC_exporting(Highstocks);
HC_exportdata(Highstocks);
HC_boost(Highstocks);

import { FilterPipe } from '../utils/filter.pipe';

import { AppComponent } from './app.component';
import { SubmitEarlReportComponent } from './admin/submit-earl-report/submit-earl-report.component';
import { SubmitAccessibilityStatementComponent } from './admin/submit-accessibility-statement/submit-accessibility-statement.component';
import { ErrorDialogComponent } from './dialogs/error-dialog/error-dialog.component';
import { DrilldownDialogComponent } from './dialogs/drilldown-dialog/drilldown-dialog.component';
import { GraphicPickerComponent } from './graphic-related/graphic-picker/graphic-picker.component';
import { GraphicSingleComponent } from './graphic-views/graphic-single/graphic-single.component';
import { GraphicCompareComponent } from './graphic-views/graphic-compare/graphic-compare.component';
import { AdminPageComponent } from './admin/admin-page/admin-page.component';
import { DatabaseDialogComponent } from './dialogs/database-dialog/database-dialog.component';
import { AppSCListComponent } from './graphic-views/app-sclist/app-sclist.component';
import { GraphicBreadcrumbsComponent } from './graphic-related/graphic-breadcrumbs/graphic-breadcrumbs.component';
import { SuccessDialogComponent } from './dialogs/success-dialog/success-dialog.component';
import { CompareDialogComponent } from './dialogs/compare-dialog/compare-dialog.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { GraphicTimelineComponent } from './graphic-views/graphic-timeline/graphic-timeline.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';
import { SidebarNavigationComponent } from './root/sidebar-navigation/sidebar-navigation.component';

const appRoutes: Routes = [
  { path: '', 
    //redirectTo: 'admin',
    redirectTo: 'assertions/continent',
    pathMatch: 'full'
  },

  { path: 'assertions',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'continent' },
      { path: 'continent', component: GraphicSingleComponent },
      { path: 'country', component: GraphicSingleComponent },
      { path: 'tag', component: GraphicSingleComponent },
      { path: 'sector', component: GraphicSingleComponent },
      { path: 'org', component: GraphicSingleComponent },
      { path: 'app', component: GraphicSingleComponent },
      { path: 'eval', component: GraphicSingleComponent },
      { path: 'sc', component: GraphicSingleComponent },
      { path: 'type', component: GraphicSingleComponent },
      { path: 'rule', component: GraphicSingleComponent }
    ]
  },

  { path: 'scriteria',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'continent' },
      { path: 'continent', component: GraphicSingleComponent },
      { path: 'country', component: GraphicSingleComponent },
      { path: 'tag', component: GraphicSingleComponent },
      { path: 'sector', component: GraphicSingleComponent },
      { path: 'org', component: GraphicSingleComponent },
      { path: 'app', component: GraphicSingleComponent },
      { path: 'eval', component: GraphicSingleComponent },
      { path: 'scApp', component: AppSCListComponent}
    ]
  },

  { path: 'compare',
    children: [
    { path: '', pathMatch: 'full', redirectTo: 'assertions' },
    { path: 'assertions', 
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'continent' },
        { path: 'continent', component: GraphicCompareComponent },
        { path: 'country', component: GraphicCompareComponent },
        { path: 'tag', component: GraphicCompareComponent },
        { path: 'sector', component: GraphicCompareComponent },
        { path: 'org', component: GraphicCompareComponent },
        { path: 'app', component: GraphicCompareComponent },
        { path: 'eval', component: GraphicCompareComponent },
        { path: 'sc', component: GraphicCompareComponent },
        { path: 'type', component: GraphicCompareComponent },
        { path: 'rule', component: GraphicCompareComponent }
      ]},
    { path: 'scriteria', 
      children: [
        { path: '', pathMatch: 'full', redirectTo: 'continent' },
        { path: 'continent', component: GraphicCompareComponent },
        { path: 'country', component: GraphicCompareComponent },
        { path: 'tag', component: GraphicCompareComponent },
        { path: 'sector', component: GraphicCompareComponent },
        { path: 'org', component: GraphicCompareComponent },
        { path: 'app', component: GraphicCompareComponent },
        { path: 'eval', component: GraphicCompareComponent },
      ]}
    ]
  },

  { path: 'timeline',
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'assertions' },
      { path: 'assertions', component: GraphicTimelineComponent },
      { path: 'scriteria', component: GraphicTimelineComponent }
    ]
  },
  { path: 'about', component: AboutPageComponent },

  { path: 'admin', component: AdminPageComponent },
  
  // Error handling path
  { path: '**', 
    //redirectTo: 'admin',
    redirectTo: 'assertions/continent',
    //redirectTo: 'continent',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    AppComponent,
    SubmitEarlReportComponent,
    SubmitAccessibilityStatementComponent,
    ErrorDialogComponent,
    DrilldownDialogComponent,
    GraphicPickerComponent,
    GraphicSingleComponent,
    GraphicCompareComponent,
    AdminPageComponent,
    DatabaseDialogComponent,
    AppSCListComponent,
    GraphicBreadcrumbsComponent,
    SuccessDialogComponent,
    CompareDialogComponent,
    ErrorPageComponent,
    GraphicTimelineComponent,
    FilterPipe,
    AboutPageComponent,
    SidebarNavigationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }
    ),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatIconModule,
    MatCheckboxModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatSelectModule,
    MatToolbarModule,
    MatMenuModule,
    MatCardModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatDividerModule,
    FlexLayoutModule,
    MatRadioModule
  ],
  entryComponents: [ErrorDialogComponent],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
