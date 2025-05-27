function detectOS() {
    const ua = navigator.userAgent;

    if (ua.includes("Windows NT")) return "Windows";
    if (ua.includes("Mac OS X")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("like Mac OS X")) return "iOS";

    return "Unknown";
}

function detectBrowser() {
    const ua = navigator.userAgent;

    if (ua.includes("Edg/")) return "Microsoft Edge";
    if (ua.includes("Chrome/") && ua.includes("Safari/")) return "Google Chrome";
    if (ua.includes("Firefox/")) return "Mozilla Firefox";
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";

    return "Unknown Browser";
}

export const logEnvInfo = () => {
    const resultArea = document.getElementById('resultArea');
    const os = detectOS();
    const browser = detectBrowser();

    resultArea.value = '';
    resultArea.value += "[Execution Environment]\n";
    resultArea.value += `OS: ${os}\n`;
    resultArea.value += `Browser: ${browser}\n`;
    resultArea.value += `UserAgent: ${navigator.userAgent}\n`;
}