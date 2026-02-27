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
        getInfo() {
            return {
                id: 'extra',
                name: 'More Blocks',
                blocks: [
                    {
                        opcode: "tb_comment",
                        blockType: Scratch.BlockType.COMMAND,
                        text: '// comment [COMMENT]',
                        arguments: {
                            COMMENT: {
                                type: Scratch.ArgumentType.STRING,
                            }
                        }
                    },
                ]
            }
        }

        tb_comment = () => {}
    }
    Scratch.extensions.register(new MoreBlocks());
})(Scratch);