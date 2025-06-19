import DuplicateIDError from "./../classes/DuplicateIDError.js";

/**
 * @typedef NodeTree A tree of nodes.
*/

/**
 * 
 * @param {Function} func Function to be executed in every node of 'NodeTree'.
 * @param {NodeTree} tree A NodeTree that can be iterated trough.
 */
function doRecursive(func, tree) {
    for (let i = 0; i < tree.length; i++) {
        func(tree[i]);
        if (tree[i].childNodes.length) {
            doRecursive(func, tree[i].childNodes);
        }
    }
}

/**
 * 
 * @param {Node | Document | DocumentFragment | DocumentOrShadowRoot} parentElement Element to which the form will be added.
 * @param {NodeList | Node[]} formChildren Elements to be added to the form.
 */
function createFormAndAppend(parentElement, formChildren) {
    const form = document.createElement("form");
    form.append(formChildren);

    doRecursive(function (element) {
        if (element.nodeName.toLowerCase() !== "input") {
            return;
        }

        element.addEventListener("keydown", function (ev) {
            if (ev.key === "ENTER") {
                ev.preventDefault();
            }
        });
    }, formChildren);

    parentElement.appendChild(form);

    return form;
}

export default class InputModal extends HTMLDialogElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const style = document.createElement("style");
        // in our especific case, there will be only 1 InputModal,
        // so this style adding isnt a problem, but if had many i
        // think that would be a problem.
        style.textContent = `
        dialog {
            padding: 14px;
            border-radius: 7px;
            background-color: var(--primary-background-color);
            color: var(--primary-font-color);
            border: none;
            box-shadow: 0px 0px 20px 3px black;
        }

        dialog::backdrop {
            background-color: rgba(0, 0, 0, 0.4);
        }

        dialog.input-modal input {
            width: 100%;
        }

        dialog.input-modal .flex-column {
            display: flex;
            flex-direction: column;
        }

        dialog button {
            border: none;
            border-radius: 99px;
            padding: 2px 6px;
            margin: 4px;
            font-weight: bold;
            color: var(--primary-font-color);
        }

        dialog button:first-of-type {
            background-color: red;
        }

        dialog button:last-of-type {
            background-color: green;
        }

        dialog #error-message {
            color: red;
        }

        dialog.select-modal ul[role="listbox"] {
            padding: 0;
        }

        dialog.select-modal ul[role="listbox"] li {
            list-style: none;
            width: 100%;
            display: flex;
            justify-content: space-between;
            margin: 0 0 20px 0;
            border: 1px gray solid;
            border-radius: 4px;
            transition: box-shadow .3s;
            box-shadow: black 0 0 9px 1px;
        }

        dialog.select-modal ul[role="listbox"] li img {
            max-width: 20%;
            min-width: 80px;
            border-radius: 7px;
            pointer-events: none;
            user-select: none;
        }

        dialog.select-modal ul[role="listbox"] li:last-of-type {
            margin: 0;
        }

        dialog.select-modal ul[role="listbox"] li[aria-selected="true"] {
            box-shadow: green 0 0 9px 5px;
        }

        dialog.select-modal [role="option"]>.flex-column>span:first-of-type {
            font-size: 1.3em;
            font-weight: bold;
        }
        `;

        this.appendChild(style);

        const btns = document.createElement("div");
        btns.id = "input-modal-buttons";

        const confirmBtn = document.createElement("button");
        confirmBtn.id = "confirm-button";
        confirmBtn.textContent = "OK";
        const cancelBtn = document.createElement("button");
        cancelBtn.id = "cancel-button";
        cancelBtn.textContent = "CANCELAR";

        const errorMessage = document.createElement("span");
        errorMessage.id = "error-message";

        this.appendChild(errorMessage);
        btns.appendChild(cancelBtn);
        btns.appendChild(confirmBtn);
        this.appendChild(btns);

        this.confirmBtn = confirmBtn;
        this.cancelBtn = cancelBtn;
    }

    /**
     * Remove everything from the Modal, leaving only the buttons, the
     * error message and the style.
     */
    clear() {
        this.classList.forEach((className) => { this.classList.remove(className); });
        for (let i = 0; i < this.children.length; i++) {
            if (["input-modal-buttons", "error-mesage"].indexOf(this.children[i].id) !== -1 || this.children[i].tagName === "STYLE") {
                continue;
            }

            this.children[i].remove();
        }
    }

    /**
     * Set the error message of the Modal.
     * @param {String} message The error message.
     */
    setErrorMessage(message) {
        this.querySelector("#error-message").textContent = message;
    }

    /**
     * For internal errors of the Modal.
     * @param {String} message The error message.
     */
    errorMode(message = null) {
        this.clear();

        const title = document.createElement("h1");
        title.textContent = "Erro!";
        this.appendChild(title);

        if (message) {
            this.setErrorMessage(message);
        } else {
            this.setErrorMessage("Ocorreu um erro durante a construção deste Modal.");
        }
    }

    /**
     * 
     * @param {String} type The type of the Input Modal, like input, confirm, etc.
     * @param {{
     *      title?: string,
     *      message?: string,
     *      label?: string,
     *      labels?: string[],
     *      inputAmount: number,
     *      selectOptions: {
     *          label: string,
     *          description?: string,
     *          id: string,
     *          images?: string[]
     *      }[]
     * }} options Options to customize the InputModal, like the title,
     *              message, labels, etc.
     */
    async showInputModal(type, options = {}) {
        if (this.open) {
            return;
        }

        this.clear();
        this.showModal();

        const instance = this;

        if (options.title) {
            const title = document.createElement("h2");
            title.textContent = options.title;
            this.appendChild(title);
        }

        if (options.message) {
            const message = document.createElement("p");
            message.textContent = options.message;
            this.appendChild(message);
        }

        switch (type) {
            case "input":
                this.classList.add("input-modal");

                const input = document.createElement("input");
                input.id = "input-modal-input";

                if (options.label) {
                    const wrraper = document.createElement("div");
                    wrraper.classList.add("flex-column");

                    const label = document.createElement("label");
                    label.textContent = options.label;
                    label.htmlFor = input.id;

                    wrraper.appendChild(label);
                    wrraper.appendChild(input);
                    // will remove btns (confirmBtn parent element) from "this" (keyword)
                    // to the form.
                    createFormAndAppend(this, [wrraper, this.confirmBtn.parentElement]);
                } else {
                    createFormAndAppend(this, [input]);
                }

                return new Promise((resolve, reject) => {
                    this.confirmBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        resolve(input.value);
                    });

                    this.cancelBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        instance.close();
                        reject(new Error("The operation was canceled."));
                    });
                });
            case "multiple input":
                this.classList.add("input-modal");

                if (!options.inputAmount) {
                    throw new TypeError("A InputModal of type \'multiple input\' must have the inputAmount property set in options.");
                }

                if (options.labels.length && options.inputAmount > options.labels.length) {
                    console.warn(`Were passed more inputs (${options.inputAmount}) than labels (${options.labels.length}) to the input modal. The remaining inputs will not have a label. ${options.inputAmount - options.labels.length} inputs without label..`);
                } else if (options.labels.length && options.inputAmount < options.labels.length) {
                    console.warn(`Were passed more labels (${options.inputAmount}) than inputs (${options.labels.length}) to the input modal. The remaining labels will not be shown. ${options.labels.length - options.inputAmount} labels excluded.`);
                }

                const form = createFormAndAppend(this, []);

                for (let i = 0; i < options.inputAmount; i++) {
                    const input = document.createElement("input");
                    input.id = `input-modal-input-${i + 1}`;
                    input.addEventListener("keydown", function (ev) {
                        if (ev.key === "ENTER") {
                            ev.preventDefault();
                        }
                    });


                    if (options.labels.length > i) {
                        const wrraper = document.createElement("div");
                        wrraper.classList.add("flex-column");

                        const label = document.createElement("label");
                        label.htmlFor = input.id;

                        wrraper.appendChild(label);
                        wrraper.appendChild(input);
                        form.appendChild(wrraper);
                    } else {
                        form.appendChild(input);
                    }
                }

                // same thing as before, in the case "input".
                form.appendChild(this.confirmBtn.parentElement);

                return new Promise((resolve, reject) => {
                    this.confirmBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        let values = [];
                        for (let i = 0; i < this.querySelectorAll("input").length; i++) {
                            values.push(this.querySelectorAll("input")[i].value);
                        }
                        resolve(values);
                    });

                    this.cancelBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        instance.close();
                        reject(new Error("The operation was canceled."));
                    });
                });
            case "confirm":
                return new Promise((resolve) => {
                    this.confirmBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();
                        resolve(true);
                    });

                    this.cancelBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();
                        resolve(false);
                    });
                });
            case "select":
                this.classList.add("select-modal");

                if (options.selectOptions === undefined || options.selectOptions === null || !options.selectOptions.length) {
                    this.errorMode();
                    throw new TypeError("A InputModal of type \'select\' must have the selectOptions property set in options.");
                }

                // check ids and labels
                let ids = [];
                options.selectOptions.forEach(function (item) {
                    if (item.id === undefined) {
                        this.errorMode();
                        throw new TypeError("All the options must have an id.");
                    }
                    ids.push(item.id.trim());
                });

                ids.forEach(function (id, index) {
                    if (ids.lastIndexOf(id) !== index) {
                        this.errorMode();
                        throw new DuplicateIDError("The id of an option must be unique.");
                    }
                });

                ids.forEach(function (item, index) {
                    if (options.selectOptions[index].label === undefined) {
                        this.errorMode();
                        throw new TypeError("All the options must have a label.");
                    }
                });
                // end of check


                const selectList = document.createElement("ul");
                selectList.role = "listbox";
                selectList.tabIndex = "0";
                // look like elements dont have a ariaActiveDescendant property, so i
                // need to set using setAttribute.
                selectList.setAttribute("aria-activedescendant", "");

                for (let i = 0; i < options.selectOptions.length; i++) {
                    const option = document.createElement("li");
                    option.role = "option";
                    option.ariaSelected = "false";
                    option.id = options.selectOptions[i].id;

                    option.addEventListener("click", function () {
                        if (this.ariaSelected === "true") {
                            this.ariaSelected = "false";
                            selectList.setAttribute("aria-activedescendant", "");

                            // dont let the user press the confirm button if none of the
                            // options are selected.
                            instance.confirmBtn.disabled = "true";
                            return;
                        }

                        instance.querySelectorAll("[aria-selected='true']").forEach((item) => { item.ariaSelected = "false" });
                        this.ariaSelected = "true";

                        instance.confirmBtn.removeAttribute("disabled");

                        selectList.setAttribute("aria-activedescendant", this.id);
                    });

                    const wrraper = document.createElement("div");
                    wrraper.classList.add("flex-column");

                    const title = document.createElement("span");
                    title.textContent = options.selectOptions[i].label;
                    option.ariaLabel = options.selectOptions[i].label;

                    wrraper.appendChild(title);
                    if (options.selectOptions[i].description) {
                        const description = document.createElement("span");
                        description.textContent = options.selectOptions[i].description;
                        wrraper.appendChild(description);

                        option.ariaDescription = options.selectOptions[i].description;
                    }

                    option.appendChild(wrraper);

                    // options.selectOptions[i].images must contain a list of srcs to images
                    // if dont want images just ommit it.
                    // the images must have a size limit defined in the css.
                    if (options.selectOptions[i].images?.length) {
                        for (let j = 0; j < options.selectOptions[i].images.length; j++) {
                            const img = new Image();
                            img.src = options.selectOptions[i].images[j];
                            option.appendChild(img);
                        }
                    }

                    selectList.appendChild(option);
                }

                this.insertBefore(selectList, this.confirmBtn.parentElement);

                return new Promise((resolve, reject) => {
                    this.confirmBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        resolve(selectList.querySelector("[aria-selected='true']").id);
                    });

                    this.cancelBtn.addEventListener("click", function (ev) {
                        ev.preventDefault();

                        instance.close();
                        reject(new Error("The operation was canceled."));
                    });
                });
            default:
                throw new TypeError(`There is no InputModal type \'${type}\'`);
        }
    }
}

customElements.define("input-modal", InputModal, { extends: "dialog" });