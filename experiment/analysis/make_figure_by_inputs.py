import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# CSV読み込み
cli_ubuntu = pd.read_csv("./results/execution_times_cli.csv")
# chrome = pd.read_csv("./results/converted_windows_chrome.csv")
# edge = pd.read_csv("./results/converted_windows_edge.csv")
# firefox = pd.read_csv("./results/converted_windows_firefox.csv")

# ブラウザ列を追加
cli_ubuntu["Browser"] = "CLI_Ubuntu"
# chrome["Browser"] = "Chrome"
# edge["Browser"] = "Edge"
# firefox["Browser"] = "Firefox"

# 縦長（long format）に変換
def melt_and_label(df):
    return pd.melt(
        df,
        id_vars=["FileName", "Browser"],
        var_name="Module",
        value_name="Time"
    )

df_all = pd.concat([melt_and_label(cli_ubuntu)])
# df_all = pd.concat([melt_and_label(chrome), melt_and_label(edge), melt_and_label(firefox)])

# 数値化できない値（"O", "N"）をNaNに
df_all["Time_numeric"] = pd.to_numeric(df_all["Time"], errors="coerce")

# 各Filenameごとに描画
for filename in df_all["FileName"].unique():
    subset = df_all[df_all["FileName"] == filename]
    print(f'filename: {filename}')

    # n_modules = subset['Module'].nunique()
    # fig_width = max(12, n_modules * 0.8)
    fig_width = 12

    plt.figure(figsize=(fig_width, 6))

    # 数値部分だけプロット
    sns.lineplot(
        data=subset.dropna(subset=["Time_numeric"]),
        x="Module",
        y="Time_numeric",
        hue="Browser",
        marker="o"
    )

    # "O"/"N" の注釈追加
    for _, row in subset.iterrows():
        if pd.isna(row["Time_numeric"]):
            plt.text(
                x=row["Module"],
                y=0,  # Y軸の下端
                s=row["Time"],
                color="red" if row["Time"] == "O" else "blue",
                ha="center",
                fontsize=8
            )

    plt.title(f"Execution Time per Module for Input: {filename}")
    plt.xlabel("Module")
    plt.ylabel("Execution Time (s)")
    plt.xticks(rotation=45)
    plt.legend(title="Browser")
    plt.grid(True)
    # plt.tight_layout()
    plt.subplots_adjust(bottom=0.2)
    plt.savefig(f"./figures/execution_time_{filename}.png", dpi=300)
    plt.show()
