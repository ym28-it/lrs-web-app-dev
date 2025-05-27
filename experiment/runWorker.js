


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
            } else if (e.data.elapsedTime) {
                console.log(`elapsedTime: ${e.data.elapsedTime}`);
                elapsed = e.data.elapsedTime;
                resultArea.value += `${moduleParam}: \n${e.data.elapsedTime} ms\n`;
            } else if (e.data.result) {
                console.log('get output data');
                worker.terminate();
                resolve({ result: e.data.result, elapsedTime: elapsed});
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