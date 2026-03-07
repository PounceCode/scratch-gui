function download(filename, blob) {
    // const blob = new Blob([text], { type: 'application/json' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024; // Use 1000 for SI units
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

async function compileToScratch(projectTitle) {
    const toCompile = JSON.parse(vm.toJSON());
    console.log('compiling', toCompile);
    try {
        let compiled = await convert(toCompile);
        let minified;
        console.log("costumes", extraCostumesToBeAdded)

        if (!window.noMinify) {
            console.log("minifying...")
            minified = minifyScratchProject(compiled)
            const totalSize = JSON.stringify(compiled).length
            const compressedSize = JSON.stringify(minified).length
            console.log("minfied, reduced by", Math.round((totalSize - compressedSize) / totalSize * 1000) / 10 + "%", "from", formatBytes(totalSize), "to", formatBytes(compressedSize))
        }

        const output = minified ?? compiled

        console.log('compiled, saving...', output);
        const project = await vm.saveProjectSb3('blob', JSON.stringify(output), extraCostumesToBeAdded.map(c => ({ fileName: c.data.md5ext, fileContent: c.content })))
        download((projectTitle || 'Compiled Project') + '.sb3', project);
        console.log("saved")
    } catch (e) {
        console.log("compilation error", e)
        alert("Compilation error, check the browser console for more info")
    }
}