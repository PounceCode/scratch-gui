function minifyScratchProject(project) {
    project = structuredClone(project)
    const safeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    function getShortId(index) {
        let res = '';
        let n = index;
        do {
            res = safeChars[n % safeChars.length] + res;
            n = Math.floor(n / safeChars.length) - 1;
        } while (n >= 0);
        return res;
    }

    let globalIdCount = 0; 
    const idMap = {};   
    const nameMap = {}; 
    const procMap = {};

    // 1. Identify "Reserved Names" (Monitored variables/lists)
    const reservedNames = new Set();
    if (project.monitors) {
        project.monitors.forEach(m => {
            if (m.params && m.params.VARIABLE) reservedNames.add(m.params.VARIABLE);
            if (m.params && m.params.LIST) reservedNames.add(m.params.LIST);
        });
    }

    // Helper to get next ID that doesn't conflict with a visible variable name
    function getSafeNextId() {
        let candidate;
        do {
            candidate = getShortId(globalIdCount++);
        } while (reservedNames.has(candidate)); // Skip if ID matches a visible name
        return candidate;
    }

    // --- STEP 1: Map Variables, Lists, and Broadcasts ---
    project.targets.forEach(target => {
        ['variables', 'lists', 'broadcasts'].forEach(type => {
            if (!target[type]) return;
            const newDict = {};
            for (const [oldId, data] of Object.entries(target[type])) {
                if (!idMap[oldId]) {
                    const shortId = getSafeNextId();
                    idMap[oldId] = shortId;
                    const originalName = Array.isArray(data) ? data[0] : data;
                    
                    // Keep original name for broadcasts or monitored items
                    if (type === 'broadcasts' || reservedNames.has(originalName)) {
                        nameMap[oldId] = originalName; 
                    } else {
                        nameMap[oldId] = shortId; 
                    }
                }
                const newId = idMap[oldId];
                newDict[newId] = (type === 'broadcasts') ? nameMap[oldId] : [nameMap[oldId], data[1]];
            }
            target[type] = newDict;
        });
    });

    // --- STEP 2: Map Custom Block Names ---
    project.targets.forEach(target => {
        if (!target.blocks) return;
        for (const block of Object.values(target.blocks)) {
            if (!Array.isArray(block) && block.mutation && block.mutation.proccode) {
                const oldCode = block.mutation.proccode;
                if (!procMap[oldCode]) {
                    const placeholders = oldCode.match(/%[sb]/g) || [];
                    const shortName = getSafeNextId();
                    procMap[oldCode] = shortName + (placeholders.length > 0 ? " " + placeholders.join(" ") : "");
                }
            }
        }
    });

    // --- STEP 3: Map Blocks ---
    project.targets.forEach(target => {
        if (!target.blocks) return;
        const blockIdMap = {};
        const newBlocks = {};

        for (const oldBlockId in target.blocks) {
            blockIdMap[oldBlockId] = getSafeNextId();
        }

        for (const [oldBlockId, block] of Object.entries(target.blocks)) {
            const newId = blockIdMap[oldBlockId];
            if (Array.isArray(block)) {
                if ((block[0] === 11 || block[0] === 12 || block[0] === 13) && idMap[block[2]]) {
                    block[1] = nameMap[block[2]]; 
                    block[2] = idMap[block[2]];   
                }
                newBlocks[newId] = block;
                continue;
            }

            const newBlock = { ...block };
            if (newBlock.next) newBlock.next = blockIdMap[newBlock.next];
            if (newBlock.parent) newBlock.parent = blockIdMap[newBlock.parent];
            if (newBlock.mutation && newBlock.mutation.proccode) {
                newBlock.mutation.proccode = procMap[newBlock.mutation.proccode];
            }

            if (newBlock.inputs) {
                for (const inputName in newBlock.inputs) {
                    const inputArr = newBlock.inputs[inputName];
                    for (let i = 1; i < inputArr.length; i++) {
                        if (typeof inputArr[i] === 'string' && blockIdMap[inputArr[i]]) {
                            inputArr[i] = blockIdMap[inputArr[i]]; 
                        } else if (Array.isArray(inputArr[i])) {
                            const innerObj = inputArr[i];
                            if ((innerObj[0] === 11 || innerObj[0] === 12 || innerObj[0] === 13) && idMap[innerObj[2]]) {
                                innerObj[1] = nameMap[innerObj[2]];
                                innerObj[2] = idMap[innerObj[2]];
                            }
                        }
                    }
                }
            }

            if (newBlock.fields) {
                for (const fieldName in newBlock.fields) {
                    const fieldArr = newBlock.fields[fieldName];
                    if (fieldArr && fieldArr.length === 2 && idMap[fieldArr[1]]) {
                        fieldArr[0] = nameMap[fieldArr[1]]; 
                        fieldArr[1] = idMap[fieldArr[1]];   
                    }
                }
            }
            newBlocks[newId] = newBlock;
        }
        target.blocks = newBlocks;
    });

    // --- STEP 4: Update Monitors ---
    if (project.monitors) {
        project.monitors.forEach(monitor => {
            const oldId = monitor.id;
            if (monitor.params) {
                if (monitor.params.VARIABLE !== undefined) monitor.params.VARIABLE = nameMap[oldId] || monitor.params.VARIABLE;
                if (monitor.params.LIST !== undefined) monitor.params.LIST = nameMap[oldId] || monitor.params.LIST;
            }
            if (idMap[oldId]) monitor.id = idMap[oldId];
        });
    }

    return project;
}