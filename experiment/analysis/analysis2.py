# *************************************
# Analysis of LRS Experiment Results
# This script reads a CSV file containing experiment results,
# processes the data to extract execution times for different modules,
# and visualizes the results using seaborn and matplotlib.
# *************************************


import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import os

# CSVファイルのパスを指定
csv_path = "../results/Windows/Chrome/lrs-experiment-results.csv"  # ファイル名に応じて変更

# CSVを読み込む
df = pd.read_csv(csv_path)

# モジュール列に展開（縦持ちへ）
df_melted = df.melt(id_vars=['FileName'], var_name='module', value_name='TotalTime(ms)')

# 実行環境を 'Browser'、インプットファイル名を 'Input' として抽出
df_melted['Browser'] = df_melted['FileName'].apply(lambda x: 'Edge' if 'byEdge' in x else 'Chrome')
df_melted['Input'] = df_melted['FileName'].apply(lambda x: os.path.basename(x).split('by')[0])

# ブラウザ名を入力名に結合（Input = filename + browser）して一意にする
df_melted['InputEnv'] = df_melted['Input'] + ' (' + df_melted['Browser'] + ')'

# InputEnv をカテゴリ型で順序保持
df_melted['InputEnv'] = pd.Categorical(df_melted['InputEnv'], categories=sorted(df_melted['InputEnv'].unique()), ordered=True)

# プロット
sns.set_theme(style="whitegrid")
plt.figure(figsize=(12, 6))

sns.lineplot(
    data=df_melted,
    x='InputEnv',
    y='TotalTime(ms)',
    hue='module',
    marker='o'
)

plt.title("Execution Time by Input File and Module")
plt.xlabel("Input File (Browser)")
plt.ylabel("Total Time (ms)")
plt.xticks(rotation=45)
plt.legend(title="Module")
plt.tight_layout()
plt.grid(True)
plt.show()
