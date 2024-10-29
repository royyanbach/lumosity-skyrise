import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
    return {
        base: command === 'build' ? '/lumosity-skyrise/' : '/',
        server: {
            host: true,
            port: 3000,
        },
        build: {
            target: 'esnext',
            sourcemap: true,
        }
    };
});
