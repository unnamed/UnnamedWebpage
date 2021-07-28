/**
 * Code for handling custom input
 * elements
 */


/**
 * Divs using this class will be filled with an
 * input and another div to simulate the live editor
 * @type {string}
 */
const INPUT_CLASS = "mc-text-input";

/**
 * Class for the output divs, they will contain the
 * colorized output
 * @type {string}
 */
const SHOWN_CLASS = "mc-text-output";

/**
 * now start generating the real input and the output
 * elements
 */
for (const div of document.getElementsByClassName(INPUT_CLASS)) {

    const input = document.createElement("input");
    const output = document.createElement("div");

    const inputId = div.dataset.inputid;
    const outputId = div.dataset.outputid;

    // setup input
    input.style.position = "absolute";
    input.style.opacity = "0";
    input.style.top = "-100%";
    input.style.left = "-100%";
    if (inputId) {
        input.setAttribute("id", inputId);
    }

    // setup output
    output.innerHTML = colorize(div.dataset.value || ""); // initial value
    output.classList.add(SHOWN_CLASS);
    if (outputId) {
        output.setAttribute("id", outputId);
    }

    // when clicking the shown div, make it click the real input
    output.addEventListener("click", event => {
        input.focus();
        event.preventDefault();
    });

    // listen to changes in the real input
    input.addEventListener("input", event => {
        const value = event.target.value;
        output.innerHTML = colorize(value);
    });

    // append the generated elements
    div.appendChild(input);
    div.appendChild(output);
}