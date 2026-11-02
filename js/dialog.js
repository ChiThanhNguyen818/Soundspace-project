const nameDialog = document.getElementById("name-dialog");
const confirmDialog = document.getElementById("confirm-dialog");

[nameDialog, confirmDialog].filter(Boolean).forEach((dialog) => {
    dialog.addEventListener("click", (e) => {
        if(e.target == dialog) dialog.close();
    });
});
export const askName = ({title, submitLabel = "Save", value = "", validate = () => ""}) => new Promise((resolve) => {
    if(!nameDialog || nameDialog.open) return resolve(null);
    const form = nameDialog.querySelector("form");
    const input = nameDialog.querySelector("input");
    const error = nameDialog.querySelector(".modal-error");
    const cancel = nameDialog.querySelector("[data-cancel]");
    const submit = nameDialog.querySelector(".primary");
    const setError = (message) => {
        error.textContent = message;
        error.hidden = !message;
        input.toggleAttribute("aria-invalid", Boolean(message));
        if(message) input.setAttribute("aria-invalid", "true");
    };
    nameDialog.querySelector("h2").textContent = title;
    submit.textContent = submitLabel;
    input.value = value;
    setError("");
    // Group all Listeners
    const controller = new AbortController();
    const {signal} = controller;
    let result = null;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = input.value.trim();
        const message = name ? validate(name) : "Please enter a playlist name";
        if(message) {
            setError(message);
            input.focus();
            return;
        }
        result = name;
        nameDialog.close();
    }, {signal});
    input.addEventListener("input", () => setError(""), {signal});
    cancel?.addEventListener("click", () => nameDialog.close(), {signal});
    nameDialog.addEventListener("close", () => {
        controller.abort();
        resolve(result);
    }, {signal});
    nameDialog.showModal();
    input.focus();
    input.select();
});

export const askConfirm = ({title, message, confirmLabel = ""}) => new Promise((resolve) => {
    if(!confirmDialog || confirmDialog.open) return resolve(false);
    const form = confirmDialog.querySelector("form");
    const confirm = confirmDialog.querySelector(".danger");
    const cancel = confirmDialog.querySelector("[data-cancel]");
    confirmDialog.querySelector("h2").textContent = title;
    confirmDialog.querySelector("p").textContent = message;
    confirm.textContent = confirmLabel;
    const controller = new AbortController();
    const {signal} = controller;
    let result = false;
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        result = true;
        confirmDialog.close();
    }, {signal});
    cancel.addEventListener("click", () => {
        confirmDialog.close();
    }, {signal});
    confirmDialog.addEventListener("close", () => {
        controller.abort();
        resolve(result);
    }, {signal});
    confirmDialog.showModal();
    cancel.focus();
});