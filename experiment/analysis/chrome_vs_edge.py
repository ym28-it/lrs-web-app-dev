import pandas as pd
import os

# パス（必要に応じて修正）
# base_path = "C:/Users/<username>/Documents/GitHub/lrs-web-app-dev/experiment/analysis/results/"
base_path = "/Users/yutamuraya/GitHub/lrs-web-app-dev/experiment/analysis/results/" # mac 
chrome_path = "converted_ubuntuVM_firefox.csv"  # 適宜修正
edge_path = "converted_windowsVM_firefox.csv"  # 適宜修正


# データ読み込み
df_c = pd.read_csv(base_path + chrome_path)
df_f = pd.read_csv(base_path + edge_path)

print(f"df_c.columns.tolist(): {df_c.columns.tolist()}")
print(f"df_f.columns.tolist(): {df_f.columns.tolist()}")


# FileName から Input を生成
df_c["Input"] = df_c["FileName"].apply(lambda x: os.path.basename(x).split("by")[0])
df_f["Input"] = df_f["FileName"].apply(lambda x: os.path.basename(x).split("by")[0])

# 並びが違う可能性を考慮して Input でマージ
df_merged = pd.merge(df_c, df_f, on="Input", suffixes=("_c", "_f"))

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
        f_val = row.get(f"{module}_f")
        print(f"c_val: {c_val}, f_val: {f_val}")
        if c_val == "O" or f_val == "O":
            result_row[module] = "Overflow"
            diff_time_row[module] = "Overflow"
            continue
        diff_time_row[module] = float(f_val) - float(c_val) if pd.notna(c_val) and pd.notna(f_val) else 'N/A'

        if pd.isna(c_val) or pd.isna(f_val):
            result_row[module] = "N/A"
        elif c_val < f_val:
            result_row[module] = "Ubuntu"
        elif f_val < c_val:
            result_row[module] = "Windows"
        else:
            result_row[module] = "Ubuntu"  # 同値は Chrome 優先
    results.append(result_row)
    diff_time_results.append(diff_time_row)

# 結果をDataFrameに変換して保存
df_result = pd.DataFrame(results)
df_result.to_csv("firefox_windows-ubuntu_result.csv", index=False)

# 出力確認
print(df_result.head())

# 差分時間結果をDataFrameに変換して保存
df_diff_time = pd.DataFrame(diff_time_results)
df_diff_time.to_csv("firefox_windows-ubuntu_diff_time.csv", index=False)

# 出力確認
print(df_diff_time.head())