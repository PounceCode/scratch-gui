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

async function compileToScratch() {
    blockInfo = vm.runtime._blockInfo.find(item => item.id == 'moreblocksextension').blocks;
    const toCompile = JSON.parse(vm.toJSON());
    console.log('compiling', toCompile);
    try {
        const compiled = await convert(toCompile);
        console.log("costumes", extraCostumesToBeAdded)
        // for (const asset of extraCostumesToBeAdded) {
        //     vm.addCostume(asset.data.md5ext, await asset.content.blob())
        // }
        console.log('compiled, saving...', compiled);
        const project = await vm.saveProjectSb3('blob', JSON.stringify(compiled), extraCostumesToBeAdded.map(c => ({fileName: c.data.md5ext, fileContent: c.content})))
        download('compiled_project.sb3', project);
        console.log("saved")
    } catch (e) {
        console.log("compilation error", e)
        alert("Compilation error, check the browser console for more info")
    }
}

const __dirname = 'compiler';
let blockInfo;
let extraCostumes = false;
let extraCostumesToBeAdded = [];
const definitions = {};

async function getDef(block) {
    // const blocks = await (await fetch(`${__dirname}/definitions/${block}.json`)).json()
    // let vars = {}
    // if (await checkUrlExists(`${__dirname}/vars/${block}.json`)) {
    //     vars = await (await fetch(`${__dirname}/vars/${block}.json`)).json()
    // }
    const data = definitions[block] ?? (await (await fetch(`${__dirname}/definitions/${block}.json`)).json());
    if (!definitions[block]) definitions[block] = data;

    const blocks = data.blocks;
    const vars = data.vars || {};
    const costumes = data.costumes || [];
    return {
        prototype: Object.entries(blocks).filter(([key, value]) => value.opcode == 'procedures_prototype')[0][1],
        blocksToAdd: blocks,
        varsToAdd: vars,
        costumesToAdd: costumes,
    };
}

async function addDef(receivedData) {
    const { blockName, addedDefs, blocks, blockID, target, returnType } = receivedData;
    const { prototype, blocksToAdd, varsToAdd, costumesToAdd } = await getDef(blockName);
    const block = blocks[blockID];

    if (blockName == "_switchCostume") {
        console.log(block)
        block.inputs.COSTUME = [1, [10, blocks[block.inputs.COSTUME[1]].fields.COSTUME[0]]]
        delete blocks[block.inputs.COSTUME[1]]
    }

    let oldValues = Object.values(block.inputs);
    let oldKeys = Object.keys(block.inputs);

    const correctInputOrder = Object.keys(blockInfo.find(block => block.info.opcode == blockName)?.info.arguments ?? block.inputs);

    console.log(correctInputOrder)

    const reorderedInputs = correctInputOrder.reduce((acc, key) => {
        acc[key] = block.inputs[key] ?? [];
        return acc;
    }, {});

    const reorderedKeys = Object.keys(reorderedInputs);
    const reorderedValues = reorderedKeys.map(key => reorderedInputs[key]);

    console.log(JSON.stringify(reorderedKeys), JSON.stringify(reorderedValues));
    
    oldValues = reorderedValues;
    oldKeys = reorderedKeys;

    // Convert the block to a procedure call
    block.opcode = 'procedures_call';
    block.inputs = structuredClone(prototype.inputs);
    const protoArgIDs = JSON.parse(prototype.mutation.argumentids);
    block.inputs = protoArgIDs.reduce((acc, key) => {
        acc[key] = block.inputs[key];
        return acc;
    }, {});

    // block.inputs = JSON.parse(prototype.mutation.argumentids).map(key => {
    //     return {
    //         [key]: "default value"
    //     }
    // })
    // console.log(prototype.inputs)

    const prototypeInputKeys = Object.keys(block.inputs);
    // console.log("keys", oldValues, oldKeys)
    // const prototypeInputKeys = Object.keys(JSON.parse(prototype.mutation.argumentids));
    oldValues.forEach((val, index) => {
        if (val && prototypeInputKeys[index]) {
            block.inputs[prototypeInputKeys[index]] = val;
        }
    });

    // 2. Set the new mutation (Procedure Definitions always need this)
    block.mutation = {
        tagName: 'mutation',
        children: [],
        proccode: prototype.mutation.proccode,
        argumentids: prototype.mutation.argumentids || '[]',
        // argumentnames: prototype.mutation.argumentnames || '[]',
        // argumentdefaults: prototype.mutation.argumentdefaults || '[]',
        warp: prototype.mutation.warp || 'false',
        return: returnType
    };

    if (!returnType) {
        delete block.mutation.return;
    }

    blocks[blockID] = block;

    if (!addedDefs.includes(blockName)) {
        Object.keys(blocksToAdd).forEach(id => {
            const addedBlock = JSON.parse(JSON.stringify(blocksToAdd[id]));

            // 3. Prevent the "e" parameter (Shadow Sanitization)
            if (addedBlock.inputs) {
                Object.keys(addedBlock.inputs).forEach(key => {
                    const input = addedBlock.inputs[key];
                    if (Array.isArray(input) && input.length === 3 && typeof input[2] === 'string') {
                        // If the shadow ID referenced doesn't exist in the current definition
                        if (!blocksToAdd[input[2]]) {
                            input[2] = null; // Remove the dangling "e" reference
                        }
                    }
                });
            }

            if (addedBlock.opcode == 'procedures_definition') {
                addedBlock.x = -1500;
                addedBlock.y = 0;
            }
            blocks[id] = addedBlock;
        });

        Object.keys(varsToAdd).forEach(id => {
            target.variables[id] = varsToAdd[id];
        });

        outer: for (const costume of costumesToAdd) {
            for (const test of target.costumes) {
                if (costume.name === test.name) {
                    console.log("skipping adding", costume.name)
                    continue outer
                }
            }
            console.log("adding", costume.name)
            target.costumes.push(costume)

            extraCostumes = true
            if (!extraCostumesToBeAdded.map(a => a.data.md5ext).includes(costume.md5ext)) {
                extraCostumesToBeAdded.push({data: costume, content: new Uint8Array(await (await fetch(`https://assets.scratch.mit.edu/internalapi/asset/${costume.md5ext}/get`)).arrayBuffer())})
            }
        }
        addedDefs.push(blockName);
    }
}

async function handleBlock(name, returnType, data) {
    data.blockName = name;
    data.returnType = returnType;
    await addDef(data);
}

async function convert(project) {
    extraCostumes = false;
    extraCostumesToBeAdded = [];

    const json = JSON.parse(JSON.stringify(project));
    const generateId = (prefix = 'VAR') => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

    delete json.extensionURLs;
    json.extensions = (json.extensions || []).filter(item => item !== 'moreblocksextension');

    for (const target of json.targets) {
        const blocks = target.blocks;
        extraCostumes = false

        // replace custom definitions (eg: exponent block)
        const addedDefs = [];
        const moreBlockStart = 'moreblocksextension_';
        const originalBlocks = Object.keys(blocks)
        for (const id of Object.keys(blocks)) {
            const block = blocks[id];
            if (block.opcode.startsWith(moreBlockStart)) {
                const bName = block.opcode.split('_')[1];
                const data = {
                    blockName: null,
                    addedDefs: addedDefs,
                    blocks: blocks,
                    blockID: id,
                    target: target
                };
                switch (bName) {
                    case "power": await handleBlock("power", 1, data); break
                    case "previousCostume": await handleBlock("previousCostume", null, data); break
                    case "previousBackdrop": await handleBlock("previousBackdrop", null, data); break
                    case "newLine": await handleBlock("newLine", 1, data); break
                    case "true": await handleBlock("true", 2, data); break
                    case "false": await handleBlock("false", 2, data); break
                    case "turnAround": await handleBlock("turnAround", null, data); break
                    case "inlineIf": await handleBlock("inlineIf", 1, data); break
                    case "pointTowardsXY": await handleBlock("pointTowardsXY", null, data); break
                    case "distanceToXY": await handleBlock("distanceToXY", 1, data); break
                    case "pi": await handleBlock("pi", 1, data); break
                    case "e": await handleBlock("e", 1, data); break
                    case "infinity": await handleBlock("infinity", 1, data); break
                    case "substring": await handleBlock("substring", 1, data); break
                    case "startsWith": await handleBlock("startsWith", 2, data); break
                    case "endsWith": await handleBlock("endsWith", 2, data); break
                    case "forceSetSize": await handleBlock("forceSetSize", null, data); break
                    case "inlineAsk": await handleBlock("inlineAsk", 1, data); break
                    case "exactEquals": await handleBlock("exactEquals", 2, data); break
                }
            }
        }

        if (extraCostumes.length > 0) {
            for (const id of originalBlocks) {
                const block = blocks[id];
                const bName = block.opcode
                const data = {
                    blockName: null,
                    addedDefs: addedDefs,
                    blocks: blocks,
                    blockID: id,
                    target: target
                };
                switch (bName) {
                    case "looks_nextcostume": await handleBlock("_nextCostume", null, data); break
                    case "looks_switchcostumeto": await handleBlock("_switchCostume", null, data); break
                }
            }
        }

        const notStackBlocks = [];

        // find stack blocks
        Object.keys(blocks).forEach(id => {
            const block = blocks[id];
            if (block.inputs) {
                Object.keys(block.inputs).forEach(input => {
                    // FIX: Ignore C-loops (substacks) so blocks inside them aren't treated as reporters
                    if (input === 'SUBSTACK' || input === 'SUBSTACK2') return;

                    const data = block.inputs[input];
                    if (typeof data[1] == 'string') {
                        if (!notStackBlocks.includes(data[1])) {
                            notStackBlocks.push(data[1]);
                        }
                    }
                });
            }
        });

        // console.log("refs", notStackBlocks);

        const procMap = {};

        // map custom blocks to variables
        Object.keys(blocks).forEach(id => {
            const block = blocks[id];
            if (block.opcode === 'procedures_definition') {
                const customBlockId = block.inputs.custom_block[1];
                const customBlock = blocks[customBlockId];
                const proccode = customBlock.mutation.proccode;
                if (!procMap[proccode]) {
                    // generate a unique variable for the function
                    const vId = generateId('glob');
                    const cleanName = proccode
                        .replace(/%[snb]/g, '')
                        .trim()
                        .substring(0, 30)
                        .replace(/\s/g, '_')
                        .replace('$TB.', '');
                    const vName = `$TB.fn_${cleanName}_output`;
                    console.log(vName);

                    target.variables[vId] = [vName, 0];
                    procMap[proccode] = { id: vId, name: vName, cleanName: cleanName };
                }
            }
        });

        let usedProcs = [];

        Object.keys(blocks).forEach(id => {
            const block = blocks[id];
            if (block.opcode === 'procedures_return') {
                let curr = block;
                let definitionFound = false;
                let depth = 0;
                while (curr.parent && blocks[curr.parent] && depth < 1000) {
                    if (blocks[curr.parent].opcode === 'procedures_definition') {
                        definitionFound = true;
                        curr = blocks[curr.parent];
                        break;
                    }
                    curr = blocks[curr.parent];
                    depth++;
                }

                if (definitionFound) {
                    const customBlockId = curr.inputs.custom_block[1];
                    const proccode = blocks[customBlockId].mutation.proccode;
                    const mapping = procMap[proccode];

                    if (mapping) {
                        if (!usedProcs.includes(proccode)) usedProcs.push(proccode);
                        block.opcode = 'data_setvariableto';
                        block.fields = { VARIABLE: [mapping.name, mapping.id] };
                        delete block.mutation;
                    }
                }
            }
        });

        Object.keys(procMap).forEach(code => {
            if (!usedProcs.includes(code)) {
                console.log('deleting unused proccode variable', code);
                delete target.variables[procMap[code].id];
                // delete procMap[code]
            }
        });

        Object.keys(blocks).forEach(id => {
            const block = blocks[id];

            // if custom reporter block
            // Handle both "1" (String/Number) and "2" (Boolean) returns
            if (block.opcode === 'procedures_call' && block.mutation && block.mutation.return) {
                // FIX: Use loose equality (==) because handleBlock passes integer 2, but JSON might have string "2"
                const isBoolean = block.mutation.return == 2;

                // convert to a stack block
                delete block.mutation.return;

                // find the parent stack block
                // We traverse up the tree until we find a block that is NOT in the reporter list.
                let stackBlockID = block.parent;
                while (stackBlockID && notStackBlocks.includes(stackBlockID)) {
                    // NEW CHECK: Check if the parent is a converted procedure call (stack block)
                    const parentBlock = blocks[stackBlockID];
                    if (
                        parentBlock.opcode === 'procedures_call' &&
                        (!parentBlock.mutation || !parentBlock.mutation.return)
                    ) {
                        // It has been converted to a stack block. Stop traversing.
                        break;
                    }
                    stackBlockID = blocks[stackBlockID].parent;
                }

                const stackBlock = blocks[stackBlockID];

                // variables
                const functionOutputVar = procMap[block.mutation.proccode];
                // create unique temp variable for this specific call
                const tempVarId = generateId('tmp');
                const tempVarName = `$TB_${procMap[block.mutation.proccode].cleanName}_${id.toString().slice(0, 6)}`;
                target.variables[tempVarId] = [tempVarName, 0];

                const outputID = generateId('output'); // The ID for the "Set Variable" block

                // update the reporter's original place in the tree
                // we find the block that immediately contains this reporter (block.parent)
                const immediateParentID = block.parent;
                const immediateParent = blocks[immediateParentID];

                // Scan inputs to replace the custom block ID with the Temp Variable ID
                Object.keys(immediateParent.inputs).forEach(inputName => {
                    const input = immediateParent.inputs[inputName];
                    if (input[1] === id) {
                        if (isBoolean) {
                            // If it's a boolean, we cannot put a variable directly into the condition.
                            // We create an (Variable == "true") equality block.
                            const eqId = generateId('bool_check');
                            blocks[eqId] = {
                                opcode: 'operator_equals',
                                next: null,
                                parent: immediateParentID,
                                inputs: {
                                    OPERAND1: [3, [12, tempVarName, tempVarId], [10, '']],
                                    OPERAND2: [1, [10, 'true']] // Strict comparison against string "true"
                                },
                                fields: {},
                                shadow: false,
                                topLevel: false
                            };
                            // Link the parent to this new equality block
                            immediateParent.inputs[inputName] = [2, eqId];
                        } else {
                            // Replace with [12, varName, varId] (Scratch variable reporter)
                            immediateParent.inputs[inputName] = [3, [12, tempVarName, tempVarId], [10, '']];
                            // immediateParent.inputs[inputName] = [3, tempVarId, [10, ""]];
                        }
                    }
                });

                // 5. INJECT into the Stack
                // Current Chain:  [PrevBlock] -> [StackBlock]
                // New Chain:      [PrevBlock] -> [CallBlock] -> [SetTempBlock] -> [StackBlock]

                const prevBlockID = stackBlock.parent;

                // Link 1: Call Block -> Set Temp Variable Block
                block.next = outputID; // set variable block
                block.parent = prevBlockID; // stackBlock.parent

                // Link 2: Set Temp Variable Block -> Stack Block (The Anchor)
                blocks[outputID] = {
                    opcode: 'data_setvariableto',
                    next: stackBlockID,
                    parent: id, // Parent is the Call Block
                    inputs: {
                        VALUE: [3, [12, functionOutputVar.name, functionOutputVar.id], [10, '']]
                    },
                    fields: {
                        VARIABLE: [tempVarName, tempVarId]
                    },
                    shadow: false,
                    topLevel: false
                };

                // Link 3: Update the Anchor to point to our new Set Temp Block
                stackBlock.parent = outputID;

                // Link 4: Update the Previous Block (if it exists)
                if (prevBlockID && blocks[prevBlockID]) {
                    // Check if we are attached via "Next"
                    if (blocks[prevBlockID].next === stackBlockID) {
                        blocks[prevBlockID].next = id;
                    }
                    // Check if we are attached via "Substack" (e.g., inside an If or Loop)
                    else {
                        const inputs = blocks[prevBlockID].inputs;
                        for (const key in inputs) {
                            if (inputs[key][1] === stackBlockID) {
                                inputs[key][1] = id;
                            }
                        }
                    }
                } else {
                    // Handle case where StackBlock was the top of the script
                    if (stackBlock.topLevel) {
                        block.topLevel = true;
                        block.x = stackBlock.x;
                        block.y = stackBlock.y;

                        stackBlock.topLevel = false;
                        delete stackBlock.x;
                        delete stackBlock.y;
                    }
                }
            }
        });
    }

    return json;
}
