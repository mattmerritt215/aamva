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
        scaleX: opts.scaleX || 4,
        scaleY: (opts.scaleX *3) || 12,
        padding: opts.padding || 1,

