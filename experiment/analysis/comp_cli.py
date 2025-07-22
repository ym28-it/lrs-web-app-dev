import pandas as pd
import numpy as np

# ファイル読み込み
cli_df = pd.read_csv("./results/execution_times_cli.csv")

chrome_df = pd.read_csv("./results/converted_windowsVM_chrome.csv")
firefox_df = pd.read_csv("./results/converted_windowsVM_firefox.csv")

# chrome_df = pd.read_csv("./results/converted_ubuntuVM_chrome.csv")
# firefox_df = pd.read_csv("./results/converted_ubuntuVM_firefox.csv")


# FileName列をインデックスに
cli_df.set_index("FileName", inplace=True)
chrome_df.set_index("FileName", inplace=True)
firefox_df.set_index("FileName", inplace=True)

# 全て数値に変換し、文字列（"O", "N"など）はNaN
cli_df = cli_df.apply(pd.to_numeric, errors="coerce")
chrome_df = chrome_df.apply(pd.to_numeric, errors="coerce")
firefox_df = firefox_df.apply(pd.to_numeric, errors="coerce")

# 結果格納用の新しいDataFrame
chrome_ratio_df = pd.DataFrame(index=cli_df.index)
firefox_ratio_df = pd.DataFrame(index=cli_df.index)

# 割合の計算
for module in cli_df.columns:
    if module in chrome_df.columns:
        ratio = chrome_df[module] / cli_df[module]
        chrome_ratio_df[module] = ratio
        print(f"[Chrome] {module} ratio:\n{ratio}")
    if module in firefox_df.columns:
        ratio = firefox_df[module] / cli_df[module]
        firefox_ratio_df[module] = ratio
        print(f"[Firefox] {module} ratio:\n{ratio}")

# FileNameを列に戻す
chrome_ratio_df.reset_index(inplace=True)
firefox_ratio_df.reset_index(inplace=True)

# 出力
chrome_ratio_df.to_csv("./results/ratio_windowsVM_chrome.csv", index=False)
firefox_ratio_df.to_csv("./results/ratio_windowsVM_firefox.csv", index=False)
