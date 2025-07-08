import pandas as pd
# import seaborn as sns
import matplotlib.pyplot as plt
# import os

csv_path = {
    "ubuntuVM_Chrome": "./results/converted_ubuntuVM_chrome.csv",
    "ubuntuVM_Firefox" :"./results/converted_ubuntuVM_firefox.csv",
    "windowsVM_Chrome" : "./results/converted_windowsVM_chrome.csv",
    "windowsVM_Firefox" :"./results/converted_windowsVM_firefox.csv",
    "windows_Chrome" : "./results/converted_windows_chrome.csv",
    # "windows_Edge" : "./results/converted_windows_edge.csv",
    "windows_Firefox" : "./results/converted_windows_firefox.csv"
}

# target_line = "fq48-19lrs.ine"
target_line = "c30-15.ext"

merged_df = pd.DataFrame()

for name, path in csv_path.items():
    df = pd.read_csv(path)
    df["FileName"] = df["FileName"].astype(str).str.strip()
    new_df = df[df["FileName"] == target_line]
    if not new_df.empty:
        new_df["Environment"] = name
        merged_df = pd.concat([merged_df, new_df], ignore_index=True)



# 不要な列（FileName）以外を縦長に変換
melted = merged_df.melt(id_vars=["Environment", "FileName"], 
                        var_name="Module", 
                        value_name="ExecutionTime")

# "O" を NaN に置換して数値に変換
melted["ExecutionTime"] = pd.to_numeric(melted["ExecutionTime"], errors="coerce")

# グラフ描画（折れ線グラフ）
plt.figure(figsize=(12, 6))
for env, grp in melted.groupby("Environment"):
    plt.plot(grp["Module"], grp["ExecutionTime"], marker='o', label=env)

plt.xlabel("Module")
plt.ylabel("Execution Time")
plt.title(f"Execution Time per Module for {target_line}")
plt.xticks(rotation=45)
plt.legend(title="Environment")
plt.tight_layout()
plt.savefig(f"execution_time_per_{target_line}.png", dpi=300)
plt.show()