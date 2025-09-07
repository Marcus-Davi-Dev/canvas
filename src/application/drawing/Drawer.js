export default class Drawer {
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

    clear() {
        this.ctx.save();
        this.ctx.resetTransform();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * Move the drawing pen to the especified coords.
     * @param {Number} x position in the x-axis in pixels.
     * @param {Number} y position in the y-axis in pixels.
     */
    moveTo(x, y) {
        this.ctx.moveTo(x, y);
    }

    /**
     * Create a line from the point [x1, y1] to the point [x2, y2].
     * @param {Number} x1 first point position in the x-axis in pixels. 
     * @param {Number} y1 first point position in the y-axis in pixels.
     * @param {Number} x2 second point position in the x-axis in pixels.
     * @param {Number} y2 second point position in the y-axis in pixels.
     */
    line(x1, y1, x2, y2) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
    }

    /**
     * Create a line from the point [x1, y1] to the point [x2, y2] and show in the canvas.
     * @param {Number} x1 first point position in the x-axis in pixels.
     * @param {Number} y1 first point position in the y-axis in pixels.
     * @param {Number} x2 second point position in the x-axis in pixels.
     * @param {Number} y2 second point position in the y-axis in pixels.
     */
    strokeLine(x1, y1, x2, y2) {
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Draw a line to the point [x, y].
     * @param {Number} x where the line will end in the x-axis in pixels
     * @param {Number} y where the line will end in the y-axis in pixels
     */
    lineTo(x, y) {
        this.ctx.lineTo(x, y);
    }

    /**
     * Draw a line to the point [x, y] and show in the canvas.
     * @param {Number} x where the line will end in the x-axis in pixels.
     * @param {Number} y where the line will end in the y-axis in pixels.
     */
    strokeLineTo(x, y) {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }

    /**
     * Draw a circle centered in the points x and y.
     * @param {Number} x center of the circle position in the x-axis in pixels.
     * @param {Number} y center of the circle position in the y-axis in pixels.
     * @param {Number} radius half the diameter of the circle in pixels.
     * @param {Number} startAngle initial angle in radians.
     * @param {Boolean} isFilled boolean value that indicates if the circle will be filled after being drawn.
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
     * Draw a rectangle.
     * @param {Number} x rectangle position in the x-axis in pixels.
     * @param {Number} y rectangle position in the y-axis in pixels.
     * @param {Number} w rectangle width in pixels.
     * @param {Number} h rectangle height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the rectangle will be filled after being drawn.
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
     * Draw a diamond.
     * @param {Number} x diamond position in the x-axis in pixels.
     * @param {Number} y diamond position in the y-axis in pixels.
     * @param {Number} w diamond width in pixels.
     * @param {Number} h diamond height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the diamond will be filled after being drawn.
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
     * Draw a triangle.
     * @param {Number} x triangle position in the x-axis in pixels.
     * @param {Number} y triangle position in the y-axis in pixels.
     * @param {Number} w triangle width in pixels.
     * @param {Number} h triangle height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the triangle will be filled after being drawn.
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
     * Draw a equilateral triangle.
     * @param {Number} x equilateral triangle position in the x-axis in pixels.
     * @param {Number} y equilateral triangle position in the y-axis in pixels.
     * @param {Number} size equilateral triangle size in pixels. Will be used as the width and height.
     * @param {Boolean} isFilled boolean value that indicates if the equilateral triangle will be filled after being drawn.
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
     * Draw a star.
     * @param {Number} x star position in the x-axis in pixels.
     * @param {Number} y star position in the y-axis in pixels.
     * @param {Number} w star width in pixels.
     * @param {Number} h star height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the star will be filled after being drawn.
     */
    star(x, y, w, h, isFilled = false) {
        let heightPart = h / 5;
        let widthPart = w / 5;

        this.ctx.beginPath();
        // --------- "/" of the top cone (^). ---------
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x + widthPart * 1.85, y + heightPart * 1.8);
        // --------- "\" of the top cone (^). ---------
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x + widthPart * 3.15, y + heightPart * 1.8);

        // --------- top line of the left cone ("<"). ---------
        // move to the lower left tip of the upper cone.
        this.ctx.moveTo(x + widthPart * 1.85, y + heightPart * 1.8);
        this.ctx.lineTo(x, y + heightPart * 1.8);
        // --------- bottom line of the left cone ("<"). ---------
        this.ctx.lineTo(x + w / 3 - (w / 18), y + (h / 2.7) * 1.667);

        // --------- "\" of the left bottom cone. ---------
        this.ctx.lineTo(x + (w / 3) / 2, y + h);
        // --------- "/" of the left bottom cone. ---------
        this.ctx.lineTo(x + w / 2, y + heightPart * 3.5);

        // --------- "\" of the right bottom cone. ---------
        this.ctx.lineTo(x + (w / 3) * 2.5, y + h);
        // --------- "/" of the right bottom cone. ---------
        this.ctx.lineTo(x + (w / 3) * 2.3 - (w / 18), y + (h / 2.7) * 1.667);

        // --------- bottom line of the right cone (">"). ---------
        this.ctx.lineTo(x + w, y + heightPart * 1.8);
        // --------- top line of the right cone (">"). ---------
        this.ctx.moveTo(x + widthPart * 3.15, y + heightPart * 1.8);
        this.ctx.lineTo(x + w, y + heightPart * 1.8);

        // show the drawing.
        if (isFilled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }

        this.ctx.closePath();
    }

    /**
     * Draw a trapezoid.
     * @param {Number} x trapezoid position in the x-axis in pixels.
     * @param {Number} y trapezoid position in the x-axis in pixels.
     * @param {Number} w trapezoid width in pixels.
     * @param {Number} h trapezoid height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the trapezoid will be filled after being drawn.
     */
    trapezoid(x, y, w, h, isFilled = false) {
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
     * Draw a ellipse.
     * @param {Number} x ellipse position in the x-axis in pixels.
     * @param {Number} y ellipse position in the y-axis in pixels.
     * @param {Number} w ellipse width in pixels.
     * @param {Number} h ellipse height in pixels.
     * @param {Number} rotation oval rotation in degrees.
     * @param {Boolean} isFilled boolean value that indicates if the ellipse will be filled after being drawn.
     */
    ellipse(x, y, w, h, rotation = 0, isFilled = false) {
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
     * Draw a pentagon.
     * @param {Number} x pentagon position in the x-axis in pixels.
     * @param {Number} y pentagon position in the y-axis in pixels.
     * @param {Number} w pentagon width in pixels.
     * @param {Number} h pentagon height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the pentagon will be filled after being drawn.
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
     * Draw a hexagon.
     * @param {Number} x hexagon position in the x-axis in pixels.
     * @param {Number} y hexagon position in the y-axis in pixels.
     * @param {Number} w hexagon width in pixels.
     * @param {Number} h hexagon height in pixels.
     * @param {Boolean} isFilled boolean value that indicates if the hexagon will be filled after being drawn.
    */
    hexagon(x, y, w, h, isFilled = false) {
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
     * Draw a rectangle with rounded borders.
     * @param {Number} x position of the rectangle in the x-axis in pixels.
     * @param {Number} y position of the rectangle in the y-axis in pixels.
     * @param {Number} w width of the rectangle in pixels.
     * @param {Number} h height of the rectangle in pixels.
     * @param {Array} radii array of the borders radii in pixels.
     *                      - The first value will be used to indicate the radii of the top left corner, the second value to the top right corner and so on.
     *                      - If there is only one value, it will be used on all the borders.
     *                      - If a corner does not have a value in the array, it will not be rounded.
     * @param {Boolean} isFilled boolean value that indicates if the rectangle will be filled after being drawn.
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

    /**
     * Draws a polygon with the amount of sides especified
     * @param {Number} x position of the polygon in the x-axis in pixels.
     * @param {Number} y position of the polygon in the y-axis in pixels.
     * @param {Number} w width of the polygon in pixels.
     * @param {Number} h height of the polygon in pixels.
     * @param {Number} sides number of sides of the polygon.
     */
    polygon(x, y, w, h, sides) {
        function toRad(deg) {
            return deg / 180 * Math.PI;
        }

        const STEP = 360 / sides;
        this.ctx.beginPath();

        for (let i = 0; i < sides + 1; i++) {
            // h and w will be the (y and x) radius of the circle (ellipse), what means that
            // the (x and y) diameter of the circle will be h*2 and w*2 (respectively), then,
            // we divide it by 2. For example, h, is the height of the polygon, so the diameter
            // would be twice the size we want and because of that we only multiply by half h.
            let ray = { dirX: 0, dirY: 0 };
            if (sides % 2 === 1) {
                ray.dirY = Math.sin(toRad(i * STEP + (STEP / 4))) * h / 2;
                ray.dirX = Math.cos(toRad(i * STEP + (STEP / 4))) * w / 2;
            } else {
                ray.dirY = Math.sin(toRad(i * STEP)) * h / 2;
                ray.dirX = Math.cos(toRad(i * STEP)) * w / 2;
            }

            // offset the x and y to be at the middle of the box the polygon should be.
            this.ctx.lineTo(ray.dirX + x + (w / 2), ray.dirY + y + (h / 2));
        }

        this.ctx.stroke();
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