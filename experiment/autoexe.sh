#!bin/bash
for i in *.ine; do
    time- -p lrs $i /dev/null
done


for i in testfiles/ ; do
    for s in prog/; do
        time -p $s $i /dev/null # deviceの略　出力の保存
    done
done