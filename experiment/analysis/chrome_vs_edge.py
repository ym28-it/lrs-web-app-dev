import pandas as pd
import os

# パス（必要に応じて修正）
base_path = "C:/Users/fdc3j/Documents/GitHub/lrs-web-app-dev/experiment/analysis/results/"
chrome_path = "lrs-experiment-results_windows_chrome.csv"  # 適宜修正
edge_path = "lrs-experiment-results_windows_edge.csv"

# データ読み込み
df_c = pd.read_csv(base_path + chrome_path)
df_e = pd.read_csv(base_path + edge_path)

# 比較対象となる数値列を取得（例：各モジュールの実行時間）
time_cols = df_e.select_dtypes(include=["number"]).columns.tolist()

# 入力ファイル名と各モジュールのペアで比較するためにピボットテーブルを作成
df_c_pivot = df_c.pivot(index="Input", columns="Module", values=time_cols).droplevel(0, axis=1)
df_e_pivot = df_e.pivot(index="Input", columns="Module", values=time_cols).droplevel(0, axis=1)

# 比較ロジック
def compare(row_c, row_e):
    result = {}
    for col in row_c.index:
        c_val = row_c[col]
        e_val = row_e[col]
        if pd.isna(c_val) or pd.isna(e_val):
            result[col] = "O"  # Overflown or missing
        elif c_val < e_val:
            result[col] = "C"
        elif e_val < c_val:
            result[col] = "E"
        else:
            result[col] = "C"  # 同一ならChrome優先
    return pd.Series(result)

# 入力ファイル単位で比較
comparison_df = df_c_pivot.combine(df_e_pivot, compare)

# 結果保存
comparison_df.to_csv("chrome_vs_edge.csv")

# 出力確認（任意）
print("比較結果（先頭5行）:")
print(comparison_df.head())
