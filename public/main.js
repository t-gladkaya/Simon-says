import { App } from "./js/game.js"

document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM loaded, creating App...');
    try {
        const app = new App();
        console.log('App created successfully:', app);
    } catch (error) {
        console.error('Error creating App:', error);
    }
})