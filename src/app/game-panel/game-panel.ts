import { 
  Component, Input, ChangeDetectionStrategy, 
  OnInit, Renderer2, ElementRef, Output, EventEmitter, 
  WritableSignal, signal, 
  HostListener,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { NgxSpinnerService, NgxSpinnerComponent  } from 'ngx-spinner';

import { APP_CONSTANTS } from '../shared/app.constants';
import { AppData } from '../services/app-data/app-data';
import { GameLogic } from '../services/game-logic/game-logic';
import { SteamApp } from '../models/steam_app';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


@Component({
  selector: 'app-game-panel',
  imports: [CommonModule, NgxSpinnerComponent],
  templateUrl: './game-panel.html',
  styleUrl: './game-panel.scss',
  providers: [AppData],
  changeDetection: ChangeDetectionStrategy.Default
})
export class GamePanel implements OnInit {  
  @Input('app') app! : SteamApp;
  @Input('initHidden') initHidden : boolean = false;
  
  // If "higher" "lower" buttons are hidden and
  // app.totalSize is shown in layout
  @Input('initRevealed') initRevealed : boolean = false;
  private _revealed : WritableSignal<boolean> = signal(false);
  public readonly revealed = this._revealed.asReadonly();
  
  // Emits to signal parent that this panel should be deleted
  @Output() destroy = new EventEmitter<void>();
  @Output() buttonSelected = new EventEmitter<GamePanel>();
  
  private _screenWidth: WritableSignal<number|undefined> = signal(undefined);
  readonly screenWidth = this._screenWidth.asReadonly();
  
  private _inMobile : WritableSignal<boolean> = signal(false);
  public readonly inMobile = this._inMobile.asReadonly();
  readonly objectFitCoverMaxWidth : number = parseInt("1280px");
  
  // Loaded images
  private mobileImageObjectUrl! : string;
  private _mobileImageUrl : WritableSignal<SafeUrl|string> = signal("");
  public readonly mobileImageUrl = this._mobileImageUrl.asReadonly();
  
  private desktopImageObjectUrl! : string;
  private _desktopImageUrl : WritableSignal<SafeUrl|string> = signal("");
  public readonly desktopImageUrl = this._desktopImageUrl.asReadonly();

  private _isVisible : WritableSignal<boolean> = signal(true);
  readonly isVisible = this._isVisible.asReadonly();
  
  // Updates after desktop and mobile images are loaded
  // Used in layout to display loading gif
  private _loaded : WritableSignal<boolean> = signal(false);
  readonly loaded = this._loaded.asReadonly();
  

  constructor(
    private renderer : Renderer2,
    private appData : AppData,
    private game : GameLogic,
    private sanitizer : DomSanitizer,
    private spinner: NgxSpinnerService,
    public el: ElementRef,
  ) {}
  

  // Updates '_screenWidth' variable
  @HostListener('window:resize', ['$event'])
  onWindowResize(event?: any) : void {
    this._screenWidth.set(window.innerWidth);
    
    const width = this._screenWidth();
    if (!width) {
      return;
    }
    
    const inMobile = width <= APP_CONSTANTS.MOBILE_WIDTH_PX;
    // console.log(
    //   `Screen width: ${width} - ` + 
    //   `Mobile width: ${APP_CONSTANTS.MOBILE_WIDTH_PX}`
    // );
    if (inMobile != this._inMobile()) {
      this._inMobile.set(inMobile);
    }
  }
  
  
  // Callback for "higher" button
  higherClicked() : void {
    // console.log("button selected");
    this.buttonSelected.emit(this);
    this._revealed.set(true);
    this.game.higherSelect();
  }


  // Callback for "lower" button
  lowerClicked() : void {
    // console.log("button selected");
    this.buttonSelected.emit(this);
    this._revealed.set(true);
    this.game.lowerSelect();
  }
  

  // Returns the panel's app's name in
  // the current language. 
  getName() : string {
    if (!this.app) {
      return 'n/a';
    }
    
    // console.log(this.app.names);
    const lang = this.getCurrentLanguage();
    
    for (const field in this.app.names) {
      if (field.includes(lang)) {
        return this.app.names[field];
      }
    }

    // return 'n/a'
    return ''
  }
  

  // Returns an image URL of a panel's app
  // in the current window layout
  getImage() : SafeUrl | string {
    // Checking which layout screen should be in
    let imageUrl : SafeUrl | string | undefined;
    let defaultImageUrl : string;
    
    if (this._inMobile()) {
      // console.log(`${this._screenWidth} is within mobile range of ${APP_CONSTANTS.MOBILE_WIDTH_PX}`);
      imageUrl = this._mobileImageUrl();
      defaultImageUrl = APP_CONSTANTS.DEFAULT_MOBILE_IMG_URL;
    } 
    else {
      imageUrl = this._desktopImageUrl();
      defaultImageUrl = APP_CONSTANTS.DEFAULT_DESKTOP_IMG_URL;
    }
    
    return (imageUrl !== undefined)
      ? imageUrl
      : defaultImageUrl;
  }
  

  // Returns text representing a panel's SteamApp's totalSize
  // with an added KB, MB, or GB.
  getSizeDisplay() : string {
    if (!this.app) {
      return '0 MB';
    }
    
    let out : string = '';

    // Showing gigabytes
    if (this.app.totalSize >= 1e9) {
      out = ( this.app.totalSize / 1e9 ).toFixed(2) + ' GB';
      
    // Showing megabytes
    } else if (this.app.totalSize >= 1e6) {
      out = (this.app.totalSize / 1e6).toFixed(2) + ' MB';

    // Showing kilobytes
    } else {
      out = (this.app.totalSize / 1e3).toFixed(2) + ' KB';
    }

    return out;
  }
  

  // Returns the current language TODO
  getCurrentLanguage() : string {
    // TODO
    return 'english'
  }


  // Resets panel's position via 'reset' CSS class
  resetPosition() : void {
    this.renderer.addClass(this.el.nativeElement, 'reset');
  }
  

  // Plays 'fade-in' animation
  fadeIn() : void {
    this.renderer.addClass(this.el.nativeElement, 'fade-in');
  }
  

  ngOnInit(): void {
    this.spinner.show();
    this._revealed.set(this.initRevealed);

    // Loading mobile image
    this.appData.getAppMobileImage(this.app)?.subscribe({
      next: (value: Blob) => {
        // Creating and storing URL for image blob after
        // bypassing Angular's security checks
        this.mobileImageObjectUrl = URL.createObjectURL(value);
        this._mobileImageUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.mobileImageObjectUrl));

        // Updating 'loaded'
        if (!this._loaded() && this._desktopImageUrl()) {
          this._loaded.set(true);
          this.spinner.hide();
        }
      },

      error: (err: any) => {
        console.log(`Error loading mobile image for appId-${this.app.appId}: ${err.message}`);
      }
    });
    
    // Loading desktop image
    this.appData.getAppDesktopImage(this.app)?.subscribe({
      next: (value: Blob) => {
        // Creating and storing URL for image blob after
        // bypassing Angular's security checks
        this.desktopImageObjectUrl = URL.createObjectURL(value);
        // this._desktopImageUrl.set(this.sanitizer.bypassSecurityTrustHtml(this.desktopImageObjectUrl));
        this._desktopImageUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.desktopImageObjectUrl));
        
        // Updating 'loaded'
        if (!this._loaded() && this._desktopImageUrl()) {
          this._loaded.set(true);
          this.spinner.hide();
        }
      },

      error: (err: any) => {
        console.log(`Error loading desktop image for appId-${this.app.appId}: ${err.message}`);
      }
    });

    this.onWindowResize();
  }
}
