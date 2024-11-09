import { resolve } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const builtInNodeModules = [
  'assert',
  'buffer',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'net',
  'os',
  'path',
  'process',
  'querystring',
  'readline',
  'stream',
  'timers',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
  'fs/promises',
  'child_process',
  'string_decoder',
  'diagnostics_channel',
];

const config = {
  mode: 'none',
  entry: {
    bundle: './src/index.ts',
  },
  target: 'es2022',
  experiments: {
    outputModule: true,
  },
  async externals({ request }) {
    const isBuiltIn = request.startsWith('node:') || builtInNodeModules.includes(request);

    if (isBuiltIn) {
      return Promise.resolve(`module ${request}`);
    }
  },
  module: {
    rules: [
      {
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    conditionNames: ['import', 'node'],
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dist'),
  },
};
export default config;
