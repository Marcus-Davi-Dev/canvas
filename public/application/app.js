import SharedWorkerPolyfill from "../polyfill/SharedWorkerPolyfill.js";

/** this dialog is a WebComponent (as you see by the "is='input-modal'") and have these
   methods:
   - (async) showInputModal: shows the modal with some dinamycally placed elements to
            receive the input of the user. Takes 2 arguments, type and options.
            type is a string, currently 1 of these 4 options: input, multiple input,
            confirm and select (is not multi-selectable).
            options is a object to "configure" the dialog, like puttting a title
            a message, label, etc.
            return the input the user gave.
   - errorMode: all the content of the modal (except the buttons, of course) is replaced
            with a message of error, use when are given not-expected parameters, info,
            things like that. Takes no arguments.
   - setErrorMessage: set the error message of the dialog, can be to set the error message
            in the error mode and when the user try to give a invalid input. Takes 1
            argument, message, that will be the error message.
   - clear: clear the dialog, leaving only the buttons and the error message behind.
            Takes no arguments.
*/ 
const inputModal = document.querySelector("dialog[is='input-modal']");

// --- ELEMENTS' ---
// from the main part
const drawings = document.querySelector("div#drawings");

// misc
const newDrawingBtn = document.querySelector("div#new-drawing");

// from the header
const header = document.querySelector("header");
const searchBtn = header.querySelector("#searchBtn");
const searchInput = header.querySelector("input#searchQuery");
const changeOrderingBtn = document.querySelector("button#change-drawings-ordering-btn");
const changeOrderingModal = document.querySelector("div#change-drawings-ordering-modal");
const applyOrderingChanges = changeOrderingModal.querySelector("button");
const more = header.querySelector("#more");

// from the configuration menu
const configBtn = document.querySelector("#configBtn");
const closeConfigMenuBtn = document.querySelector("#close-config-menu");
const configMenu = document.querySelector("#config-menu");
const drawingsCounterCheckbox = document.querySelector("#config-menu input[aria-describedby='config-description-1']");
const themeSelector = document.querySelector("#config-menu select");
const deleteAllDrawingsBtn = document.querySelector("#delete-all-drawings");

const SVG_STAR_FILLING = "M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z";
const SVG_TRASH_BIN_FILLING = "M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z";
const SVG_THREE_VERTICAL_CIRCLES_FILLING = "M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z";
const NO_DRAWING_TEXT = "Nenhum desenho.<br> Pressione o botão \'+\' para criar um novo desenho.";

const aside = document.querySelector("aside");
let asideClosed = true;
let asideSelectedSection = document.querySelector("aside ul [aria-selected='true']").children[0].textContent.toLowerCase();
const asideSections = document.querySelectorAll("aside ul li");
// tamanho normal do aside
const ASIDE_NORMAL_WIDTH = "109.781px";
// com os contadores desenhos
const ASIDE_EXTENDED_WIDTH = "133px";
// tamanho com o menu de configuração aberto
const ASIDE_EXTENDED_PLUS_WIDTH = "200px";

const sharedWorker = new SharedWorkerPolyfill("../application/sharedWorker.js");
sharedWorker.onerror = (err) => {
    console.log("SharedWorker error:", err);
};

sharedWorker.port.onmessage = async (ev) => {
    const msg = ev.data;

    // utilizarei ifs e else ifs para manter o escopo em cada if,
    // coisa que não aconteceria com o switch case.
    if (msg.type === "create drawing") {
        if (msg.result === "success") {
            inputModal.close();
            renderDrawing({ name: msg.drawing.name, img: msg.drawing.img, favorited: msg.drawing.favorited });
            if (!inputModal.querySelector("#error-message").classList.contains("hidden")) {
                inputModal.querySelector("#error-message").classList.add("hidden");
            }
            // atualiza o contador de desenhos da seção em que o desenho foi criado.
            if (msg.drawing.favorited) {
                incrementDrawingCounter("tudo", 1);
                incrementDrawingCounter("favoritados", 1);
            } else {
                incrementDrawingCounter(asideSelectedSection, 1);
            }
        } else {
            inputModal.setErrorMessage(msg.errorMsg);
        }
    }
    else if (msg.type === "delete drawing") {
        if (msg.result !== "success") {
            alert(msg.errorMsg);
            return;
        }

        if (msg.favorited) {
            decrementDrawingCounter("tudo", 1);
            decrementDrawingCounter("favoritados", 1);
        } else {
            decrementDrawingCounter(asideSelectedSection, 1);
        }
    }
    else if (msg.type === "render section") {
        drawings.innerHTML = NO_DRAWING_TEXT;
        for (let i = 0; i < msg.drawings.length; i++) {
            renderDrawing(msg.drawings[i]);
        }
    }
    else if (msg.type === "favoritate drawing") {
        // favoritar desenho na seção 'tudo'.
        if (msg.result === "success" && msg.section === "tudo" && msg.favorited) {
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].querySelector(".info").children[0].textContent === msg.name) {
                    // adiciona uma estrela para indicar que está favoritado.
                    drawings.children[i].querySelector(".options").innerHTML = `<svg viewBox='0 0 576 512' height='17.7px' width='19.7px'><path fill='gold' d='M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z'/></svg> ${drawings.children[i].children[1].children[1].innerHTML}`;
                    drawings.children[i].querySelector("[popover]").children[2].textContent = "Desfavoritar";
                }
            }
            incrementDrawingCounter("favoritados", 1);
            // desfavoritar desenho na seção 'tudo'.
        } else if (msg.result === "success" && msg.section === "tudo" && !msg.favorited) {
            for (let i = 0; i < drawings.children.length; i++) {
                if (drawings.children[i].querySelector(".info").children[0].textContent === msg.name) {
                    drawings.children[i].querySelector(".options").children[0].remove(); // remove a estrela de favoritado.
                    drawings.children[i].querySelector("[popover]").children[2].textContent = "Favoritar";
                }
            }
            decrementDrawingCounter("favoritados", 1);
            // desfavoritar desenho na seção 'favoritados'.
        } else if (msg.result === "success" && msg.section === "favoritados") {
            removeDrawing(msg.name);
            decrementDrawingCounter("favoritados", 1);
            // favoritar desenho na seção 'arquivados'.
        } else if (msg.result === "success" && msg.section === "arquivados") {
            removeDrawing(msg.name);
            decrementDrawingCounter("arquivados", 1);
            incrementDrawingCounter("favoritados", 1);
            incrementDrawingCounter("tudo", 1);
        }
    }
    else if (msg.type === "archive drawing") {
        if (msg.result === "error") {
            alert(msg.errorMsg);
            return;
        }

        if (msg.favorited || msg.section === "favoritados") {
            incrementDrawingCounter("arquivados", 1);
            decrementDrawingCounter("favoritados", 1);
            decrementDrawingCounter("tudo", 1);
            removeDrawing(msg.name);
        } else if (msg.section === "tudo") {
            incrementDrawingCounter("arquivados", 1);
            decrementDrawingCounter("tudo", 1);
            removeDrawing(msg.name);
        } else {
            decrementDrawingCounter("arquivados", 1);
            incrementDrawingCounter("tudo", 1);
            removeDrawing(msg.name);
        }
    }
    else if (msg.type === "export drawing") {
        const img = new Image();
        img.src = URL.createObjectURL(msg.img);
        await new Promise((resolve) => { img.onload = () => { resolve() } });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // png quadriculated background
        // the gray squares will have 10px width and height
        // ctx.fillStyle = "gray";
        // for (let x = 0; x <= canvas.width; x += 10) {
        // for (let y = 0; y <= canvas.height; y += 10) {
        // ctx.fillRect(x, y, 10, 10);
        // }
        // }

        ctx.drawImage(img, 0, 0);

        let imgPNG;
        await new Promise((resolve) => {
            canvas.toBlob((blob) => {
                imgPNG = URL.createObjectURL(blob);
                resolve();
            });
        });

        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // give the canvas a white background to replace
        // the transparent one
        ctx.fillStyle = "white";
        ctx.moveTo(0, 0);
        ctx.lineTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.drawImage(img, 0, 0);

        let imgJPG;
        await new Promise((resolve) => {
            canvas.toBlob((blob) => {
                imgJPG = URL.createObjectURL(blob);
                resolve();
            });
        });

        const selectedOption = await inputModal.showInputModal("select", {
            selectOptions: [
                {
                    label: "Formato PNG",
                    description: "Imagem sem fundo.",
                    id: "PNG",
                    images: [imgPNG]
                },
                {
                    label: "Formato JPEG",
                    description: "Imagem com fundo branco.",
                    id: "JPEG",
                    images: [imgJPG]
                }
            ]
        });

        if (selectedOption) {
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.download = msg.name;

            switch (selectedOption) {
                case "PNG":
                    a.href = imgPNG;
                    break;
                case "JPEG":
                    a.href = imgJPG;
                    break;
            }

            a.click();
            a.remove();

            URL.revokeObjectURL(imgPNG);
            URL.revokeObjectURL(imgJPG);
        }
    } else if (msg.type === "search drawings") {
        drawings.innerHTML = NO_DRAWING_TEXT;
        for (let i = 0; i < msg.drawings.length; i++) {
            renderDrawing({ name: msg.drawings[i].name, img: msg.drawings[i].img, favorited: msg.drawings[i].favorited });
        }
    } else if (msg.type === "init app") {
        if (msg.drawings.length === 0) {
            drawings.innerHTML = NO_DRAWING_TEXT;
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
    } else if (msg.type === "clear database") {
        const div = document.createElement("div");
        div.classList.add("modal");

        const message = document.createElement("p");
        div.appendChild(message);

        if (msg.result === "success") {
            message.textContent = "Desenhos apagados com sucesso.";
        } else {
            message.textContent = "Ocorreu um tentando apagar os desenhos.";
        }

        document.body.appendChild(div);
        setTimeout(function () {
            div.remove();
        }, 5000);
    } else if (msg.type === "DBerror") {
        alert("Ocorreu um erro no banco de dados, tente recarregar a página");
    }
};

/**
 * @param {Object} infos * name: nome do desenho
 *                       * img: path da imagem representativa do desenho.
 *                       * favorited: se o desenho está favoritado.
*/
function renderDrawing(infos) {
    const drawing = document.createElement("div");
    drawing.classList.add("drawing");

    const a = document.createElement("a");
    a.href = `./public/canvas.html?drawing=${infos.name}&section=${asideSelectedSection}`;
    const img = document.createElement("img");
    img.src = URL.createObjectURL(infos.img);
    img.onload = function () {
        URL.revokeObjectURL(img.src);
    };
    img.style.width = "100%";
    img.style.height = "78%";
    img.classList.add("png"); // fundo quadriculado de imagens PNG.

    a.appendChild(img);

    const info = document.createElement("div");
    info.classList.add("info");
    info.innerHTML = `<span>${infos.name}</span>`;

    const options = document.createElement("div");
    options.classList.add("options");
    options.innerHTML = `<button title='Apagar desenho' aria-label='Apagar desenho'>
                            <svg viewBox='0 0 448 512' height='17.7px' width='19.7px' aria-hidden='true'><path fill='red' d='${SVG_TRASH_BIN_FILLING}'/></svg>
                        </button> 
                        <button title='Mais opções...' aria-label='Mostrar mais opções'>
                            <svg viewBox='0 0 128 512' width='10px' height='19.7px' aria-hidden='true'><path fill='currentColor' d='${SVG_THREE_VERTICAL_CIRCLES_FILLING}'/></svg>
                        </button>`;
    if (infos.favorited) {
        options.innerHTML = `<svg viewBox='0 0 576 512' height='17.7px' width='19.7px'><path fill='gold' d='${SVG_STAR_FILLING}'/></svg> ${options.innerHTML}`;
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
        if (asideSelectedSection === "arquivados") {
            sharedWorker.port.postMessage({ type: "favoritate drawing", name: info.querySelector("span").textContent, section: asideSelectedSection, favorited: infos.favorited, confirmed: window.confirm("Tem certeza? Favoritar este desenho também irá desarquivar-lo. (Se ele é tão importante para estar favoritado não deveria estar arquivado.)") });
        } else {
            sharedWorker.port.postMessage({ type: "favoritate drawing", name: info.querySelector("span").textContent, section: asideSelectedSection, favorited: infos.favorited });
        }
    });

    // primeira opção
    options.querySelectorAll("button")[0].addEventListener('click', function () {
        deleteDrawing(infos.name, asideSelectedSection);
    });

    drawing.appendChild(a);
    drawing.appendChild(info);
    info.appendChild(options);
    drawing.appendChild(extraOptions);

    // remove os textos de "nenhum desenho" e a quebra de linha quando um desenho for renderizado
    if (drawings.children[0]?.tagName === "BR") {
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

newDrawingBtn.addEventListener('click', async function () {
    sharedWorker.port.postMessage({
        type: "create drawing",
        name:
            await inputModal.showInputModal("input", {
                title: `Novo desenho à ${asideSelectedSection[0].toUpperCase() + asideSelectedSection.substring(1)}`,
                label: "Nome do desenho."
            }),
        section: asideSelectedSection
    });
});


// Funcionalidades de outros elementos da UI que não estão diretamente relacionados à desenhos.

// navegação entre seções.
for (let i = 0; i < asideSections.length; i++) {
    asideSections[i].addEventListener('click', function () {
        if (asideSelectedSection === this.children[0].textContent.toLowerCase()) return;
        asideSelectedSection = this.children[0].textContent.toLowerCase();
        drawings.innerHTML = NO_DRAWING_TEXT;
        sharedWorker.port.postMessage({ type: "render section", section: asideSelectedSection });
        for (let j = 0; j < asideSections.length; j++) {
            asideSections[j].setAttribute("aria-selected", "false");
        }
        this.setAttribute("aria-selected", "true");
    });
}
searchBtn.addEventListener('click', function (ev) {
    ev.preventDefault();
    sharedWorker.port.postMessage({ type: "search drawings", section: asideSelectedSection, search: searchInput.value });
});

deleteAllDrawingsBtn.addEventListener("click", dangerousAction("excluir todos os desenhos", function () {
    sharedWorker.port.postMessage({ type: "clear database" });
}));

changeOrderingBtn.addEventListener("click", function () {
    changeOrderingModal.style.marginTop = `${this.getBoundingClientRect().y + this.getBoundingClientRect().height}px`;
    changeOrderingModal.style.marginLeft = `${this.getBoundingClientRect().x + (this.getBoundingClientRect().width / 10) * 9}px`;
    if ((changeOrderingModal.getBoundingClientRect().x + changeOrderingModal.getBoundingClientRect().width) > window.innerWidth) {
        const totalSize = changeOrderingModal.getBoundingClientRect().x + changeOrderingModal.getBoundingClientRect().width;
        changeOrderingModal.style.marginLeft = `${totalSize + (window.innerWidth - totalSize)}px`;
    }

    if ((changeOrderingModal.getBoundingClientRect().y + changeOrderingModal.getBoundingClientRect().height) > window.innerHeight) {
        const totalSize = changeOrderingModal.getBoundingClientRect().y + changeOrderingModal.getBoundingClientRect().height;
        changeOrderingModal.style.marginTop = `${totalSize + (window.innerHeight - totalSize)}px`;
    }
});

applyOrderingChanges.addEventListener("click", function () {
    const orderingMode = changeOrderingModal.querySelectorAll("select")[0];
    const orderingWay = changeOrderingModal.querySelectorAll("select")[1];

    sharedWorker.port.postMessage({ type: "render section", section: asideSelectedSection, order: { mode: orderingMode.value, way: orderingWay.value } });
})

window.onresize = updateDrawingsMenuPosition;

more.addEventListener('click', function () {
    if (asideClosed) { // open the aside
        // say that the aside is open
        this.ariaExpanded = "true";

        // update the width and the border
        aside.style.minWidth = "var(--aside-width)";
        aside.style.width = "var(--aside-width)";
        aside.style.borderRight = "2px black solid";

        // self-descriptive
        asideClosed = false;

        // if the config menu was left open and is being "re-opened" add the blur
        // to the <main> (drawings.parentNode) because the config menu is open.
        if(configBtn.ariaExpanded === "true"){
            drawings.parentNode.classList.add("not-focus");
        }
    } else { // close the aside
        // say that the aside is closed
        this.ariaExpanded = "false";

        // remove the width and the border
        aside.style.minWidth = "0";
        aside.style.width = "0";
        aside.style.borderRight = "0 black solid";

        // self-descriptive
        asideClosed = true;

        // if the config menu was left open remove the blur from the <main> (drawings.parentNode)
        // because the config menu isnt "open".
        if(configBtn.ariaExpanded === "true"){
            drawings.parentNode.classList.remove("not-focus");
        }
    }

    setTimeout(updateDrawingsMenuPosition, 1000);
});

closeConfigMenuBtn.addEventListener('click', hideConfigMenu);
configBtn.addEventListener('click', showConfigMenu);
drawingsCounterCheckbox.addEventListener('click', toggleDrawingsCounter);
themeSelector.addEventListener('change', function () {
    changeTheme(this.value);
});

// change the position of the "change drawings ordering" button from the header to the aside
// if the width of the screen is small.
window.matchMedia("screen and (max-width: 475px)").onchange = function(query){
    if(query.matches){
        aside.querySelector("ul").insertAdjacentElement("afterend", changeOrderingBtn.parentElement);
    }else{
        header.querySelector("#drawing-related-options").insertAdjacentElement("beforebegin", changeOrderingBtn.parentElement);
    }
}

function showConfigMenu() {
    // say that the config menu is open
    configBtn.ariaExpanded = "true";
    closeConfigMenuBtn.ariaExpanded = "true";

    // hide these, as we dont need them
    asideSections[0].parentNode.classList.add("hidden");
    configBtn.parentNode.classList.add("hidden");

    // actually show the config menu
    configMenu.classList.remove("hidden");

    // blur the <main> (drawings.parentNode) and prevent it from
    // receiving pointer events
    drawings.parentNode.classList.add("not-focus");

    // apply a min width to increase the width of the aside
    aside.style.minWidth = ASIDE_EXTENDED_PLUS_WIDTH;

    // update the css variable --aside-width because the aside is now bigger
    document.documentElement.style.setProperty("--aside-width", ASIDE_EXTENDED_PLUS_WIDTH);
}

function hideConfigMenu() {
    // say that the config menu is closed
    configBtn.ariaExpanded = "false";
    closeConfigMenuBtn.ariaExpanded = "false";

    // show the content that the config menu hid
    asideSections[0].parentNode.classList.remove("hidden");
    configBtn.parentNode.classList.remove("hidden");

    // actually hide the config menu
    configMenu.classList.add("hidden");

    // de-blur the <main> (drawings.parentNode)
    drawings.parentNode.classList.remove("not-focus");

    // dont need the min-width anymore
    aside.style.minWidth = "";

    // update the css variable --aside-width because the aside is now smaller
    document.documentElement.style.setProperty("--aside-width", aside.getAttribute("data-width"));
}

/**
 * Atualiza a posição dos menus flutuantes dos desenhos.
 */
function updateDrawingsMenuPosition() {
    for (const menu of document.querySelectorAll("div.drawing > div[popover]")) {
        menu.style.marginLeft = `${menu.parentElement.getBoundingClientRect().x + menu.parentElement.getBoundingClientRect().width}px`;
        menu.style.marginTop = `${menu.parentElement.getBoundingClientRect().y + 10}px`;
    }
}

function changeTheme(newTheme) {
    switch (newTheme) {
        case "Automático":
            document.documentElement.classList.remove("light");
            document.documentElement.classList.remove("dark");
            break;
        case "Escuro":
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            break;
        case "Claro":
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
            break;
    }
}

function toggleDrawingsCounter() {
    if (asideSections[0].children[1].classList.contains("hidden")) {
        for (let i = 0; i < asideSections.length; i++) {
            asideSections[i].children[1].classList.remove("hidden");
        }
        document.documentElement.style.setProperty("--aside-width", ASIDE_EXTENDED_WIDTH);
        aside.setAttribute("data-width", ASIDE_EXTENDED_WIDTH);
        for (let i = 0; i < asideSections.length; i++) {
            // só para saber o getBoundigClientRect().x e depois re-esconder
            asideSections[i].parentNode.classList.remove("hidden");
            // pega a distância do contador desenhos da esquerda e aplica ela como margem.
            asideSections[i].children[1].style.marginLeft = `${100 - asideSections[i].children[1].getBoundingClientRect().x}px`;
            asideSections[i].parentNode.classList.add("hidden");
        }
    } else {
        for (let i = 0; i < asideSections.length; i++) {
            asideSections[i].children[1].classList.add("hidden");
            asideSections[i].children[1].style.marginLeft = "";
        }
        document.documentElement.style.setProperty("--aside-width", ASIDE_NORMAL_WIDTH);
        aside.setAttribute("data-width", ASIDE_NORMAL_WIDTH);
    }
}

/**
 * Aumenta a contagem de desenhos de uma seção.
 * @param {String} section nome da seção.
 * @param {Number} amount o quanto será aumentado.
 */
function incrementDrawingCounter(section, amount = 1) {
    for (let i = 0; i < asideSections.length; i++) {
        if (asideSections[i].querySelector("button").textContent.toLowerCase() === section.toLowerCase()) {
            // transforma o texto do contador em um número e incrementa a quantidade passada.
            asideSections[i].querySelector("span.section-drawings-counter").textContent = parseInt(asideSections[i].querySelector("span.section-drawings-counter").textContent) + amount;
            // encerra o loop e retorna.
            return;
        }
    }
}

/**
 * Diminui a contagem de desenhos de uma seção.
 * @param {String} section nome da seção.
 * @param {Number} amount o quanto será diminuído.
 */
function decrementDrawingCounter(section, amount = 1) {
    for (let i = 0; i < asideSections.length; i++) {
        if (asideSections[i].querySelector("button").textContent.toLowerCase() === section.toLowerCase()) {
            // transforma o texto do contador em um número e incrementa a quantidade passada.
            asideSections[i].querySelector("span.section-drawings-counter").textContent = parseInt(asideSections[i].querySelector("span.section-drawings-counter").textContent) - amount;
            // encerra o loop e retorna.
            return;
        }
    }
}

/**
 * Remove um desenho da tela.
 * @param {String} name nome do desenho.
 */
function removeDrawing(name) {
    // busca o desenho para removê-lo da tela.
    for (let i = 0; i < drawings.children.length; i++) {
        if (drawings.children[i].querySelector(".info span").textContent === name) {
            drawings.children[i].remove();
        }
    }

    if (drawings.children.length === 0) {
        drawings.innerHTML = NO_DRAWING_TEXT;
    }
}

/**
 * Exclui um desenho e o remove da tela.
 * @param {String} name nome do desenho.
 * @param {String} section seção à qual o desenho pertence.
 */
function deleteDrawing(name, section) {
    sharedWorker.port.postMessage({ type: "delete drawing", name: name, section: section });
    removeDrawing(name);
    // deve ser feito no onmessage do Shared Worker.
    // decrementDrawingCounter(section, 1);
}

/**
 * Shows a modal asking if you really want to do that.
 * As it has to wait for the user input, the function will become
 * asynchronous.
 * @param {String} action what it does. No explanation or something except what it does.
 * Example: "exclude all the drawings using a loop" not.
 *          "exclude all drawings" yes.
 * @param {Function} actionFunc the function that will do the action.
 */
function dangerousAction(action, actionFunc) {
    return async function (...args) {
        const confirmed = await inputModal.showInputModal("confirm", {
            title: "Certeza?",
            message: `Tem certeza de que quer ${action}? Esta é uma ação irreversível.`
        });

        inputModal.close();

        if (confirmed) {
            return actionFunc(...args);
        }
    }
}
