import pandas as pd
import os

base_path = "C:/Users/fdc3j/Documents/GitHub/lrs-web-app-dev/experiment/analysis/results/"
wc_path = "lrs-experiment-results_windows_chrome.csv"  # 適宜修正
we_path = "lrs-experiment-results_windows_edge.csv"  # 適宜修正

# データ読み込み
df_wc = pd.read_csv(base_path + wc_path)
df_we = pd.read_csv(base_path + we_path)

# 'FileName' を基に 'Input' と 'Browser' を抽出
df_wc['Browser'] = 'Chrome'
df_we['Browser'] = 'Edge'

df_wc['Input'] = df_wc['FileName'].apply(lambda x: os.path.basename(x).split('by')[0])
df_we['Input'] = df_we['FileName'].apply(lambda x: os.path.basename(x).split('by')[0])

print(df_wc.head())
print(df_we.head())

# 数値列のみを抽出して、ミリ秒→秒に変換
df_wc_numeric = df_wc.select_dtypes(include=['number']) / 1000
df_we_numeric = df_we.select_dtypes(include=['number']) / 1000

# 元のデータフレームの非数値列を結合
df_wc = pd.concat([df_wc.drop(columns=df_wc_numeric.columns), df_wc_numeric], axis=1)
df_we = pd.concat([df_we.drop(columns=df_we_numeric.columns), df_we_numeric], axis=1)


# 結果の保存
df_wc.to_csv("converted_windows_chrome.csv", index=False)
df_we.to_csv("converted_windows_edge.csv", index=False)


