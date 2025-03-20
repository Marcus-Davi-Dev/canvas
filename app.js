const inputModal = document.createElement("dialog");
document.body.appendChild(inputModal);

const newDrawingBtn = document.querySelector("div#new-drawing");
const drawings = document.querySelector("div#drawings");
const header = document.querySelector("header");
const searchBtn = header.querySelector("#searchBtn");
const searchInput = header.querySelector("input#searchQuery");
const more = header.querySelector("#more");
const configBtn = document.querySelector("#configBtn");
const closeConfigMenuBtn = document.querySelector("#close-config-menu");
const configMenu = document.querySelector("#config-menu");

const aside = document.querySelector("aside");
let asideClosed = true;
let asideSelectedSection = document.querySelector("aside ul [aria-selected='true']").children[0].textContent.toLowerCase();
const asideSections = document.querySelectorAll("aside ul li");
// tamanho normal do aside
const asideNormalWidth = "109.781px";
// com os contadores desenhos
const asideExtendedWidth = "133px";
// tamanho com o menu de configuração aberto
const asideExtendedPlusWidth = "200px";

const sharedWorker = new SharedWorker("sharedWorker.js");
sharedWorker.onerror = (err) => {
    console.log("SharedWorker error:", err);
}

sharedWorker.port.onmessage = (ev) => {
    const msg = ev.data;

    // utilizarei ifs e else ifs para manter o escopo em cada if,
    // coisa que não aconteceria com o switch case.
    if (msg.type === "create drawing") {
        if (msg.result === "success") {
            inputModal.close();
            renderDrawing({ name: msg.drawing.name, img: msg.drawing.img, favorited: msg.drawing.favorited });
            if (inputModal.querySelector("#aviso-input-invalido")) {
                inputModal.querySelector("#aviso-input-invalido").remove();
            }
            // atualiza o contador de desenhos da seção em que o desenho foi criado.
            asideSections[["tudo", "favoritados", "arquivados"].indexOf(asideSelectedSection)].children[1].textContent = +asideSections[["tudo", "favoritados", "arquivados"].indexOf(asideSelectedSection)].children[1].textContent + 1;
        } else {
            const advice = document.createElement("span");
            advice.innerHTML = `<br> ${msg.errorMsg} <br>`;
            advice.id = "aviso-input-invalido";
            advice.setAttribute("role", "alert");
            advice.style.color = "red";
            inputModal.insertBefore(advice, inputModal.querySelector("div"));
        }
    }
    else if (msg.type === "delete drawing") {
        if (msg.result === "success") {
            // busca pelo desenho que foi excluído para remover ele da tela.
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].children[1].children[0].textContent === msg.name) {
                    drawings.children[i].remove();
                    break;
                }
            }
            if(!drawings.children.length){
                drawings.innerHTML = "Nenhum desenho.<br> Pressione o botão \'+\' para criar um novo desenho.";
            }
        } else {
            alert(msg.errorMsg);
        }
    }
    else if (msg.type === "render section") {
        for (let i = 0; i < msg.drawings.length; i++) {
            renderDrawing(msg.drawings[i]);
        }
    }
    else if (msg.type === "favoritate drawing") {
        if (msg.result === "success" && msg.section === "tudo" && msg.favorited) {
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].querySelector(".info").children[0].textContent === msg.name) {
                    drawings.children[i].querySelector(".options").innerHTML = `<svg viewBox='0 0 576 512' height='17.7px' width='19.7px'><path fill='gold' d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z'/></svg> ${drawings.children[i].children[1].children[1].innerHTML}`;
                    drawings.children[i].querySelector("[popover]").children[2].textContent = "Desfavoritar";
                }
            }
        } else if (msg.result === "success" && msg.section === "tudo" && !msg.favorited) {
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].querySelector(".info").children[0].textContent === msg.name) {
                    drawings.children[i].querySelector(".options").children[0].remove();
                    drawings.children[i].querySelector("[popover]").children[2].textContent = "Favoritar";
                }
            }
        } else if (msg.result === "success" && (msg.section === "favoritados" || msg.section === "arquivados")) {
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].querySelector(".info").children[0].textContent === msg.name) {
                    drawings.children[i].remove();
                }
            }
        }
    }
    else if (msg.type === "archive drawing") {
        if(msg.result === "error"){
            alert(msg.errorMsg);
        }
        for (let i = 0; i < drawings.children.length; i++) {
            if (drawings.children[i].children[1].children[1].textContent === msg.name) {
                drawings.children[i].remove();
            }
        }
        asideSections[0].children[1].textContent = +asideSections[0].children[1].textContent - 1;
        if (msg.favorited) {
            asideSections[1].children[1].textContent = +asideSections[1].children[1].textContent - 1;
        }
        asideSections[2].children[1].textContent = +asideSections[2].children[1].textContent + 1;
    }
    else if (msg.type === "export drawing") {
        inputModal.showModal();
        inputModal.innerHTML = "";
        inputModal.setAttribute("data-input-modal", "exportar desenho");

        const title = document.createElement("h2");
        title.textContent = "Exportar desenho";

        const opcao1 = document.createElement("div");
        opcao1.classList.add("opcao");
        const texto1 = document.createElement("div");
        const titulo1 = document.createElement("h3");
        titulo1.textContent = "PNG";
        const descricao1 = document.createElement("p");
        descricao1.textContent = "Formato PNG. Imagem sem fundo.";

        const opcao2 = document.createElement("div");
        opcao2.classList.add("opcao");
        const texto2 = document.createElement("div");
        const titulo2 = document.createElement("h3");
        titulo2.textContent = "JPG";
        const descricao2 = document.createElement("p");
        descricao2.textContent = "Formato JPG. Imagem com fundo branco.";

        opcao1.addEventListener("click", function(){
            if(this.getAttribute("data-selected")){
                this.removeAttribute("data-selected");
            }else{
                this.setAttribute("data-selected", "true");
                opcao2.removeAttribute("data-selected");
            }
        })

        opcao2.addEventListener("click", function(){
            if(this.getAttribute("data-selected")){
                this.removeAttribute("data-selected");
            }else{
                this.setAttribute("data-selected", "true");
                opcao1.removeAttribute("data-selected");
            }
        })

        inputModal.appendChild(title);
        inputModal.appendChild(opcao1);
        opcao1.appendChild(texto1);
        texto1.appendChild(titulo1);
        texto1.appendChild(descricao1);

        inputModal.appendChild(opcao2);
        opcao2.appendChild(texto2);
        texto2.appendChild(titulo2);
        texto2.appendChild(descricao2);

        // imagens de demonstração
        const imgPNG = document.createElement("img");
        imgPNG.src = URL.createObjectURL(msg.img);
        const imgJPG = document.createElement("img");
        imgJPG.src = imgPNG.src;
        imgJPG.addEventListener("load", function(){
            URL.revokeObjectURL(imgJPG.src);
        });
        imgJPG.style.backgroundColor = "white"; // para simular uma imagem JPG com fundo branco

        opcao1.appendChild(imgPNG);
        opcao2.appendChild(imgJPG);

        // botões de confirmação e cancelamento da exportação.
        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = "OK";
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancelar";
        cancelBtn.onclick = function () { inputModal.close() };
        confirmBtn.onclick = function () {
            let url;

            const a = document.createElement("a");
            document.body.appendChild(a);

            if (opcao1.getAttribute("data-selected")) { // img png
                // usar typeof em um blob retorna 'object'
                if (typeof msg.img === typeof {}) {
                    a.href = URL.createObjectURL(msg.img);
                    url = a.href;
                    a.textContent = "DOWNLOAD"; // apenas para que o link tenha um width.
                    a.download = msg.name;
                    a.click();
                    setTimeout(function () {
                        a.remove();
                        URL.revokeObjectURL(url);
                    }, 50);
                } else {
                    const canvas = document.createElement("canvas");
                    const img = new Image();
                    img.src = msg.img;
                    canvas.height = img.height;
                    canvas.width = img.width;
                    canvas.getContext("2d").drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        a.href = URL.createObjectURL(blob);
                        url = a.href;
                        a.textContent = "DOWNLOAD"; // apenas para que o link tenha um width.
                        a.download = msg.name;
                        a.click();
                        setTimeout(function () {
                            a.remove();
                            URL.revokeObjectURL(url);
                        }, 50);
                    })
                }
            } else if (opcao2.getAttribute("data-selected")) {
                const img = new Image();
                // usar typeof em um blob retorna 'object'
                if(typeof msg.img === typeof {}){
                    url = URL.createObjectURL(msg.img);
                    img.src = url;
                }else{
                    img.src = msg.img;
                }
                document.body.appendChild(img);
                const canvas = document.createElement("canvas");
                canvas.height = img.height;
                canvas.width = img.width;
                img.remove();
                const ctx = canvas.getContext("2d");
                // fazer a imagem ter fundo branco.
                ctx.moveTo(0, 0);
                ctx.lineTo(0, canvas.height);
                ctx.lineTo(canvas.width, canvas.height);
                ctx.lineTo(canvas.width, 0);
                ctx.lineTo(0, 0);
                ctx.fillStyle = "white";
                ctx.fill();
                
                ctx.drawImage(img, 0, 0);
                if(url){
                    URL.revokeObjectURL(url);
                }
                canvas.toBlob((blob)=>{
                    url = URL.createObjectURL(blob);
                    a.href = url;
                    a.textContent = "DOWNLOAD"; // apenas para que o link tenha um width.
                    a.download = msg.name;
                    a.click();
                    setTimeout(function(){
                        a.remove();
                        URL.revokeObjectURL(url);
                    });
                })
            }
        }

        inputModal.appendChild(cancelBtn);
        inputModal.appendChild(confirmBtn);
    }else if(msg.type === "search drawings"){
        drawings.innerHTML = "Nenhum desenho.<br> Pressione o botão \'+\' para criar um novo desenho.";
        for(let i = 0; i < msg.drawings.length; i++){
            renderDrawing({name: msg.drawings[i].name, img: msg.drawings[i].img, favorited: msg.drawings[i].favorited});
        }
    }else if (msg.type === "init app") {
        if (msg.drawings.length === 0) {
            drawings.innerHTML = "Nenhum desenho.<br> Pressione o botão \'+\' para criar um novo desenho.";
            asideSections[0].children[1].textContent = "0";
            asideSections[1].children[1].textContent = "0";
            asideSections[2].children[1].textContent = "0";
        } else {
            for (let i = 0; i < msg.drawings.length; i++) {
                renderDrawing(msg.drawings[i]);
            }
            asideSections[0].children[1].textContent = msg.SectionTudoDrawingAmount;
            asideSections[1].children[1].textContent = msg.SectionFavoritadosDrawingAmount;
            asideSections[2].children[1].textContent = msg.SectionArquivadosDrawingAmount;
        }
    }else if(msg.type === "DBerror"){
        alert("Ocorreu um erro no banco de dados, tente recarregar a página");
    }
}

/**
 * @param {Object} infos * name: nome do desenho
 *                       * img: path da imagem representativa do desenho.
 *                       * favorited: se o desenho está favoritado.
*/
function renderDrawing(infos) {
    const drawing = document.createElement("div");
    drawing.classList.add("drawing");

    const img = document.createElement("img");
    img.addEventListener('click', function(){
        const a = document.createElement("a");
        a.src = `canvas.html?drawing=${infos.name}&section=${asideSelectedSection}`;
        a.click();
    })
    img.src = URL.createObjectURL(infos.img);
    img.onload = function(){
        URL.revokeObjectURL(infos.img);
    }
    img.style.width = "100%";
    img.style.height = "78%";

    const info = document.createElement("div");
    info.classList.add("info");
    info.innerHTML = `<span>${infos.name}</span>`;

    const options = document.createElement("div");
    options.classList.add("options");
    options.innerHTML = "<button><svg viewBox='0 0 448 512' height='17.7px' width='19.7px'><path fill='red' d='M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z'/></svg></button>  <button><svg viewBox='0 0 128 512' width='10px' height='19.7px'><path fill='currentColor' d='M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z'/></svg></button>";
    if (infos.favorited) {
        options.innerHTML = `<svg viewBox='0 0 576 512' height='17.7px' width='19.7px'><path fill='gold' d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z'/></svg> ${options.innerHTML}`;
    }

    const extraOptions = document.createElement("div");
    extraOptions.setAttribute('popover', 'auto');
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Exportar";

    const archiveBtn = document.createElement("button");
    if (asideSelectedSection === "arquivados") {
        archiveBtn.textContent = "Desarquivar";
    } else {
        archiveBtn.textContent = "Arquivar";
    }

    const favoritateBtn = document.createElement("button");
    if (asideSelectedSection !== "favoritados" || !infos.favorited) {
        favoritateBtn.textContent = "Favoritar";
    } else {
        favoritateBtn.textContent = "Desfavoritar";
    }

    extraOptions.appendChild(exportBtn);
    exportBtn.addEventListener('click', function () {
        sharedWorker.port.postMessage({ type: "export drawing", name: info.querySelector("span").textContent, section: asideSelectedSection });
    });

    extraOptions.appendChild(archiveBtn);
    archiveBtn.addEventListener('click', function () {
        sharedWorker.port.postMessage({ type: "archive drawing", name: info.querySelector("span").textContent, section: asideSelectedSection });
    });

    extraOptions.appendChild(favoritateBtn);
    favoritateBtn.addEventListener('click', function () {
        if(asideSelectedSection === "arquivados"){
            sharedWorker.port.postMessage({ type: "favoritate drawing", name: info.querySelector("span").textContent, section: asideSelectedSection, favorited: infos.favorited, confirmed: window.confirm("Tem certeza? Favoritar este desenho também irá desarquivar-lo. (Se ele é tão importante para estar favoritado não deveria estar arquivado.)") });
        }else{
            sharedWorker.port.postMessage({ type: "favoritate drawing", name: info.querySelector("span").textContent, section: asideSelectedSection, favorited: infos.favorited });
        }
    });

    // primeira opção
    options.querySelectorAll("button")[0].addEventListener('click', function () {
        sharedWorker.port.postMessage({ type: "delete drawing", name: infos.name, section: asideSelectedSection });
    })

    drawing.appendChild(img);
    drawing.appendChild(info);
    info.appendChild(options);
    drawing.appendChild(extraOptions);

    // remove os textos de "nenhum desenho" e a quebra de linha quando um desenho for renderizado
    if(drawings.children[0].tagName === "BR"){
        drawings.childNodes[0].remove();
        drawings.childNodes[0].remove();
        drawings.childNodes[0].remove();
    }
    drawings.appendChild(drawing);
    setTimeout(function () {
        extraOptions.style.marginLeft = `${drawing.getBoundingClientRect().x + drawing.getBoundingClientRect().width}px`;
        extraOptions.style.marginTop = `${drawing.getBoundingClientRect().y + 10}px`;
    }, 500);

    // garante que não vão existir dois do mesmo id para o container de mais opções.
    for (let i = 0; i < document.querySelectorAll("div#drawings > div.drawing").length; i++) {
        const moreOptionsContainer = document.querySelectorAll("div#drawings > div.drawing")[i].querySelector("div[popover]");
        moreOptionsContainer.id = `more-options-${i + 1}`;

        const moreOptionsBtn = document.querySelectorAll("div#drawings > div.drawing > div.info")[i].querySelectorAll("button")[1];
        moreOptionsBtn.setAttribute('popovertarget', moreOptionsContainer.id);
    }
    return drawing;
}

async function showInputModal(options) {
    inputModal.showModal();
    inputModal.innerHTML = "";
    inputModal.setAttribute("data-input-modal", "criar desenho");

    const title = document.createElement("h3");
    title.style.margin = "2px 0";
    title.textContent = options.title || "";

    const input = document.createElement("input");

    const btns = document.createElement("div");
    btns.style.display = "flex";
    btns.style.justifyContent = "flex-end";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "CANCELAR";
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "OK";

    const result = new Promise((resolve, reject) => {
        confirmBtn.addEventListener('click', async function () {
            sharedWorker.port.postMessage({ type: "create drawing", name: input.value, section: asideSelectedSection });
            resolve(input.value);
        });

        cancelBtn.addEventListener('click', function () {
            inputModal.close();
            reject(new Error("A operação foi abortada."));
        });
    });

    inputModal.appendChild(title);

    if (options.description) {
        const description = document.createElement("span");
        description.innerHTML = options.description;
        inputModal.appendChild(description);
        // quebra de linha.
        inputModal.appendChild(document.createElement("br"));
    }

    inputModal.appendChild(input);
    inputModal.appendChild(btns);
    btns.appendChild(cancelBtn);
    btns.appendChild(confirmBtn);
    input.focus();

    return result;
}

newDrawingBtn.addEventListener('click', function () {
    showInputModal({
        title: `Novo desenho à ${asideSelectedSection[0].toUpperCase() + asideSelectedSection.substring(1)}`,
        description: "Nome do desenho."
    });
});


// Funcionalidades de outros elementos da UI que não estão diretamente relacionados à desenhos.

// navegação entre seções.
for (let i = 0; i < asideSections.length; i++) {
    asideSections[i].addEventListener('click', function () {
        asideSelectedSection = asideSections[i].children[0].textContent[0].toLowerCase() + asideSections[i].children[0].textContent.substring(1);
        drawings.innerHTML = "Nenhum desenho.<br> Pressione o botão \'+\' para criar um novo desenho.";
        sharedWorker.port.postMessage({ type: "render section", section: asideSelectedSection });
        for (let j = 0; j < asideSections.length; j++) {
            asideSections[j].setAttribute("aria-selected", "false");
        }
        asideSections[i].setAttribute("aria-selected", "true");
    })
}
searchBtn.addEventListener('click', function (ev) {
    ev.preventDefault();
    sharedWorker.port.postMessage({type: "search drawings", section: asideSelectedSection, search: searchInput.value});
})

window.onresize = updateDrawingsMenuPosition;

more.addEventListener('click', function () {
    if (asideClosed) {
        aside.style.minWidth = "var(--aside-width)";
        aside.style.width = "var(--aside-width)";
        aside.style.borderRight = "2px black solid";
        asideClosed = false;
    } else {
        aside.style.minWidth = "0";
        aside.style.width = "0";
        aside.style.borderRight = "0 black solid";
        asideClosed = true;
    }

    setTimeout(updateDrawingsMenuPosition, 1000);
})

closeConfigMenuBtn.addEventListener('click', hideConfigMenu);
configBtn.addEventListener('click', showConfigMenu);

function showConfigMenu() {
    asideSections[0].parentNode.classList.add("hidden");
    configBtn.parentNode.classList.add("hidden");
    configMenu.classList.remove("hidden");
    drawings.parentNode.style.filter = "blur(2px)";
    aside.style.minWidth = asideExtendedPlusWidth;
    document.documentElement.style.setProperty("--aside-width", asideExtendedPlusWidth);
}

function hideConfigMenu() {
    asideSections[0].parentNode.classList.remove("hidden");
    configBtn.parentNode.classList.remove("hidden");
    configMenu.classList.add("hidden");
    drawings.parentNode.style.filter = "";
    aside.style.minWidth = "";
    document.documentElement.style.setProperty("--aside-width", aside.getAttribute("data-width"));
}

function updateDrawingsMenuPosition() {
    for (const menu of document.querySelectorAll("div.drawing > div[popover]")) {
        menu.style.marginLeft = `${menu.parentElement.getBoundingClientRect().x + menu.parentElement.getBoundingClientRect().width}px`;
        menu.style.marginTop = `${menu.parentElement.getBoundingClientRect().y + 10}px`;
    }
}
