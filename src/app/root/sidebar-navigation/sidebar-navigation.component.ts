import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

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
  
  constructor(private router: Router) {
    router.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        this.scriteriaGroup = window.location.href.split('/')[4] === 'scriteria';
        this.variableGroup = this.scriteriaGroup ? 'scriteria' : 'assertions';
      }
    });
  }

  ngOnInit(): void {
    this.visible = window.innerWidth > 959;
    this.scriteriaGroup = window.location.href.split('/')[4] === 'scriteria';
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

}
