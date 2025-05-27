export function resultDownloadBtn() {
    const resultDownloadBtn = document.getElementById('downloadResult');
    const resultFileNameInput = document.getElementById('resultFileName');
    const resultArea = document.getElementById('resultArea');

    resultDownloadBtn.addEventListener('click', () => {
        const outputText = resultArea.value;
        const resultFileName = resultFileNameInput.value;
        const blob = new Blob([outputText], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = resultFileName;
        a.click();
        URL.revokeObjectURL(a.href);
    });
}
