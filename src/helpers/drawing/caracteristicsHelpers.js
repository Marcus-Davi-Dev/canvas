import { carac, fontsDatalist, drawingColorInput} from "./../../application/drawing/UIElements.js";

function caracteristicsChildren() {
    return Array.from(carac.children);
}

export function showTextCaracteristics() {
    if (!caracteristicsChildren().filter((el) => { return el.getAttribute("data-text-caracteristic"); }).length) {
        const fontSizeLabel = document.createElement("label");
        fontSizeLabel.textContent = "Tamanho da fonte: ";
        fontSizeLabel.setAttribute("for", "font-size");

        const fontSizeInput = document.createElement("input");
        fontSizeInput.type = "number";
        fontSizeInput.id = "font-size";
        fontSizeInput.min = "2";

        const fontSizeWrraper = document.createElement("div");
        fontSizeWrraper.id = "font-size-div";
        fontSizeWrraper.appendChild(fontSizeLabel);
        fontSizeWrraper.appendChild(fontSizeInput);


        const fontFamilyLabel = document.createElement("label");
        fontFamilyLabel.textContent = "Família da fonte: ";
        fontFamilyLabel.setAttribute("for", "font-family");

        const fontFamilyInput = document.createElement("input");
        fontFamilyInput.id = "font-family";
        fontFamilyInput.setAttribute("list", "availableFonts");

        const fontFamilyWrraper = document.createElement("div");
        fontFamilyWrraper.id = "font-family-div";
        fontFamilyWrraper.appendChild(fontFamilyLabel);
        fontFamilyWrraper.appendChild(fontFamilyInput);


        const textInputLabel = document.createElement("label");
        textInputLabel.setAttribute("for", "text");
        textInputLabel.textContent = "Texto: ";

        const textInput = document.createElement("input");
        textInput.id = "text";

        const textInputWrraper = document.createElement("div");
        textInputWrraper.id = "text-input-div";
        textInputWrraper.appendChild(textInputLabel);
        textInputWrraper.appendChild(textInput);


        fontSizeInput.oninput = function () { drawer.ctx.font = `bold ${this.value}px ${fontFamilyInput.value}`; }
        fontFamilyInput.oninput = function () { drawer.ctx.font = `bold ${fontSizeInput.value}px ${this.value}`; }
        drawingColorInput.oninput = function () { drawer.ctx.fillStyle = this.value; }

        if (fontsDatalist.children.length === 0) {
            (async function () {
                let availableFonts;

                if ("queryLocalFonts" in window) {
                    availableFonts = await window.queryLocalFonts();
                } else {
                    availableFonts = ["sans-serif", "serif", "monospace"];
                }

                for (let i = 0; i < availableFonts.length; i++) {
                    const option = document.createElement("option");
                    option.textContent = availableFonts[i].fullName || availableFonts[i];
                    option.value = availableFonts[i].fullName || availableFonts[i];

                    if (availableFonts[i]?.style.split(" ").length > 1) {
                        option.style.fontStyle = availableFonts[i].style.split(" ")[1];
                        option.style.fontWeight = availableFonts[i].style.split(" ")[0];
                    } else if (availableFonts[i]?.style === "Italic") {
                        option.style.fontStyle = availableFonts[i].style;
                    } else {
                        option.style.fontWeight = availableFonts[i]?.style;
                    }
                    fontsDatalist.appendChild(option);
                }

            })();
        }

        carac.querySelector("br").remove();
        carac.querySelector("label[for=drawing-line-width").remove();
        carac.querySelector("input#drawing-line-width").remove();

        //fontSizeLabel.setAttribute("data-text-caracteristic", "true");
        //fontSizeInput.setAttribute("data-text-caracteristic", "true");
        //fontFamilyLabel.setAttribute("data-text-caracteristic", "true");
        //fontFamilyInput.setAttribute("data-text-caracteristic", "true");
        //textInputLabel.setAttribute("data-text-caracteristic", "true");
        //textInput.setAttribute("data-text-caracteristic", "true");


        fontSizeWrraper.setAttribute("data-text-caracteristic", "true");
        fontFamilyWrraper.setAttribute("data-text-caracteristic", "true");
        textInputWrraper.setAttribute("data-text-caracteristic", "true");


        carac.appendChild(fontSizeWrraper);
        carac.appendChild(fontFamilyWrraper);
        carac.appendChild(textInputWrraper);
    }
}

export function hideTextCaracteristics() {
    const textCaracteristics = caracteristicsChildren().filter((el) => { return el.getAttribute("data-text-caracteristic") });
    if (textCaracteristics.length) {
        for (let i = 0; i < textCaracteristics.length; i++) {
            textCaracteristics[i].remove();
        }
        const label = document.createElement("label");
        label.setAttribute("for", "drawing-line-width");
        label.textContent = "Espessura: ";

        carac.appendChild(document.createElement("br"));
        carac.appendChild(label);
        carac.appendChild(lineWidthInput);
    }
}

export function showNewPathButton() {
    if (!(caracteristicsChildren().filter((el) => { return el.textContent === "Iniciar novo traço" }).length)) {
        const button = document.createElement("button");
        button.style.display = "block";
        button.textContent = "Iniciar novo traço";
        button.addEventListener("click", function () { drawer.ctx.beginPath() });

        carac.appendChild(button);
    }
}

export function hideNewPathButton() {
    const newPathElements = caracteristicsChildren().filter((el) => { return el.textContent === "Iniciar novo traço" });
    if (newPathElements.length) {
        newPathElements[0].remove();
    }
}

export function showPolygonCaracteristics() {
    if (document.querySelectorAll("[data-polygon-caracteristic]").length) {
        return;
    }

    const wrraper = document.createElement("div");
    wrraper.id = "polygon-sides-div";
    wrraper.setAttribute("data-polygon-caracteristic", "true");

    const sidesInputLabel = document.createElement("label");
    sidesInputLabel.setAttribute("for", "polygon-sides-input");
    sidesInputLabel.id = "polygon-sides-label";
    sidesInputLabel.textContent = "Número de lados:";

    const sidesInput = document.createElement("input");
    sidesInput.id = "polygon-sides-input";
    sidesInput.type = "number";
    sidesInput.min = "2";
    sidesInput.value = "7";

    wrraper.appendChild(sidesInputLabel);
    wrraper.appendChild(sidesInput);

    carac.appendChild(wrraper);
};

export function hidePolygonCaracteristics() {
    document.querySelectorAll("[data-polygon-caracteristic]").forEach((element) => { element.remove(); });
}
