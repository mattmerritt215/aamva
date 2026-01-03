import bwipjs from 'bwip-js';

function assertText(text) {
    if (typeof text !== 'string' || text.length === 0) {
        throw new Error('Text must be a non-empty string');
    }

    if (text.length > 2000) {
        throw new Error('Text must be less than 2000 characters');
    }
}

export async function makePDF417(text, opts = {}) {
    assertText(text);

    return bwipjs.toBuffer({
        bcid: 'pdf417',
        text: text,
        scaleX: opts.scaleX || 2,
        scaleY: opts.scaleY || 1,
        padding: opts.padding || 1,
        width: opts.width || 214,
        height: opts.height || 108,
        columns: opts.columns || 13,
        parse: true,
        ...opts,
    });
}

export async function makeCode128(text, opts = {}) {
    assertText(text);

    return bwipjs.toBuffer({
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: false,
        ...opts,
    });
}
