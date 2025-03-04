let db;
// flag para garantir que o código de procura pelas databases em busca pela
// nossa só seja executada se o banco de dados não tenha sido criado dessa vez.
let databaseCreated = false;

class Drawing {
    constructor() { }

    /**
     * 
     * @param {String} name Nome do desenho.
     * @param {Blob} img Imagem do desenho.
     * @param {Boolean} isFavoritated Indica se o desenho está favoritado.
     * @returns O desenho recém-criado.
     */
    static create(name, img, isFavoritated, criacao = Date.now()) {
        return { name: name, criacao: criacao, img: img, favoritated: isFavoritated, modificado: Date.now() };
    }

    /**
     * Converte uma string contendo a url da imagem em um blob da imagem.
     * @param {String} img String contendo a url da imagem.
     */
    static stringImgToBlob(imgUrl) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const image = new Image();
        image.src = imgUrl;
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
                return blob;
            })
        }
    }
}

console.log("Something is ever happening here?");

self.onconnect = (event) => {
    console.log("SharedWorker: shared worker connected.", event);
    const port = event.ports[0];

    let request = indexedDB.open("canvas", 1);
    request.onupgradeneeded = (ev) => {
        console.log("SharedWorker: database created.");
        db = ev.target.result;

        db.onerror = (err) => {
            console.log("SharedWorker: an error ocurred in the database.", err)
            port.postMessage({ type: "DBerror" });
        }

        const tudoObjStr = db.createObjectStore("tudo", { keyPath: "name" });
        // cria um index para pesquisa chamado 'name' que deve ser único.
        tudoObjStr.createIndex("name", "name", { unique: true });
        // cria outro index só que para a data de criação, que dessa vez não
        // é única.
        tudoObjStr.createIndex("criacao", "criacao", { unique: false });
        tudoObjStr.createIndex("favoritated", "favoritated", { unique: false });

        const favoritadosObjStr = db.createObjectStore("favoritados", { keyPath: "name" });
        favoritadosObjStr.createIndex("name", "name", { unique: true });
        favoritadosObjStr.createIndex("criacao", "criacao", { unique: false });

        const arquivadosObjStr = db.createObjectStore("arquivados", { keyPath: "name" });
        arquivadosObjStr.createIndex("name", "name", { unique: true });
        arquivadosObjStr.createIndex("criacao", "criacao", { unique: false });

        port.postMessage({ type: "init app", drawings: [], SectionTudoDrawingAmount: 0, SectionFavoritadosDrawingAmount: 0, SectionArquivadosDrawingAmount: 0 });
    }

    // se o banco de dados já tiver sido criado antes
    (async function () {
        // checa quantas databases existem, se existir ao menos uma vai verificar se é a que foi criada por nós.
        if ((await indexedDB.databases()).length > 0 && !databaseCreated) {
            let databases = await indexedDB.databases();
            // percorre todas as databases procurando pela nossa
            for (let i = 0; i < databases.length; i++) {
                console.log(`Database ${i + 1} de ${databases.length}`);
                if (databases[i].name === "canvas") {
                    console.log("Banco de dados \'canvas\' encontrado.");
                    const request = indexedDB.open("canvas");
                    request.onsuccess = async function (ev) {
                        // atribui a database à variável
                        db = ev.target.result;

                        db.onerror = () => {
                            port.postMessage({ type: "DBerror" });
                        }
                        // obtem a quantidade de desenhos em cada seção.
                        let QTDdrawingsSecoes = [0, 0, 0];
                        const nomesObjectStores = ["tudo", "favoritados", "arquivados"];
                        let drawings = [];
                        const objectStores = db.transaction(["tudo", "favoritados", "arquivados"]);
                        for (let i = 0; i < 3; i++) {
                            // usa uma promise com await para que o resto do código espere essa operação assíncrona.
                            await new Promise((resolve) => {
                                objectStores.objectStore(nomesObjectStores[i]).openCursor().onsuccess = function (ev) {
                                    const cursor = ev.target.result;
                                    if (cursor) {
                                        QTDdrawingsSecoes[i]++;
                                        cursor.continue();
                                        return;
                                    }
                                    resolve();
                                }
                            })
                        }
                        // obtem os desenhos que vão ser exibidos quando o usuário entrar no aplicativo.
                        new Promise((resolve) => {
                            objectStores.objectStore("tudo").openCursor().onsuccess = (ev) => {
                                const cursor = ev.target.result;
                                if (cursor) {
                                    drawings.push(cursor.value);
                                    cursor.continue();
                                    return;
                                }
                                resolve();
                            }
                        })
                        port.postMessage({
                            type: "init app",
                            drawings: drawings,
                            SectionTudoDrawingAmount: QTDdrawingsSecoes[0],
                            SectionFavoritadosDrawingAmount: QTDdrawingsSecoes[1],
                            SectionArquivadosDrawingAmount: QTDdrawingsSecoes[2]
                        });
                    };
                    request.onerror = (err) => { console.log("Erro ao adquirir o database", err) };
                    break;
                }
            }
        }
    })()

    port.onmessage = (ev) => {
        console.log("SharedWorker: message received by shared worker.", ev);
        const msg = ev.data;
        if (msg.type === "create drawing") {
            const name = msg.name;
            const objectStore = db.transaction([msg.section], "readwrite").objectStore(msg.section);
            objectStore.openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor && cursor.value.name === name) {
                    console.log("SharedWorker: an error occurred when trying to create a drawing. An other drawing already heve the inputted name.");
                    port.postMessage({
                        type: "create drawing",
                        result: "error",
                        errorMsg: "Nome inválido: já existe um desenho com esse nome."
                    });
                } else if (cursor) {
                    cursor.continue();
                } else {
                    console.log(`SharedWorker: drawing created with name ${msg.name}.`);
                    objectStore.add(Drawing.create(name, Drawing.stringImgToBlob("imagens/imagem_branca.png"), msg.section === "favoritados"));
                    port.postMessage({
                        type: "create drawing",
                        result: "success",
                        drawing: {
                            name: cursor.value.name,
                            img: cursor.value.img,
                            favoritated: cursor.value.favoritated
                        }
                    });
                }
            }
        }
        else if (msg.type === "delete drawing") {
            db.transaction([msg.section]).objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor && msg.name === cursor.value.name) {
                    if (cursor.value.favoritated) {
                        const objectStores = db.transaction(["favoritados", "tudo"], "readwrite");
                        objectStores.onerror = (err) => {
                            console.log(`Ocorreu um error tentando excluir o desenho ${msg.name}.`, err);
                            port.postMessage({ type: "delete drawing", result: "error", errorMsg: `Ocorreu um error tentano excluir o desenho ${msg.name}.` });
                        }
                        objectStores.objectStore("favoritados").delete(msg.name);
                        const secaoTudoDeleteRequest = objectStores.objectStore("tudo").delete(msg.name);
                        secaoTudoDeleteRequest.onsuccess = () => {
                            port.postMessage({ type: "delete drawing", result: "success", name: msg.name });
                        }
                    } else {
                        const deleteRequest = db.transaction([msg.section], "readwrite").objectStore(msg.section).delete(msg.name);
                        deleteRequest.onerror = (err) => {
                            console.log(`Ocorreu um error tentando excluir o desenho ${msg.name}`, err);
                            port.postMessage({ type: "delete drawing", result: "error", errorMsg: `Ocorreu um error tentando excluir o desenho ${msg.name}.` });
                        }
                        deleteRequest.onsuccess = () => {
                            port.postMessage({ type: "delete drawing", result: "success", name: msg.name });
                        }
                    }
                } else if (cursor) {
                    cursor.continue();
                }
            }
        }
        else if (msg.type === "render section") {
            console.log(`SharedWorker: section \'${msg.section}\' rendered.`);
            let drawings = [];
            db.transaction([msg.section]).objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor) {
                    drawings.push(cursor.value);
                    cursor.continue();
                } else {
                    port.postMessage({ type: "render section", drawings: drawings });
                }
            }
        }
        else if (msg.type === "favoritate drawing") {
            const objectStores = db.transaction(["tudo", "favoritados", "arquivados"], "readwrite");
            objectStores.onerror = (err) => {
                console.log(`Ocorreu um error tentando favoritar o desenho ${msg.name}. Seção: ${msg.section}`, err);
                port.postMessage({ type: "favoritate drawing", result: "error" });
            }
            objectStores.objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor && msg.name === cursor.value.name) {
                    if (msg.section === "arquivados" && window.confirm("Tem certeza? Favoritar este desenho também irá desarquivar-lo. (Se ele é tão importante para estar favoritado não deveria estar arquivado.)")) {
                        objectStores.objectStore("arquivados").delete(msg.name);
                        objectStores.objectStore("favoritados").add(Drawing.create(cursor.value.name, cursor.value.img, true, cursor.value.criacao));
                        const secaoTudoAddRequest = objectStores.objectStore("tudo").add(Drawing.create(cursor.value.name, cursor.value.img, true, cursor.value.criacao));
                        secaoTudoAddRequest.onsuccess = () => {
                            port.postMessage({ type: "favoritate drawing", result: "success", name: msg.name, section: msg.section, favoritated: true });
                        }
                    } else if (msg.section === "favoritados" || cursor.value.favoritated) {
                        objectStores.objectStore("favoritated").delete(msg.name);
                        const updateRequest = objectStores.objectStore("tudo").put(Drawing.create(cursor.value.name, cursor.value.img, false, cursor.value.criacao));
                        updateRequest.onsuccess = () => {
                            port.postMessage({ type: "favoritate drawing", result: "success", name: msg.name, section: msg.section, favoritated: false });
                        }
                    } else {
                        objectStores.objectStore("tudo").put(Drawing.create(cursor.value.name, cursor.value.img, true, cursor.value.criacao));
                        const addRequest = objectStores.objectStore("favoritated").add(Drawing.create(cursor.value.name, cursor.value.img, true, cursor.value.criacao));
                        addRequest.onsuccess = () => {
                            port.postMessage({ type: "favoritate drawing", result: "success", name: msg.name, section: msg.section, favoritated: true });
                        }
                    }
                } else if (cursor) {
                    cursor.continue();
                }
            }
        }
        else if (msg.type === "archive drawing") {
            const objectStores = db.transaction(["tudo", "favoritados", "arquivados"], "readwrite");
            objectStores.onerror = (err) => {
                console.log(`Ocorreu um error tentando arquivar o desenho ${msg.name}.`, err);
                port.postMessage({ type: "archive drawing", result: "error" });
            }
            objectStores.objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor && cursor.value.name === msg.name) {
                    if (cursor.value.favoritated) {
                        objectStores.objectStore("tudo").delete(msg.name);
                        objectStores.objectStore("favoritados").delete(msg.name);
                        const secaoArquivadosAddRequest = objectStores.objectStore("arquivados").add(Drawing.create(cursor.value.name, cursor.value.img, false, cursor.value.criacao));
                        secaoArquivadosAddRequest.onsuccess = () => {
                            port.postMessage({ type: "archive drawing", result: "success", name: msg.name, favoritated: true });
                        }
                    } else {
                        objectStores.objectStore("arquivados").delete(msg.name);
                        const secaoTudoAddRequest = objectStores.objectStore("tudo").add(Drawing.create(cursor.value.name, cursor.value.img, false, cursor.value.criacao));
                        secaoTudoAddRequest.onsuccess = () => {
                            port.postMessage({ type: "archive drawing", result: "success", name: msg.name, favoritated: false });
                        }
                    }
                } else if (cursor) {
                    cursor.continue();
                } else {
                    port.postMessage({ type: "archive drawing", result: "error", errorMsg: "Desenho não encontrado." });
                }
            }
        }
        else if (msg.type === "export drawing") {
            db.transaction([msg.section]).objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor.value.name === msg.name) {
                    console.log(`SharedWorker: drawing \'${msg.name}\' exported.`);
                    port.postMessage({ type: "export drawing", img: cursor.value.img, name: cursor.value.name });
                } else if (cursor) {
                    cursor.continue();
                }
            }
        }
        else if (msg.type === "get drawing") {
            db.transaction([msg.section]).objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor.value.name === msg.name) {
                    console.log(`SharedWorker: drawing ${msg.name} getted.`)
                    port.postMessage({ type: "get drawing", img: cursor.value.img });
                } else if (cursor) {
                    cursor.continue();
                }
            }
        } else if (msg.type === "update drawing") {
            const objectStores = db.transaction(["favoritados", "tudo", "arquivados"], "readwrite");
            objectStores.objectStore(msg.section).openCursor().onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor && cursor.value.name === msg.name) {
                    if (msg.section === "arquivados") {
                        cursor.update(Drawing.create(cursor.value.name, msg.img, false));
                        console.log(`SharedWorker: drawing \'${msg.name}\' updated.`);
                    } else if (msg.section === "favoritados" || cursor.value.favoritated) {
                        console.log(`SharedWorker: drawing \'${msg.name}\' updated.`);
                        cursor.update(Drawing.create(cursor.value.name, msg.img, true));
                        const secaoTudoUpdateRequest = objectStores.objectStore("tudo").put(Drawing.create(cursor.value.name, msg.img, true));
                        secaoTudoUpdateRequest.onsuccess = () => {
                            port.postMessage({ type: "update drawing", result: "success" });
                        }
                        secaoTudoUpdateRequest.onerror = (err) => {
                            console.log(`SharedWorker: an error has ocurred when trying to update the drawing ${msg.name}.`);
                        }
                    } else {
                        cursor.update(Drawing.create(cursor.value.name, msg.img, false));
                        console.log(`SharedWorker: drawing \'${msg.name}\' updated.`);
                    }
                } else if (cursor) {
                    cursor.continue();
                } else {
                    port.postMessage({ type: "update drawing", result: "error", errorMsg: "Desenho não encontrado." });
                    console.log(`SharedWorker: drawing \'${msg.name}\' not found on object store ${msg.section}`);
                    return;
                }
            }
        } else if (msg.type === "search drawings") {
            let filteredDrawings = [];
            const objectStore = db.transaction([msg.section]).objectStore(msg.section);
            objectStore.openCursor(IDBKeyRange.lowerBound(msg.search)).onsuccess = (ev) => {
                const cursor = ev.target.result;
                if (cursor) {
                    filteredDrawings.push({ name: cursor.value.nome, img: cursor.value.img });
                    cursor.continue();
                    return;
                }
                port.postMessage({type: "search drawings", result: "success", drawings: filteredDrawings});
            }
            console.log(`SharedWorker: drawings on ${msg.section} filtered. Result: ${filteredDrawings}.`);
        }
    }
}
