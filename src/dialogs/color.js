import actionStack from "lib/actionStack";
import restoreTheme from "lib/restoreTheme";
import Picker from "vanilla-picker";

let lastPicked = localStorage.__picker_last_picked || "#fff";
let colorHistory = JSON.parse(localStorage.__picker_color_history || "[]");

function saveToHistory(color) {
    if (!colorHistory.includes(color)) {
        colorHistory.unshift(color);
        if (colorHistory.length > 8) colorHistory = colorHistory.slice(0, 8); // Maksimum 8 renk
        localStorage.__picker_color_history = JSON.stringify(colorHistory);
    }
}

/**
 * Choose color
 * @param {string} defaultColor Default color
 * @param {Function} onhide Callback function
 * @returns {Promise<string>}
 */
function color(defaultColor, onhide) {
    defaultColor = defaultColor || lastPicked;
    let type = checkColorType(defaultColor) || "hex";
    return new Promise((resolve) => {
        const colorModes = ["hsl", "hex", "rgb"];
        let mode = colorModes.indexOf(type);
        let selectedColor = null;

        // color history dialog
        const historyBox = tag("div", {
            className: "color-history",
            children: colorHistory.map(histColor =>
                tag("span", {
                    className: "color-history-item",
                    style: `background:${histColor}`,
                    onclick: () => {
                        picker.setColor(histColor, true);
                    }
                })
            )
        });

        const parent = tag("div", { className: "message color-picker" });
        const okBtn = tag("button", {
            textContent: strings.ok,
            onclick: function () {
                hide();
                lastPicked = selectedColor;
                saveToHistory(selectedColor);
                localStorage.__picker_last_picked = selectedColor;
                resolve(selectedColor);
            },
        });

        // Kopyala butonu
        const copyBtn = tag("button", {
            textContent: "Copy",
            onclick: function () {
                if (selectedColor) {
                    navigator.clipboard.writeText(selectedColor);
                    this.textContent = "Copied!";
                    setTimeout(() => (this.textContent = "Copy"), 1200);
                }
            },
        });

        const toggleMode = tag("button", {
            textContent: type,
            onclick: function (e) {
                ++mode;
                if (mode >= colorModes.length) mode = 0;
                type = colorModes[mode];
                this.textContent = type;
                picker.setOptions({
                    color: selectedColor,
                    editorFormat: type,
                });
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            },
        });

        const box = tag("div", {
            className: "prompt box",
            children: [
                tag("strong", {
                    className: "title",
                    textContent: strings["choose color"],
                }),
                parent,
                historyBox, // Geçmiş kutusu eklendi
                tag("div", {
                    className: "button-container",
                    children: [toggleMode, okBtn, copyBtn],
                }),
            ],
        });

        const mask = tag("span", {
            className: "mask",
            onclick: hide,
        });

        const picker = new Picker({
            parent,
            popup: false,
            editor: true,
            color: defaultColor,
            onChange,
            alpha: true,
            editorFormat: type,
        });

        picker.show();

        actionStack.push({
            id: "box",
            action: hideSelect,
        });

        document.body.append(box, mask);
        restoreTheme(true);

        function hideSelect() {
            box.classList.add("hide");
            restoreTheme();
            setTimeout(() => {
                document.body.removeChild(box);
                document.body.removeChild(mask);
                if (typeof onhide === "function") onhide();
            }, 300);
        }

        function hide() {
            actionStack.remove("box");
            const height = box.clientHeight;
            box.style.height = height + "px";
            picker.destroy();
            hideSelect();
        }

        function onChange(c) {
            if (!c) return;
            const alpha = c.rgba[3] < 1 ? true : false;
            if (type === "hex") {
                if (alpha) selectedColor = c.hex;
                else selectedColor = c.hex.slice(0, -2);
            } else if (type === "rgb") {
                if (alpha) selectedColor = c.rgbaString;
                else selectedColor = c.rgbString;
            } else {
                if (alpha) selectedColor = c.hslaString;
                else selectedColor = c.hslString;
            }
            if (selectedColor) {
                setTimeout(() => {
                    const $editor = box.get(".picker_editor");
                    if ($editor) $editor.style.backgroundColor = selectedColor;
                }, 0);
            }
        }
    });
}

/**
 *
 * @param {string} color
 * @returns {'hex'|'rgb'|'hsl'}
 */
function checkColorType(color) {
    if (color.startsWith("#")) return "hex";
    if (color.startsWith("rgb")) return "rgb";
    if (color.startsWith("hsl")) return "hsl";
    return null;
}

export default color;
