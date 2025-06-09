import { logEnvInfo } from "./detectEnv.js";
import { showLoading, hideLoading } from "./animationController.js";
import { drawExecutionTimeChart } from "./chart.js";
import { runWorker } from "./runWorker.js";
// import { uploadFileList } from "./uploadFileList.js";
import { readFileAsync } from "./readFileAsync.js";
// import { resultDownloadBtn } from "./resultDownloadBtn.js";
import { makeCsv } from "./csv.js";
import { autoDownloadOutput } from "./autoDownloadOutput.js";
import { selectModuleParams, setupModuleSelectControls } from "./selectModuleParams.js";


document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea'); //input files list area
    const resultArea = document.getElementById('resultArea');
    const resultFileNameInput = document.getElementById('resultFileName');
    const runProgramButton = document.getElementById('runProgram');
    const executionTimes = [];

    setupModuleSelectControls();


    let inputFileList = [];
    let wakeLock = null;
    let currentWorker = null;

    async function requestWakeLock() {
        // Wake Lock APIを使用して画面のスリープを防止
        if (wakeLock !== null) {
            console.log('[Wake Lock] Screen wake lock is already active.');
            return;
        }
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('[Wake Lock] Screen wake lock is active.');
            wakeLock.addEventListener('release', () => {
                console.log('[Wake Lock] Screen wake lock has been released.');
                wakeLock = null;
            });
        } catch (error) {
            console.error('[Wake Lock] Error requesting screen wake lock:', error);
        }
    }

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            console.log('[Wake Lock] Document visible again, re-requesting wake lock.');
            await requestWakeLock();
        } else {
            console.log('[Wake Lock] Document hidden, wake lock may be released by browser.');
        }
    });


    fileInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        inputFileList = Array.from(files)

        inputArea.value = '[Waiting List]\n';
        inputFileList.forEach(f => {
            inputArea.value += `・${f.name}\n`;
        });
    });
    console.log(`inputFileList: ${inputFileList}`);

    runProgramButton.addEventListener('click', runProgram);

    // ショートカットキー (Ctrl+Enter / Cmd+Enter)
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        runProgram();
        }
    });

    async function runProgram() {
        await requestWakeLock();
        console.log('requestWakeLock run');
        logEnvInfo();
        console.log('logEnvInfo run');

        // if (currentWorker !== null) {
        //     console.log('Terminate current Worker');
        //     currentWorker.terminate();
        //     currentWorker = null;
        // }

        showLoading();
        resultArea.value += "\n=== Start Experiment ===\n";

        // const inputText = inputArea.value;
        // all modules setting remove lrs-mp64.js
        // const moduleParams = ['lrs-long64-safe.js', 'lrs-long128-safe.js', 'lrs-gmp.js', 'lrs-minigmp.js', 'hybrid-gmp.js', 'hybrid-minigmp.js', 'lrs-long64-unsafe.js', 'lrs-long128-unsafe.js'];
        // const moduleParams = ['lrs-minigmp.js', 'hybrid-minigmp.js'];
        // const moduleParams = ['lrs-gmp.js', 'lrs-minigmp.js', 'hybrid-gmp.js', 'hybrid-minigmp.js']

        const moduleParams = selectModuleParams();
        console.log(`moduleParams: ${moduleParams}`);

        if (moduleParams.length === 0) {
            alert("Please select at least one module.");
            hideLoading();
            return;
        }

        const csvData = makeCsv(inputFileList, moduleParams);
        csvData.initTable();
        console.log('init table');

        try {
            for (const file of inputFileList) {
                const inputText = await readFileAsync(file);
                resultArea.value += `\nIn Process ${file.name}\n`;
                console.log(`Processing file: ${file.name}`);
                // 各モジュールごとに処理を実行
                let totalTimeRecord = { filename: file.name };

                for (const moduleParam of moduleParams) {
                    resultArea.value += `\n=== Start ${moduleParam} ===\n`;
                    console.log(`Running module: ${moduleParam}`);
                    const { result, elapsedTime, worker, FSWriteTime, WasmCallTime, FSReadTime } = await runWorker(moduleParam, inputText);
                    worker.terminate();
                    console.log(`Worker terminated for module: ${moduleParam}`);
                    console.log(`Module: ${moduleParam}, Elapsed Time: ${elapsedTime} s`);

                    totalTimeRecord[moduleParam] = elapsedTime;
                    csvData.recordData(moduleParam, file.name, elapsedTime);
                    autoDownloadOutput(result, elapsedTime, FSWriteTime, WasmCallTime, FSReadTime, moduleParam, file.name);
                    resultArea.value += `\n=== End ${moduleParam} ===\n`;
                }

                executionTimes.push(totalTimeRecord);

                // 処理済み以外を次のinputFileListに残す
                resultArea.value += `[Completion] ${file.name}\n`;
                // 処理済みとして除外（この例では除外しない方がわかりやすい）
            }

            console.log('All files processed.');
            // make csv file
            const csvString = csvData.tableToCsv();
            console.log('CSV data prepared.');
            csvData.csvDownload('lrs-experiment-results', csvString);

            // draw chart
            const labels = executionTimes.map(e => e.filename);
            drawExecutionTimeChart(executionTimes, moduleParams, labels);

            inputArea.value = 'Completed \n';
            resultArea.value += "\n=== Termination ===\n";
        } catch (error) {
            console.error('Error during processing:', error);
            resultArea.value += `\nError: ${error.message}\n`;

            const csvString = csvData.tableToCsv();
            csvData.csvDownload('lrs-experiment-error-results', csvString);
        } finally {
            if (wakeLock !== null) {
                await wakeLock.release();
                wakeLock = null;
                console.log('[Wake Lock] Screen wake lock released.');
            }
            currentWorker = null;
            hideLoading();
        }
        
    }
})

