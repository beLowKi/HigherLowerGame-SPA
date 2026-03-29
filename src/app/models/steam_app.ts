export class SteamApp {
    appId: number;
    appType: string;
    images: { [key:string]: string };
    names: { [key:string]: string };
    totalSize: number;
    downloadSize: number;
    dlcSize: number;
    dlcDownloadSize: number;
    timeUpdated: number
    
    constructor() {
        this.appId = -1;
        this.appType = "";
        this.images = {};
        this.names = {};
        this.totalSize = -1;
        this.downloadSize = -1;
        this.dlcSize = -1;
        this.dlcDownloadSize = -1;
        this.timeUpdated = -1;
    }
}