

export function uploadFileList(fileInput, inputArea) {
    fileInput.addEventListener('change', (e) =>  {
        const files = e.target.files;
        const inputFileList = Array.from(files);
        console.log(`inputFileList: ${inputFileList}`);

        inputArea.innerHTML = '';
        inputArea.value = '[Waiting List]\n';
        inputFileList.forEach((file) => {
            inputArea.value += `: ${file.name}\n`;
        });
        return inputFileList;
    });

}