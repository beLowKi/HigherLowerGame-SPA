const root = document.documentElement;
const style = window.getComputedStyle(root);

export const APP_CONSTANTS = {
    MOBILE_WIDTH_PX: parseInt(style.getPropertyValue("--app-mobile-width")),
    DEFAULT_DESKTOP_IMG_URL: "./images/default/desktop.jpeg",
    DEFAULT_MOBILE_IMG_URL: "./images/default/mobile.jpg",
}
