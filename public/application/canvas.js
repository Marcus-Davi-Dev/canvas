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

import SharedWorkerPolyfill from "../polyfill/SharedWorkerPolyfill.js";
import toArray from "../utils/toArray.js";

class Draw {
    /**
     * @param {HTMLCanvasElement} canvas  canvas para o qual será desenhado.
    */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.fill = "black";
    }

    export() {
        let url;
        const a = document.createElement("a");
        this.canvas.toBlob((blob) => {
            a.href = URL.createObjectURL(blob);
            url = a.href;
            a.download = "desenho";
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 50);
        })
    }

    clear(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Move a caneta de desenho para as coordenadas especificadas.
     * @param {Number} x posição no eixo x em pixels
     * @param {Number} y posição no eixo y em pixels
     */
    moveTo(x, y) {
        this.ctx.moveTo(x, y);
    }

    /**
     * Cria uma linha dos pontos [x1, y1] até os [x2, y2].
     * @param {Number} x1 posição do primeiro ponto no eixo x em pixels 
     * @param {Number} y1 posição do primeiro ponto no eixo y em pixels
     * @param {Number} x2 posição do segundo ponto no eixo x em pixels
     * @param {Number} y2 posição do segundo ponto no eixo y em pixels
     */
    line(x1, y1, x2, y2) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
    }

    /**
     * Cria uma linha dos pontos [x1, y1] até os [x2, y2] e mostra no canvas.
     * @param {Number} x1 posição do primeiro ponto no eixo x em pixels
     * @param {Number} y1 posição do primeiro ponto no eixo y em pixels
     * @param {Number} x2 posição do segundo ponto no eixo x em pixels
     * @param {Number} y2 posição do segundo ponto no eixo y em pixels
     */
    strokeLine(x1, y1, x2, y2) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Desenha uma linha até as coordenadas [x, y].
     * @param {Number} x onde a linha terminará no eixo x em pixels
     * @param {Number} y onde a linha terminará no eixo y em pixels
     */
    lineTo(x, y) {
        this.ctx.lineTo(x, y);
    }

    /**
     * Desenha uma linha até as coordenadas [x, y] e mostra no canvas.
     * @param {Number} x onde a linha terminará no eixo x em pixels.
     * @param {Number} y onde a linha terminará no eixo y em pixels
     */
    strokeLineTo(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    /**
     * Desenha um círculo centralizado nos pontos x e y.
     * @param {Number} x posição do centro do círculo no eixo x em pixels.
     * @param {Number} y posição do centro do círculo no eixo y em pixels.
     * @param {Number} radius metade do diâmetro do círculo em pixels.
     * @param {Number} startAngle ângulo de início em radianos.
     * @param {Boolean} isFilled valor booleano que indica se o círculo será preenchido após desenhado.
     */
    circle(x, y, radius, startAngle, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.moveTo(x + radius, y);
        this.ctx.arc(x, y, Math.abs(radius), startAngle, 2 * Math.PI);

        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um retângulo.
     * @param {Number} x  posição do retângulo no eixo x (horizontal) em pixels.
     * @param {Number} y  posição do retângulo no eixo y (vertical) em pixels.
     * @param {Number} w  largura do retângulo em pixels.
     * @param {Number} h  altura do retângulo em pixels.
     * @param {Boolean} isFilled  valor booleano que indica se o retângulo será preenchido após desenhado.
    */
    rectangle(x, y, w, h, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.rect(x, y, w, h);
        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um losango.
     * @param {Number} x  posição do losango no eixo x (horizontal) em pixels.
     * @param {Number} y  posição do losango no eixo y (vertical) em pixels.
     * @param {Number} w  largura do losango.
     * @param {Number} h  altura do losango.
     * @param {Boolean} isFilled  valor booleano que indica se o losango será preenchido após desenhado.
    */
    diamond(x, y, w, h, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x, y + h / 2);
        this.ctx.lineTo(x + w / 2, y + h);
        this.ctx.lineTo(x + w, y + h / 2);
        this.ctx.lineTo(x + w / 2, y);

        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um triângulo.
     * @param {Number} x posição do triângulo no eixo x (horizontal) em pixels.
     * @param {Number} y posição do triângulo no eixo y (vertical) em pixels.
     * @param {Number} w largura do triângulo.
     * @param {Number} h altura do triângulo.
     * @param {Boolean} isFilled valor booleano que indica se o triângulo será preenchido após desenhado.
     */
    triangle(x, y, w, h, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y);

        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um triângulo equilátero.
     * @param {Number} x posição do triângulo equilátero no eixo x (horizontal) em pixels.
     * @param {Number} y posição do triângulo equilátero no eixo y (vertical) em pixels.
     * @param {Number} size tamanho do triângulo equilátero em pixels. Será usado como altura e largura do triângulo.
     * @param {Boolean} isFilled valor booleano que indica se o triângulo equilátero deve ser preenchido após desenhado.
    */
    equilateralTriangle(x, y, size, isFilled = false) {
        let w = size;
        let h = size * 0.8;
        this.ctx.beginPath();

        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y);

        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha uma estrela.
     * @param {Number} x posição da estrela no eixo x (horizontal) em pixels.
     * @param {Number} y posição da estrela no eixo y (vertical) em pixels.
     * @param {Number} w largura da estrela em pixels.
     * @param {Number} h altura da estrela em pixels.
     * @param {Boolean} isFilled valor booleano que indica se a estrela deve ser preenchida após desenhada.
     */
    star(x, y, w, h, isFilled = false) {
        let heightPart = h / 5;
        let widthPart = w / 5;

        this.ctx.beginPath();
        // --------- "/" do cone superior (^). ---------
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x + widthPart * 1.85, y + heightPart * 1.8);
        // --------- "\" do cone superior (^). ---------
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x + widthPart * 3.15, y + heightPart * 1.8);

        // --------- parte superior do cone esquerdo ("<"). ---------
        // move para a ponta inferior esquerda do cone superior.
        this.ctx.moveTo(x + widthPart * 1.85, y + heightPart * 1.8);
        this.ctx.lineTo(x, y + heightPart * 1.8);
        // --------- parte inferior do cone esquerdo ("<"). ---------
        this.ctx.lineTo(x + w / 3 - (w / 18), y + (h / 2.7) * 1.667);

        // --------- "\" do cone inferior esquerdo. ---------
        this.ctx.lineTo(x + (w / 3) / 2, y + h);
        // --------- "/" do cone inferior esquerdo. ---------
        this.ctx.lineTo(x + w / 2, y + heightPart * 3.5);

        // --------- "\" do cone inferior direito. ---------
        this.ctx.lineTo(x + (w / 3) * 2.5, y + h);
        // --------- "/" do cone inferior direito. ---------
        this.ctx.lineTo(x + (w / 3) * 2.3 - (w / 18), y + (h / 2.7) * 1.667);

        // --------- parte inferior do cone direito (">"). ---------
        this.ctx.lineTo(x + w, y + heightPart * 1.8);
        // --------- parte superior do cone direito (">"). ---------
        this.ctx.moveTo(x + widthPart * 3.15, y + heightPart * 1.8);
        this.ctx.lineTo(x + w, y + heightPart * 1.8);

        // exibe o desenho.
        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um trapézio.
     * @param {Number} x posição do trapézio no eixo x (horizontal) em pixels.
     * @param {Number} y posição do trapézio no eixo y (vertical) em pixels.
     * @param {Number} w largura do trapézio em pixels.
     * @param {Number} h altura do trapézio em pixels.
     * @param {Boolean} isFilled valor booleano que indica se o trapézio deve ser preenchido após desenhado.
     */
    trapezium(x, y, w, h, isFilled = false) {
        let widthPart = w / 5;
        this.ctx.beginPath();

        this.ctx.moveTo(x + widthPart, y);
        this.ctx.lineTo(x + w - widthPart, y);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x, y + h);
        this.ctx.lineTo(x + widthPart, y);

        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um oval.
     * @param {Number} x posição do oval no eixo x (horizontal) em pixels.
     * @param {Number} y posição do oval no eixo y (vertical) em pixels.
     * @param {Number} w largura do oval em pixels.
     * @param {Number} h altura do oval em pixels.
     * @param {Number} rotation rotação do oval em graus.
     * @param {Boolean} isFilled valor booleano que indica se o oval deve ser preenchido após desenhado.
     */
    oval(x, y, w, h, rotation = 0, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.ellipse(x, y, Math.abs(w), Math.abs(h), Math.abs(rotation) * Math.PI / 180, 0, 2 * Math.PI);
        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um pentágono.
     * @param {Number} x posição do pentágono no eixo x (horizontal) em pixels.
     * @param {Number} y posição do pentágono no eixo y (vertical) em pixels.
     * @param {Number} w largura do pentágono em pixels.
     * @param {Number} h altura do pentágono em pixels.
     * @param {Boolean} isFilled valor booleano que indica se o pentágono deve ser preenchido após desenhado.
     */
    pentagon(x, y, w, h, isFilled = false) {
        this.ctx.beginPath();

        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x, y + h / 3 * 1.3);
        this.ctx.lineTo(x + (w / 5) * 1, y + h);
        this.ctx.lineTo(x + (w / 5) * 4, y + h);
        this.ctx.lineTo(x + w, y + h / 3 * 1.3);
        this.ctx.lineTo(x + w / 2, y);
        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Desenha um hexágono.
     * @param {Number} x posição do hexágono no eixo x (horizontal) em pixels.
     * @param {Number} y posição do hexágono no eixo y (vertical) em pixels.
     * @param {Number} w largura do hexágono em pixels.
     * @param {Number} h altura do hexágono em pixels.
     * @param {Boolean} isFilled valor booleano que indica se o hexágono deve ser preenchido após desenhado.
    */
   heptagon(x, y, w, h, isFilled = false) {
       this.ctx.beginPath();
       
       this.ctx.moveTo(x + w / 8 * 2, y);
       this.ctx.lineTo(x + w / 8 * 6, y);
       this.ctx.lineTo(x + w, y + h / 2);
       this.ctx.lineTo(x + w / 8 * 6, y + h);
       this.ctx.lineTo(x + w / 8 * 2, y + h);
       this.ctx.lineTo(x, y + h / 2);
       this.ctx.lineTo(x + w / 8 * 2, y);
       if (isFilled) {
           this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
        
        this.ctx.closePath();
        
    }
    
    /**
     * Desenha um retângulo com as bordas arredondadas.
     * @param {Number} x posição do retângulo no eixo x (horizontal) em pixels.
     * @param {Number} y posição do retângulo no eixo y (vertical) em pixels.
     * @param {Number} w largura do hexágono em pixels.
     * @param {Number} h altura do hexágono em pixels.
     * @param {Array} radii array com o arredondamento das bordas em pixels.
     *                      - O primeiro valor será usado para o arredondamento da borda superior esquerda, o segundo para a borda superior direita e assim por diante.
     *                      - Se tiver só um valor, este será utilizado em todos os 4 cantos.
     *                      - Se tiver mais de um valor, este será usado para os respectivos cantos e os cantos sem um valor definido ficará sem arredondamento.
     * @param {Boolean} isFilled valor booleano que indica se o retângulo deve ser preenchido após desenhado.
    */
   roundRectangle(x, y, w, h, radii, isFilled = false) {
        this.ctx.beginPath();
        
        this.ctx.roundRect(x, y, w, h, radii);
        this.ctx.stroke();
        
        this.ctx.closePath();
        
        if (isFilled) {
            this.ctx.fill();
        }
    }
    
    text(text, x, y, options = {}) {
        this.ctx.save();
        if (options.color) {
            this.ctx.fillStyle = options.color;
        }
        
        this.ctx.font = `${options.fontSize ? options.fontSize : 10}px ${options.fontFamily ? options.fontFamily : "serif"}`;
        
        if (options.maxWidth) {
            this.ctx.fillText(text, x, y - parseFloat(this.ctx.font.split("px")[0].split(" ")[this.ctx.font.split("px")[0].split(" ").length - 1]), options.maxWidth);
        } else {
            this.ctx.fillText(text, x, y + parseFloat(this.ctx.font.split("px")[0].split(" ")[this.ctx.font.split("px")[0].split(" ").length - 1]));
        }
        this.ctx.restore();
    }
}


const canvas = document.querySelector("#main-canvas");
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
const ctx = canvas.getContext("2d");

const drawingPreview = document.querySelector("#drawing-preview");
drawingPreview.height = canvas.height;
drawingPreview.width = canvas.width;
const previewDraw = new Draw(drawingPreview);

const lineWidthInput = document.querySelector("input#drawing-line-width");
const drawingColorInput = document.querySelector("input#drawing-line-color");
const resizer = document.querySelector("#resizer");
const drawingOptions = document.querySelector("#drawing-options");
const carac = document.querySelector("#caracteristics");
const closeCanvasBtn = document.querySelector("#return");
// if the user is drawing, not if the drawing is drawing.
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

const draw = new Draw(canvas);

const sharedWorker = new SharedWorkerPolyfill("../application/sharedWorker.js");

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
                draw.ctx.drawImage(img, 0, 0);
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

function init(){
    draw.ctx.lineWidth = parseInt(carac.children["drawing-line-width"].value);
    draw.ctx.strokeStyle = carac.children["drawing-line-color"].value;
    draw.ctx.fillStyle = carac.children["drawing-line-color"].value;
}
init();

HTMLElement.prototype.resetStyle = function(){
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


        fontSizeInput.oninput = function () {draw.ctx.font = `bold ${this.value}px ${fontFamilyInput.value}`;}
        fontFamilyInput.oninput = function () {draw.ctx.font = `bold ${fontSizeInput.value}px ${this.value}`;}
        drawingColorInput.oninput = function () {draw.ctx.fillStyle = this.value;}

        if (fontsDatalist.children.length === 0) {
            (async function () {
                let availableFonts;
                const option = document.createElement("option");

                if ("queryLocalFonts" in window) {
                    availableFonts = await window.queryLocalFonts();
                }else{
                    availableFonts = ["sans-serif", "serif", "monospace"];
                }

                for (let i = 0; i < availableFonts.length; i++) {
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
                }

                fontsDatalist.appendChild(option);
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
        button.addEventListener("click", function () { draw.ctx.beginPath() });

        carac.appendChild(button);
    }
}

function hideNewPathButton() {
    const newPathElements = caracteristicsChildren().filter((el) => { return el.textContent === "Iniciar novo traço" });
    if (newPathElements.length) {
        newPathElements[0].remove();
    }
}


canvas.addEventListener("mousemove", handleMouseOrTouchMove);
canvas.addEventListener("mousedown", handleMouseDownOrTouchStart);
canvas.addEventListener("mouseup", handleMouseUpOrTouchEnd);
canvas.addEventListener("touchmove", function(ev){
    ev.preventDefault();
    handleMouseOrTouchMove(ev);
}, {passive: false});
canvas.addEventListener("touchstart", function(ev){
    ev.preventDefault();
    handleMouseDownOrTouchStart(ev);
}, {passive: false});
canvas.addEventListener("touchend", function(ev){
    ev.preventDefault();
    handleMouseUpOrTouchEnd(ev);
}, {passive: false});

canvas.addEventListener("touchcancel", function(ev){
    console.log(ev);
    console.log("cancel acima ^");
}, {passive: false});

canvas.addEventListener("click", function (ev) {
    if (currentDrawingMode === "line") {
        draw.lineTo(Math.round(ev.offsetX), Math.round(ev.offsetY));
        draw.ctx.stroke();
    }
});

function handleMouseOrTouchMove(event){
    if (isDrawing && currentDrawingMode === "free") {
        draw.strokeLineTo(getEventPos(event).x - 2, getEventPos(event).y - 2);
    } else {
        if(isDrawing && currentDrawingMode !== "line"){
            previewDraw.clear();
            previewDraw.rectangle(lowestPosition.x, lowestPosition.y, getEventPos(event).x - lowestPosition.x, getEventPos(event).y - lowestPosition.y);
        }

        if (isDrawing && currentDrawingMode === "text") {
            previewDraw.ctx.font = draw.ctx.font;
            drawText(previewDraw);
        }
        
    }
}

function handleMouseDownOrTouchStart(event){
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
        draw.moveTo(getEventPos(event).x, getEventPos(event).y);
        draw.ctx.beginPath();
    }

    lowestPosition = getEventPos(event);
    isDrawing = true;

    drawingPreview.style.display = "block";
}

function handleMouseUpOrTouchEnd(event){
    highestPosition = getEventPos(event);

    if (currentDrawingMode === "shape") {
        switch (currentShapeToDraw) {
            case "equilateralTriangle":
                if ((highestPosition.x - lowestPosition.x) < 0 && (highestPosition.y - lowestPosition.y) < 0) {
                    draw["equilateralTriangle"](lowestPosition.x, lowestPosition.y, Math.max(highestPosition.x - lowestPosition.x, highestPosition.y - lowestPosition.y));
                }else if ((highestPosition.x - lowestPosition.x) < 0 || (highestPosition.y - lowestPosition.y) < 0) {
                    let size = Math.min(Math.abs(highestPosition.x - lowestPosition.x), Math.abs(highestPosition.y - lowestPosition.y));
                    draw["equilateralTriangle"](Math.min(highestPosition.x, lowestPosition.x), Math.min(highestPosition.y, lowestPosition.y), size);
                }else {
                    draw["equilateralTriangle"](lowestPosition.x, lowestPosition.y, Math.min(highestPosition.x - lowestPosition.x, highestPosition.y - lowestPosition.y));
                }
                break;
            case "circle":
                draw["circle"](lowestPosition.x + (highestPosition.x - lowestPosition.x) / 2, lowestPosition.y + (highestPosition.y - lowestPosition.y) / 2, Math.min(Math.abs((highestPosition.x - lowestPosition.x) / 2), Math.abs((highestPosition.y - lowestPosition.y) / 2)), 0);
                break;
            case "oval":
                draw["oval"](lowestPosition.x + (highestPosition.x - lowestPosition.x) / 2, lowestPosition.y + (highestPosition.y - lowestPosition.y) / 2, (highestPosition.x - lowestPosition.x) / 2, (highestPosition.y - lowestPosition.y) / 2);
                break;
            default:
                draw[currentShapeToDraw](lowestPosition.x, lowestPosition.y, highestPosition.x - lowestPosition.x, highestPosition.y - lowestPosition.y);
                break;
        }
    
        drawingPreview.style.display = "none";
        previewDraw.clear();
    }
    
    if (currentDrawingMode !== "line") {
        ctx.closePath();
    }
    
    if (currentDrawingMode === "text") {
        drawingPreview.style.display = "none";
        previewDraw.clear();

        drawText(draw);
    }
    
    isDrawing = false;
}

/**
 * @param {MouseEvent || TouchEvent} event
*/
function getEventPos(event){
    if(event.type === "touchend"){
        return {x: Math.round(event.changedTouches[0].clientX), y: Math.round(event.changedTouches[0].clientY)};
    }else if(event.type.startsWith("touch")){
        return {x: Math.round(event.touches[0].clientX), y: Math.round(event.touches[0].clientY)};
    }else{
        return {x: Math.round(event.offsetX), y: Math.round(event.offsetY)};
    }
}

function drawText(drawToDrawText){
    drawToDrawText.text(carac.children["text-input-div"].children["text"].value, lowestPosition.x, lowestPosition.y, { fontSize: carac.children["font-size-div"].children["font-size"].value, fontFamily: carac.children["font-family-div"].children["font-family"].value });
}

for (let i = 0; i < document.querySelectorAll("button[data-shape]").length; i++) {
    const alternateCtx = document.querySelectorAll("button[data-shape]")[i].children[0].getContext("2d");
    const temporaryDraw = new Draw(alternateCtx.canvas);
    temporaryDraw.ctx.lineWidth = 1.5;
    
    if (document.documentElement.classList.contains("dark-mode")) {
        temporaryDraw.ctx.strokeStyle = "white";
    } else {
        temporaryDraw.ctx.strokeStyle = "black";
    }
    switch (temporaryDraw.canvas.parentElement.getAttribute("data-shape")) {
        case "equilateralTriangle":
            temporaryDraw[temporaryDraw.canvas.parentElement.getAttribute("data-shape")](0, 0, 16);
            break;
        case "circle":
            temporaryDraw[temporaryDraw.canvas.parentElement.getAttribute("data-shape")](temporaryDraw.canvas.width / 2, temporaryDraw.canvas.height / 2, 7.5, 0);
            break;
        case "oval":
            temporaryDraw[temporaryDraw.canvas.parentElement.getAttribute("data-shape")](temporaryDraw.canvas.width / 2, temporaryDraw.canvas.height / 2, 16 / 3, 7);
            break;
        default:
            temporaryDraw[temporaryDraw.canvas.parentElement.getAttribute("data-shape")](0, 0, 16, 16);
            break;
    }

    alternateCtx.canvas.parentElement.addEventListener("click", function () {
        currentDrawingMode = "shape";
        currentShapeToDraw = alternateCtx.canvas.parentElement.getAttribute("data-shape");
        document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
        this.classList.add("active");
        hideNewPathButton();
        hideTextCaracteristics();
    })
}

for (let i = 0; i < document.querySelectorAll("button[data-type]").length; i++) {
    if (document.querySelectorAll("button[data-type]")[i].getAttribute("data-type") === "line") {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            draw.ctx.beginPath();
            currentDrawingMode = this.getAttribute("data-type");
            hideTextCaracteristics();
            showNewPathButton();
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
            document.querySelectorAll("button").forEach((btn) => { btn.classList.remove("active") });
            this.classList.add("active");
        })
    } else {
        document.querySelectorAll("button[data-type]")[i].addEventListener("click", function () {
            currentDrawingMode = document.querySelectorAll("button[data-type]")[i].getAttribute("data-type");
            hideTextCaracteristics();
            hideNewPathButton();
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
        const temporaryDraw = new Draw(temporaryCtx.canvas);
        temporaryCtx.lineWidth = 12;
        temporaryCtx.fillStyle = "crimson";
        temporaryDraw.diamond(temporaryCtx.canvas.width / 4, temporaryCtx.canvas.height / 3 * 2, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
        temporaryCtx.fillStyle = "cyan";
        temporaryDraw.diamond(temporaryCtx.canvas.width / 4 * 1.66, temporaryCtx.canvas.height / 3 * 1.5, temporaryCtx.canvas.width / 3, temporaryCtx.canvas.height / 3, true);
    } else if (temporaryCtx.canvas.parentElement.getAttribute("data-type") === "text") {
        const temporaryDraw = new Draw(temporaryCtx.canvas);
        temporaryDraw.text("t", temporaryDraw.canvas.width / 7 * 2, -30, { fontSize: temporaryDraw.canvas.width, color: document.documentElement.classList.contains("dark-mode") ? "white" : "black" });
    }
}
lineWidthInput.addEventListener("input", function () {
    /**
     * if odd and already translated: do nothing.
     * if odd and not translated: translate.
     * if even and translated: de-translate.
     * if even and not translated: do nothing.
     */ 
    if(parseInt(lineWidthInput.value) % 2 === 1 && !isPixelSharpnessTranslated){
        ctx.translate(0.5, 0.5);
    } else if(parseInt(lineWidthInput.value) % 2 === 0 && isPixelSharpnessTranslated){
        ctx.translate(-0.5, -0.5);
    }

    ctx.lineWidth = lineWidthInput.value;
    draw.ctx.lineWidth = lineWidthInput.value;
})

drawingColorInput.addEventListener("input", function () {
    ctx.strokeStyle = drawingColorInput.value;
    draw.ctx.strokeStyle = drawingColorInput.value;
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
    saveLinkWrraper.href = "../index.html";
    saveLinkWrraper.textContent = "Salvar";
    saveLinkWrraper.addEventListener('click', function () {
        canvas.toBlob((blob) => {
            sharedWorker.port.postMessage({ type: "update drawing", name: (URL.parse(window.location)).searchParams.get("drawing"), section: (URL.parse(window.location)).searchParams.get("section"), img: blob });
        });
    })
    saveBtn.appendChild(saveLinkWrraper);

    const doNotSaveBtn = document.createElement("button");
    const doNotSaveLinkWrraper = document.createElement("a");
    doNotSaveLinkWrraper.href = "../index.html";
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
drawingOptions.addEventListener("scroll", function(ev){
    if(ev.target.scrollTop > 10){
        resizer.parentElement.style.outline = "2px rgba(0, 0, 0, 0.4) solid";
        resizer.parentElement.style.backgroundColor = "rgb(38, 38, 48)";
    }else{
        resizer.parentElement.style.outline = "none";
        resizer.parentElement.style.backgroundColor = "inherit";
    }
}, {passive: true});
