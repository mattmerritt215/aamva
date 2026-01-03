import { program } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { makePDF417, makeCode128 } from './barcode.js';

program
    .name('aamva-barcode')
    .description('Generate AAMVA-compliant barcodes (PDF417 and Code128)')
    .version('1.0.0');

function commonOptions(cmd) {
    return cmd
        .requiredOption('-t, --text <string>', 'Text to encode')
        .option('-o, --output <file>', 'Output PNG file (default: stdout)', null);
}

commonOptions(program.command('pdf417').description('Generate a PDF417 barcode'))
    .action(async (opts) => {
        const buffer = await makePDF417(opts.text, {});
        await writeOutput(buffer, opts.output);
    });

commonOptions(program.command('code128').description('Generate a Code128 barcode'))
    .action(async (opts) => {
        const buffer = await makeCode128(opts.text, {});
        await writeOutput(buffer, opts.output);
    });

program.parse(process.argv);

async function writeOutput(buffer, outputPath) {
    if (!outputPath) {
        process.stdout.write(buffer);
    } else {
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, buffer);
        console.log(`Wrote barcode to ${outputPath}`);
    }
}