export default class SharedWorkerPolyfill {
    static sharedWorkerAvailable = "SharedWorker" in globalThis;
    constructor(scriptURL, options = {}){
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            this.worker = new SharedWorker(new URL(scriptURL, import.meta.url), options);
        }else{
            this.worker = new Worker(new URL(scriptURL, import.meta.url), options);
        }
    }

    get port() {
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            return this.worker.port;
        }else{
            return this.worker;
        }
    }

    get onmessage() {
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            return this.worker.port.onmessage;
        }else{
            return this.worker.onmessage;
        }
    }

    set onmessage(value){
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            this.worker.port.onmessage = value;
        }else{
            this.worker.onmessage = value;
        }
    }

    get onmessageerror() {
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            return this.worker.port.onmessageerror;
        }else{
            return this.worker.onmessageerror;
        }
    }

    set onmessageerror(value){
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            this.worker.port.onmessageerror = value;
        }else{
            this.worker.onmessageerror = value;
        }
    }

    get onerror(){
        return this.worker.onerror;
    }

    set onerror(value){
        this.worker.onerror = value;
    }

    dispatchEvent(event){
        this.worker.dispatchEvent(event);
    }

    addEventListener(type, listener, options = {}){
        if(SharedWorkerPolyfill.sharedWorkerAvailable && type !== "error"){
            this.worker.port.addEventListener(type, listener, options);
        }else{
            this.worker.addEventListener(type, listener, options);
        }
    }

    removeEventListener(type, listener, options = {}){
        if(SharedWorkerPolyfill.sharedWorkerAvailable && type !== "error"){
            this.worker.port.removeEventListener(type, listener, options);
        }else{
            this.worker.removeEventListener(type, listener, options);
        }
    }

    close(){
        if(SharedWorkerPolyfill.sharedWorkerAvailable){
            this.worker.port.close();
        }else{
            this.worker.terminate();
        }
    }

    start(){
        this.worker?.port.start();
    }
}