# *****************************************
# This script analyzes the execution time of different modules in a web application
# across different browsers (Edge and Chrome) using data from a CSV file.
# X: modules
# Y: total execution time in milliseconds
# *****************************************

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os

# ファイルパス（1つのファイルに統合されている前提）
csv_path = "./results/lrs-experiment-results_windows_chrome.csv"  # 適宜修正

# データ読み込み
df = pd.read_csv(csv_path)

# 'FileName' を基に 'Input' と 'Browser' を抽出
df_melted = df.melt(id_vars=['FileName'], var_name='module', value_name='TotalTime(ms)')
df_melted['Browser'] = df_melted['FileName'].apply(lambda x: 'edge' if 'byEdge' in x else 'byChrome')
df_melted['Input'] = df_melted['FileName'].apply(lambda x: os.path.basename(x).split('by')[0])

# 入力ファイルごとにグラフを描画
sns.set_theme(style="whitegrid")
for input_file in df_melted['Input'].unique():
    subset = df_melted[df_melted['Input'] == input_file]
    
    plt.figure(figsize=(10, 6))
    sns.lineplot(
        data=subset,
        x='module',
        y='TotalTime(ms)',
        hue='Browser',
        marker='o'
    )
    
    plt.title(f"Execution Time per Module for Input: {input_file}")
    plt.xlabel("Module")
    plt.ylabel("Total Time (ms)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.legend(title="Browser")
    plt.grid(True)

    # PNG形式で保存（ファイル名を適宜変更可）
    plt.savefig(f"execution_time_by_input_and_module_{input_file}.png", dpi=300)
    plt.show()
