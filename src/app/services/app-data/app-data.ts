import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SteamApp } from '../../models/steam_app';


export const API_URL : string = 'http://localhost:3000/api';
export const DEFAULT_MOBILE_IMAGE_URL : string = '../public/images/mobile.jpg'
export const DEFAULT_DESKTOP_IMAGE_URL : string = '../public/images/desktop.jpg'

// SteamApp imageTypes best suited for mobile layouts
// ordered from most to least desired
export const MOBILE_IMAGETYPES : string[] = [
  "header", "libraryHero", "600x900"
];

// SteamApp imageTypes best suited for desktop/laptop layouts
// ordered from most to least desired
export const DESKTOP_IMAGETYPES : string[] = [
  "600x900_2x", "600x900", "header"
];

// Chain of default imageTypes in descending priority.
// This is used after failing to get layout-specific images.
export const DEFAULT_IMAGE_CHAIN : string[] = [
  'header', '600x900_2x', '600x900', 'libraryHero'
];


@Injectable({
  providedIn: 'root',
})
export class AppData {
  constructor(private http: HttpClient) {}
  
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
  

  // Samples (limit) random SteamApps that fit (match) criteria.
  // Subsequent calls may return different apps
  // even if their parameters are the same.
  sampleApps(match: { [key:string]: any}, limit: number) : Observable<SteamApp[]> {
    return this.http.post<SteamApp[]>(
      API_URL + "/apps-sample",
      {
        match: match,
        limit: limit
      }
    )
  }
  
  
  // Returns a specific SteamApp
  getApp(appId: number) : Observable<SteamApp> {
    return this.http.get<SteamApp>(API_URL + '/apps/' + appId);
  }


  // Returns the box image of a specific SteamApp
  // depreciated - switching to getApp(Mobile/Desktop)Image and
  // getAppDefaultImage instead
  getAppImage(appId: number) : Observable<ImageData> {
    return this.http.get<ImageData>(API_URL + '/apps/images/' + appId);
  }

  
  // Returns default image for a SteamApp.
  getAppDefaultImage(app: SteamApp, mobile: boolean = false) : Observable<Blob> {
    // Getting first known URL
    let url : string | undefined;

    // TODO different priority chain for mobile?
    for (let imageType of DEFAULT_IMAGE_CHAIN) {
      if (!(imageType in app.images)) {
        continue;
      }
      
      url = app.images[imageType];
    }

    // Seeing if there are any available images
    if (url === undefined) {
      const imageTypes = Object.keys(app.images) as Array<string>;
      if (imageTypes.length > 0) {
        url = app.images[imageTypes[0]];
      }
    }
    
    // No images known for this app
    if (url === undefined) {
      // TODO verify this returns default image
      return (mobile)
        ? this.http.get(DEFAULT_MOBILE_IMAGE_URL, { responseType: 'blob' })
        : this.http.get(DEFAULT_DESKTOP_IMAGE_URL, { responseType: 'blob' }); 
    }
    
    return this.http.get(url, { responseType: 'blob' });
  }
  

  // Attempts to find a SteamApp's best image for mobile device layouts.
  getAppMobileImage(app: SteamApp) : Observable<Blob> | undefined {
    // Getting first known URL
    let url : string | undefined;
    for (let imageType of MOBILE_IMAGETYPES) {
      if (!(imageType in app.images)) {
        continue;
      }
      
      url = app.images[imageType];
      break;
    }
    
    // No mobile images known for this app
    if (url === undefined) {
      return undefined;
    }
    
    return this.http.get(url, { responseType: 'blob' });
  }


  // Attempts to find a SteamApp's best image for desktop/laptop layouts
  getAppDesktopImage(app: SteamApp) : Observable<Blob> | undefined {
    // Getting first known URL
    let url : string | undefined;
    for (let imageType of DESKTOP_IMAGETYPES) {
      if (!(imageType in app.images)) {
        continue;
      }
      
      url = app.images[imageType];
      break;
    }
    
    // No desktop/laptop images known for this app
    if (url === undefined) {
      return undefined;
    }
    
    return this.http.get(url, { responseType: 'blob' });
  }
}
