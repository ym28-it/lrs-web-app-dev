

export function autoDownloadOutput(result, elapsedTime, FSWriteTime, WasmCallTime, FSReadTime, moduleParam, filename) {
    // result: 処理結果の配列
    const output = `=== ${filename} Output for ${moduleParam} ===\n` +
                    `Module: ${moduleParam}\n` +
                    `Filename: ${filename}\n` +
                    `Elapsed Time: ${elapsedTime} ms\n` +
                    `FSWriteTime: ${FSWriteTime} ms\n` +
                    `WasmCallTime: ${WasmCallTime} ms\n` +
                    `FSReadTime: ${FSReadTime} ms\n` +
                    `Results:\n${result}\n`;

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${moduleParam}-output.txt`;
    a.style.display = 'none'; // Hide the link element
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}