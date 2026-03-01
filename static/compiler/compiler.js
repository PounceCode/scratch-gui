const __dirname = 'compiler';
let blockInfo = {
    "inlineIf": ['CONDITION', 'IFTRUE', 'IFFALSE']
}

let extraCostumes = false;
let extraCostumesToBeAdded = [];
const definitions = {};
const generateId = (prefix = 'VAR') => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

function getBlockIDByOpcode(object, value) {
    return Object.keys(object).find(key => object[key].opcode === value);
}

// const globs.for.iterCount.id = generateId("glob")
// const globs.for.iterCount.name = "$TB.GLOB.forLoopIterCount"
const globs = {}
globs.for = {
    start: { id: generateId("var"), name: "$TB.GLOB.forLoopStart" },
    stop: { id: generateId("var"), name: "$TB.GLOB.forLoopStop" },
    step: { id: generateId("var"), name: "$TB.GLOB.forLoopStep" },
    iterCount: { id: generateId("glob"), name: "$TB.GLOB.forLoopIterCount" }
}


const generateLongId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 15; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

function lengthenBlockIds(blocksObj) {
    const newBlocks = {};
    const idMap = {};

    // Map old IDs to new ones
    Object.keys(blocksObj).forEach(oldId => {
        idMap[oldId] = generateLongId();
    });

    // Reconstruct with updated references
    Object.keys(blocksObj).forEach(oldId => {
        const block = JSON.parse(JSON.stringify(blocksObj[oldId])); // Deep copy
        const newId = idMap[oldId];

        if (block.next && idMap[block.next]) block.next = idMap[block.next];
        if (block.parent && idMap[block.parent]) block.parent = idMap[block.parent];

        if (block.inputs) {
            for (const inputData of Object.values(block.inputs)) {
                // Scratch input format: [shadow_status, block_id_or_value]
                if (Array.isArray(inputData) && typeof inputData[1] === 'string' && idMap[inputData[1]]) {
                    inputData[1] = idMap[inputData[1]];
                }
            }
        }
        newBlocks[newId] = block;
    });

    return newBlocks;
}

async function getDef(block) {
    // const blocks = await (await fetch(`${__dirname}/definitions/${block}.json`)).json()
    // let vars = {}
    // if (await checkUrlExists(`${__dirname}/vars/${block}.json`)) {
    //     vars = await (await fetch(`${__dirname}/vars/${block}.json`)).json()
    // }
    if (block == "for") return {}

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

const constantReporters = ["newLine", "pi", "e", "infinity"]
const constantBooleans = ["true", "false"]

async function addDef(receivedData) {
    const { blockName, addedDefs, blocks, blockID, target, returnType } = receivedData;
    const { prototype, blocksToAdd, varsToAdd, costumesToAdd } = await getDef(blockName);
    const block = blocks[blockID];

    console.log("handling block", blockName)

    if (blockName == "_switchCostume") {
        console.log(block)
        block.inputs.COSTUME = [1, [10, blocks[block.inputs.COSTUME[1]].fields.COSTUME[0]]]
        delete blocks[block.inputs.COSTUME[1]]
    } else if (constantReporters.includes(blockName)) {
        console.log("handling reporter constant", blockName)
        blockOutput = Object.values(Object.values(blocksToAdd).find(b => b.opcode == "procedures_return").inputs)[0][1][1]
        const immediateParentID = block.parent;
        const immediateParent = blocks[immediateParentID];

        Object.keys(immediateParent.inputs).forEach(inputName => {
            const input = immediateParent.inputs[inputName];
            if (input[1] === blockID) {
                immediateParent.inputs[inputName] = [1, [10, blockOutput]]
            }
        })

        delete blocks[blockID]
        return
    } else if (constantBooleans.includes(blockName)) {
        console.log("handling boolean constant", blockName)

        if (blockName == "true" || blockName == "false") {
            const immediateParentID = block.parent;
            const immediateParent = blocks[immediateParentID];

            const newBlock = { "opcode": "operator_equals", "next": null, "parent": immediateParentID, "inputs": { "OPERAND1": [1, [10, "1"]], "OPERAND2": [1, [10, blockName == "true" ? "1" : "2"]] }, "fields": {}, "shadow": false, "topLevel": false }
            const newBlockID = generateId("b")
            blocks[newBlockID] = newBlock

            Object.keys(immediateParent.inputs).forEach(inputName => {
                const input = immediateParent.inputs[inputName];
                if (input[1] === blockID) {
                    immediateParent.inputs[inputName] = [3, newBlockID, [10, ""]]
                }
            })

            delete blocks[blockID]
            return
        }
    }
    // } else if (blockName == "for") {

    //     return
    // }

    let oldValues = Object.values(block.inputs);
    let oldKeys = Object.keys(block.inputs);

    // const correctInputOrder = Object.keys(blockInfo.find(block => block.info.opcode == blockName)?.info.arguments ?? block.inputs);
    const correctInputOrder = blockInfo[blockName] ?? Object.keys(block.inputs);

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
                extraCostumesToBeAdded.push({ data: costume, content: new Uint8Array(await (await fetch(`https://assets.scratch.mit.edu/internalapi/asset/${costume.md5ext}/get`)).arrayBuffer()) })
            }
        }
        addedDefs.push(blockName);
    }
}

async function handleBlockOther(receivedData) {
    const { blockName, blocks, blockID, target } = receivedData;
    const block = blocks[blockID];
    if (blockName == "for") {
        console.log("for loop", structuredClone(block))
        block.opcode = "control_repeat"

        // check if the loop is static/constant
        // if so, we don't need to add extra variables
        let isLoopStatic = true
        for (const inputName of Object.keys(block.inputs)) {
            const input = block.inputs[inputName]
            if (["START", "STEP", "STOP"].includes(inputName)) {
                if (input[0] == 2 || input[0] == 3) {
                    console.log("loop is not static", input, blockID, blocks[blockID].opcode, blocks, block.inputs)
                    isLoopStatic = false;
                    break;
                }
            }
        }

        let newInputs = {}

        // if it's static, we can calculate the iteration count while compiling
        if (isLoopStatic) {
            newInputs = {
                TIMES: [1, [4, Math.floor(Math.abs((parseInt(block.inputs.STOP[1][1]) - parseInt(block.inputs.START[1][1])) / parseInt(block.inputs.STEP[1][1]))) + 1]]
            }
        }

        // the block to update the iterator used in the loop
        const changeBlockID = generateId("var")
        console.log(block.inputs)
        if (block.inputs.SUBSTACK) {
            if (block.inputs.SUBSTACK[1]) {
                newInputs.SUBSTACK = block.inputs.SUBSTACK
            } else {
                // if there's nothing in the loop, add the block
                console.log("no substack, creating")
                newInputs.SUBSTACK = [2, changeBlockID]
            }
        } else {
            console.log("no substack, creating")
            newInputs.SUBSTACK = [2, changeBlockID]
        }

        // setting the iterator variable
        const [varName, varID] = block.fields.VARIABLE
        console.log("loop var", varName, varID)
        block.fields = {}

        const resetBlockID = generateId("var")

        let iterBlock, iterBlockID, startBlockID, stopBlockID, stepBlockID
        let resetBlock = {} // the block that resets the iterator variable
        resetBlock.opcode = 'data_setvariableto';
        resetBlock.fields = { VARIABLE: [varName, varID] };
        resetBlock.shadow = false
        resetBlock.topLevel = false
        resetBlock.inputs = {}
        resetBlock.inputs.VALUE = block.inputs.START
        // resetBlock.inputs.VALUE = [3, [12, globs.for.start.name, globs.for.start.id], [10, '']]
        if (block.inputs.START[0] <= 3 && typeof block.inputs.START[1] == "string") {
            blocks[block.inputs.START[1]].parent = resetBlockID
        }

        console.log("static?", isLoopStatic, block.inputs)
        if (!isLoopStatic) {
            // if the loop isn't static, we need to create variables to store the values, and then create the code to bring it all together
            console.log("fetching for loop def")
            const varDef = lengthenBlockIds(definitions["_for"] ?? (await (await fetch(`${__dirname}/definitions/_forLoopIterCount.json`)).json()));
            if (!definitions["_for"]) definitions["_for"] = varDef;

            // the block for the start input
            let startBlock = {}
            startBlock.opcode = 'data_setvariableto';
            startBlock.fields = { VARIABLE: [globs.for.start.name, globs.for.start.id] };
            startBlock.shadow = false
            startBlock.topLevel = false
            startBlock.inputs = {}
            startBlock.inputs.VALUE = [3, [12, varName, varID], [10, '']]

            // the block for the stop input
            let stopBlock = {}
            stopBlock.opcode = 'data_setvariableto';
            stopBlock.fields = { VARIABLE: [globs.for.stop.name, globs.for.stop.id] };
            stopBlock.shadow = false
            stopBlock.topLevel = false
            stopBlock.inputs = {}
            stopBlock.inputs.VALUE = block.inputs.STOP

            // the block for the step input
            let stepBlock = {}
            stepBlock.opcode = 'data_setvariableto';
            stepBlock.fields = { VARIABLE: [globs.for.step.name, globs.for.step.id] };
            stepBlock.shadow = false
            stepBlock.topLevel = false
            stepBlock.inputs = {}
            stepBlock.inputs.VALUE = block.inputs.STEP

            startBlockID = generateId("b")
            stopBlockID = generateId("b")
            stepBlockID = generateId("b")

            blocks[startBlockID] = startBlock
            blocks[stopBlockID] = stopBlock
            blocks[stepBlockID] = stepBlock

            // Update the parents of any reporter blocks nested in STOP or STEP
            if (block.inputs.STOP[0] <= 3 && typeof block.inputs.STOP[1] === "string") {
                blocks[block.inputs.STOP[1]].parent = stopBlockID;
            }
            if (block.inputs.STEP[0] <= 3 && typeof block.inputs.STEP[1] === "string") {
                blocks[block.inputs.STEP[1]].parent = stepBlockID;
            }

            // make sure the blocks in the inputs have the correct parents
            for (const inputName of Object.keys(block.inputs)) {
                const input = block.inputs[inputName]
                console.log("i", input)
                // if (input[0] == 3 && typeof input[1] == "string") {
                // if (input[0] == 2 || input[0] == 3) {
                switch (inputName) {
                    case "START":
                        varDef[getBlockIDByOpcode(varDef, "operator_subtract")].inputs.NUM2 = [3, [12, globs.for.start.name, globs.for.start.id], [10, '']]
                        break
                    case "STOP":
                        const t = varDef[getBlockIDByOpcode(varDef, "operator_subtract")]
                        t.inputs.NUM1 = [3, [12, globs.for.stop.name, globs.for.stop.id], [10, '']]
                        break
                    case "STEP":
                        const t2 = varDef[getBlockIDByOpcode(varDef, "operator_divide")]
                        t2.inputs.NUM2 = [3, [12, globs.for.step.name, globs.for.step.id], [10, '']]
                        break
                    // varDef[getBlockIDByOpcode(varDef, "operator_divide")].inputs.NUM2 = input
                }
                // }
            }

            // the block that holds the calculation
            iterBlockID = generateId("b")
            iterBlock = {}
            iterBlock.opcode = 'data_setvariableto';
            iterBlock.fields = { VARIABLE: [globs.for.iterCount.name, globs.for.iterCount.id] };
            iterBlock.shadow = false
            iterBlock.topLevel = false
            iterBlock.inputs = { VALUE: [3, getBlockIDByOpcode(varDef, "operator_add"), [4, ""]] }
            iterBlock.parent = stepBlockID
            iterBlock.next = blockID
            console.log(iterBlock, iterBlockID)

            startBlock.parent = resetBlockID
            startBlock.next = stopBlockID
            stopBlock.parent = startBlockID
            stopBlock.next = stepBlockID
            stepBlock.parent = stopBlockID
            stepBlock.next = iterBlockID

            varDef[getBlockIDByOpcode(varDef, "operator_add")].parent = iterBlockID
            console.log("add", varDef[getBlockIDByOpcode(varDef, "operator_add")])

            newInputs.TIMES = [3, [12, globs.for.iterCount.name, globs.for.iterCount.id], [10, '']]

            // if (block.inputs.STOP[0] <= 3 && typeof block.inputs.STOP[1] == "string") {
            //     varDef[block.inputs.STOP[1]].parent = getBlockIDByOpcode(varDef, "operator_subtract")
            // }
            // if (block.inputs.STEP[0] <= 3 && typeof block.inputs.STEP[1] == "string") {
            //     varDef[block.inputs.STEP[1]].parent = getBlockIDByOpcode(varDef, "operator_subtract")
            // }


            blocks[iterBlockID] = iterBlock

            // add the blocks to the main object
            for (const b of Object.keys(varDef)) {
                blocks[b] = varDef[b]
            }
        }

        // the block that updates the iterator variable
        let changeBlock = {}
        changeBlock.opcode = 'data_changevariableby';
        changeBlock.fields = { VARIABLE: [varName, varID] };
        changeBlock.shadow = false
        changeBlock.topLevel = false
        changeBlock.next = null
        changeBlock.inputs = {}
        changeBlock.inputs.VALUE = isLoopStatic ? block.inputs.STEP: [3, [12, globs.for.step.name, globs.for.step.id], [10, '']]
        changeBlock.parent = blockID
        blocks[changeBlockID] = changeBlock

        let testID = newInputs.SUBSTACK[1]
        let testBlock = blocks[testID]
        if (block.inputs.SUBSTACK) {
            if (block.inputs.SUBSTACK[1]) {
                while (testBlock.next) {
                    testID = testBlock.next
                    testBlock = blocks[testID]
                }
                blocks[testID].next = changeBlockID
                changeBlock.parent = testID
            }
        }

        block.inputs = newInputs

        const prevBlockID = block.parent

        // Update the Previous Block (if it exists)
        if (prevBlockID && blocks[prevBlockID]) {
            // Check if we are attached via "Next"
            if (blocks[prevBlockID].next === blockID) {
                blocks[prevBlockID].next = resetBlockID;
            }
            // Check if we are attached via "Substack" (e.g., inside an If or Loop)
            else {
                const inputs = blocks[prevBlockID].inputs;
                for (const key in inputs) {
                    if (inputs[key][1] === blockID) {
                        inputs[key][1] = resetBlockID;
                    }
                }
            }
        } else {
            // Handle case where StackBlock was the top of the script
            resetBlock.topLevel = true;
            resetBlock.x = block.x;
            resetBlock.y = block.y;

            block.topLevel = false;
            delete block.x;
            delete block.y;
        }

        blocks[resetBlockID] = resetBlock
        block.parent = iterBlockID ?? resetBlockID
        resetBlock.parent = prevBlockID
        resetBlock.next = startBlockID ?? blockID

        console.log(block)
    }
}

async function handleBlock(name, returnType, data, useSeperate) {
    data.blockName = name;
    data.returnType = returnType;

    if (useSeperate) {
        await handleBlockOther(data);
    } else {
        await addDef(data);
    }
}

async function convert(project) {
    extraCostumes = false;
    extraCostumesToBeAdded = [];

    const json = JSON.parse(JSON.stringify(project));

    delete json.extensionURLs;
    json.extensions = (json.extensions || []).filter(item => item != 'moreblocksextension' && item != 'extra');

    Object.keys(globs.for).forEach(v => {
        json.targets.find(t => t.isStage).variables[globs.for[v].id] = [globs.for[v].name, 0]
    })

    for (const target of json.targets) {
        console.log("compiling target", target.name)
        const blocks = target.blocks;
        extraCostumes = false

        // replace custom definitions (eg: exponent block)
        const addedDefs = [];
        // const moreBlockStart = 'tb_';
        const originalBlocks = Object.keys(blocks)
        for (const id of Object.keys(blocks)) {
            const block = blocks[id];
            if (block.opcode.split("_")[1] == "tb") {
                const bName = block.opcode.split('_')[2];
                const data = {
                    blockName: null,
                    addedDefs: addedDefs,
                    blocks: blocks,
                    blockID: id,
                    target: target,
                };
                switch (bName) {
                    case "for": await handleBlock("for", null, data, true); break
                }
            }
        }

        for (const id of Object.keys(blocks)) {
            const block = blocks[id];
            if (block.opcode.split("_")[1] == "tb") {
                const bName = block.opcode.split('_')[2];
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
                    case "goToXYWithoutFencing": await handleBlock("goToXYWithoutFencing", null, data); break
                    case "comment": await handleBlock("comment", null, data); break
                    case "ltOrEqual": await handleBlock("ltOrEqual", 2, data); break
                    case "gtOrEqual": await handleBlock("gtOrEqual", 2, data); break
                    case "atan2": await handleBlock("atan2", 1, data); break
                    case "distanceFromXYToXY": await handleBlock("distanceFromXYToXY", 1, data); break
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
