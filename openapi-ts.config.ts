import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: './src/api',
  plugins: [
    {
      name: '@hey-api/client-next',
      runtimeConfigPath: '@/lib/hey-api',
    },
  ],
});
