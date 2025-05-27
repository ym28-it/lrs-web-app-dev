export function makeCsv(files, modules) {
    let table = Object;


    function initTable() {
        const initTable = Object.fromEntries(
            modules.map(mod => 
                [mod, Object.fromEntries(files.map(file => [file.name, '']))]
            )
        );
        table = initTable;
    }

    function recordData(mod, filename, data) {
        if (!(mod in table)) throw Error(`Unknown module ${mod}`);
        if (!(filename in table[mod])) throw Error(`Unknown file ${filename}`);
        table[mod][filename] = data;
    }

    function tableToCsv() {
        const rows = [['Module', ...files.map(f => f.name)]];

        modules.forEach(mod => {
            const row = [mod, ...files.map(file => table[mod][file.name] ?? '')];
            rows.push(row);
        });

        return rows
            .map(r => r
            .map(v =>
                ('' + v).match(/[,\"\n]/)
                ? `"${v.replace(/"/g, '""')}"`
                : v
            )
            .join(',')
            )
            .join('\r\n');
    }

    function checkTable() {
        return table;
    }


    return {
        initTable,
        recordData,
        tableToCsv,
        checkTable
    }
}

