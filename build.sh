
cat pmat.api.js | grep -vE 'pmat\.engine\s*=\s*require|export\s+const|module\.exports' > pmat-globals.js;
cat pmat.engine.js | grep -vE 'pmat\.engine\s*=\s*require|const\s+pmat\s*=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;
cat pmat.util.js | grep -vE 'pmat\.engine\s*=\s*require|const\s+pmat\s*=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;
cat pmat.main.js | grep -vE 'const\s+pmat\s*=|pmat\.api\s*=\s*require|export\s+const|module\.exports' >> pmat-globals.js;