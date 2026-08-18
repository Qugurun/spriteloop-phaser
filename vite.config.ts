import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            include: [ 'src' ],
            rollupTypes: true,
            insertTypesEntry: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'SpriteLoopPhaser',
            formats: [ 'es', 'cjs' ],
            fileName: (format) => format === 'es' ? 'spriteloop-phaser.js' : 'spriteloop-phaser.cjs'
        },
        rollupOptions: {
            external: [ 'phaser', 'fflate' ],
            output: {
                globals: {
                    phaser: 'Phaser',
                    fflate: 'fflate'
                }
            }
        },
        sourcemap: true,
        emptyOutDir: true
    }
});
