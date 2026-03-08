export class SteamApp {
    appId: number;
    names: { [key:string]: string };
    totalSize: number;
    downloadSize: number;
    dlcSize: number;
    dlcDownloadSize: number;
    timeUpdated: number
    
    constructor() {
        this.appId = -1;
        this.names = {};
        this.totalSize = -1;
        this.downloadSize = -1;
        this.dlcSize = -1;
        this.dlcDownloadSize = -1;
        this.timeUpdated = -1;
    }
}