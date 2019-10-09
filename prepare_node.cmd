echo {"name": "project_name","version": "1.0.0","description": "project description","main": "index.js","scripts": {"test": "echo \"Error: no test specified\" && exit 1" },"author": "","license": "ISC","eslint": "eslint --ignore-path .gitignore .","dependencies": {}} > package.json
call npm install eslint --save-dev
call node node_modules\eslint\bin\eslint.js --init
call npm install webpack webpack-cli webpack-dev-server --save-dev
call npm install @babel/core @babel/node babel-polyfill babel-loader --save-dev
call npm install @babel/preset-env --save-dev
echo {"presets": ["@babel/preset-env"]} > .babelrc