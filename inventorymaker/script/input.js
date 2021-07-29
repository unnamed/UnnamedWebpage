/**
 * Code for binding input elements with
 * their "Minecraft-style" display elements
 */

const INPUT_CLASS = "live-input";

for (const input of document.getElementsByClassName(INPUT_CLASS)) {

    const output = document.getElementById(input.dataset.bound);

    // update 'output' when 'input' changes
    input.addEventListener("input", event => {
        output.innerHTML = colorize(event.target.value);
    });

    // initial update
    output.innerHTML = colorize(input.value);
}