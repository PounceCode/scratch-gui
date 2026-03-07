function minifyScratchProject(project) {
    project = structuredClone(project);
    const safeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    let globalIdCount = 0; 
    const idMap = {};   
    const nameMap = {}; 

    function getShortId() {
        let n = globalIdCount++;
        let res = '';
        do {
            res = safeChars[n % safeChars.length] + res;
            n = Math.floor(n / safeChars.length) - 1;
        } while (n >= 0);
        return res;
    }

    const reservedNames = new Set();
    if (project.monitors) {
        project.monitors.forEach(m => {
            if (m.params) {
                if (m.params.VARIABLE) reservedNames.add(m.params.VARIABLE);
                if (m.params.LIST) reservedNames.add(m.params.LIST);
            }
        });
    }

    function getSafeNextId() {
        let candidate;
        do { candidate = getShortId(); } while (reservedNames.has(candidate));
        return candidate;
    }

    // --- STEP 1: Map Variables, Lists, and Broadcasts (Global/Local) ---
    project.targets.forEach(target => {
        ['variables', 'lists', 'broadcasts'].forEach(type => {
            if (!target[type]) return;
            const newDict = {};
            for (const [oldId, data] of Object.entries(target[type])) {
                if (!idMap[oldId]) {
                    const shortId = getSafeNextId();
                    idMap[oldId] = shortId;
                    const originalName = Array.isArray(data) ? data[0] : data;
                    
                    // Preserve names for monitored variables or broadcasts
                    nameMap[oldId] = (type === 'broadcasts' || reservedNames.has(originalName)) 
                        ? originalName 
                        : shortId;
                }
                const newId = idMap[oldId];
                newDict[newId] = (type === 'broadcasts') ? nameMap[oldId] : [nameMap[oldId], data[1]];
            }
            target[type] = newDict;
        });
    });

    // --- STEP 2: Map Blocks and Scoped Procedures ---
    project.targets.forEach(target => {
        if (!target.blocks) return;
        const blockIdMap = {};
        const localProcMap = {}; // Scopes procedure names per sprite
        const localParamMap = {}; // Maps old parameter names to new ones within this sprite

        // Pass 1: Pre-generate IDs and identify procedure/parameter renames
        for (const [oldId, block] of Object.entries(target.blocks)) {
            blockIdMap[oldId] = getSafeNextId();
            
            if (!Array.isArray(block) && (block.opcode === 'procedures_prototype' || (block.mutation && block.mutation.proccode))) {
                const mutation = block.mutation;
                if (mutation && mutation.proccode) {
                    // Minify Proccode
                    if (!localProcMap[mutation.proccode]) {
                        const placeholders = mutation.proccode.match(/%[sb]/g) || [];
                        localProcMap[mutation.proccode] = getSafeNextId() + (placeholders.length > 0 ? " " + placeholders.join(" ") : "");
                    }
                    
                    // Minify Argument Names (Parameters)
                    if (mutation.argumentnames) {
                        const argNames = JSON.parse(mutation.argumentnames);
                        const newArgNames = argNames.map(name => {
                            if (!localParamMap[name]) localParamMap[name] = getSafeNextId();
                            return localParamMap[name];
                        });
                        mutation.argumentnames = JSON.stringify(newArgNames);
                    }
                }
            }
        }

        // Pass 2: Reconstruct blocks
        const newBlocks = {};
        for (const [oldId, block] of Object.entries(target.blocks)) {
            const newId = blockIdMap[oldId];
            
            if (Array.isArray(block)) {
                const cloned = [...block];
                if ((cloned[0] >= 11 && cloned[0] <= 13) && idMap[cloned[2]]) {
                    cloned[1] = nameMap[cloned[2]]; 
                    cloned[2] = idMap[cloned[2]];   
                }
                newBlocks[newId] = cloned;
                continue;
            }

            const newBlock = { ...block };
            if (newBlock.next) newBlock.next = blockIdMap[newBlock.next];
            if (newBlock.parent) newBlock.parent = blockIdMap[newBlock.parent];

            // Update Argument Reporters (The "temp variables" of procedures)
            if (newBlock.opcode.startsWith('argument_reporter_')) {
                const oldParamName = newBlock.fields.VALUE[0];
                if (localParamMap[oldParamName]) {
                    newBlock.fields.VALUE[0] = localParamMap[oldParamName];
                }
            }

            // Update Mutations (Procedures)
            if (newBlock.mutation && newBlock.mutation.proccode) {
                newBlock.mutation.proccode = localProcMap[newBlock.mutation.proccode];
            }

            // Update Inputs and Fields
            if (newBlock.inputs) {
                for (const inputName in newBlock.inputs) {
                    const inputArr = newBlock.inputs[inputName];
                    for (let i = 1; i < inputArr.length; i++) {
                        if (typeof inputArr[i] === 'string' && blockIdMap[inputArr[i]]) {
                            inputArr[i] = blockIdMap[inputArr[i]]; 
                        } else if (Array.isArray(inputArr[i])) {
                            const inner = inputArr[i];
                            if ((inner[0] >= 11 && inner[0] <= 13) && idMap[inner[2]]) {
                                inner[1] = nameMap[inner[2]];
                                inner[2] = idMap[inner[2]];
                            }
                        }
                    }
                }
            }

            if (newBlock.fields) {
                for (const fieldName in newBlock.fields) {
                    const fieldArr = newBlock.fields[fieldName];
                    if (fieldArr && fieldArr.length >= 2 && idMap[fieldArr[1]]) {
                        fieldArr[0] = nameMap[fieldArr[1]]; 
                        fieldArr[1] = idMap[fieldArr[1]];   
                    }
                }
            }
            newBlocks[newId] = newBlock;
        }
        target.blocks = newBlocks;
    });

    // --- STEP 3: Update Monitors ---
    if (project.monitors) {
        project.monitors.forEach(monitor => {
            if (monitor.params) {
                if (monitor.params.VARIABLE !== undefined) monitor.params.VARIABLE = nameMap[monitor.id] || monitor.params.VARIABLE;
                if (monitor.params.LIST !== undefined) monitor.params.LIST = nameMap[monitor.id] || monitor.params.LIST;
            }
            if (idMap[monitor.id]) monitor.id = idMap[monitor.id];
        });
    }

    return project;
}