// Copyright (c) 2015-present TeamUp, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Node, Parser} from 'commonmark';

import {
    addListItemIndices,
    combineTextNodes,
    getFirstMatch,
    highlightMentions,
    highlightTextNode,
    mentionKeysToPatterns,
    pullOutImages,
    highlightWithoutNotification,
    highlightKeysToPatterns,
} from '@components/markdown/transform';
import {logError} from '@utils/log';

import type {UserMentionKey} from '@typings/global/markdown';

/* eslint-disable max-lines, no-underscore-dangle */

describe('Components.Markdown.transform', () => {
    const parser = new Parser();

    describe('combineTextNodes', () => {
        const tests = [{
            name: 'no text nodes',
            input: {
                type: 'document',
                children: [{
                    type: 'thematic_break',
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'thematic_break',
                }],
            },
        }, {
            name: 'one text node',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
        }, {
            name: 'multiple text nodes',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'text',
                        literal: 'is a',
                    }, {
                        type: 'text',
                        literal: ' sen',
                    }, {
                        type: 'text',
                        literal: 'tence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a sentence',
                    }],
                }],
            },
        }, {
            name: 'mixed formatting',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'is a',
                        }],
                    }, {
                        type: 'text',
                        literal: ' sen',
                    }, {
                        type: 'text',
                        literal: 'tence',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'is a',
                        }],
                    }, {
                        type: 'text',
                        literal: ' sentence',
                    }],
                }],
            },
        }, {
            name: 'multiple paragraphs',
            input: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a ',
                    }, {
                        type: 'text',
                        literal: 'paragraph',
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is',
                    }, {
                        type: 'text',
                        literal: ' another ',
                    }, {
                        type: 'text',
                        literal: 'paragraph',
                    }],
                }],
            },
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a paragraph',
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is another paragraph',
                    }],
                }],
            },
        }, {
            name: 'MM-12880 merging text followed by non-text',
            input: 'test: *italics*',
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'test: ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'italics',
                        }],
                    }],
                }],
            },
        }, {
            name: 'MM-12880 merging text followed by image',
            input: 'test: ![image](https://example.com/image)',
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'test: ',
                    }, {
                        type: 'image',
                        destination: 'https://example.com/image',
                        title: '',
                        children: [{
                            type: 'text',
                            literal: 'image',
                        }],
                    }],
                }],
            },
        }];

        for (const test of tests) {
            it(test.name, () => {
                const input = typeof test.input === 'string' ? parser.parse(test.input) : makeAst(test.input);
                const expected = makeAst(test.expected);
                const actual = combineTextNodes(input);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(astToString(actual), astToString(expected));
                assert.deepStrictEqual(stripUnusedFields(actual), stripUnusedFields(expected));
            });
        }
    });

    describe('addListItemIndices', () => {
        it('unordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });

        it('ordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });

        it('nested lists', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'list',
                            listType: 'bullet',
                            listTight: true,
                            listStart: 3,
                            listDelimiter: 'period',
                            children: [{
                                type: 'item',
                                children: [{
                                    type: 'pargraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'one',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                children: [{
                                    type: 'list',
                                    listTight: true,
                                    children: [{
                                        type: 'item',
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'one',
                                            }],
                                        }],
                                    }, {
                                        type: 'item',
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'two',
                                            }],
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }, {
                    type: 'list',
                    listTight: true,
                    children: [{
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    listStart: 7,
                    listDelimiter: 'period',
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'list',
                            listType: 'bullet',
                            listTight: true,
                            listStart: 3,
                            listDelimiter: 'period',
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'pargraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'one',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'list',
                                    listTight: true,
                                    children: [{
                                        type: 'item',
                                        index: 1,
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'one',
                                            }],
                                        }],
                                    }, {
                                        type: 'item',
                                        index: 2,
                                        children: [{
                                            type: 'pargraph',
                                            children: [{
                                                type: 'text',
                                                literal: 'two',
                                            }],
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }, {
                    type: 'list',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'one',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'pargraph',
                            children: [{
                                type: 'text',
                                literal: 'two',
                            }],
                        }],
                    }],
                }],
            });
            const actual = addListItemIndices(input);

            assert.ok(verifyAst(actual));
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('pullOutImages', () => {
        it('simple example with no images', () => {
            const input = parser.parse('test');
            const expected = parser.parse('test');
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complex example with no images', () => {
            const inputString = '- abc\n    1. def\n\n    2. ghi\n\n3. jkl\n- mno\n    1. pqr\n---\n# vwx\n\nyz';
            const input = parser.parse(inputString);
            const expected = parser.parse(inputString);
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph with surrounding text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is text with ',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'text',
                        literal: ' in it',
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is text with ',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'text',
                        literal: ' in it',
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('paragraph with multiple images', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image2',
                        children: [{
                            type: 'text',
                            literal: 'another image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image2',
                        children: [{
                            type: 'text',
                            literal: 'another image',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('headings', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 1',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 1',
                        }],
                    }],
                }, {
                    type: 'heading',
                    level: 4,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 2',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 2',
                    }],
                }, {
                    type: 'heading',
                    level: 2,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 3',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 3',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 3',
                    }],
                }, {
                    type: 'heading',
                    level: 3,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4a',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4b',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 1',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 1',
                        }],
                    }],
                }, {
                    type: 'heading',
                    level: 4,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 2',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 2',
                    }],
                }, {
                    type: 'heading',
                    level: 2,
                    children: [{
                        type: 'text',
                        literal: 'This is the start 3',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 3',
                        }],
                    }, {
                        type: 'text',
                        literal: 'This is the end 3',
                    }],
                }, {
                    type: 'heading',
                    level: 3,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4a',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'an image 4b',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('block quote', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('block quote with other text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('unordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is moretext',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bullet',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is moretext',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('ordered list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complicated list', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 9,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }, {
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 10,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 11,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: false,
                    children: [{
                        type: 'item',
                        index: 7,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 8,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }, {
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 9,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }, {
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 10,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'an image',
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 11,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'text',
                                literal: 'This is text',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('nested lists', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'list',
                            listType: 'ordered',
                            listTight: true,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'list',
                            listType: 'bulleted',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 3,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 4,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }],
                        }],
                    }, {
                        type: 'item',
                        index: 2,
                        children: [{
                            type: 'list',
                            listType: 'ordered',
                            listTight: true,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }, {
                                        type: 'text',
                                        literal: 'This is text',
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'text',
                                        literal: 'This is text',
                                    }, {
                                        type: 'image',
                                        destination: 'http://example.com/image',
                                        children: [{
                                            type: 'text',
                                            literal: 'an image',
                                        }],
                                    }],
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('complex example with images', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/abc',
                                children: [{
                                    type: 'text',
                                    literal: 'abc',
                                }],
                            }],
                        }, {
                            type: 'list',
                            listType: 'numbered',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/def',
                                        children: [{
                                            type: 'text',
                                            literal: 'def',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/ghi',
                                        children: [{
                                            type: 'text',
                                            literal: 'ghi',
                                        }],
                                    }],
                                }],
                            }],
                        }],

                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/jkl',
                                children: [{
                                    type: 'text',
                                    literal: 'jkl',
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/mno',
                            children: [{
                                type: 'text',
                                literal: 'mno',
                            }],
                        }, {
                            type: 'softbreak',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/pqr',
                            children: [{
                                type: 'text',
                                literal: 'pqr',
                            }],
                        }],
                    }],
                }, {
                    type: 'thematic_break',
                }, {
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'vw',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'x',
                        }],
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'yz',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'list',
                    listType: 'bulleted',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 1,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/abc',
                                children: [{
                                    type: 'text',
                                    literal: 'abc',
                                }],
                            }],
                        }, {
                            type: 'list',
                            listType: 'numbered',
                            listTight: false,
                            children: [{
                                type: 'item',
                                index: 1,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/def',
                                        children: [{
                                            type: 'text',
                                            literal: 'def',
                                        }],
                                    }],
                                }],
                            }, {
                                type: 'item',
                                index: 2,
                                children: [{
                                    type: 'paragraph',
                                    children: [{
                                        type: 'image',
                                        destination: 'http://example.com/ghi',
                                        children: [{
                                            type: 'text',
                                            literal: 'ghi',
                                        }],
                                    }],
                                }],
                            }],
                        }],

                    }],
                }, {
                    type: 'list',
                    listType: 'ordered',
                    listTight: true,
                    children: [{
                        type: 'item',
                        index: 3,
                        children: [{
                            type: 'paragraph',
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/jkl',
                                children: [{
                                    type: 'text',
                                    literal: 'jkl',
                                }],
                            }],
                        }],
                    }],
                }, {
                    type: 'block_quote',
                    children: [{
                        type: 'paragraph',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/mno',
                            children: [{
                                type: 'text',
                                literal: 'mno',
                            }],
                        }, {
                            type: 'softbreak',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/pqr',
                            children: [{
                                type: 'text',
                                literal: 'pqr',
                            }],
                        }],
                    }],
                }, {
                    type: 'thematic_break',
                }, {
                    type: 'heading',
                    level: 1,
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'vw',
                        }],
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'x',
                        }],
                    }],
                }, {
                    type: 'paragraph',
                    children: [{
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'yz',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('simple link', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'image',
                            destination: 'http://example.com/image',
                            linkDestination: 'http://example.com',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('link in sentence', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence.',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'http://example.com',
                        children: [{
                            type: 'text',
                            literal: 'This is ',
                        }, {
                            type: 'image',
                            destination: 'http://example.com/image',
                            linkDestination: 'http://example.com',
                            children: [{
                                type: 'text',
                                literal: 'an image',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in a sentence.',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('table', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'table',
                    children: [{
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }],
                    }, {
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'table',
                    children: [{
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }],
                    }, {
                        type: 'table_row',
                        isHeading: true,
                        children: [{
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'text',
                                literal: 'This is ',
                            }, {
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }, {
                                type: 'text',
                                literal: ' in a sentence.',
                            }],
                        }, {
                            type: 'table_cell',
                            isHeading: true,
                            children: [{
                                type: 'image',
                                destination: 'http://example.com/image',
                                children: [{
                                    type: 'text',
                                    literal: 'image1',
                                }],
                            }],
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });

        it('adjacent images and text', () => {
            const input = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'First:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'text',
                        literal: 'Second:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }],
                }],
            });
            const expected = makeAst({
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'First:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'text',
                        literal: 'Second:',
                    }, {
                        type: 'softbreak',
                    }, {
                        type: 'image',
                        destination: 'http://example.com/image',
                        children: [{
                            type: 'text',
                            literal: 'Image',
                        }],
                    }],
                }],
            });
            const actual = pullOutImages(input);

            assert.ok(verifyAst(actual));
            assert.equal(astToString(actual), astToString(expected));
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe('highlightMentions', () => {
        const tests = [{
            name: 'no mentions',
            input: 'These are words',
            mentionKeys: [],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are words',
                    }],
                }],
            },
        }, {
            name: 'not an at-mention',
            input: 'These are words',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }],
                }],
            },
        }, {
            name: 'at-mention for another user',
            input: 'This is @user',
            mentionKeys: [{key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is ',
                    }, {
                        type: 'at_mention',
                        _mentionName: 'user',
                    }],
                }],
            },
        }, {
            name: 'at-mention',
            input: 'These are @words',
            mentionKeys: [{key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'words',
                        }],
                    }],
                }],
            },
        }, {
            name: 'at-mention and non-at-mention for same word',
            input: 'These are @words',
            mentionKeys: [{key: 'words'}, {key: '@words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'words',
                        }],
                    }],
                }],
            },
        }, {
            name: 'case insensitive mentions',
            input: 'These are Words and wORDS',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'Words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' and ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'wORDS',
                        }],
                    }],
                }],
            },
        }, {
            name: 'case sesitive mentions',
            input: 'These are Words and wORDS',
            mentionKeys: [{key: 'Words', caseSensitive: true}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'Words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' and wORDS',
                    }],
                }],
            },
        }, {
            name: 'bold',
            input: 'These are **words** in a sentence',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'strong',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }, {
                        type: 'text',
                        literal: ' in a sentence',
                    }],
                }],
            },
        }, {
            name: 'italics',
            input: 'These _are Words in_ a sentence',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'text',
                            literal: 'are ',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'Words',
                            }],
                        }, {
                            type: 'text',
                            literal: ' in',
                        }],
                    }, {
                        type: 'text',
                        literal: ' a sentence',
                    }],
                }],
            },
        }, {
            name: 'code span',
            input: 'These are `words`',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'code',
                        literal: 'words',
                    }],
                }],
            },
        }, {
            name: 'code block',
            input: '```\nThese are\nwords\n```',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'code_block',
                    literal: 'These are\nwords\n',
                }],
            },
        }, {
            name: 'link text',
            input: 'These are [words words](https://example.com)',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'These are ',
                    }, {
                        type: 'link',
                        destination: 'https://example.com',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }, {
                            type: 'text',
                            literal: ' ',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'link url',
            input: 'This is [a link](https://example.com/words)',
            mentionKeys: [{key: 'example'}, {key: 'com'}, {key: 'https'}, {key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is ',
                    }, {
                        type: 'link',
                        destination: 'https://example.com/words',
                        title: '',
                        children: [{
                            type: 'text',
                            literal: 'a link',
                        }],
                    }],
                }],
            },
        }, {
            name: 'autolinked url',
            input: 'https://example.com/words',
            mentionKeys: [{key: 'example'}, {key: 'com'}, {key: 'https'}, {key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'link',
                        destination: 'https://example.com/words',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'https',
                            }],
                        }, {
                            type: 'text',
                            literal: '://',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'example',
                            }],
                        }, {
                            type: 'text',
                            literal: '.',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'com',
                            }],
                        }, {
                            type: 'text',
                            literal: '/',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'words with punctuation',
            input: 'words. (words) words/words/words words:words',
            mentionKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '. (',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: ') ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '/',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: '/',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: 'words',
                        }],
                    }, {
                        type: 'text',
                        literal: ' ',
                    }, {
                        type: 'link',
                        destination: 'words:words',
                        title: '',
                        children: [{
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }, {
                            type: 'text',
                            literal: ':',
                        }, {
                            type: 'mention_highlight',
                            children: [{
                                type: 'text',
                                literal: 'words',
                            }],
                        }],
                    }],
                }],
            },
        }, {
            name: 'multibyte keyword',
            input: '我爱吃番茄炒饭',
            mentionKeys: [{key: '番茄'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: '我爱吃',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '番茄',
                        }],
                    }, {
                        type: 'text',
                        literal: '炒饭',
                    }],
                }],
            },
        }, {
            name: 'multiple multibyte keywords',
            input: 'CJK is 中國日本한국.',
            mentionKeys: [{key: '中國'}, {key: '日本'}, {key: '한국'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'CJK is ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '中國',
                        }],
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '日本',
                        }],
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'text',
                            literal: '한국',
                        }],
                    }, {
                        type: 'text',
                        literal: '.',
                    }],
                }],
            },
        }, {
            name: 'Mention followed by a period',
            input: 'This is a mention for @channel.',
            mentionKeys: [{key: 'channel'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a mention for ',
                    }, {
                        type: 'mention_highlight',
                        children: [{
                            type: 'at_mention',
                            _mentionName: 'channel.',
                        }],
                    }],
                }],
            },
        }, {
            name: 'Do not mention partial keys',
            input: 'This is a mention for @Gvn.',
            mentionKeys: [{key: 'gv'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'This is a mention for ',
                    }, {
                        type: 'at_mention',
                        _mentionName: 'Gvn.',
                    }],
                }],
            },
        }];

        for (const test of tests) {
            it(test.name, () => {
                const input = combineTextNodes(parser.parse(test.input));
                const expected = makeAst(test.expected);
                const actual = highlightMentions(input, test.mentionKeys);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(stripUnusedFields(actual), stripUnusedFields(expected));
            });
        }
    });

    describe('getFirstMention with mentionKeysToPatterns', () => {
        const tests = [{
            name: 'no mention keys',
            input: 'apple banana orange',
            mentionKeys: [],
            expected: {index: -1, length: -1},
        }, {
            name: 'single mention',
            input: 'apple banana orange',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 6, length: 6},
        }, {
            name: 'multiple mentions',
            input: 'apple banana orange',
            mentionKeys: [{key: 'apple'}, {key: 'orange'}],
            expected: {index: 0, length: 5},
        }, {
            name: 'case sensitive',
            input: 'apple APPLE Apple aPPle',
            mentionKeys: [{key: 'Apple', caseSensitive: true}],
            expected: {index: 12, length: 5},
        }, {
            name: 'followed by period',
            input: 'banana.',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 0, length: 6},
        }, {
            name: 'followed by underscores',
            input: 'banana__',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 0, length: 6},
        }, {
            name: 'in brackets',
            input: '(banana)',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 1, length: 6},
        }, {
            name: 'following punctuation',
            input: ':banana',
            mentionKeys: [{key: 'banana'}],
            expected: {index: 1, length: 6},
        }, {
            name: 'not part of another word',
            input: 'pineapple',
            mentionKeys: [{key: 'apple'}],
            expected: {index: -1, length: -1},
        }, {
            name: 'no error from weird mention keys',
            input: 'apple banana orange',
            mentionKeys: [{key: '*\\3_.'}],
            expected: {index: -1, length: -1},
        }, {
            name: 'no blank mention keys',
            input: 'apple banana orange',
            mentionKeys: [{key: ''}],
            expected: {index: -1, length: -1},
        }, {
            name: 'multibyte key',
            input: '좋은 하루 되세요.',
            mentionKeys: [{key: '하루'}],
            expected: {index: 3, length: 2},
        }];

        function getFirstMention(str: string, mentionKeys: UserMentionKey[]) {
            const patterns = mentionKeysToPatterns(mentionKeys);
            return getFirstMatch(str, patterns);
        }

        for (const test of tests) {
            it(test.name, () => {
                const actual = getFirstMention(test.input, test.mentionKeys);

                assert.deepStrictEqual(actual, test.expected);
            });
        }
    });

    describe('highlightTextNode', () => {
        const type = 'paragraph';
        const literal = 'This is a sentence';

        const tests = [{
            name: 'highlight entire text',
            start: 0,
            end: literal.length,
            expected: [{
                type,
                children: [{
                    type: 'text',
                    literal,
                }],
            }],
        }, {
            name: 'highlight start of text',
            start: 0,
            end: 6,
            expected: [{
                type,
                children: [{
                    type: 'text',
                    literal: 'This i',
                }],
            }, {
                type: 'text',
                literal: 's a sentence',
            }],
        }, {
            name: 'highlight end of text',
            start: 8,
            end: literal.length,
            expected: [{
                type: 'text',
                literal: 'This is ',
            }, {
                type,
                children: [{
                    type: 'text',
                    literal: 'a sentence',
                }],
            }],
        }, {
            name: 'highlight middle of text',
            start: 5,
            end: 12,
            expected: [{
                type: 'text',
                literal: 'This ',
            }, {
                type,
                children: [{
                    type: 'text',
                    literal: 'is a se',
                }],
            }, {
                type: 'text',
                literal: 'ntence',
            }],
        }];

        for (const test of tests) {
            it(test.name + ', without siblings', () => {
                const actual = makeAst({
                    type: 'parent',
                    children: [{
                        type: 'text',
                        literal,
                    }],
                });
                const expected = makeAst({
                    type: 'parent',
                    children: test.expected,
                });

                const node = actual.firstChild;
                assert.equal(node!.type, 'text');

                const highlighted = highlightTextNode(node!, test.start, test.end, type);
                assert.equal(highlighted.type, type);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(actual, expected);
            });

            it(test.name + ', with siblings', () => {
                const actual = makeAst({
                    type: 'parent',
                    children: [{
                        type: 'previous',
                    }, {
                        type: 'text',
                        literal,
                    }, {
                        type: 'next',
                    }],
                });
                const expected = makeAst({
                    type: 'parent',
                    children: [
                        {
                            type: 'previous',
                        },
                        ...test.expected,
                        {
                            type: 'next',
                        },
                    ],
                });

                const node = actual.firstChild!.next;
                assert.equal(node!.type, 'text');

                const highlighted = highlightTextNode(node!, test.start, test.end, type);
                assert.equal(highlighted.type, type);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(actual, expected);
            });
        }
    });

    describe('highlightWithoutNotification', () => {
        const tests = [{
            name: 'no highlights',
            input: 'Cant put down an anti gravity book',
            highlightKeys: [],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'Cant put down an anti gravity book',
                    }],
                }],
            },
        }, {
            name: 'key bigger than input',
            input: 'incredible',
            highlightKeys: [{key: 'incredible and industructable'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'incredible',
                    }],
                }],
            },
        }, {
            name: 'key part of the word',
            input: 'Sesquipedalian',
            highlightKeys: [{key: 'quipedalian'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'Sesquipedalian',
                    }],
                }],
            },
        }, {
            name: 'word part of key',
            input: 'floccinauc',
            highlightKeys: [{key: 'floccinaucinihilipilification'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'floccinauc',
                    }],
                }],
            },
        }, {
            name: 'a word highlight',
            input: 'Cant put down an anti gravity book',
            highlightKeys: [{key: 'anti'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            literal: 'Cant put down an ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'anti',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' gravity book',
                        },
                    ],
                }],
            },
        }, {
            name: 'a sentence highlight',
            input: 'Cant put down an anti gravity book',
            highlightKeys: [{key: 'anti gravity'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            literal: 'Cant put down an ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'anti gravity',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' book',
                        },
                    ],
                }],
            },
        }, {
            name: 'insensitive keywords',
            input: 'Cant put down an anti gravity book',
            highlightKeys: [{key: 'dOwN'}, {key: 'Anti'}, {key: 'BOOK'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            literal: 'Cant put ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'down',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' an ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'anti',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' gravity ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'book',
                            }],
                        },
                    ],
                }],
            },
        }, {
            name: 'insensitive keywords',
            input: 'Cant put down an anti gravity book',
            highlightKeys: [{key: 'dOwN'}, {key: 'Anti'}, {key: 'BOOK'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            literal: 'Cant put ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'down',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' an ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'anti',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' gravity ',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'book',
                            }],
                        },
                    ],
                }],
            },
        }, {
            name: 'words with characters surrounding them',
            input: 'peace& ^peace -peace-',
            highlightKeys: [{key: 'PEACE'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'peace',
                            }],
                        },
                        {
                            type: 'text',
                            literal: '& ^',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'peace',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' -',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'peace',
                            }],
                        },
                        {
                            type: 'text',
                            literal: '-',
                        },
                    ],
                }],
            },
        }, {
            name: 'input in code block',
            input: '```\nTurning it off and\non\n```',
            highlightKeys: [{key: 'words'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'code_block',
                    literal: 'Turning it off and\non\n',
                }],
            },
        }, {
            name: 'key in bold',
            input: 'Actions speak **louder** than words',
            highlightKeys: [{key: 'louder'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'Actions speak ',
                    }, {
                        type: 'strong',
                        children: [{
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'louder',
                            }],
                        }],
                    }, {
                        type: 'text',
                        literal: ' than words',
                    }],
                }],
            },
        }, {
            name: 'key in italic',
            input: 'Actions speak *louder* than words',
            highlightKeys: [{key: 'louder'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'Actions speak ',
                    }, {
                        type: 'emph',
                        children: [{
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'louder',
                            }],
                        }],
                    }, {
                        type: 'text',
                        literal: ' than words',
                    }],
                }],
            },
        }, {
            name: 'key in heading',
            input: '### Actions speak louder than words',
            highlightKeys: [{key: 'Actions'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'heading',
                    level: 3,
                    children: [
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: 'Actions',
                            }],
                        },
                        {
                            type: 'text',
                            literal: ' speak louder than words',
                        }],
                }],
            },
        }, {
            name: 'Do not mention partial keys',
            input: 'Adding more memory wont help @bob',
            highlightKeys: [{key: 'bob'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [{
                        type: 'text',
                        literal: 'Adding more memory wont help ',
                    }, {
                        type: 'at_mention',
                        _mentionName: 'bob',
                    }],
                }],
            },
        }, {
            name: 'CJK word highlight',
            input: '我确实喜欢我的同事。',
            highlightKeys: [{key: '喜欢'}],
            expected: {
                type: 'document',
                children: [{
                    type: 'paragraph',
                    children: [
                        {
                            type: 'text',
                            literal: '我确实',
                        },
                        {
                            type: 'highlight_without_notification',
                            children: [{
                                type: 'text',
                                literal: '喜欢',
                            }],
                        },
                        {
                            type: 'text',
                            literal: '我的同事。',
                        },
                    ],
                }],
            },
        }];

        for (const test of tests) {
            it(test.name, () => {
                const input = combineTextNodes(parser.parse(test.input));
                const expected = makeAst(test.expected);
                const actual = highlightWithoutNotification(input, test.highlightKeys);

                assert.ok(verifyAst(actual));
                assert.deepStrictEqual(stripUnusedFields(actual), stripUnusedFields(expected));
            });
        }
    });

    describe('getFirstMatch with highlightKeysToPatterns', () => {
        const tests = [{
            name: 'text with space before',
            input: ' lol',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        },
        {
            name: 'text with space afterwards and before',
            input: ' Lol ',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        },
        {
            name: 'text with a non word character before (?)',
            input: '?Lol',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        },
        {
            name: 'text with a non word character before (.)',
            input: '?Lol',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        },
        {
            name: 'text with a non word character before (_)',
            input: '?Lol',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        },
        {
            name: 'text with non word character after (.)',
            input: 'Lol.',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 0, length: 3},
        },
        {
            name: 'text with non word character after (?)',
            input: 'Lol?',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 0, length: 3},
        },
        {
            name: 'text with non word character after (_)',
            input: 'Lol_',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 0, length: 3},
        },
        {
            name: 'text with non word character before and after',
            input: '?Lol?',
            patterns: highlightKeysToPatterns([{key: 'lol'}]),
            expected: {index: 1, length: 3},
        }];

        for (const test of tests) {
            it(test.name, () => {
                const actual = getFirstMatch(test.input, test.patterns);

                assert.deepStrictEqual(actual, test.expected);
            });
        }
    });
});

// Testing and debugging functions

// Confirms that all parent, child, and sibling linkages are correct and go both ways.
function verifyAst(node: Node) {
    if (node.prev && node.prev.next !== node) {
        logError('node is not linked properly to prev');
        return false;
    }

    if (node.next && node.next.prev !== node) {
        logError('node is not linked properly to next');
        return false;
    }

    if (!node.firstChild && node.lastChild) {
        logError('node has children, but is not linked to first child');
        return false;
    }

    if (node.firstChild && !node.lastChild) {
        logError('node has children, but is not linked to last child');
        return false;
    }

    for (let child = node.firstChild; child; child = child.next) {
        if (child.parent !== node) {
            logError('node is not linked properly to child');
            return false;
        }

        if (!verifyAst(child)) {
            return false;
        }

        if (!child.next && child !== node.lastChild) {
            logError('node children are not linked correctly');
            return false;
        }
    }

    if (node.firstChild && node.firstChild.prev) {
        logError('node\'s first child has previous sibling');
        return false;
    }

    if (node.lastChild && node.lastChild.next) {
        logError('node\'s last child has next sibling');
        return false;
    }

    return true;
}

function astToString(node: Node, indent = '') {
    if (!node) {
        return '';
    }

    let out = '';

    out += indent + nodeToString(node) + '\n';

    for (let child = node.firstChild; child !== null; child = child.next) {
        out += astToString(child, indent + '  ');
    }

    return out;
}

const neighbours = ['parent', 'prev', 'next', 'firstChild', 'lastChild'];
const importantFields = ['literal', 'destination', 'title', 'level', 'listType', 'listTight', 'listDelimiter', 'mentionName', 'channelName', 'emojiName', 'continue', 'index'];
function nodeToString(node: any) {
    let out = node.type;

    for (const neighbour of neighbours) {
        if (node[neighbour]) {
            out += ' ' + neighbour + '=`' + node[neighbour].type;
            if (node[neighbour].type === 'text') {
                out += ':' + node[neighbour].literal;
            }
            out += '`';
        }
    }

    for (const field of importantFields) {
        if (node[field]) {
            out += ' ' + field + '=`' + node[field] + '`';
        }
    }

    return out;
}

// Converts an AST represented as a JavaScript object into a full Commonmark-compatitle AST.
// This function is intended for use while testing. An example of input would be:
// {
//     type: 'document',
//     children: [{
//         type: 'heading',
//         level: 2,
//         children: [{
//             type: 'text',
//             literal: 'This is a heading'
//         }]
//     }, {
//         type: 'paragraph',
//         children: [{
//             type: 'text',
//             literal: 'This is a paragraph'
//         }]
//     }]
// }
function makeAst(input: any) {
    const {type, children, ...other} = input;

    const node = new Node(type);

    for (const key of Object.keys(other)) {
        // @ts-expect-error key
        node[key] = other[key];
    }

    if (children) {
        for (const child of children) {
            node.appendChild(makeAst(child));
        }
    }

    return node;
}

// Remove any fields from the AST that are only used while parsing to make testing equality easier.
function stripUnusedFields(node: any) {
    const walker = node.walker();

    let e;
    while ((e = walker.next())) {
        e.node._open = false;
        e.node._size = null;
        e.node._sourcepos = null;

        e.node._fenceChar = null;
        e.node._fenceLength = 0;
        e.node._fenceOffset = 0;
        e.node._info = '';
        e.node._isFenced = false;
    }

    return node;
}
