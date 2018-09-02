
cat pmat.api.js | grep -vE 'export\s+const|module\.exports' > pmat-globals.js;
cat pmat.engine.js | grep -vE 'pmat\.engine\s*=\s*require|const\s+pmat\s*=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;
cat pmat.util.js | grep -vE 'pmat\.engine\s*=\s*require|const\s+pmat\s*=|module\.exports|export\s+const|const\s+testCases|pmat\.util\s*=\s*require' >> pmat-globals.js;
