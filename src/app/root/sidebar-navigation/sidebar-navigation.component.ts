import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { VAR_GROUP_INDEX_URL, CLASSES } from 'utils/constants';

@Component({
  selector: 'app-sidebar-navigation',
  templateUrl: './sidebar-navigation.component.html',
  styleUrls: ['./sidebar-navigation.component.css']
})
export class SidebarNavigationComponent implements OnInit {

  visible: boolean;
  clickedButton: boolean = false;
  scriteriaGroup: boolean = false;
  variableGroup: string;
  actualClass: string;
  classes: string[] = CLASSES;
  
  constructor(private router: Router) {
    router.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        this.handleUrlChange();
        this.variableGroup = this.scriteriaGroup ? 'scriteria' : 'assertions';
      }
    });
  }

  ngOnInit(): void {
    this.handleUrlChange();
    this.visible = window.innerWidth > 959;
    this.variableGroup = this.scriteriaGroup ? 'scriteria' : 'assertions';
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if(!this.clickedButton){
      if(window.innerWidth > 959){
        this.visible = true;
      } else if(this.visible) {
        this.visible = false;
      }
    }
  }

  toggleVisibility(): void{
    this.visible = !this.visible;
    this.clickedButton = true;
  }

  handleUrlChange(){
    let splittedUrl = window.location.href.split('/');
    switch(splittedUrl[VAR_GROUP_INDEX_URL]){
      case 'about':
        this.actualClass = 'about';
        break;
      case 'admin':
        this.actualClass = 'admin';
        break;
      case 'compare':
        this.scriteriaGroup = splittedUrl[VAR_GROUP_INDEX_URL+1] === 'scriteria';
        this.actualClass = splittedUrl[VAR_GROUP_INDEX_URL+2].split('?')[0];
        break;
      case 'timeline':
        let path = splittedUrl[VAR_GROUP_INDEX_URL+1].split('?');
        this.scriteriaGroup = path[0] === 'scriteria';
        this.actualClass = this.getClassByQueryParams(path[1]);
        break;
      default:
        this.scriteriaGroup = splittedUrl[VAR_GROUP_INDEX_URL] === 'scriteria';
        this.actualClass = splittedUrl[VAR_GROUP_INDEX_URL+1].split('?')[0];
        break;
    }
  }


  getClassByQueryParams(queryParams: string){
    let firstParam = queryParams.split('&')[0];
    let keyFirstParam = firstParam.split('=')[0];
    return keyFirstParam.replace('Ids','');
  }

}
