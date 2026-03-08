import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SteamApp } from '../../models/steam_app';

export const API_URL : string = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root',
})
export class AppData {
  constructor(private http: HttpClient) { }
  
  // Returns list of all SteamApps
  getApps() : Observable<SteamApp[]> {
    return this.http.get<SteamApp[]>(API_URL + '/apps/');
  }
  
  // Returns SteamApps query results of given parameters
  queryApps(
    query: { [key:string]: any } = {}, 
    projection: { [key:string]: any } = {}, 
    options: { [key:string]: any } = {}
  ) : Observable<SteamApp[]> {
    return this.http.post<SteamApp[]>(
      API_URL + '/apps/', 
      {
        query: query,
        projection: projection,
        options: options
      }
    )
  }
  
  // Returns a specific SteamApp
  getApp(appId: number) : Observable<SteamApp> {
    return this.http.get<SteamApp>(API_URL + '/apps/' + appId);
  }

  // Returns the box image of a specific SteamApp
  getAppImage(appId: number) : Observable<ImageData> {
    return this.http.get<ImageData>(API_URL + '/apps/images/' + appId);
  }
}
