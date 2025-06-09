

export function selectModuleParams() {
    const checkboxes = document.querySelectorAll('#moduleCheckboxes input[type="checkbox"]');
    return Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
}

export function setupModuleSelectControls() {
    const checkboxes = document.querySelectorAll('#moduleCheckboxes input[type="checkbox"]');
    const selectAllBtn = document.getElementById("selectAllModules");
    const clearAllBtn = document.getElementById("clearAllModules");

    selectAllBtn.addEventListener("click", () => {
        checkboxes.forEach(cb => cb.checked = true);
    });

    clearAllBtn.addEventListener("click", () => {
        checkboxes.forEach(cb => cb.checked = false);
    });
}
