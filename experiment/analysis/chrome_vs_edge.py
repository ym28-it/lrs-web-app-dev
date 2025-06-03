import pandas as pd
import os

# パス（必要に応じて修正）
# base_path = "C:/Users/<username>/Documents/GitHub/lrs-web-app-dev/experiment/analysis/results/"
base_path = "/Users/yutamuraya/GitHub/lrs-web-app-dev/experiment/analysis/results/" # mac 
chrome_path = "converted_windows_chrome.csv"  # 適宜修正
edge_path = "converted_windows_edge.csv"  # 適宜修正


# データ読み込み
df_c = pd.read_csv(base_path + chrome_path)
df_e = pd.read_csv(base_path + edge_path)

print(f"df_c.columns.tolist(): {df_c.columns.tolist()}")
print(f"df_e.columns.tolist(): {df_e.columns.tolist()}")


# FileName から Input を生成
df_c["Input"] = df_c["FileName"].apply(lambda x: os.path.basename(x).split("by")[0])
df_e["Input"] = df_e["FileName"].apply(lambda x: os.path.basename(x).split("by")[0])

# 並びが違う可能性を考慮して Input でマージ
df_merged = pd.merge(df_c, df_e, on="Input", suffixes=("_c", "_e"))

# 比較対象のモジュール名リスト（Chrome側から取得）
modules = [col for col in df_c.columns if col not in ["FileName", "Input"]]

# 比較結果を格納するリスト
results = []
diff_time_results = []

for _, row in df_merged.iterrows():
    result_row = {"Input": row["Input"]}
    diff_time_row = {"Input": row["Input"]}
    for module in modules:
        c_val = row.get(f"{module}_c")
        e_val = row.get(f"{module}_e")
        diff_time_row[module] = e_val - c_val if pd.notna(c_val) and pd.notna(e_val) else 'N/A'

        if pd.isna(c_val) or pd.isna(e_val):
            result_row[module] = "N/A"
        elif c_val < e_val:
            result_row[module] = "C"
        elif e_val < c_val:
            result_row[module] = "E"
        else:
            result_row[module] = "C"  # 同値は Chrome 優先
    results.append(result_row)
    diff_time_results.append(diff_time_row)

# 結果をDataFrameに変換して保存
df_result = pd.DataFrame(results)
df_result.to_csv("chrome_vs_edge.csv", index=False)

# 出力確認
print(df_result.head())

# 差分時間結果をDataFrameに変換して保存
df_diff_time = pd.DataFrame(diff_time_results)
df_diff_time.to_csv("chrome_vs_edge_diff_time.csv", index=False)

# 出力確認
print(df_diff_time.head())