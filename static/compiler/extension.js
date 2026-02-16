(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('This extension must run unsandboxed');
    }

    const Colors = {
        Motion: {
            primary: '#4C97FF',
            secondary: '#4280D7',
            tertiary: '#3373CC'
        },
        Looks: {
            primary: '#9966FF',
            secondary: '#855CD6',
            tertiary: '#774DCB'
        },
        Sound: {
            primary: '#CF63CF',
            secondary: '#C94FC9',
            tertiary: '#BD42BD'
        },
        Events: {
            primary: '#FFBF00',
            secondary: '#E6AC00',
            tertiary: '#CC9900'
        },
        Control: {
            primary: '#FFAB19',
            secondary: '#EC9C13',
            tertiary: '#CF8B17'
        },
        Sensing: {
            primary: '#5CB1D6',
            secondary: '#47A8D1',
            tertiary: '#2E8EB8'
        },
        Operators: {
            primary: '#59C059',
            secondary: '#46B946',
            tertiary: '#389438'
        },
        Variables: {
            primary: '#FF8C1A',
            secondary: '#FF8000',
            tertiary: '#DB6E00'
        },
        Lists: {
            primary: '#FF661A',
            secondary: '#FF5500',
            tertiary: '#E64D00'
        },
        MyBlocks: {
            primary: '#FF6680',
            secondary: '#FF4D6A',
            tertiary: '#FF3355'
        },
        Extensions: {
            primary: '#0FBD8C',
            secondary: '#0DA57A',
            tertiary: '#0B8E69'
        }
    };

    class MoreBlocks {
        constructor() {
            // this.enableReturns = setInterval(() => {
            //     if (vm.enableCustomReturns) {
            //         vm.enableCustomReturns()
            //         // clearInterval(this.enableReturns)
            //         // console.log("enabled custom reporters")
            //     }
            // }
            //     , 500)
        }

        getInfo() {
            return {
                id: 'moreblocksextension',
                name: 'More Blocks',
                blocks: [
                    {
                        text: 'Motion',
                        blockType: Scratch.BlockType.LABEL
                    },
                    {
                        opcode: "turnAround",
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'turn around',
                        color1: Colors.Motion.primary,
                        color2: Colors.Motion.secondary,
                        color3: Colors.Motion.tertiary
                    },
                    {
                        opcode: "pointTowardsXY",
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'point towards x: [X] y: [Y]',
                        color1: Colors.Motion.primary,
                        color2: Colors.Motion.secondary,
                        color3: Colors.Motion.tertiary,
                        arguments: {
                            X: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            Y: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },
                    {
                        text: 'Looks',
                        blockType: Scratch.BlockType.LABEL
                    },
                    {
                        opcode: "previousCostume",
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'previous costume',
                        color1: Colors.Looks.primary,
                        color2: Colors.Looks.secondary,
                        color3: Colors.Looks.tertiary
                    },
                    {
                        opcode: "previousBackdrop",
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'previous backdrop',
                        color1: Colors.Looks.primary,
                        color2: Colors.Looks.secondary,
                        color3: Colors.Looks.tertiary
                    },
                    {
                        opcode: "forceSetSize",
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'force set size to [SIZE]%',
                        color1: Colors.Looks.primary,
                        color2: Colors.Looks.secondary,
                        color3: Colors.Looks.tertiary,
                        arguments: {
                            SIZE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1000
                            }
                        },
                        hideFromPalette: true
                    },
                    {
                        text: 'Sensing',
                        blockType: Scratch.BlockType.LABEL
                    },
                    {
                        opcode: "distanceToXY",
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'distance to x: [X] y: [Y]',
                        color1: Colors.Sensing.primary,
                        color2: Colors.Sensing.secondary,
                        color3: Colors.Sensing.tertiary,
                        arguments: {
                            X: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            },
                            Y: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0
                            }
                        }
                    },
                    {
                        text: 'Operators',
                        blockType: Scratch.BlockType.LABEL
                    },
                    {
                        opcode: 'power',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '[ONE] ^ [TWO]',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        arguments: {
                            ONE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: ''
                            },
                            TWO: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: ''
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'true',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'true',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: true
                    },
                    {
                        opcode: 'false',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'false',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: true
                    },
                    '---',
                    {
                        opcode: 'newLine',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'new line',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: false
                    },
                    {
                        opcode: 'pi',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'π',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: false
                    }, {
                        opcode: 'e',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'e',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: false
                    }, {
                        opcode: 'infinity',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '∞',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: false
                    },
                    '---',
                    {
                        opcode: "inlineIf",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "if [CONDITION] then [IFTRUE] else [IFFALSE]",
                        arguments: {
                            CONDITION: {
                                type: Scratch.ArgumentType.BOOLEAN
                            },
                            IFTRUE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "apple"
                            },
                            IFFALSE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "banana"
                            }
                        },
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        disableMonitor: true
                    },
                    {
                        opcode: 'substring',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'letters [START] to [END] of [TEXT]',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        arguments: {
                            START: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 2
                            },
                            END: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 4
                            },
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "banana"
                            }
                        },
                        disableMonitor: true
                    },
                    {
                        opcode: 'startsWith',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '[TEXT] starts with [STARTS]',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "banana"
                            },
                            STARTS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "ban"
                            },

                        },
                        disableMonitor: true
                    },
                    {
                        opcode: 'endsWith',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '[TEXT] ends with [ENDS]',
                        color1: Colors.Operators.primary,
                        color2: Colors.Operators.secondary,
                        color3: Colors.Operators.tertiary,
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "apple"
                            },
                            ENDS: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "ple"
                            },

                        },
                        disableMonitor: true
                    },
                ]
            };
        }

        power(args) {
            return Math.pow(Scratch.Cast.toNumber(args.ONE), Scratch.Cast.toNumber(args.TWO));
        }

        previousCostume(args, util) {
            const target = util.target;
            const costumeCount = target.getCostumes().length;
            const newIndex = (target.currentCostume - 1 + costumeCount) % costumeCount;
            target.setCostume(newIndex);
        }

        previousBackdrop(args, util) {
            const stage = util.runtime.getTargetForStage();
            const backdropCount = stage.getCostumes().length;
            const newIndex = (stage.currentCostume - 1 + backdropCount) % backdropCount;
            stage.setCostume(newIndex);
        }

        newLine() {
            return "\n"
        }

        true() {
            return true
        }

        false() {
            return false
        }

        turnAround(args, util) {
            util.target.setDirection(util.target.direction + 180)
        }

        inlineIf(args) {
            return args.CONDITION ? args.IFTRUE : args.IFFALSE
        }

        pointTowardsXY(args, util) {
            const dx = util.target.x - args.X;
            const dy = util.target.y - args.Y;
            const angleInRadians = Math.atan2(dx, dy);
            const angleInDegrees = angleInRadians * (180 / Math.PI);

            util.target.setDirection(angleInDegrees + 180)
        }

        distanceToXY(args, util) {
            const dx = util.target.x - args.X;
            const dy = util.target.y - args.Y;
            return Math.hypot(dx, dy)
        }

        pi() {
            return Scratch.Cast.toString(3.141592653589793238462643383279502884197)
        }

        e() {
            return Scratch.Cast.toString(2.7182818284590452353602874713527)
        }

        infinity() {
            return "Infinity"
        }

        substring(args) {
            const text = Scratch.Cast.toString(args.TEXT)
            const start = Math.round(Scratch.Cast.toNumber(args.START) - 1)
            const end = Math.round(Scratch.Cast.toNumber(args.END || text.length))
            console.log(text, start, end, args.END)
            if (end < start) return "";
            return text.substring(start, end)
        }

        startsWith(args) {
            return Scratch.Cast.toBoolean(Scratch.Cast.toString(args.TEXT).startsWith(Scratch.Cast.toString(args.STARTS)))
        }

        endsWith(args) {
            return Scratch.Cast.toBoolean(Scratch.Cast.toString(args.TEXT).endsWith(Scratch.Cast.toString(args.ENDS)))
        }

        forceSetSize(args, util) {
            util.target.setSize(args.SIZE, false)
        }
    }
    Scratch.extensions.register(new MoreBlocks());
})(Scratch);