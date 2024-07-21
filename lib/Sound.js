import {Pen} from "./Pen.js";
export class Sound {
    #pen
    /**
     * 
     * @param {Pen} pen 
     */
    constructor(pen){
        this.#pen=pen;
        this.context=new AudioContext();
        this.validTypes=new Set();
        this.validTypes.add("mp3");
        console.clear(); //really unsure about this but I don't want students to have think about audioContexts we can just tell them that things are muted by default
    }
    /**
     * @param {string} filepath
     */
    isValidType(filepath){
        const splitPath=filepath.split('/');
        const filename = splitPath.splice(splitPath.length-1)[0];
        const splitname=filename.split(".");            
        let filetypeFromPath=splitname[splitname.length-1];
        return this.validTypes.has(filetypeFromPath.toLowerCase())
    }
}