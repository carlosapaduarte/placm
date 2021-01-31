import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor() { }


  addDataToTableSimple(header: string, data: number[], rowIndex: number, table: any[]): any[] {
    if(!table[rowIndex])
      table[rowIndex] = [];

    table[rowIndex][0] = header;

    // +1 because header will be the first column
    let actualColIndex = 1;
    for(let i = 0; i < data.length; i++){
      table[rowIndex][actualColIndex] = data[i];
      actualColIndex++;
    }
    return table;
  }

  addDataToTable(table: any[], data: number[], multipleCharts: boolean,
                rowIndex: number, columnIndex: number = 0,
                addColumnIndex: number = 1): any[] {
    // +1 because header will be the first column
    let actualColIndex = multipleCharts ? columnIndex+1 : 0;

    for(let i = 0; i < data.length; i++){
      if(!table[rowIndex])
        table[rowIndex] = [];
      table[rowIndex][actualColIndex] = data[i];
      actualColIndex += addColumnIndex;
    }
    return table;
  }

  addRowHeaderToTable(table: any[], header: string, rowIndex: number): any[] {
    if(header !== undefined && header !== '-' && header !== ''){
      if(!table[rowIndex])
          table[rowIndex] = [];
      table[rowIndex][0] = header;
    }
    return table;
  }

  addColumnHeaderToTable(table: any[], header: string, columnIndex: number, addColumnIndex: number, totalColumns: number): any[] {
    let actualColIndex = columnIndex;
    for(let i = 0; i < totalColumns; i++){
      if(!table[1])
          table[1] = [];
      table[1][actualColIndex] = header;
      actualColIndex += addColumnIndex;
    }
    return table;
  }

}
