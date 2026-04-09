export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
nvm install 20
nvm use 20

pnpm i

cd node_modules/.pnpm/canvas@3.2.3/node_modules/canvas
npm rebuild --build-addon-from-source

cd node_modules/.pnpm/@tensorflow+tfjs-node@4.22.0_seedrandom@3.0.5/node_modules/@tensorflow/tfjs-node
npm rebuild --build-addon-from-source

npm rebuild @tensorflow/tfjs-node --build-addon-from-source