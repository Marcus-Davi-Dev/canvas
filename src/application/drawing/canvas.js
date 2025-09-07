/* Anotações do canvas sobre o globalCompositeOperation
----Subtrair----
- destination-out
Ele vai apagar o conteúdo do canvas onde a nova forma dá overlap no conteúdo do canvas.
Adicionalmente, a forma não desenhará nada, apenas apagará.
*/



/* Possível sistema de gradiente
let gradient;

canvas.onmouseup = () => {
    gradient = ctx.createLinearGradient(lowestPosition.x, lowestPosition.y, highestPosition.x, highestPosition.y);
    gradient.addColorStop(0, "blue");
    gradient.addColorStop(0.5, "green");
    gradient.addColorStop(1, "red");
    ctx.fillStyle = gradient;
}
*/

import SharedWorkerPolyfill from "./../../lib/polyfill/SharedWorkerPolyfill.js";
import toArray from "./../../utils/toArray.js";
import Drawer from "./Drawer.js";

const canvas = document.querySelector("#main-canvas");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d");

const drawingPreview = document.querySelector("#drawing-preview");
drawingPreview.height = canvas.height;
drawingPreview.width = canvas.width;
const previewDraw = new Drawer(drawingPreview);

const lineWidthInput = document.querySelector("input#drawing-line-width");
const drawingColorInput = document.querySelector("input#drawing-line-color");
const resizer = document.querySelector("#resizer");
const drawingOptions = document.querySelector("#drawing-options");
const carac = document.querySelector("#caracteristics");
const closeCanvasBtn = document.querySelector("#return");
// if the user is drawing, not if the drawing is a drawing.
let isDrawing = false;
let lowestPosition = { x: 9999, y: 9999 };
let highestPosition = { x: 0, y: 0 };
let currentDrawingMode = "shape";
let currentShapeToDraw = "rectangle";
const fontsDatalist = document.querySelector("datalist");

ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.lineJoin = "round";

// if the lineWidth is odd, translate the canvas by 0.5 in the x-axis and the y-axis
// can increase the pixel sharpness, removing part of the blur. Every time a change
// to the lineWidth is made, update this variable to translate or de-translate the
// canvas.
let isPixelSharpnessTranslated = false;

const drawer = new Drawer(canvas);

const sharedWorker = new SharedWorkerPolyfill("./../../services/sharedWorker.js");

sharedWorker.port.onmessage = function (ev) {
    const msg = ev.data;
    if (msg.type === "update drawing" && msg.result === "error") {
        alert(msg.errorMsg);
    } else if (msg.type === "get drawing") {
        if (msg.result === "success") {
            const img = new Image();
            img.src = URL.createObjectURL(msg.img);
            img.onload = function () {
                URL.revokeObjectURL(img.src);
                drawer.ctx.drawImage(img, 0, 0);
            }
        } else {
            alert(msg.errorMsg);
        }
    } else if (msg.type === "ready") {
        sharedWorker.port.postMessage({
            type: "get drawing",
            name: (URL.parse(window.location)).searchParams.get("drawing"),
            section: (URL.parse(window.location)).searchParams.get("section")
        });
    }
}

function init() {
    drawer.ctx.lineWidth = parseInt(carac.children["drawing-line-width"].value);
    drawer.ctx.strokeStyle = carac.children["drawing-line-color"].value;
    drawer.ctx.fillStyle = carac.children["drawing-line-color"].value;
}
init();

HTMLElement.prototype.resetStyle = function () {
    this.style = "";
}

function caracteristicsChildren() {
    return toArray(carac.children);
}

function showTextCaracteristics() {
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

function hideTextCaracteristics() {
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

function showNewPathButton() {
    if (!(caracteristicsChildren().filter((el) => { return el.textContent === "Iniciar novo traço" }).length)) {
        const button = document.createElement("button");
        button.style.display = "block";
        button.textContent = "Iniciar novo traço";
        button.addEventListener("click", function () { drawer.ctx.beginPath() });

        carac.appendChild(button);
    }
}

function hideNewPathButton() {
    const newPathElements = caracteristicsChildren().filter((el) => { return el.textContent === "Iniciar novo traço" });
    if (newPathElements.length) {
        newPathElements[0].remove();
    }
}

function showPolygonCaracteristics() {
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

function hidePolygonCaracteristics() {
    document.querySelectorAll("[data-polygon-caracteristic]").forEach((element) => { element.remove(); });
}


canvas.addEventListener("mousemove", handleMouseOrTouchMove);
canvas.addEventListener("mousedown", handleMouseDownOrTouchStart);
canvas.addEventListener("mouseup", handleMouseUpOrTouchEnd);
canvas.addEventListener("touchmove", function (ev) {
    ev.preventDefault();
    handleMouseOrTouchMove(ev);
}, { passive: false });
canvas.addEventListener("touchstart", function (ev) {
    ev.preventDefault();
    handleMouseDownOrTouchStart(ev);
}, { passive: false });
canvas.addEventListener("touchend", function (ev) {
    ev.preventDefault();
    handleMouseUpOrTouchEnd(ev);
}, { passive: false });

canvas.addEventListener("touchcancel", function (ev) {
    console.log(ev);
    console.log("cancel acima ^");
}, { passive: false });

canvas.addEventListener("click", function (ev) {
    if (currentDrawingMode === "line") {
        drawer.lineTo(Math.round(ev.offsetX), Math.round(ev.offsetY));
        drawer.ctx.stroke();
    }
});

function handleMouseOrTouchMove(event) {
    if (!isDrawing) {
        return;
    }

    switch (currentDrawingMode) {
        case "free":
            drawer.strokeLineTo(getEventPos(event).x, getEventPos(event).y);
            break;
        case "text":
            previewDraw.ctx.font = drawer.ctx.font;

            previewDraw.clear();
            previewDraw.rectangle(lowestPosition.x, lowestPosition.y, getEventPos(event).x - lowestPosition.x, getEventPos(event).y - lowestPosition.y);
            drawText(previewDraw);
            break;
        case "shape":
            previewDraw.clear();
            previewDraw.rectangle(lowestPosition.x, lowestPosition.y, getEventPos(event).x - lowestPosition.x, getEventPos(event).y - lowestPosition.y);
            if (currentShapeToDraw === "polygon") {
                drawShape(
                    currentShapeToDraw,
                    previewDraw,
                    { lowestPosition: lowestPosition, highestPosition: getEventPos(event) },
                    { sides: parseInt(document.querySelector("#polygon-sides-input").value) }
                );
            } else {
                drawShape(
                    currentShapeToDraw,
                    previewDraw,
                    { lowestPosition: lowestPosition, highestPosition: getEventPos(event) }
                );
            }
        case "line":
        default:
            break; // do nothing
    }
}

function handleMouseDownOrTouchStart(event) {
    // if the user pressed the canvas, it was drawing,
    // what means that the canvas was changed, then everytime
    // the user try to reload to page or exit ask if it
    // really want to. use the onXX syntax to only add
    // 1 listener.
    window.onbeforeunload = (ev) => {
        // legacy suport
        ev.returnValue = true;
        ev.preventDefault();
    }

    console.log(event);
    if (currentDrawingMode !== "line") {
        drawer.moveTo(getEventPos(event).x, getEventPos(event).y);
        drawer.ctx.beginPath();
    }

    lowestPosition = getEventPos(event);
    isDrawing = true;

    drawingPreview.style.display = "block";
}

function handleMouseUpOrTouchEnd(event) {
    highestPosition = getEventPos(event);

    if (currentDrawingMode === "shape") {
        drawShape(currentShapeToDraw, drawer, { lowestPosition: lowestPosition, highestPosition: highestPosition }, currentShapeToDraw === "polygon" ? { sides: parseInt(document.querySelector("#polygon-sides-input").value) } : undefined);

        drawingPreview.style.display = "none";
        previewDraw.clear();
    }

    if (currentDrawingMode !== "line") {
        ctx.closePath();
    }

    if (currentDrawingMode === "text") {
        drawingPreview.style.display = "none";
        previewDraw.clear();

        drawText(drawer);
    }

    isDrawing = false;
}

/**
 * @param {MouseEvent || TouchEvent} event
*/
function getEventPos(event) {
    if (event.type === "touchend") {
        return { x: Math.round(event.changedTouches[0].clientX), y: Math.round(event.changedTouches[0].clientY) };
    } else if (event.type.startsWith("touch")) {
        return { x: Math.round(event.touches[0].clientX), y: Math.round(event.touches[0].clientY) };
    } else {
        return { x: Math.round(event.offsetX), y: Math.round(event.offsetY) };
    }
}

function drawText(drawToDrawText) {
    drawToDrawText.text(carac.children["text-input-div"].children["text"].value, lowestPosition.x, lowestPosition.y, { fontSize: carac.children["font-size-div"].children["font-size"].value, fontFamily: carac.children["font-family-div"].children["font-family"].value });
}

/**
 * 
 * @param {String} shape Name of the shape to draw
 * @param {Drawer} targetDraw The Drawer to draw to
 * @param {{
 *      lowestPosition: {
 *          x: number,
 *          y: number
 *      },
 *      highestPosition: {
 *          x: number,
 *          y: number
 *      }
 * }} pos The position to draw in. If it is determined by user input, `lowestPosition` must be the point where the user
 *        started clicking and `highestPosition` the point where the user finished clicking.
 * @param {{}} [values={}] Extra values that would be needed for drawing especific shapes, like the amount of
 *                         sides to draw a polygon
 */
function drawShape(shape, targetDraw, pos, values = {}) {
    switch (shape) {
        case "equilateralTriangle":
            // if ((pos.highestPosition.x - pos.lowestPosition.x) < 0 && (pos.highestPosition.y - pos.lowestPosition.y) < 0) {
            // targetDraw["equilateralTriangle"](pos.lowestPosition.x, pos.lowestPosition.y, Math.max(pos.highestPosition.x - pos.lowestPosition.x, pos.highestPosition.y - pos.lowestPosition.y));
            // } else if ((pos.highestPosition.x - pos.lowestPosition.x) < 0 || (pos.highestPosition.y - pos.lowestPosition.y) < 0) {
            // let size = Math.min(Math.abs(pos.highestPosition.x - pos.lowestPosition.x), Math.abs(pos.highestPosition.y - pos.lowestPosition.y));
            // targetDraw["equilateralTriangle"](Math.min(pos.highestPosition.x, pos.lowestPosition.x), Math.min(pos.highestPosition.y, pos.lowestPosition.y), size);
            // } else {
            // targetDraw["equilateralTriangle"](pos.lowestPosition.x, pos.lowestPosition.y, Math.min(pos.highestPosition.x - pos.lowestPosition.x, pos.highestPosition.y - pos.lowestPosition.y));
            // }
            let size = Math.min(Math.abs(pos.highestPosition.x - pos.lowestPosition.x), Math.abs(pos.highestPosition.y - pos.lowestPosition.y));
            targetDraw["equilateralTriangle"](Math.min(pos.highestPosition.x, pos.lowestPosition.x), Math.min(pos.highestPosition.y, pos.lowestPosition.y), size);
            break;
        case "circle":
            targetDraw["circle"](pos.lowestPosition.x + (pos.highestPosition.x - pos.lowestPosition.x) / 2, pos.lowestPosition.y + (pos.highestPosition.y - pos.lowestPosition.y) / 2, Math.min(Math.abs((pos.highestPosition.x - pos.lowestPosition.x) / 2), Math.abs((pos.highestPosition.y - pos.lowestPosition.y) / 2)), 0);
            break;
        case "ellipse":
            targetDraw["ellipse"](pos.lowestPosition.x + (pos.highestPosition.x - pos.lowestPosition.x) / 2, pos.lowestPosition.y + (pos.highestPosition.y - pos.lowestPosition.y) / 2, (pos.highestPosition.x - pos.lowestPosition.x) / 2, (pos.highestPosition.y - pos.lowestPosition.y) / 2);
            break;
        case "polygon":
            targetDraw["polygon"](pos.lowestPosition.x, pos.lowestPosition.y, pos.highestPosition.x - pos.lowestPosition.x, pos.highestPosition.y - pos.lowestPosition.y, values.sides);
            break;
        default:
            targetDraw[shape](pos.lowestPosition.x, pos.lowestPosition.y, pos.highestPosition.x - pos.lowestPosition.x, pos.highestPosition.y - pos.lowestPosition.y);
            break;
    }
}

for (let i = 0; i < document.querySelectorAll("button[data-shape]").length; i++) {
    const alternateCtx = document.querySelectorAll("button[data-shape]")[i].children[0].getContext("2d");
    const temporaryDrawer = new Drawer(alternateCtx.canvas);
    temporaryDrawer.ctx.lineWidth = 1.5;

    if (document.documentElement.classList.contains("dark-mode")) {
        temporaryDrawer.ctx.strokeStyle = "white";
    } else {
        temporaryDrawer.ctx.strokeStyle = "black";
    }

    if (alternateCtx.canvas.parentElement.getAttribute("data-shape") === "polygon") {
        alternateCtx.moveTo(0, 0);
        alternateCtx.lineTo(alternateCtx.canvas.width, 0);
        alternateCtx.lineTo(alternateCtx.canvas.width, alternateCtx.canvas.height);
        alternateCtx.lineTo(0, alternateCtx.canvas.height);
        alternateCtx.lineTo(0, 0);

        alternateCtx.rect(0, 0, alternateCtx.canvas.width / 8, alternateCtx.canvas.height / 8);
        alternateCtx.rect(alternateCtx.canvas.width - (alternateCtx.canvas.width / 8), 0, alternateCtx.canvas.width / 8, alternateCtx.canvas.height / 8);
        alternateCtx.rect(alternateCtx.canvas.width - (alternateCtx.canvas.width / 8), alternateCtx.canvas.height - (alternateCtx.canvas.height / 8), alternateCtx.canvas.width / 8, alternateCtx.canvas.height / 8);
        alternateCtx.rect(0, alternateCtx.canvas.height - (alternateCtx.canvas.height / 8), alternateCtx.canvas.width / 8, alternateCtx.canvas.height / 8);

        alternateCtx.stroke();
    } else {
        drawShape(alternateCtx.canvas.parentElement.getAttribute("data-shape"), temporaryDrawer, { lowestPosition: { x: 0, y: 0 }, highestPosition: { x: 16, y: 16 } });
    }

    if (alternateCtx.canvas.parentElement.getAttribute("data-shape") === "polygon") {
        alternateCtx.canvas.parentElement.addEventListener("click", function () {
            currentDrawingMode = "shape";
            currentShapeToDraw = alternateCtx.canvas.parentElement.getAttribute("data-shape");
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
            hideNewPathButton();
            hideTextCaracteristics();
            showPolygonCaracteristics();
        });
    } else {
        alternateCtx.canvas.parentElement.addEventListener("click", function () {
            currentDrawingMode = "shape";
            currentShapeToDraw = alternateCtx.canvas.parentElement.getAttribute("data-shape");
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
            hideNewPathButton();
            hideTextCaracteristics();
            hidePolygonCaracteristics();
        });
    }

}

for (let i = 0; i < document.querySelectorAll("button[data-type]").length; i++) {
    if (document.querySelectorAll("button[data-type]")[i].getAttribute("data-type") === "line") {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            drawer.ctx.beginPath();
            currentDrawingMode = this.getAttribute("data-type");
            hideTextCaracteristics();
            showNewPathButton();
            hidePolygonCaracteristics();
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
        })
    } else if (document.querySelectorAll("button[data-type]")[i].getAttribute("data-type") === "clear") {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            if (ctx.globalCompositeOperation === "source-over") {
                ctx.globalCompositeOperation = "destination-out";
                this.style.backgroundColor = "orange";
            } else {
                ctx.globalCompositeOperation = "source-over";
                this.style.backgroundColor = "";
            }
        })
    } else if (document.querySelectorAll("button[data-type]")[i].getAttribute("data-type") === "text") {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            currentDrawingMode = this.getAttribute("data-type");
            showTextCaracteristics();
            hideNewPathButton();
            hidePolygonCaracteristics();
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
        })
    } else {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            currentDrawingMode = document.querySelectorAll("button[data-type]")[i].getAttribute("data-type");
            hideTextCaracteristics();
            hideNewPathButton();
            hidePolygonCaracteristics();
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
        })
    }

    const temporaryCtx = document.querySelectorAll("button[data-type]")[i].children[0].getContext("2d");
    if (document.documentElement.classList.contains("dark-mode")) {
        temporaryCtx.strokeStyle = "white";
    }
    if (temporaryCtx.canvas.parentElement.getAttribute("data-type") === "free") {
        temporaryCtx.lineWidth = 24;
        temporaryCtx.lineCap = "round";
        temporaryCtx.lineJoin = "round";
        temporaryCtx.moveTo(temporaryCtx.canvas.width / 19, temporaryCtx.canvas.height / 3 * 2);
        temporaryCtx.lineTo(temporaryCtx.canvas.width / 4, temporaryCtx.canvas.height / 3);
        temporaryCtx.lineTo(temporaryCtx.canvas.width / 2, temporaryCtx.canvas.height / 2);
        temporaryCtx.lineTo(temporaryCtx.canvas.width / 19 * 18, temporaryCtx.canvas.height / 2);
        temporaryCtx.stroke();
    } else if (temporaryCtx.canvas.parentElement.getAttribute("data-type") === "line") {
        temporaryCtx.lineWidth = 12;
        temporaryCtx.lineCap = "round";
        temporaryCtx.fillStyle = "rgba(120, 120, 255, 0.8)";

        temporaryCtx.beginPath();
        temporaryCtx.arc(temporaryCtx.canvas.width / 7 / 2, temporaryCtx.canvas.height / 3, temporaryCtx.canvas.width / 7 / 2, 0, 2 * Math.PI);
        temporaryCtx.fill();
        temporaryCtx.closePath();

        temporaryCtx.beginPath();
        temporaryCtx.arc(temporaryCtx.canvas.width / 2, temporaryCtx.canvas.height / 7 * 6, temporaryCtx.canvas.width / 7 / 2, 0, 2 * Math.PI);
        temporaryCtx.fill();
        temporaryCtx.closePath();

        temporaryCtx.beginPath();
        temporaryCtx.arc((temporaryCtx.canvas.width / 7 * 6) + (temporaryCtx.canvas.width / 7 / 2), temporaryCtx.canvas.height / 3, temporaryCtx.canvas.width / 7 / 2, 0, 2 * Math.PI);
        temporaryCtx.fill();
        temporaryCtx.closePath();

        temporaryCtx.beginPath();
        temporaryCtx.moveTo(temporaryCtx.canvas.width / 7 / 2, temporaryCtx.canvas.height / 3);
        temporaryCtx.lineTo(temporaryCtx.canvas.width / 2, temporaryCtx.canvas.height / 7 * 6);
        temporaryCtx.lineTo((temporaryCtx.canvas.width / 7 * 6) + (temporaryCtx.canvas.width / 7 / 2), temporaryCtx.canvas.height / 3);
        temporaryCtx.stroke();
        temporaryCtx.closePath();
    } else if (temporaryCtx.canvas.parentElement.getAttribute("data-type") === "clear") {
        const temporaryDrawer = new Drawer(temporaryCtx.canvas);
        temporaryCtx.lineWidth = 12;
        temporaryCtx.fillStyle = "crimson";
        temporaryDrawer.diamond(temporaryCtx.canvas.width / 4, temporaryCtx.canvas.height / 3 * 2, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
        temporaryCtx.fillStyle = "cyan";
        temporaryDrawer.diamond(temporaryCtx.canvas.width / 4 * 1.66, temporaryCtx.canvas.height / 3 * 1.5, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
    } else if (temporaryCtx.canvas.parentElement.getAttribute("data-type") === "text") {
        const temporaryDrawer = new Drawer(temporaryCtx.canvas);
        temporaryDrawer.text("t", temporaryDrawer.canvas.width / 7 * 2, -30, { fontSize: temporaryDrawer.canvas.width, color: document.documentElement.classList.contains("dark-mode") ? "white" : "black" });
    }
}
lineWidthInput.addEventListener("input", function () {
    /**
     * if odd and already translated: do nothing.
     * if odd and not translated: translate.
     * if even and translated: de-translate.
     * if even and not translated: do nothing.
     */
    if (parseInt(lineWidthInput.value) % 2 === 1 && !isPixelSharpnessTranslated) {
        ctx.translate(0.5, 0.5);
        isPixelSharpnessTranslated = true;
    } else if (parseInt(lineWidthInput.value) % 2 === 0 && isPixelSharpnessTranslated) {
        ctx.translate(-0.5, -0.5);
        isPixelSharpnessTranslated = false;
    }

    ctx.lineWidth = lineWidthInput.value;
    drawer.ctx.lineWidth = lineWidthInput.value;
})

drawingColorInput.addEventListener("input", function () {
    ctx.strokeStyle = drawingColorInput.value;
    drawer.ctx.strokeStyle = drawingColorInput.value;
})

resizer.addEventListener("click", function () {
    drawingOptions.classList.toggle("resized");
    resizer.parentElement.resetStyle();
})

closeCanvasBtn.addEventListener('click', function () {
    const dialog = document.createElement("dialog");

    const title = document.createElement("h2");
    title.textContent = "Sair do editor";
    const text = document.createElement("p");
    text.textContent = "Salvar antes de sair?";

    const options = document.createElement("div");
    options.style.display = "flex";
    options.style.justifyContent = "center";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancelar";
    cancelBtn.addEventListener('click', function () {
        dialog.close();
        dialog.remove();
    })


    const saveBtn = document.createElement("button");
    const saveLinkWrraper = document.createElement("a");
    saveLinkWrraper.href = "/index.html";
    saveLinkWrraper.textContent = "Salvar";
    saveLinkWrraper.addEventListener('click', function () {
        canvas.toBlob((blob) => {
            sharedWorker.port.postMessage({ type: "update drawing", name: (URL.parse(window.location)).searchParams.get("drawing"), section: (URL.parse(window.location)).searchParams.get("section"), img: blob });
        });
    })
    saveBtn.appendChild(saveLinkWrraper);

    const doNotSaveBtn = document.createElement("button");
    const doNotSaveLinkWrraper = document.createElement("a");
    doNotSaveLinkWrraper.href = "/index.html";
    doNotSaveLinkWrraper.textContent = "Não salvar";
    doNotSaveBtn.appendChild(doNotSaveLinkWrraper);

    options.appendChild(cancelBtn);
    options.appendChild(saveBtn);
    options.appendChild(doNotSaveBtn);

    dialog.appendChild(title);
    dialog.appendChild(text);
    dialog.appendChild(options);

    document.body.appendChild(dialog);
    dialog.showModal();
});

// background color change when scrolling for resizer wrraper
drawingOptions.addEventListener("scroll", function (ev) {
    if (ev.target.scrollTop > 10) {
        resizer.parentElement.style.outline = "2px rgba(0, 0, 0, 0.4) solid";
        resizer.parentElement.style.backgroundColor = "rgb(38, 38, 48)";
    } else {
        resizer.parentElement.style.outline = "none";
        resizer.parentElement.style.backgroundColor = "inherit";
    }
}, { passive: true });
