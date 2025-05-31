


export async function runWorker(moduleParam, inputText) {
    const resultArea = document.getElementById('resultArea');

    return new Promise((resolve, reject) => {
        const workerUrl = `./lrs-worker-ex.js?module=${moduleParam}`;
        const worker = new Worker(workerUrl);
        console.log('create Worker', workerUrl);

        let elapsed = null;
        worker.onmessage = function (e) {
            if (e.data.ready) {
                console.log('Worker is ready. Sending input data.');
                worker.postMessage({ input: inputText });
            } else if (e.data.error) {
                resultArea.value += "Error:" + e.data.error;
                worker.terminate();
                reject(e.data.error);
            } else if (e.data.Result) {
                const Result = e.data.Result;
                console.log('get timeResult');
                console.log(`elapsedTime: ${Result.totalTime} ms`);
                elapsed = Result.totalTime;

                resultArea.value += `\n=== ${moduleParam} ===\n`;
                resultArea.value += `FSWriteTime: ${Result.FSWriteTime} ms\n`;
                resultArea.value += `WasmCallTime: ${Result.WasmCallTime} ms\n`;
                resultArea.value += `FSReadTime: ${Result.FSReadTime} ms\n`;
                resultArea.value += `TotalTime: \n${Result.totalTime} ms\n`;

                console.log('get output data');
                worker.terminate();
                resolve({
                    result: Result.results,
                    elapsedTime: elapsed,
                    worker: worker,
                    FSWriteTime: Result.FSWriteTime,
                    WasmCallTime: Result.WasmCallTime,
                    FSReadTime: Result.FSReadTime
                });
            }
        };

        worker.onerror = function (err) {
            console.error("Worker Error: ", err);
            resultArea.value += "Worker Error:" + err.message;
            worker.terminate();
            reject(err);
        };
    });
}