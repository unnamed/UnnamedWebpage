/**
 * Formats the given time in seconds
 * to a human readable string
 * @param {number} time The time in seconds
 * @return {string} The formatted string
 */
function formatSeconds(time) {
    let hours = Math.floor(time / 3600);
    let minutes = Math.floor((time - (hours * 3600)) / 60);
    let seconds = time - (hours * 3600) - (minutes * 60);

    /**
     * Ensures that the given number has two or
     * more digits and returns it as string
     * @param {number} number The number
     * @return {string} Number with 2+ digits
     */
    function fixed(number) {
        return number < 10 ? `0${number}` : number.toString();
    }

    return `${fixed(hours)}:${fixed(minutes)}:${fixed(seconds)}`;
}

let seconds = 1;
const time = document.getElementById("time");

/** Updates the time counter */
function updateTime() {
    time.innerHTML = formatSeconds(seconds);
    seconds++;
}

setInterval(updateTime, 1000);