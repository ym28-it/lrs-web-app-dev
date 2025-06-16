// lrs-worker-ex.js
// Wasmモジュール（lrs64.js）をimportScriptsで読み込む

const urlParams = new URLSearchParams(self.location.search);
// const wasmModule = urlParams.get('module') || 'lrs-mp64.js';
const version = urlParams.get('version') || 'v7.3-O2';
const version = 'openmp-v7.3';
console.log('wasmModule', wasmModule);
console.log('Version', version);

var Module = {
    locateFile: function(path) {
        return `../modules/${version}/${path}`;
    }
}

try {
    importScripts(`../modules/${version}/${wasmModule}`);
    console.log('Worker created, waiting for Wasm initialization.');
    console.log(`../modules/${version}/${wasmModule}`);
} catch (err) {
    console.error('ImportScript error:', err);
    self.postMessage({error: err.toString() });
}


// Wasmモジュールの初期化完了を待つ
Module.onRuntimeInitialized = function() {
    console.log('Wasm module initialized in worker.');
    // Wasm初期化完了をメインスレッドに通知
    self.postMessage({ ready: true });

    // 初期化完了後にメインスレッドからのメッセージを受け付ける
    self.onmessage = function(e) {
        const input = e.data.input;
        console.log('Received input in worker:', input);

        try {
            const start = performance.now();
            let { results, moduleStart, moduleEnd } = heavyWasmProcessing(input);
            console.log(`moduleStart: ${moduleStart}, moduleEnd: ${moduleEnd}`);
            console.log('heavyWasmProcessing completed in worker.');
            // heavyWasmProcessingの結果を受け取る
            const end = performance.now();
            // 結果をメインスレッドに返送
            console.log('Processing completed in worker.');
            const Result = {
                FSWriteTime: moduleStart - start,
                WasmCallTime: moduleEnd - moduleStart,
                FSReadTime: end - moduleEnd,
                totalTime: end - start,
                results: results
            };
            console.log('Result', Result);
            self.postMessage({Result: Result});
            // 出力結果をメインスレッドに送信
            // self.postMessage({ result: results });
        } catch (err) {
            console.log("Error in onRuntimeInitialized:\n", err);
            self.postMessage({ error: err.toString() });
        }
    };
};

// 重い処理を実行する関数（本来はWasmの呼び出し）
function heavyWasmProcessing(input) {
    const inputFileName = "input.txt";
    const outputFileName = "output.txt";
    // Worker内のFSに対してファイルを作成
    FS.writeFile(`/${inputFileName}`, input);
    FS.writeFile(`/${outputFileName}`, '');
    console.log('Files written in virtual FS in worker.');

    // 仮想ファイルシステム上のファイルパスを引数としてWasmプログラムを実行
    const moduleStart = performance.now();
    console.log('Module.callMain start');
    Module.callMain([`/${inputFileName}`, `/${outputFileName}`]);
    const moduleEnd = performance.now();
    console.log('Module.callMain executed in worker.');

    // 出力ファイルを読み込む
    const outputText = FS.readFile(`/${outputFileName}`, { encoding: 'utf8' });
    console.log('output data', outputText);
    return {
        results: outputText,
        moduleStart: moduleStart,
        moduleEnd: moduleEnd
    };
    // return outputText;
}
