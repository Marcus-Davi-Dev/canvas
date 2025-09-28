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
import Drawer from "./Drawer.js";
import {
    showNewPathButton,
    hideNewPathButton,
    showTextCaracteristics,
    hideTextCaracteristics,
    showPolygonCaracteristics,
    hidePolygonCaracteristics
} from "./../../helpers/drawing/caracteristicsHelpers.js";
import {
    canvas,
    drawingPreview,
    carac,
    lineWidthInput,
    drawingColorInput,
    drawingOptions,
    resizer,
    closeCanvasBtn
} from "./UIElements.js";

canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d");

drawingPreview.height = canvas.height;
drawingPreview.width = canvas.width;
const previewDrawer = new Drawer(drawingPreview);

// if the user is drawing, not if the drawing is a drawing.
let isDrawing = false;
let lowestPosition = { x: 9999, y: 9999 };
let highestPosition = { x: 0, y: 0 };
let currentDrawingMode = "shape";
let currentShapeToDraw = "rectangle";

ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.lineJoin = "round";

// if the lineWidth is odd, translate the canvas by 0.5 in the x-axis and the y-axis
// can increase the pixel sharpness, removing part of the blur. Every time a change
// to the lineWidth is made, update this variable to translate or de-translate the
// canvas.
let isPixelSharpnessTranslated = false;

const canvasDrawer = new Drawer(canvas);

const sharedWorker = new SharedWorkerPolyfill(new URL("./../../services/sharedWorker.js", import.meta.url));

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
                canvasDrawer.ctx.drawImage(img, 0, 0);
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
    canvasDrawer.ctx.lineWidth = parseInt(carac.children["drawing-line-width"].value);
    canvasDrawer.ctx.strokeStyle = carac.children["drawing-line-color"].value;
    canvasDrawer.ctx.fillStyle = carac.children["drawing-line-color"].value;
    drawShapeButtonShapes();
    appendEventListenerToShapeButtons();
    drawDrawingTypeButtonsImage();
    appendEventListenerToDrawingTypeButtons();
}
init();

HTMLElement.prototype.resetStyle = function () {
    this.style = "";
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
        canvasDrawer.lineTo(Math.round(ev.offsetX), Math.round(ev.offsetY));
        canvasDrawer.ctx.stroke();
    }
});

function handleMouseOrTouchMove(event) {
    if (!isDrawing) {
        return;
    }

    switch (currentDrawingMode) {
        case "free":
            canvasDrawer.strokeLineTo(getEventPos(event).x, getEventPos(event).y);
            break;
        case "text":
            previewDrawer.ctx.font = canvasDrawer.ctx.font;

            previewDrawer.clear();
            previewDrawer.rectangle(lowestPosition.x, lowestPosition.y, getEventPos(event).x - lowestPosition.x, getEventPos(event).y - lowestPosition.y);
            drawText(previewDrawer);
            break;
        case "shape":
            previewDrawer.clear();

            previewDrawer.ctx.save();
            previewDrawer.ctx.lineWidth = 1;
            previewDrawer.ctx.strokeStyle = "black";

            previewDrawer.rectangle(lowestPosition.x, lowestPosition.y, getEventPos(event).x - lowestPosition.x, getEventPos(event).y - lowestPosition.y);

            previewDrawer.ctx.restore();

            if (currentShapeToDraw === "polygon") {
                drawShape(
                    currentShapeToDraw,
                    previewDrawer,
                    { lowestPosition: lowestPosition, highestPosition: getEventPos(event) },
                    { sides: parseInt(document.querySelector("#polygon-sides-input").value) }
                );
            } else {
                drawShape(
                    currentShapeToDraw,
                    previewDrawer,
                    { lowestPosition: lowestPosition, highestPosition: getEventPos(event) }
                );
            }
            break;
        case "line":
            previewDrawer.ctx.beginPath();
            previewDrawer.clear();
            // highestPosition is the position where the last point/line was drawn.
            // i think that this variable should be renamed to something more descriptive.
            previewDrawer.ctx.moveTo(highestPosition.x, highestPosition.y);
            previewDrawer.ctx.lineTo(getEventPos(event).x, getEventPos(event).y);
            previewDrawer.ctx.stroke();
            break;
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
        canvasDrawer.moveTo(getEventPos(event).x, getEventPos(event).y);
        canvasDrawer.ctx.beginPath();
    }

    lowestPosition = getEventPos(event);
    isDrawing = true;

    drawingPreview.style.display = "block";
}

function handleMouseUpOrTouchEnd(event) {
    highestPosition = getEventPos(event);

    if (currentDrawingMode === "shape") {
        drawShape(
            currentShapeToDraw,
            canvasDrawer,
            {
                lowestPosition: lowestPosition,
                highestPosition: highestPosition
            },
            currentShapeToDraw === "polygon" ? {
                sides: parseInt(document.querySelector("#polygon-sides-input").value)
            } : undefined
        );
    }

    if (currentDrawingMode === "text") {
        drawText(canvasDrawer);
    }

    if (currentDrawingMode !== "line") {
        ctx.closePath();
    }

    if (currentDrawingMode !== "free") {
        drawingPreview.style.display = "none";
        previewDrawer.clear();
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

function drawText(targetDrawer) {
    targetDrawer.text(carac.children["text-input-div"].children["text"].value, lowestPosition.x, lowestPosition.y, { fontSize: carac.children["font-size-div"].children["font-size"].value, fontFamily: carac.children["font-family-div"].children["font-family"].value });
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

/**
 * Draw the shape of the buttons that change the current shape to draw.
*/
function drawShapeButtonShapes() {
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

    }
}

/**
 * Append the click event listener to the shape buttons.
*/
function appendEventListenerToShapeButtons() {
    for (let i = 0, dataShapeBtns = document.querySelectorAll("button[data-shape]"); i < dataShapeBtns.length; i++) {
        if (dataShapeBtns[i].getAttribute("data-shape") === "polygon") {
            dataShapeBtns[i].addEventListener("click", function () {
                currentDrawingMode = "shape";
                currentShapeToDraw = dataShapeBtns[i].getAttribute("data-shape");
                document.querySelectorAll("button.active").forEach((btn) => { btn.classList.remove("active") });
                this.classList.add("active");
                hideNewPathButton();
                hideTextCaracteristics();
                showPolygonCaracteristics();
            });
        } else {
            dataShapeBtns[i].addEventListener("click", function () {
                currentDrawingMode = "shape";
                currentShapeToDraw = dataShapeBtns[i].getAttribute("data-shape");
                document.querySelectorAll("button.active").forEach((btn) => { btn.classList.remove("active") });
                this.classList.add("active");
                hideNewPathButton();
                hideTextCaracteristics();
                hidePolygonCaracteristics();
            });
        }
    }
}

/**
 * Append the click event listener to the drawing type buttons.
*/
function appendEventListenerToDrawingTypeButtons() {
    for (let i = 0, dataTypeBtns = document.querySelectorAll("button[data-type]"); i < dataTypeBtns.length; i++) {
        if (dataTypeBtns[i].getAttribute("data-type") === "line") {
            dataTypeBtns[i].addEventListener("click", function () {
                canvasDrawer.ctx.beginPath();
                currentDrawingMode = this.getAttribute("data-type");
                hideTextCaracteristics();
                showNewPathButton();
                hidePolygonCaracteristics();
                document.querySelectorAll("button.active").forEach((btn) => { btn.classList.remove("active") });
                this.classList.add("active");
            });
        } else if (dataTypeBtns[i].getAttribute("data-type") === "clear") {
            dataTypeBtns[i].addEventListener("click", function () {
                if (ctx.globalCompositeOperation === "source-over") {
                    ctx.globalCompositeOperation = "destination-out";
                    this.style.backgroundColor = "orange";
                } else {
                    ctx.globalCompositeOperation = "source-over";
                    this.style.backgroundColor = "";
                }
            });
        } else if (dataTypeBtns[i].getAttribute("data-type") === "text") {
            dataTypeBtns[i].addEventListener("click", function () {
                currentDrawingMode = this.getAttribute("data-type");
                showTextCaracteristics();
                hideNewPathButton();
                hidePolygonCaracteristics();
                document.querySelectorAll("button.active").forEach((btn) => { btn.classList.remove("active") });
                this.classList.add("active");
            });
        } else {
            dataTypeBtns[i].addEventListener("click", function () {
                currentDrawingMode = this.getAttribute("data-type");
                hideTextCaracteristics();
                hideNewPathButton();
                hidePolygonCaracteristics();
                document.querySelectorAll("button.active").forEach((btn) => { btn.classList.remove("active") });
                this.classList.add("active");
            });
        }
    }
}

/**
 * Draw the image of the buttons that change the current drawing type (shape, free, text, etc). 
*/
function drawDrawingTypeButtonsImage() {
    for (let i = 0, dataTypeBtns = document.querySelectorAll("button[data-type]"); i < dataTypeBtns.length; i++) {
        const temporaryCtx = dataTypeBtns[i].querySelector("canvas").getContext("2d");
        if (document.documentElement.classList.contains("dark-mode")) {
            temporaryCtx.strokeStyle = "white";
        }

        if (dataTypeBtns[i].getAttribute("data-type") === "free") {
            temporaryCtx.lineWidth = 24;
            temporaryCtx.lineCap = "round";
            temporaryCtx.lineJoin = "round";
            temporaryCtx.moveTo(temporaryCtx.canvas.width / 19, temporaryCtx.canvas.height / 3 * 2);
            temporaryCtx.lineTo(temporaryCtx.canvas.width / 4, temporaryCtx.canvas.height / 3);
            temporaryCtx.lineTo(temporaryCtx.canvas.width / 2, temporaryCtx.canvas.height / 2);
            temporaryCtx.lineTo(temporaryCtx.canvas.width / 19 * 18, temporaryCtx.canvas.height / 2);
            temporaryCtx.stroke();
        } else if (dataTypeBtns[i].getAttribute("data-type") === "line") {
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
        } else if (dataTypeBtns[i].getAttribute("data-type") === "clear") {
            const temporaryDrawer = new Drawer(temporaryCtx.canvas);
            temporaryCtx.lineWidth = 12;
            temporaryCtx.fillStyle = "crimson";
            temporaryDrawer.diamond(temporaryCtx.canvas.width / 4, temporaryCtx.canvas.height / 3 * 2, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
            temporaryCtx.fillStyle = "cyan";
            temporaryDrawer.diamond(temporaryCtx.canvas.width / 4 * 1.66, temporaryCtx.canvas.height / 3 * 1.5, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
        } else if (dataTypeBtns[i].getAttribute("data-type") === "text") {
            const temporaryDrawer = new Drawer(temporaryCtx.canvas);
            temporaryDrawer.text("t", temporaryDrawer.canvas.width / 7 * 2, -30, { fontSize: temporaryDrawer.canvas.width, color: document.documentElement.classList.contains("dark-mode") ? "white" : "black" });
        }
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

    canvasDrawer.ctx.lineWidth = lineWidthInput.value;
    canvasDrawer.ctx.beginPath();
    previewDrawer.ctx.lineWidth = lineWidthInput.value;
    previewDrawer.ctx.beginPath();
})

drawingColorInput.addEventListener("input", function () {
    canvasDrawer.ctx.strokeStyle = drawingColorInput.value;
    canvasDrawer.ctx.beginPath();
    previewDrawer.ctx.strokeStyle = drawingColorInput.value;
    previewDrawer.ctx.beginPath();
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
    saveLinkWrraper.href = "/canvas/index.html";
    saveLinkWrraper.textContent = "Salvar";
    saveLinkWrraper.addEventListener('click', function () {
        canvas.toBlob((blob) => {
            sharedWorker.port.postMessage({ type: "update drawing", name: (URL.parse(window.location)).searchParams.get("drawing"), section: (URL.parse(window.location)).searchParams.get("section"), img: blob });
        });
    })
    saveBtn.appendChild(saveLinkWrraper);

    const doNotSaveBtn = document.createElement("button");
    const doNotSaveLinkWrraper = document.createElement("a");
    doNotSaveLinkWrraper.href = "/canvas/index.html";
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
